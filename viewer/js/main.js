(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * Knockout JavaScript library v3.4.0
 * (c) Steven Sanderson - http://knockoutjs.com/
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 */

(function(){
var DEBUG=true;
(function(undefined){
    // (0, eval)('this') is a robust way of getting a reference to the global object
    // For details, see http://stackoverflow.com/questions/14119988/return-this-0-evalthis/14120023#14120023
    var window = this || (0, eval)('this'),
        document = window['document'],
        navigator = window['navigator'],
        jQueryInstance = window["jQuery"],
        JSON = window["JSON"];
(function(factory) {
    // Support three module loading scenarios
    if (typeof define === 'function' && define['amd']) {
        // [1] AMD anonymous module
        define(['exports', 'require'], factory);
    } else if (typeof exports === 'object' && typeof module === 'object') {
        // [2] CommonJS/Node.js
        factory(module['exports'] || exports);  // module.exports is for Node.js
    } else {
        // [3] No module loader (plain <script> tag) - put directly in global namespace
        factory(window['ko'] = {});
    }
}(function(koExports, amdRequire){
// Internally, all KO objects are attached to koExports (even the non-exported ones whose names will be minified by the closure compiler).
// In the future, the following "ko" variable may be made distinct from "koExports" so that private objects are not externally reachable.
var ko = typeof koExports !== 'undefined' ? koExports : {};
// Google Closure Compiler helpers (used only to make the minified file smaller)
ko.exportSymbol = function(koPath, object) {
    var tokens = koPath.split(".");

    // In the future, "ko" may become distinct from "koExports" (so that non-exported objects are not reachable)
    // At that point, "target" would be set to: (typeof koExports !== "undefined" ? koExports : ko)
    var target = ko;

    for (var i = 0; i < tokens.length - 1; i++)
        target = target[tokens[i]];
    target[tokens[tokens.length - 1]] = object;
};
ko.exportProperty = function(owner, publicName, object) {
    owner[publicName] = object;
};
ko.version = "3.4.0";

ko.exportSymbol('version', ko.version);
// For any options that may affect various areas of Knockout and aren't directly associated with data binding.
ko.options = {
    'deferUpdates': false,
    'useOnlyNativeEvents': false
};

//ko.exportSymbol('options', ko.options);   // 'options' isn't minified
ko.utils = (function () {
    function objectForEach(obj, action) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                action(prop, obj[prop]);
            }
        }
    }

    function extend(target, source) {
        if (source) {
            for(var prop in source) {
                if(source.hasOwnProperty(prop)) {
                    target[prop] = source[prop];
                }
            }
        }
        return target;
    }

    function setPrototypeOf(obj, proto) {
        obj.__proto__ = proto;
        return obj;
    }

    var canSetPrototype = ({ __proto__: [] } instanceof Array);
    var canUseSymbols = !DEBUG && typeof Symbol === 'function';

    // Represent the known event types in a compact way, then at runtime transform it into a hash with event name as key (for fast lookup)
    var knownEvents = {}, knownEventTypesByEventName = {};
    var keyEventTypeName = (navigator && /Firefox\/2/i.test(navigator.userAgent)) ? 'KeyboardEvent' : 'UIEvents';
    knownEvents[keyEventTypeName] = ['keyup', 'keydown', 'keypress'];
    knownEvents['MouseEvents'] = ['click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave'];
    objectForEach(knownEvents, function(eventType, knownEventsForType) {
        if (knownEventsForType.length) {
            for (var i = 0, j = knownEventsForType.length; i < j; i++)
                knownEventTypesByEventName[knownEventsForType[i]] = eventType;
        }
    });
    var eventsThatMustBeRegisteredUsingAttachEvent = { 'propertychange': true }; // Workaround for an IE9 issue - https://github.com/SteveSanderson/knockout/issues/406

    // Detect IE versions for bug workarounds (uses IE conditionals, not UA string, for robustness)
    // Note that, since IE 10 does not support conditional comments, the following logic only detects IE < 10.
    // Currently this is by design, since IE 10+ behaves correctly when treated as a standard browser.
    // If there is a future need to detect specific versions of IE10+, we will amend this.
    var ieVersion = document && (function() {
        var version = 3, div = document.createElement('div'), iElems = div.getElementsByTagName('i');

        // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
        while (
            div.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
            iElems[0]
        ) {}
        return version > 4 ? version : undefined;
    }());
    var isIe6 = ieVersion === 6,
        isIe7 = ieVersion === 7;

    function isClickOnCheckableElement(element, eventType) {
        if ((ko.utils.tagNameLower(element) !== "input") || !element.type) return false;
        if (eventType.toLowerCase() != "click") return false;
        var inputType = element.type;
        return (inputType == "checkbox") || (inputType == "radio");
    }

    // For details on the pattern for changing node classes
    // see: https://github.com/knockout/knockout/issues/1597
    var cssClassNameRegex = /\S+/g;

    function toggleDomNodeCssClass(node, classNames, shouldHaveClass) {
        var addOrRemoveFn;
        if (classNames) {
            if (typeof node.classList === 'object') {
                addOrRemoveFn = node.classList[shouldHaveClass ? 'add' : 'remove'];
                ko.utils.arrayForEach(classNames.match(cssClassNameRegex), function(className) {
                    addOrRemoveFn.call(node.classList, className);
                });
            } else if (typeof node.className['baseVal'] === 'string') {
                // SVG tag .classNames is an SVGAnimatedString instance
                toggleObjectClassPropertyString(node.className, 'baseVal', classNames, shouldHaveClass);
            } else {
                // node.className ought to be a string.
                toggleObjectClassPropertyString(node, 'className', classNames, shouldHaveClass);
            }
        }
    }

    function toggleObjectClassPropertyString(obj, prop, classNames, shouldHaveClass) {
        // obj/prop is either a node/'className' or a SVGAnimatedString/'baseVal'.
        var currentClassNames = obj[prop].match(cssClassNameRegex) || [];
        ko.utils.arrayForEach(classNames.match(cssClassNameRegex), function(className) {
            ko.utils.addOrRemoveItem(currentClassNames, className, shouldHaveClass);
        });
        obj[prop] = currentClassNames.join(" ");
    }

    return {
        fieldsIncludedWithJsonPost: ['authenticity_token', /^__RequestVerificationToken(_.*)?$/],

        arrayForEach: function (array, action) {
            for (var i = 0, j = array.length; i < j; i++)
                action(array[i], i);
        },

        arrayIndexOf: function (array, item) {
            if (typeof Array.prototype.indexOf == "function")
                return Array.prototype.indexOf.call(array, item);
            for (var i = 0, j = array.length; i < j; i++)
                if (array[i] === item)
                    return i;
            return -1;
        },

        arrayFirst: function (array, predicate, predicateOwner) {
            for (var i = 0, j = array.length; i < j; i++)
                if (predicate.call(predicateOwner, array[i], i))
                    return array[i];
            return null;
        },

        arrayRemoveItem: function (array, itemToRemove) {
            var index = ko.utils.arrayIndexOf(array, itemToRemove);
            if (index > 0) {
                array.splice(index, 1);
            }
            else if (index === 0) {
                array.shift();
            }
        },

        arrayGetDistinctValues: function (array) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++) {
                if (ko.utils.arrayIndexOf(result, array[i]) < 0)
                    result.push(array[i]);
            }
            return result;
        },

        arrayMap: function (array, mapping) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++)
                result.push(mapping(array[i], i));
            return result;
        },

        arrayFilter: function (array, predicate) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++)
                if (predicate(array[i], i))
                    result.push(array[i]);
            return result;
        },

        arrayPushAll: function (array, valuesToPush) {
            if (valuesToPush instanceof Array)
                array.push.apply(array, valuesToPush);
            else
                for (var i = 0, j = valuesToPush.length; i < j; i++)
                    array.push(valuesToPush[i]);
            return array;
        },

        addOrRemoveItem: function(array, value, included) {
            var existingEntryIndex = ko.utils.arrayIndexOf(ko.utils.peekObservable(array), value);
            if (existingEntryIndex < 0) {
                if (included)
                    array.push(value);
            } else {
                if (!included)
                    array.splice(existingEntryIndex, 1);
            }
        },

        canSetPrototype: canSetPrototype,

        extend: extend,

        setPrototypeOf: setPrototypeOf,

        setPrototypeOfOrExtend: canSetPrototype ? setPrototypeOf : extend,

        objectForEach: objectForEach,

        objectMap: function(source, mapping) {
            if (!source)
                return source;
            var target = {};
            for (var prop in source) {
                if (source.hasOwnProperty(prop)) {
                    target[prop] = mapping(source[prop], prop, source);
                }
            }
            return target;
        },

        emptyDomNode: function (domNode) {
            while (domNode.firstChild) {
                ko.removeNode(domNode.firstChild);
            }
        },

        moveCleanedNodesToContainerElement: function(nodes) {
            // Ensure it's a real array, as we're about to reparent the nodes and
            // we don't want the underlying collection to change while we're doing that.
            var nodesArray = ko.utils.makeArray(nodes);
            var templateDocument = (nodesArray[0] && nodesArray[0].ownerDocument) || document;

            var container = templateDocument.createElement('div');
            for (var i = 0, j = nodesArray.length; i < j; i++) {
                container.appendChild(ko.cleanNode(nodesArray[i]));
            }
            return container;
        },

        cloneNodes: function (nodesArray, shouldCleanNodes) {
            for (var i = 0, j = nodesArray.length, newNodesArray = []; i < j; i++) {
                var clonedNode = nodesArray[i].cloneNode(true);
                newNodesArray.push(shouldCleanNodes ? ko.cleanNode(clonedNode) : clonedNode);
            }
            return newNodesArray;
        },

        setDomNodeChildren: function (domNode, childNodes) {
            ko.utils.emptyDomNode(domNode);
            if (childNodes) {
                for (var i = 0, j = childNodes.length; i < j; i++)
                    domNode.appendChild(childNodes[i]);
            }
        },

        replaceDomNodes: function (nodeToReplaceOrNodeArray, newNodesArray) {
            var nodesToReplaceArray = nodeToReplaceOrNodeArray.nodeType ? [nodeToReplaceOrNodeArray] : nodeToReplaceOrNodeArray;
            if (nodesToReplaceArray.length > 0) {
                var insertionPoint = nodesToReplaceArray[0];
                var parent = insertionPoint.parentNode;
                for (var i = 0, j = newNodesArray.length; i < j; i++)
                    parent.insertBefore(newNodesArray[i], insertionPoint);
                for (var i = 0, j = nodesToReplaceArray.length; i < j; i++) {
                    ko.removeNode(nodesToReplaceArray[i]);
                }
            }
        },

        fixUpContinuousNodeArray: function(continuousNodeArray, parentNode) {
            // Before acting on a set of nodes that were previously outputted by a template function, we have to reconcile
            // them against what is in the DOM right now. It may be that some of the nodes have already been removed, or that
            // new nodes might have been inserted in the middle, for example by a binding. Also, there may previously have been
            // leading comment nodes (created by rewritten string-based templates) that have since been removed during binding.
            // So, this function translates the old "map" output array into its best guess of the set of current DOM nodes.
            //
            // Rules:
            //   [A] Any leading nodes that have been removed should be ignored
            //       These most likely correspond to memoization nodes that were already removed during binding
            //       See https://github.com/knockout/knockout/pull/440
            //   [B] Any trailing nodes that have been remove should be ignored
            //       This prevents the code here from adding unrelated nodes to the array while processing rule [C]
            //       See https://github.com/knockout/knockout/pull/1903
            //   [C] We want to output a continuous series of nodes. So, ignore any nodes that have already been removed,
            //       and include any nodes that have been inserted among the previous collection

            if (continuousNodeArray.length) {
                // The parent node can be a virtual element; so get the real parent node
                parentNode = (parentNode.nodeType === 8 && parentNode.parentNode) || parentNode;

                // Rule [A]
                while (continuousNodeArray.length && continuousNodeArray[0].parentNode !== parentNode)
                    continuousNodeArray.splice(0, 1);

                // Rule [B]
                while (continuousNodeArray.length > 1 && continuousNodeArray[continuousNodeArray.length - 1].parentNode !== parentNode)
                    continuousNodeArray.length--;

                // Rule [C]
                if (continuousNodeArray.length > 1) {
                    var current = continuousNodeArray[0], last = continuousNodeArray[continuousNodeArray.length - 1];
                    // Replace with the actual new continuous node set
                    continuousNodeArray.length = 0;
                    while (current !== last) {
                        continuousNodeArray.push(current);
                        current = current.nextSibling;
                    }
                    continuousNodeArray.push(last);
                }
            }
            return continuousNodeArray;
        },

        setOptionNodeSelectionState: function (optionNode, isSelected) {
            // IE6 sometimes throws "unknown error" if you try to write to .selected directly, whereas Firefox struggles with setAttribute. Pick one based on browser.
            if (ieVersion < 7)
                optionNode.setAttribute("selected", isSelected);
            else
                optionNode.selected = isSelected;
        },

        stringTrim: function (string) {
            return string === null || string === undefined ? '' :
                string.trim ?
                    string.trim() :
                    string.toString().replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
        },

        stringStartsWith: function (string, startsWith) {
            string = string || "";
            if (startsWith.length > string.length)
                return false;
            return string.substring(0, startsWith.length) === startsWith;
        },

        domNodeIsContainedBy: function (node, containedByNode) {
            if (node === containedByNode)
                return true;
            if (node.nodeType === 11)
                return false; // Fixes issue #1162 - can't use node.contains for document fragments on IE8
            if (containedByNode.contains)
                return containedByNode.contains(node.nodeType === 3 ? node.parentNode : node);
            if (containedByNode.compareDocumentPosition)
                return (containedByNode.compareDocumentPosition(node) & 16) == 16;
            while (node && node != containedByNode) {
                node = node.parentNode;
            }
            return !!node;
        },

        domNodeIsAttachedToDocument: function (node) {
            return ko.utils.domNodeIsContainedBy(node, node.ownerDocument.documentElement);
        },

        anyDomNodeIsAttachedToDocument: function(nodes) {
            return !!ko.utils.arrayFirst(nodes, ko.utils.domNodeIsAttachedToDocument);
        },

        tagNameLower: function(element) {
            // For HTML elements, tagName will always be upper case; for XHTML elements, it'll be lower case.
            // Possible future optimization: If we know it's an element from an XHTML document (not HTML),
            // we don't need to do the .toLowerCase() as it will always be lower case anyway.
            return element && element.tagName && element.tagName.toLowerCase();
        },

        catchFunctionErrors: function (delegate) {
            return ko['onError'] ? function () {
                try {
                    return delegate.apply(this, arguments);
                } catch (e) {
                    ko['onError'] && ko['onError'](e);
                    throw e;
                }
            } : delegate;
        },

        setTimeout: function (handler, timeout) {
            return setTimeout(ko.utils.catchFunctionErrors(handler), timeout);
        },

        deferError: function (error) {
            setTimeout(function () {
                ko['onError'] && ko['onError'](error);
                throw error;
            }, 0);
        },

        registerEventHandler: function (element, eventType, handler) {
            var wrappedHandler = ko.utils.catchFunctionErrors(handler);

            var mustUseAttachEvent = ieVersion && eventsThatMustBeRegisteredUsingAttachEvent[eventType];
            if (!ko.options['useOnlyNativeEvents'] && !mustUseAttachEvent && jQueryInstance) {
                jQueryInstance(element)['bind'](eventType, wrappedHandler);
            } else if (!mustUseAttachEvent && typeof element.addEventListener == "function")
                element.addEventListener(eventType, wrappedHandler, false);
            else if (typeof element.attachEvent != "undefined") {
                var attachEventHandler = function (event) { wrappedHandler.call(element, event); },
                    attachEventName = "on" + eventType;
                element.attachEvent(attachEventName, attachEventHandler);

                // IE does not dispose attachEvent handlers automatically (unlike with addEventListener)
                // so to avoid leaks, we have to remove them manually. See bug #856
                ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                    element.detachEvent(attachEventName, attachEventHandler);
                });
            } else
                throw new Error("Browser doesn't support addEventListener or attachEvent");
        },

        triggerEvent: function (element, eventType) {
            if (!(element && element.nodeType))
                throw new Error("element must be a DOM node when calling triggerEvent");

            // For click events on checkboxes and radio buttons, jQuery toggles the element checked state *after* the
            // event handler runs instead of *before*. (This was fixed in 1.9 for checkboxes but not for radio buttons.)
            // IE doesn't change the checked state when you trigger the click event using "fireEvent".
            // In both cases, we'll use the click method instead.
            var useClickWorkaround = isClickOnCheckableElement(element, eventType);

            if (!ko.options['useOnlyNativeEvents'] && jQueryInstance && !useClickWorkaround) {
                jQueryInstance(element)['trigger'](eventType);
            } else if (typeof document.createEvent == "function") {
                if (typeof element.dispatchEvent == "function") {
                    var eventCategory = knownEventTypesByEventName[eventType] || "HTMLEvents";
                    var event = document.createEvent(eventCategory);
                    event.initEvent(eventType, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, element);
                    element.dispatchEvent(event);
                }
                else
                    throw new Error("The supplied element doesn't support dispatchEvent");
            } else if (useClickWorkaround && element.click) {
                element.click();
            } else if (typeof element.fireEvent != "undefined") {
                element.fireEvent("on" + eventType);
            } else {
                throw new Error("Browser doesn't support triggering events");
            }
        },

        unwrapObservable: function (value) {
            return ko.isObservable(value) ? value() : value;
        },

        peekObservable: function (value) {
            return ko.isObservable(value) ? value.peek() : value;
        },

        toggleDomNodeCssClass: toggleDomNodeCssClass,

        setTextContent: function(element, textContent) {
            var value = ko.utils.unwrapObservable(textContent);
            if ((value === null) || (value === undefined))
                value = "";

            // We need there to be exactly one child: a text node.
            // If there are no children, more than one, or if it's not a text node,
            // we'll clear everything and create a single text node.
            var innerTextNode = ko.virtualElements.firstChild(element);
            if (!innerTextNode || innerTextNode.nodeType != 3 || ko.virtualElements.nextSibling(innerTextNode)) {
                ko.virtualElements.setDomNodeChildren(element, [element.ownerDocument.createTextNode(value)]);
            } else {
                innerTextNode.data = value;
            }

            ko.utils.forceRefresh(element);
        },

        setElementName: function(element, name) {
            element.name = name;

            // Workaround IE 6/7 issue
            // - https://github.com/SteveSanderson/knockout/issues/197
            // - http://www.matts411.com/post/setting_the_name_attribute_in_ie_dom/
            if (ieVersion <= 7) {
                try {
                    element.mergeAttributes(document.createElement("<input name='" + element.name + "'/>"), false);
                }
                catch(e) {} // For IE9 with doc mode "IE9 Standards" and browser mode "IE9 Compatibility View"
            }
        },

        forceRefresh: function(node) {
            // Workaround for an IE9 rendering bug - https://github.com/SteveSanderson/knockout/issues/209
            if (ieVersion >= 9) {
                // For text nodes and comment nodes (most likely virtual elements), we will have to refresh the container
                var elem = node.nodeType == 1 ? node : node.parentNode;
                if (elem.style)
                    elem.style.zoom = elem.style.zoom;
            }
        },

        ensureSelectElementIsRenderedCorrectly: function(selectElement) {
            // Workaround for IE9 rendering bug - it doesn't reliably display all the text in dynamically-added select boxes unless you force it to re-render by updating the width.
            // (See https://github.com/SteveSanderson/knockout/issues/312, http://stackoverflow.com/questions/5908494/select-only-shows-first-char-of-selected-option)
            // Also fixes IE7 and IE8 bug that causes selects to be zero width if enclosed by 'if' or 'with'. (See issue #839)
            if (ieVersion) {
                var originalWidth = selectElement.style.width;
                selectElement.style.width = 0;
                selectElement.style.width = originalWidth;
            }
        },

        range: function (min, max) {
            min = ko.utils.unwrapObservable(min);
            max = ko.utils.unwrapObservable(max);
            var result = [];
            for (var i = min; i <= max; i++)
                result.push(i);
            return result;
        },

        makeArray: function(arrayLikeObject) {
            var result = [];
            for (var i = 0, j = arrayLikeObject.length; i < j; i++) {
                result.push(arrayLikeObject[i]);
            };
            return result;
        },

        createSymbolOrString: function(identifier) {
            return canUseSymbols ? Symbol(identifier) : identifier;
        },

        isIe6 : isIe6,
        isIe7 : isIe7,
        ieVersion : ieVersion,

        getFormFields: function(form, fieldName) {
            var fields = ko.utils.makeArray(form.getElementsByTagName("input")).concat(ko.utils.makeArray(form.getElementsByTagName("textarea")));
            var isMatchingField = (typeof fieldName == 'string')
                ? function(field) { return field.name === fieldName }
                : function(field) { return fieldName.test(field.name) }; // Treat fieldName as regex or object containing predicate
            var matches = [];
            for (var i = fields.length - 1; i >= 0; i--) {
                if (isMatchingField(fields[i]))
                    matches.push(fields[i]);
            };
            return matches;
        },

        parseJson: function (jsonString) {
            if (typeof jsonString == "string") {
                jsonString = ko.utils.stringTrim(jsonString);
                if (jsonString) {
                    if (JSON && JSON.parse) // Use native parsing where available
                        return JSON.parse(jsonString);
                    return (new Function("return " + jsonString))(); // Fallback on less safe parsing for older browsers
                }
            }
            return null;
        },

        stringifyJson: function (data, replacer, space) {   // replacer and space are optional
            if (!JSON || !JSON.stringify)
                throw new Error("Cannot find JSON.stringify(). Some browsers (e.g., IE < 8) don't support it natively, but you can overcome this by adding a script reference to json2.js, downloadable from http://www.json.org/json2.js");
            return JSON.stringify(ko.utils.unwrapObservable(data), replacer, space);
        },

        postJson: function (urlOrForm, data, options) {
            options = options || {};
            var params = options['params'] || {};
            var includeFields = options['includeFields'] || this.fieldsIncludedWithJsonPost;
            var url = urlOrForm;

            // If we were given a form, use its 'action' URL and pick out any requested field values
            if((typeof urlOrForm == 'object') && (ko.utils.tagNameLower(urlOrForm) === "form")) {
                var originalForm = urlOrForm;
                url = originalForm.action;
                for (var i = includeFields.length - 1; i >= 0; i--) {
                    var fields = ko.utils.getFormFields(originalForm, includeFields[i]);
                    for (var j = fields.length - 1; j >= 0; j--)
                        params[fields[j].name] = fields[j].value;
                }
            }

            data = ko.utils.unwrapObservable(data);
            var form = document.createElement("form");
            form.style.display = "none";
            form.action = url;
            form.method = "post";
            for (var key in data) {
                // Since 'data' this is a model object, we include all properties including those inherited from its prototype
                var input = document.createElement("input");
                input.type = "hidden";
                input.name = key;
                input.value = ko.utils.stringifyJson(ko.utils.unwrapObservable(data[key]));
                form.appendChild(input);
            }
            objectForEach(params, function(key, value) {
                var input = document.createElement("input");
                input.type = "hidden";
                input.name = key;
                input.value = value;
                form.appendChild(input);
            });
            document.body.appendChild(form);
            options['submitter'] ? options['submitter'](form) : form.submit();
            setTimeout(function () { form.parentNode.removeChild(form); }, 0);
        }
    }
}());

ko.exportSymbol('utils', ko.utils);
ko.exportSymbol('utils.arrayForEach', ko.utils.arrayForEach);
ko.exportSymbol('utils.arrayFirst', ko.utils.arrayFirst);
ko.exportSymbol('utils.arrayFilter', ko.utils.arrayFilter);
ko.exportSymbol('utils.arrayGetDistinctValues', ko.utils.arrayGetDistinctValues);
ko.exportSymbol('utils.arrayIndexOf', ko.utils.arrayIndexOf);
ko.exportSymbol('utils.arrayMap', ko.utils.arrayMap);
ko.exportSymbol('utils.arrayPushAll', ko.utils.arrayPushAll);
ko.exportSymbol('utils.arrayRemoveItem', ko.utils.arrayRemoveItem);
ko.exportSymbol('utils.extend', ko.utils.extend);
ko.exportSymbol('utils.fieldsIncludedWithJsonPost', ko.utils.fieldsIncludedWithJsonPost);
ko.exportSymbol('utils.getFormFields', ko.utils.getFormFields);
ko.exportSymbol('utils.peekObservable', ko.utils.peekObservable);
ko.exportSymbol('utils.postJson', ko.utils.postJson);
ko.exportSymbol('utils.parseJson', ko.utils.parseJson);
ko.exportSymbol('utils.registerEventHandler', ko.utils.registerEventHandler);
ko.exportSymbol('utils.stringifyJson', ko.utils.stringifyJson);
ko.exportSymbol('utils.range', ko.utils.range);
ko.exportSymbol('utils.toggleDomNodeCssClass', ko.utils.toggleDomNodeCssClass);
ko.exportSymbol('utils.triggerEvent', ko.utils.triggerEvent);
ko.exportSymbol('utils.unwrapObservable', ko.utils.unwrapObservable);
ko.exportSymbol('utils.objectForEach', ko.utils.objectForEach);
ko.exportSymbol('utils.addOrRemoveItem', ko.utils.addOrRemoveItem);
ko.exportSymbol('utils.setTextContent', ko.utils.setTextContent);
ko.exportSymbol('unwrap', ko.utils.unwrapObservable); // Convenient shorthand, because this is used so commonly

if (!Function.prototype['bind']) {
    // Function.prototype.bind is a standard part of ECMAScript 5th Edition (December 2009, http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf)
    // In case the browser doesn't implement it natively, provide a JavaScript implementation. This implementation is based on the one in prototype.js
    Function.prototype['bind'] = function (object) {
        var originalFunction = this;
        if (arguments.length === 1) {
            return function () {
                return originalFunction.apply(object, arguments);
            };
        } else {
            var partialArgs = Array.prototype.slice.call(arguments, 1);
            return function () {
                var args = partialArgs.slice(0);
                args.push.apply(args, arguments);
                return originalFunction.apply(object, args);
            };
        }
    };
}

ko.utils.domData = new (function () {
    var uniqueId = 0;
    var dataStoreKeyExpandoPropertyName = "__ko__" + (new Date).getTime();
    var dataStore = {};

    function getAll(node, createIfNotFound) {
        var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
        var hasExistingDataStore = dataStoreKey && (dataStoreKey !== "null") && dataStore[dataStoreKey];
        if (!hasExistingDataStore) {
            if (!createIfNotFound)
                return undefined;
            dataStoreKey = node[dataStoreKeyExpandoPropertyName] = "ko" + uniqueId++;
            dataStore[dataStoreKey] = {};
        }
        return dataStore[dataStoreKey];
    }

    return {
        get: function (node, key) {
            var allDataForNode = getAll(node, false);
            return allDataForNode === undefined ? undefined : allDataForNode[key];
        },
        set: function (node, key, value) {
            if (value === undefined) {
                // Make sure we don't actually create a new domData key if we are actually deleting a value
                if (getAll(node, false) === undefined)
                    return;
            }
            var allDataForNode = getAll(node, true);
            allDataForNode[key] = value;
        },
        clear: function (node) {
            var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
            if (dataStoreKey) {
                delete dataStore[dataStoreKey];
                node[dataStoreKeyExpandoPropertyName] = null;
                return true; // Exposing "did clean" flag purely so specs can infer whether things have been cleaned up as intended
            }
            return false;
        },

        nextKey: function () {
            return (uniqueId++) + dataStoreKeyExpandoPropertyName;
        }
    };
})();

ko.exportSymbol('utils.domData', ko.utils.domData);
ko.exportSymbol('utils.domData.clear', ko.utils.domData.clear); // Exporting only so specs can clear up after themselves fully

ko.utils.domNodeDisposal = new (function () {
    var domDataKey = ko.utils.domData.nextKey();
    var cleanableNodeTypes = { 1: true, 8: true, 9: true };       // Element, Comment, Document
    var cleanableNodeTypesWithDescendants = { 1: true, 9: true }; // Element, Document

    function getDisposeCallbacksCollection(node, createIfNotFound) {
        var allDisposeCallbacks = ko.utils.domData.get(node, domDataKey);
        if ((allDisposeCallbacks === undefined) && createIfNotFound) {
            allDisposeCallbacks = [];
            ko.utils.domData.set(node, domDataKey, allDisposeCallbacks);
        }
        return allDisposeCallbacks;
    }
    function destroyCallbacksCollection(node) {
        ko.utils.domData.set(node, domDataKey, undefined);
    }

    function cleanSingleNode(node) {
        // Run all the dispose callbacks
        var callbacks = getDisposeCallbacksCollection(node, false);
        if (callbacks) {
            callbacks = callbacks.slice(0); // Clone, as the array may be modified during iteration (typically, callbacks will remove themselves)
            for (var i = 0; i < callbacks.length; i++)
                callbacks[i](node);
        }

        // Erase the DOM data
        ko.utils.domData.clear(node);

        // Perform cleanup needed by external libraries (currently only jQuery, but can be extended)
        ko.utils.domNodeDisposal["cleanExternalData"](node);

        // Clear any immediate-child comment nodes, as these wouldn't have been found by
        // node.getElementsByTagName("*") in cleanNode() (comment nodes aren't elements)
        if (cleanableNodeTypesWithDescendants[node.nodeType])
            cleanImmediateCommentTypeChildren(node);
    }

    function cleanImmediateCommentTypeChildren(nodeWithChildren) {
        var child, nextChild = nodeWithChildren.firstChild;
        while (child = nextChild) {
            nextChild = child.nextSibling;
            if (child.nodeType === 8)
                cleanSingleNode(child);
        }
    }

    return {
        addDisposeCallback : function(node, callback) {
            if (typeof callback != "function")
                throw new Error("Callback must be a function");
            getDisposeCallbacksCollection(node, true).push(callback);
        },

        removeDisposeCallback : function(node, callback) {
            var callbacksCollection = getDisposeCallbacksCollection(node, false);
            if (callbacksCollection) {
                ko.utils.arrayRemoveItem(callbacksCollection, callback);
                if (callbacksCollection.length == 0)
                    destroyCallbacksCollection(node);
            }
        },

        cleanNode : function(node) {
            // First clean this node, where applicable
            if (cleanableNodeTypes[node.nodeType]) {
                cleanSingleNode(node);

                // ... then its descendants, where applicable
                if (cleanableNodeTypesWithDescendants[node.nodeType]) {
                    // Clone the descendants list in case it changes during iteration
                    var descendants = [];
                    ko.utils.arrayPushAll(descendants, node.getElementsByTagName("*"));
                    for (var i = 0, j = descendants.length; i < j; i++)
                        cleanSingleNode(descendants[i]);
                }
            }
            return node;
        },

        removeNode : function(node) {
            ko.cleanNode(node);
            if (node.parentNode)
                node.parentNode.removeChild(node);
        },

        "cleanExternalData" : function (node) {
            // Special support for jQuery here because it's so commonly used.
            // Many jQuery plugins (including jquery.tmpl) store data using jQuery's equivalent of domData
            // so notify it to tear down any resources associated with the node & descendants here.
            if (jQueryInstance && (typeof jQueryInstance['cleanData'] == "function"))
                jQueryInstance['cleanData']([node]);
        }
    };
})();
ko.cleanNode = ko.utils.domNodeDisposal.cleanNode; // Shorthand name for convenience
ko.removeNode = ko.utils.domNodeDisposal.removeNode; // Shorthand name for convenience
ko.exportSymbol('cleanNode', ko.cleanNode);
ko.exportSymbol('removeNode', ko.removeNode);
ko.exportSymbol('utils.domNodeDisposal', ko.utils.domNodeDisposal);
ko.exportSymbol('utils.domNodeDisposal.addDisposeCallback', ko.utils.domNodeDisposal.addDisposeCallback);
ko.exportSymbol('utils.domNodeDisposal.removeDisposeCallback', ko.utils.domNodeDisposal.removeDisposeCallback);
(function () {
    var none = [0, "", ""],
        table = [1, "<table>", "</table>"],
        tbody = [2, "<table><tbody>", "</tbody></table>"],
        tr = [3, "<table><tbody><tr>", "</tr></tbody></table>"],
        select = [1, "<select multiple='multiple'>", "</select>"],
        lookup = {
            'thead': table,
            'tbody': table,
            'tfoot': table,
            'tr': tbody,
            'td': tr,
            'th': tr,
            'option': select,
            'optgroup': select
        },

        // This is needed for old IE if you're *not* using either jQuery or innerShiv. Doesn't affect other cases.
        mayRequireCreateElementHack = ko.utils.ieVersion <= 8;

    function getWrap(tags) {
        var m = tags.match(/^<([a-z]+)[ >]/);
        return (m && lookup[m[1]]) || none;
    }

    function simpleHtmlParse(html, documentContext) {
        documentContext || (documentContext = document);
        var windowContext = documentContext['parentWindow'] || documentContext['defaultView'] || window;

        // Based on jQuery's "clean" function, but only accounting for table-related elements.
        // If you have referenced jQuery, this won't be used anyway - KO will use jQuery's "clean" function directly

        // Note that there's still an issue in IE < 9 whereby it will discard comment nodes that are the first child of
        // a descendant node. For example: "<div><!-- mycomment -->abc</div>" will get parsed as "<div>abc</div>"
        // This won't affect anyone who has referenced jQuery, and there's always the workaround of inserting a dummy node
        // (possibly a text node) in front of the comment. So, KO does not attempt to workaround this IE issue automatically at present.

        // Trim whitespace, otherwise indexOf won't work as expected
        var tags = ko.utils.stringTrim(html).toLowerCase(), div = documentContext.createElement("div"),
            wrap = getWrap(tags),
            depth = wrap[0];

        // Go to html and back, then peel off extra wrappers
        // Note that we always prefix with some dummy text, because otherwise, IE<9 will strip out leading comment nodes in descendants. Total madness.
        var markup = "ignored<div>" + wrap[1] + html + wrap[2] + "</div>";
        if (typeof windowContext['innerShiv'] == "function") {
            // Note that innerShiv is deprecated in favour of html5shiv. We should consider adding
            // support for html5shiv (except if no explicit support is needed, e.g., if html5shiv
            // somehow shims the native APIs so it just works anyway)
            div.appendChild(windowContext['innerShiv'](markup));
        } else {
            if (mayRequireCreateElementHack) {
                // The document.createElement('my-element') trick to enable custom elements in IE6-8
                // only works if we assign innerHTML on an element associated with that document.
                documentContext.appendChild(div);
            }

            div.innerHTML = markup;

            if (mayRequireCreateElementHack) {
                div.parentNode.removeChild(div);
            }
        }

        // Move to the right depth
        while (depth--)
            div = div.lastChild;

        return ko.utils.makeArray(div.lastChild.childNodes);
    }

    function jQueryHtmlParse(html, documentContext) {
        // jQuery's "parseHTML" function was introduced in jQuery 1.8.0 and is a documented public API.
        if (jQueryInstance['parseHTML']) {
            return jQueryInstance['parseHTML'](html, documentContext) || []; // Ensure we always return an array and never null
        } else {
            // For jQuery < 1.8.0, we fall back on the undocumented internal "clean" function.
            var elems = jQueryInstance['clean']([html], documentContext);

            // As of jQuery 1.7.1, jQuery parses the HTML by appending it to some dummy parent nodes held in an in-memory document fragment.
            // Unfortunately, it never clears the dummy parent nodes from the document fragment, so it leaks memory over time.
            // Fix this by finding the top-most dummy parent element, and detaching it from its owner fragment.
            if (elems && elems[0]) {
                // Find the top-most parent element that's a direct child of a document fragment
                var elem = elems[0];
                while (elem.parentNode && elem.parentNode.nodeType !== 11 /* i.e., DocumentFragment */)
                    elem = elem.parentNode;
                // ... then detach it
                if (elem.parentNode)
                    elem.parentNode.removeChild(elem);
            }

            return elems;
        }
    }

    ko.utils.parseHtmlFragment = function(html, documentContext) {
        return jQueryInstance ?
            jQueryHtmlParse(html, documentContext) :   // As below, benefit from jQuery's optimisations where possible
            simpleHtmlParse(html, documentContext);  // ... otherwise, this simple logic will do in most common cases.
    };

    ko.utils.setHtml = function(node, html) {
        ko.utils.emptyDomNode(node);

        // There's no legitimate reason to display a stringified observable without unwrapping it, so we'll unwrap it
        html = ko.utils.unwrapObservable(html);

        if ((html !== null) && (html !== undefined)) {
            if (typeof html != 'string')
                html = html.toString();

            // jQuery contains a lot of sophisticated code to parse arbitrary HTML fragments,
            // for example <tr> elements which are not normally allowed to exist on their own.
            // If you've referenced jQuery we'll use that rather than duplicating its code.
            if (jQueryInstance) {
                jQueryInstance(node)['html'](html);
            } else {
                // ... otherwise, use KO's own parsing logic.
                var parsedNodes = ko.utils.parseHtmlFragment(html, node.ownerDocument);
                for (var i = 0; i < parsedNodes.length; i++)
                    node.appendChild(parsedNodes[i]);
            }
        }
    };
})();

ko.exportSymbol('utils.parseHtmlFragment', ko.utils.parseHtmlFragment);
ko.exportSymbol('utils.setHtml', ko.utils.setHtml);

ko.memoization = (function () {
    var memos = {};

    function randomMax8HexChars() {
        return (((1 + Math.random()) * 0x100000000) | 0).toString(16).substring(1);
    }
    function generateRandomId() {
        return randomMax8HexChars() + randomMax8HexChars();
    }
    function findMemoNodes(rootNode, appendToArray) {
        if (!rootNode)
            return;
        if (rootNode.nodeType == 8) {
            var memoId = ko.memoization.parseMemoText(rootNode.nodeValue);
            if (memoId != null)
                appendToArray.push({ domNode: rootNode, memoId: memoId });
        } else if (rootNode.nodeType == 1) {
            for (var i = 0, childNodes = rootNode.childNodes, j = childNodes.length; i < j; i++)
                findMemoNodes(childNodes[i], appendToArray);
        }
    }

    return {
        memoize: function (callback) {
            if (typeof callback != "function")
                throw new Error("You can only pass a function to ko.memoization.memoize()");
            var memoId = generateRandomId();
            memos[memoId] = callback;
            return "<!--[ko_memo:" + memoId + "]-->";
        },

        unmemoize: function (memoId, callbackParams) {
            var callback = memos[memoId];
            if (callback === undefined)
                throw new Error("Couldn't find any memo with ID " + memoId + ". Perhaps it's already been unmemoized.");
            try {
                callback.apply(null, callbackParams || []);
                return true;
            }
            finally { delete memos[memoId]; }
        },

        unmemoizeDomNodeAndDescendants: function (domNode, extraCallbackParamsArray) {
            var memos = [];
            findMemoNodes(domNode, memos);
            for (var i = 0, j = memos.length; i < j; i++) {
                var node = memos[i].domNode;
                var combinedParams = [node];
                if (extraCallbackParamsArray)
                    ko.utils.arrayPushAll(combinedParams, extraCallbackParamsArray);
                ko.memoization.unmemoize(memos[i].memoId, combinedParams);
                node.nodeValue = ""; // Neuter this node so we don't try to unmemoize it again
                if (node.parentNode)
                    node.parentNode.removeChild(node); // If possible, erase it totally (not always possible - someone else might just hold a reference to it then call unmemoizeDomNodeAndDescendants again)
            }
        },

        parseMemoText: function (memoText) {
            var match = memoText.match(/^\[ko_memo\:(.*?)\]$/);
            return match ? match[1] : null;
        }
    };
})();

ko.exportSymbol('memoization', ko.memoization);
ko.exportSymbol('memoization.memoize', ko.memoization.memoize);
ko.exportSymbol('memoization.unmemoize', ko.memoization.unmemoize);
ko.exportSymbol('memoization.parseMemoText', ko.memoization.parseMemoText);
ko.exportSymbol('memoization.unmemoizeDomNodeAndDescendants', ko.memoization.unmemoizeDomNodeAndDescendants);
ko.tasks = (function () {
    var scheduler,
        taskQueue = [],
        taskQueueLength = 0,
        nextHandle = 1,
        nextIndexToProcess = 0;

    if (window['MutationObserver']) {
        // Chrome 27+, Firefox 14+, IE 11+, Opera 15+, Safari 6.1+
        // From https://github.com/petkaantonov/bluebird * Copyright (c) 2014 Petka Antonov * License: MIT
        scheduler = (function (callback) {
            var div = document.createElement("div");
            new MutationObserver(callback).observe(div, {attributes: true});
            return function () { div.classList.toggle("foo"); };
        })(scheduledProcess);
    } else if (document && "onreadystatechange" in document.createElement("script")) {
        // IE 6-10
        // From https://github.com/YuzuJS/setImmediate * Copyright (c) 2012 Barnesandnoble.com, llc, Donavon West, and Domenic Denicola * License: MIT
        scheduler = function (callback) {
            var script = document.createElement("script");
            script.onreadystatechange = function () {
                script.onreadystatechange = null;
                document.documentElement.removeChild(script);
                script = null;
                callback();
            };
            document.documentElement.appendChild(script);
        };
    } else {
        scheduler = function (callback) {
            setTimeout(callback, 0);
        };
    }

    function processTasks() {
        if (taskQueueLength) {
            // Each mark represents the end of a logical group of tasks and the number of these groups is
            // limited to prevent unchecked recursion.
            var mark = taskQueueLength, countMarks = 0;

            // nextIndexToProcess keeps track of where we are in the queue; processTasks can be called recursively without issue
            for (var task; nextIndexToProcess < taskQueueLength; ) {
                if (task = taskQueue[nextIndexToProcess++]) {
                    if (nextIndexToProcess > mark) {
                        if (++countMarks >= 5000) {
                            nextIndexToProcess = taskQueueLength;   // skip all tasks remaining in the queue since any of them could be causing the recursion
                            ko.utils.deferError(Error("'Too much recursion' after processing " + countMarks + " task groups."));
                            break;
                        }
                        mark = taskQueueLength;
                    }
                    try {
                        task();
                    } catch (ex) {
                        ko.utils.deferError(ex);
                    }
                }
            }
        }
    }

    function scheduledProcess() {
        processTasks();

        // Reset the queue
        nextIndexToProcess = taskQueueLength = taskQueue.length = 0;
    }

    function scheduleTaskProcessing() {
        ko.tasks['scheduler'](scheduledProcess);
    }

    var tasks = {
        'scheduler': scheduler,     // Allow overriding the scheduler

        schedule: function (func) {
            if (!taskQueueLength) {
                scheduleTaskProcessing();
            }

            taskQueue[taskQueueLength++] = func;
            return nextHandle++;
        },

        cancel: function (handle) {
            var index = handle - (nextHandle - taskQueueLength);
            if (index >= nextIndexToProcess && index < taskQueueLength) {
                taskQueue[index] = null;
            }
        },

        // For testing only: reset the queue and return the previous queue length
        'resetForTesting': function () {
            var length = taskQueueLength - nextIndexToProcess;
            nextIndexToProcess = taskQueueLength = taskQueue.length = 0;
            return length;
        },

        runEarly: processTasks
    };

    return tasks;
})();

ko.exportSymbol('tasks', ko.tasks);
ko.exportSymbol('tasks.schedule', ko.tasks.schedule);
//ko.exportSymbol('tasks.cancel', ko.tasks.cancel);  "cancel" isn't minified
ko.exportSymbol('tasks.runEarly', ko.tasks.runEarly);
ko.extenders = {
    'throttle': function(target, timeout) {
        // Throttling means two things:

        // (1) For dependent observables, we throttle *evaluations* so that, no matter how fast its dependencies
        //     notify updates, the target doesn't re-evaluate (and hence doesn't notify) faster than a certain rate
        target['throttleEvaluation'] = timeout;

        // (2) For writable targets (observables, or writable dependent observables), we throttle *writes*
        //     so the target cannot change value synchronously or faster than a certain rate
        var writeTimeoutInstance = null;
        return ko.dependentObservable({
            'read': target,
            'write': function(value) {
                clearTimeout(writeTimeoutInstance);
                writeTimeoutInstance = ko.utils.setTimeout(function() {
                    target(value);
                }, timeout);
            }
        });
    },

    'rateLimit': function(target, options) {
        var timeout, method, limitFunction;

        if (typeof options == 'number') {
            timeout = options;
        } else {
            timeout = options['timeout'];
            method = options['method'];
        }

        // rateLimit supersedes deferred updates
        target._deferUpdates = false;

        limitFunction = method == 'notifyWhenChangesStop' ?  debounce : throttle;
        target.limit(function(callback) {
            return limitFunction(callback, timeout);
        });
    },

    'deferred': function(target, options) {
        if (options !== true) {
            throw new Error('The \'deferred\' extender only accepts the value \'true\', because it is not supported to turn deferral off once enabled.')
        }

        if (!target._deferUpdates) {
            target._deferUpdates = true;
            target.limit(function (callback) {
                var handle;
                return function () {
                    ko.tasks.cancel(handle);
                    handle = ko.tasks.schedule(callback);
                    target['notifySubscribers'](undefined, 'dirty');
                };
            });
        }
    },

    'notify': function(target, notifyWhen) {
        target["equalityComparer"] = notifyWhen == "always" ?
            null :  // null equalityComparer means to always notify
            valuesArePrimitiveAndEqual;
    }
};

var primitiveTypes = { 'undefined':1, 'boolean':1, 'number':1, 'string':1 };
function valuesArePrimitiveAndEqual(a, b) {
    var oldValueIsPrimitive = (a === null) || (typeof(a) in primitiveTypes);
    return oldValueIsPrimitive ? (a === b) : false;
}

function throttle(callback, timeout) {
    var timeoutInstance;
    return function () {
        if (!timeoutInstance) {
            timeoutInstance = ko.utils.setTimeout(function () {
                timeoutInstance = undefined;
                callback();
            }, timeout);
        }
    };
}

function debounce(callback, timeout) {
    var timeoutInstance;
    return function () {
        clearTimeout(timeoutInstance);
        timeoutInstance = ko.utils.setTimeout(callback, timeout);
    };
}

function applyExtenders(requestedExtenders) {
    var target = this;
    if (requestedExtenders) {
        ko.utils.objectForEach(requestedExtenders, function(key, value) {
            var extenderHandler = ko.extenders[key];
            if (typeof extenderHandler == 'function') {
                target = extenderHandler(target, value) || target;
            }
        });
    }
    return target;
}

ko.exportSymbol('extenders', ko.extenders);

ko.subscription = function (target, callback, disposeCallback) {
    this._target = target;
    this.callback = callback;
    this.disposeCallback = disposeCallback;
    this.isDisposed = false;
    ko.exportProperty(this, 'dispose', this.dispose);
};
ko.subscription.prototype.dispose = function () {
    this.isDisposed = true;
    this.disposeCallback();
};

ko.subscribable = function () {
    ko.utils.setPrototypeOfOrExtend(this, ko_subscribable_fn);
    ko_subscribable_fn.init(this);
}

var defaultEvent = "change";

// Moved out of "limit" to avoid the extra closure
function limitNotifySubscribers(value, event) {
    if (!event || event === defaultEvent) {
        this._limitChange(value);
    } else if (event === 'beforeChange') {
        this._limitBeforeChange(value);
    } else {
        this._origNotifySubscribers(value, event);
    }
}

var ko_subscribable_fn = {
    init: function(instance) {
        instance._subscriptions = {};
        instance._versionNumber = 1;
    },

    subscribe: function (callback, callbackTarget, event) {
        var self = this;

        event = event || defaultEvent;
        var boundCallback = callbackTarget ? callback.bind(callbackTarget) : callback;

        var subscription = new ko.subscription(self, boundCallback, function () {
            ko.utils.arrayRemoveItem(self._subscriptions[event], subscription);
            if (self.afterSubscriptionRemove)
                self.afterSubscriptionRemove(event);
        });

        if (self.beforeSubscriptionAdd)
            self.beforeSubscriptionAdd(event);

        if (!self._subscriptions[event])
            self._subscriptions[event] = [];
        self._subscriptions[event].push(subscription);

        return subscription;
    },

    "notifySubscribers": function (valueToNotify, event) {
        event = event || defaultEvent;
        if (event === defaultEvent) {
            this.updateVersion();
        }
        if (this.hasSubscriptionsForEvent(event)) {
            try {
                ko.dependencyDetection.begin(); // Begin suppressing dependency detection (by setting the top frame to undefined)
                for (var a = this._subscriptions[event].slice(0), i = 0, subscription; subscription = a[i]; ++i) {
                    // In case a subscription was disposed during the arrayForEach cycle, check
                    // for isDisposed on each subscription before invoking its callback
                    if (!subscription.isDisposed)
                        subscription.callback(valueToNotify);
                }
            } finally {
                ko.dependencyDetection.end(); // End suppressing dependency detection
            }
        }
    },

    getVersion: function () {
        return this._versionNumber;
    },

    hasChanged: function (versionToCheck) {
        return this.getVersion() !== versionToCheck;
    },

    updateVersion: function () {
        ++this._versionNumber;
    },

    limit: function(limitFunction) {
        var self = this, selfIsObservable = ko.isObservable(self),
            ignoreBeforeChange, previousValue, pendingValue, beforeChange = 'beforeChange';

        if (!self._origNotifySubscribers) {
            self._origNotifySubscribers = self["notifySubscribers"];
            self["notifySubscribers"] = limitNotifySubscribers;
        }

        var finish = limitFunction(function() {
            self._notificationIsPending = false;

            // If an observable provided a reference to itself, access it to get the latest value.
            // This allows computed observables to delay calculating their value until needed.
            if (selfIsObservable && pendingValue === self) {
                pendingValue = self();
            }
            ignoreBeforeChange = false;
            if (self.isDifferent(previousValue, pendingValue)) {
                self._origNotifySubscribers(previousValue = pendingValue);
            }
        });

        self._limitChange = function(value) {
            self._notificationIsPending = ignoreBeforeChange = true;
            pendingValue = value;
            finish();
        };
        self._limitBeforeChange = function(value) {
            if (!ignoreBeforeChange) {
                previousValue = value;
                self._origNotifySubscribers(value, beforeChange);
            }
        };
    },

    hasSubscriptionsForEvent: function(event) {
        return this._subscriptions[event] && this._subscriptions[event].length;
    },

    getSubscriptionsCount: function (event) {
        if (event) {
            return this._subscriptions[event] && this._subscriptions[event].length || 0;
        } else {
            var total = 0;
            ko.utils.objectForEach(this._subscriptions, function(eventName, subscriptions) {
                if (eventName !== 'dirty')
                    total += subscriptions.length;
            });
            return total;
        }
    },

    isDifferent: function(oldValue, newValue) {
        return !this['equalityComparer'] || !this['equalityComparer'](oldValue, newValue);
    },

    extend: applyExtenders
};

ko.exportProperty(ko_subscribable_fn, 'subscribe', ko_subscribable_fn.subscribe);
ko.exportProperty(ko_subscribable_fn, 'extend', ko_subscribable_fn.extend);
ko.exportProperty(ko_subscribable_fn, 'getSubscriptionsCount', ko_subscribable_fn.getSubscriptionsCount);

// For browsers that support proto assignment, we overwrite the prototype of each
// observable instance. Since observables are functions, we need Function.prototype
// to still be in the prototype chain.
if (ko.utils.canSetPrototype) {
    ko.utils.setPrototypeOf(ko_subscribable_fn, Function.prototype);
}

ko.subscribable['fn'] = ko_subscribable_fn;


ko.isSubscribable = function (instance) {
    return instance != null && typeof instance.subscribe == "function" && typeof instance["notifySubscribers"] == "function";
};

ko.exportSymbol('subscribable', ko.subscribable);
ko.exportSymbol('isSubscribable', ko.isSubscribable);

ko.computedContext = ko.dependencyDetection = (function () {
    var outerFrames = [],
        currentFrame,
        lastId = 0;

    // Return a unique ID that can be assigned to an observable for dependency tracking.
    // Theoretically, you could eventually overflow the number storage size, resulting
    // in duplicate IDs. But in JavaScript, the largest exact integral value is 2^53
    // or 9,007,199,254,740,992. If you created 1,000,000 IDs per second, it would
    // take over 285 years to reach that number.
    // Reference http://blog.vjeux.com/2010/javascript/javascript-max_int-number-limits.html
    function getId() {
        return ++lastId;
    }

    function begin(options) {
        outerFrames.push(currentFrame);
        currentFrame = options;
    }

    function end() {
        currentFrame = outerFrames.pop();
    }

    return {
        begin: begin,

        end: end,

        registerDependency: function (subscribable) {
            if (currentFrame) {
                if (!ko.isSubscribable(subscribable))
                    throw new Error("Only subscribable things can act as dependencies");
                currentFrame.callback.call(currentFrame.callbackTarget, subscribable, subscribable._id || (subscribable._id = getId()));
            }
        },

        ignore: function (callback, callbackTarget, callbackArgs) {
            try {
                begin();
                return callback.apply(callbackTarget, callbackArgs || []);
            } finally {
                end();
            }
        },

        getDependenciesCount: function () {
            if (currentFrame)
                return currentFrame.computed.getDependenciesCount();
        },

        isInitial: function() {
            if (currentFrame)
                return currentFrame.isInitial;
        }
    };
})();

ko.exportSymbol('computedContext', ko.computedContext);
ko.exportSymbol('computedContext.getDependenciesCount', ko.computedContext.getDependenciesCount);
ko.exportSymbol('computedContext.isInitial', ko.computedContext.isInitial);

ko.exportSymbol('ignoreDependencies', ko.ignoreDependencies = ko.dependencyDetection.ignore);
var observableLatestValue = ko.utils.createSymbolOrString('_latestValue');

ko.observable = function (initialValue) {
    function observable() {
        if (arguments.length > 0) {
            // Write

            // Ignore writes if the value hasn't changed
            if (observable.isDifferent(observable[observableLatestValue], arguments[0])) {
                observable.valueWillMutate();
                observable[observableLatestValue] = arguments[0];
                observable.valueHasMutated();
            }
            return this; // Permits chained assignments
        }
        else {
            // Read
            ko.dependencyDetection.registerDependency(observable); // The caller only needs to be notified of changes if they did a "read" operation
            return observable[observableLatestValue];
        }
    }

    observable[observableLatestValue] = initialValue;

    // Inherit from 'subscribable'
    if (!ko.utils.canSetPrototype) {
        // 'subscribable' won't be on the prototype chain unless we put it there directly
        ko.utils.extend(observable, ko.subscribable['fn']);
    }
    ko.subscribable['fn'].init(observable);

    // Inherit from 'observable'
    ko.utils.setPrototypeOfOrExtend(observable, observableFn);

    if (ko.options['deferUpdates']) {
        ko.extenders['deferred'](observable, true);
    }

    return observable;
}

// Define prototype for observables
var observableFn = {
    'equalityComparer': valuesArePrimitiveAndEqual,
    peek: function() { return this[observableLatestValue]; },
    valueHasMutated: function () { this['notifySubscribers'](this[observableLatestValue]); },
    valueWillMutate: function () { this['notifySubscribers'](this[observableLatestValue], 'beforeChange'); }
};

// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the ko.observable constructor
if (ko.utils.canSetPrototype) {
    ko.utils.setPrototypeOf(observableFn, ko.subscribable['fn']);
}

var protoProperty = ko.observable.protoProperty = '__ko_proto__';
observableFn[protoProperty] = ko.observable;

ko.hasPrototype = function(instance, prototype) {
    if ((instance === null) || (instance === undefined) || (instance[protoProperty] === undefined)) return false;
    if (instance[protoProperty] === prototype) return true;
    return ko.hasPrototype(instance[protoProperty], prototype); // Walk the prototype chain
};

ko.isObservable = function (instance) {
    return ko.hasPrototype(instance, ko.observable);
}
ko.isWriteableObservable = function (instance) {
    // Observable
    if ((typeof instance == 'function') && instance[protoProperty] === ko.observable)
        return true;
    // Writeable dependent observable
    if ((typeof instance == 'function') && (instance[protoProperty] === ko.dependentObservable) && (instance.hasWriteFunction))
        return true;
    // Anything else
    return false;
}

ko.exportSymbol('observable', ko.observable);
ko.exportSymbol('isObservable', ko.isObservable);
ko.exportSymbol('isWriteableObservable', ko.isWriteableObservable);
ko.exportSymbol('isWritableObservable', ko.isWriteableObservable);
ko.exportSymbol('observable.fn', observableFn);
ko.exportProperty(observableFn, 'peek', observableFn.peek);
ko.exportProperty(observableFn, 'valueHasMutated', observableFn.valueHasMutated);
ko.exportProperty(observableFn, 'valueWillMutate', observableFn.valueWillMutate);
ko.observableArray = function (initialValues) {
    initialValues = initialValues || [];

    if (typeof initialValues != 'object' || !('length' in initialValues))
        throw new Error("The argument passed when initializing an observable array must be an array, or null, or undefined.");

    var result = ko.observable(initialValues);
    ko.utils.setPrototypeOfOrExtend(result, ko.observableArray['fn']);
    return result.extend({'trackArrayChanges':true});
};

ko.observableArray['fn'] = {
    'remove': function (valueOrPredicate) {
        var underlyingArray = this.peek();
        var removedValues = [];
        var predicate = typeof valueOrPredicate == "function" && !ko.isObservable(valueOrPredicate) ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        for (var i = 0; i < underlyingArray.length; i++) {
            var value = underlyingArray[i];
            if (predicate(value)) {
                if (removedValues.length === 0) {
                    this.valueWillMutate();
                }
                removedValues.push(value);
                underlyingArray.splice(i, 1);
                i--;
            }
        }
        if (removedValues.length) {
            this.valueHasMutated();
        }
        return removedValues;
    },

    'removeAll': function (arrayOfValues) {
        // If you passed zero args, we remove everything
        if (arrayOfValues === undefined) {
            var underlyingArray = this.peek();
            var allValues = underlyingArray.slice(0);
            this.valueWillMutate();
            underlyingArray.splice(0, underlyingArray.length);
            this.valueHasMutated();
            return allValues;
        }
        // If you passed an arg, we interpret it as an array of entries to remove
        if (!arrayOfValues)
            return [];
        return this['remove'](function (value) {
            return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
        });
    },

    'destroy': function (valueOrPredicate) {
        var underlyingArray = this.peek();
        var predicate = typeof valueOrPredicate == "function" && !ko.isObservable(valueOrPredicate) ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        this.valueWillMutate();
        for (var i = underlyingArray.length - 1; i >= 0; i--) {
            var value = underlyingArray[i];
            if (predicate(value))
                underlyingArray[i]["_destroy"] = true;
        }
        this.valueHasMutated();
    },

    'destroyAll': function (arrayOfValues) {
        // If you passed zero args, we destroy everything
        if (arrayOfValues === undefined)
            return this['destroy'](function() { return true });

        // If you passed an arg, we interpret it as an array of entries to destroy
        if (!arrayOfValues)
            return [];
        return this['destroy'](function (value) {
            return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
        });
    },

    'indexOf': function (item) {
        var underlyingArray = this();
        return ko.utils.arrayIndexOf(underlyingArray, item);
    },

    'replace': function(oldItem, newItem) {
        var index = this['indexOf'](oldItem);
        if (index >= 0) {
            this.valueWillMutate();
            this.peek()[index] = newItem;
            this.valueHasMutated();
        }
    }
};

// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the ko.observableArray constructor
if (ko.utils.canSetPrototype) {
    ko.utils.setPrototypeOf(ko.observableArray['fn'], ko.observable['fn']);
}

// Populate ko.observableArray.fn with read/write functions from native arrays
// Important: Do not add any additional functions here that may reasonably be used to *read* data from the array
// because we'll eval them without causing subscriptions, so ko.computed output could end up getting stale
ko.utils.arrayForEach(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function (methodName) {
    ko.observableArray['fn'][methodName] = function () {
        // Use "peek" to avoid creating a subscription in any computed that we're executing in the context of
        // (for consistency with mutating regular observables)
        var underlyingArray = this.peek();
        this.valueWillMutate();
        this.cacheDiffForKnownOperation(underlyingArray, methodName, arguments);
        var methodCallResult = underlyingArray[methodName].apply(underlyingArray, arguments);
        this.valueHasMutated();
        // The native sort and reverse methods return a reference to the array, but it makes more sense to return the observable array instead.
        return methodCallResult === underlyingArray ? this : methodCallResult;
    };
});

// Populate ko.observableArray.fn with read-only functions from native arrays
ko.utils.arrayForEach(["slice"], function (methodName) {
    ko.observableArray['fn'][methodName] = function () {
        var underlyingArray = this();
        return underlyingArray[methodName].apply(underlyingArray, arguments);
    };
});

ko.exportSymbol('observableArray', ko.observableArray);
var arrayChangeEventName = 'arrayChange';
ko.extenders['trackArrayChanges'] = function(target, options) {
    // Use the provided options--each call to trackArrayChanges overwrites the previously set options
    target.compareArrayOptions = {};
    if (options && typeof options == "object") {
        ko.utils.extend(target.compareArrayOptions, options);
    }
    target.compareArrayOptions['sparse'] = true;

    // Only modify the target observable once
    if (target.cacheDiffForKnownOperation) {
        return;
    }
    var trackingChanges = false,
        cachedDiff = null,
        arrayChangeSubscription,
        pendingNotifications = 0,
        underlyingBeforeSubscriptionAddFunction = target.beforeSubscriptionAdd,
        underlyingAfterSubscriptionRemoveFunction = target.afterSubscriptionRemove;

    // Watch "subscribe" calls, and for array change events, ensure change tracking is enabled
    target.beforeSubscriptionAdd = function (event) {
        if (underlyingBeforeSubscriptionAddFunction)
            underlyingBeforeSubscriptionAddFunction.call(target, event);
        if (event === arrayChangeEventName) {
            trackChanges();
        }
    };
    // Watch "dispose" calls, and for array change events, ensure change tracking is disabled when all are disposed
    target.afterSubscriptionRemove = function (event) {
        if (underlyingAfterSubscriptionRemoveFunction)
            underlyingAfterSubscriptionRemoveFunction.call(target, event);
        if (event === arrayChangeEventName && !target.hasSubscriptionsForEvent(arrayChangeEventName)) {
            arrayChangeSubscription.dispose();
            trackingChanges = false;
        }
    };

    function trackChanges() {
        // Calling 'trackChanges' multiple times is the same as calling it once
        if (trackingChanges) {
            return;
        }

        trackingChanges = true;

        // Intercept "notifySubscribers" to track how many times it was called.
        var underlyingNotifySubscribersFunction = target['notifySubscribers'];
        target['notifySubscribers'] = function(valueToNotify, event) {
            if (!event || event === defaultEvent) {
                ++pendingNotifications;
            }
            return underlyingNotifySubscribersFunction.apply(this, arguments);
        };

        // Each time the array changes value, capture a clone so that on the next
        // change it's possible to produce a diff
        var previousContents = [].concat(target.peek() || []);
        cachedDiff = null;
        arrayChangeSubscription = target.subscribe(function(currentContents) {
            // Make a copy of the current contents and ensure it's an array
            currentContents = [].concat(currentContents || []);

            // Compute the diff and issue notifications, but only if someone is listening
            if (target.hasSubscriptionsForEvent(arrayChangeEventName)) {
                var changes = getChanges(previousContents, currentContents);
            }

            // Eliminate references to the old, removed items, so they can be GCed
            previousContents = currentContents;
            cachedDiff = null;
            pendingNotifications = 0;

            if (changes && changes.length) {
                target['notifySubscribers'](changes, arrayChangeEventName);
            }
        });
    }

    function getChanges(previousContents, currentContents) {
        // We try to re-use cached diffs.
        // The scenarios where pendingNotifications > 1 are when using rate-limiting or the Deferred Updates
        // plugin, which without this check would not be compatible with arrayChange notifications. Normally,
        // notifications are issued immediately so we wouldn't be queueing up more than one.
        if (!cachedDiff || pendingNotifications > 1) {
            cachedDiff = ko.utils.compareArrays(previousContents, currentContents, target.compareArrayOptions);
        }

        return cachedDiff;
    }

    target.cacheDiffForKnownOperation = function(rawArray, operationName, args) {
        // Only run if we're currently tracking changes for this observable array
        // and there aren't any pending deferred notifications.
        if (!trackingChanges || pendingNotifications) {
            return;
        }
        var diff = [],
            arrayLength = rawArray.length,
            argsLength = args.length,
            offset = 0;

        function pushDiff(status, value, index) {
            return diff[diff.length] = { 'status': status, 'value': value, 'index': index };
        }
        switch (operationName) {
            case 'push':
                offset = arrayLength;
            case 'unshift':
                for (var index = 0; index < argsLength; index++) {
                    pushDiff('added', args[index], offset + index);
                }
                break;

            case 'pop':
                offset = arrayLength - 1;
            case 'shift':
                if (arrayLength) {
                    pushDiff('deleted', rawArray[offset], offset);
                }
                break;

            case 'splice':
                // Negative start index means 'from end of array'. After that we clamp to [0...arrayLength].
                // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
                var startIndex = Math.min(Math.max(0, args[0] < 0 ? arrayLength + args[0] : args[0]), arrayLength),
                    endDeleteIndex = argsLength === 1 ? arrayLength : Math.min(startIndex + (args[1] || 0), arrayLength),
                    endAddIndex = startIndex + argsLength - 2,
                    endIndex = Math.max(endDeleteIndex, endAddIndex),
                    additions = [], deletions = [];
                for (var index = startIndex, argsIndex = 2; index < endIndex; ++index, ++argsIndex) {
                    if (index < endDeleteIndex)
                        deletions.push(pushDiff('deleted', rawArray[index], index));
                    if (index < endAddIndex)
                        additions.push(pushDiff('added', args[argsIndex], index));
                }
                ko.utils.findMovesInArrayComparison(deletions, additions);
                break;

            default:
                return;
        }
        cachedDiff = diff;
    };
};
var computedState = ko.utils.createSymbolOrString('_state');

ko.computed = ko.dependentObservable = function (evaluatorFunctionOrOptions, evaluatorFunctionTarget, options) {
    if (typeof evaluatorFunctionOrOptions === "object") {
        // Single-parameter syntax - everything is on this "options" param
        options = evaluatorFunctionOrOptions;
    } else {
        // Multi-parameter syntax - construct the options according to the params passed
        options = options || {};
        if (evaluatorFunctionOrOptions) {
            options["read"] = evaluatorFunctionOrOptions;
        }
    }
    if (typeof options["read"] != "function")
        throw Error("Pass a function that returns the value of the ko.computed");

    var writeFunction = options["write"];
    var state = {
        latestValue: undefined,
        isStale: true,
        isBeingEvaluated: false,
        suppressDisposalUntilDisposeWhenReturnsFalse: false,
        isDisposed: false,
        pure: false,
        isSleeping: false,
        readFunction: options["read"],
        evaluatorFunctionTarget: evaluatorFunctionTarget || options["owner"],
        disposeWhenNodeIsRemoved: options["disposeWhenNodeIsRemoved"] || options.disposeWhenNodeIsRemoved || null,
        disposeWhen: options["disposeWhen"] || options.disposeWhen,
        domNodeDisposalCallback: null,
        dependencyTracking: {},
        dependenciesCount: 0,
        evaluationTimeoutInstance: null
    };

    function computedObservable() {
        if (arguments.length > 0) {
            if (typeof writeFunction === "function") {
                // Writing a value
                writeFunction.apply(state.evaluatorFunctionTarget, arguments);
            } else {
                throw new Error("Cannot write a value to a ko.computed unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.");
            }
            return this; // Permits chained assignments
        } else {
            // Reading the value
            ko.dependencyDetection.registerDependency(computedObservable);
            if (state.isStale || (state.isSleeping && computedObservable.haveDependenciesChanged())) {
                computedObservable.evaluateImmediate();
            }
            return state.latestValue;
        }
    }

    computedObservable[computedState] = state;
    computedObservable.hasWriteFunction = typeof writeFunction === "function";

    // Inherit from 'subscribable'
    if (!ko.utils.canSetPrototype) {
        // 'subscribable' won't be on the prototype chain unless we put it there directly
        ko.utils.extend(computedObservable, ko.subscribable['fn']);
    }
    ko.subscribable['fn'].init(computedObservable);

    // Inherit from 'computed'
    ko.utils.setPrototypeOfOrExtend(computedObservable, computedFn);

    if (options['pure']) {
        state.pure = true;
        state.isSleeping = true;     // Starts off sleeping; will awake on the first subscription
        ko.utils.extend(computedObservable, pureComputedOverrides);
    } else if (options['deferEvaluation']) {
        ko.utils.extend(computedObservable, deferEvaluationOverrides);
    }

    if (ko.options['deferUpdates']) {
        ko.extenders['deferred'](computedObservable, true);
    }

    if (DEBUG) {
        // #1731 - Aid debugging by exposing the computed's options
        computedObservable["_options"] = options;
    }

    if (state.disposeWhenNodeIsRemoved) {
        // Since this computed is associated with a DOM node, and we don't want to dispose the computed
        // until the DOM node is *removed* from the document (as opposed to never having been in the document),
        // we'll prevent disposal until "disposeWhen" first returns false.
        state.suppressDisposalUntilDisposeWhenReturnsFalse = true;

        // disposeWhenNodeIsRemoved: true can be used to opt into the "only dispose after first false result"
        // behaviour even if there's no specific node to watch. In that case, clear the option so we don't try
        // to watch for a non-node's disposal. This technique is intended for KO's internal use only and shouldn't
        // be documented or used by application code, as it's likely to change in a future version of KO.
        if (!state.disposeWhenNodeIsRemoved.nodeType) {
            state.disposeWhenNodeIsRemoved = null;
        }
    }

    // Evaluate, unless sleeping or deferEvaluation is true
    if (!state.isSleeping && !options['deferEvaluation']) {
        computedObservable.evaluateImmediate();
    }

    // Attach a DOM node disposal callback so that the computed will be proactively disposed as soon as the node is
    // removed using ko.removeNode. But skip if isActive is false (there will never be any dependencies to dispose).
    if (state.disposeWhenNodeIsRemoved && computedObservable.isActive()) {
        ko.utils.domNodeDisposal.addDisposeCallback(state.disposeWhenNodeIsRemoved, state.domNodeDisposalCallback = function () {
            computedObservable.dispose();
        });
    }

    return computedObservable;
};

// Utility function that disposes a given dependencyTracking entry
function computedDisposeDependencyCallback(id, entryToDispose) {
    if (entryToDispose !== null && entryToDispose.dispose) {
        entryToDispose.dispose();
    }
}

// This function gets called each time a dependency is detected while evaluating a computed.
// It's factored out as a shared function to avoid creating unnecessary function instances during evaluation.
function computedBeginDependencyDetectionCallback(subscribable, id) {
    var computedObservable = this.computedObservable,
        state = computedObservable[computedState];
    if (!state.isDisposed) {
        if (this.disposalCount && this.disposalCandidates[id]) {
            // Don't want to dispose this subscription, as it's still being used
            computedObservable.addDependencyTracking(id, subscribable, this.disposalCandidates[id]);
            this.disposalCandidates[id] = null; // No need to actually delete the property - disposalCandidates is a transient object anyway
            --this.disposalCount;
        } else if (!state.dependencyTracking[id]) {
            // Brand new subscription - add it
            computedObservable.addDependencyTracking(id, subscribable, state.isSleeping ? { _target: subscribable } : computedObservable.subscribeToDependency(subscribable));
        }
    }
}

var computedFn = {
    "equalityComparer": valuesArePrimitiveAndEqual,
    getDependenciesCount: function () {
        return this[computedState].dependenciesCount;
    },
    addDependencyTracking: function (id, target, trackingObj) {
        if (this[computedState].pure && target === this) {
            throw Error("A 'pure' computed must not be called recursively");
        }

        this[computedState].dependencyTracking[id] = trackingObj;
        trackingObj._order = this[computedState].dependenciesCount++;
        trackingObj._version = target.getVersion();
    },
    haveDependenciesChanged: function () {
        var id, dependency, dependencyTracking = this[computedState].dependencyTracking;
        for (id in dependencyTracking) {
            if (dependencyTracking.hasOwnProperty(id)) {
                dependency = dependencyTracking[id];
                if (dependency._target.hasChanged(dependency._version)) {
                    return true;
                }
            }
        }
    },
    markDirty: function () {
        // Process "dirty" events if we can handle delayed notifications
        if (this._evalDelayed && !this[computedState].isBeingEvaluated) {
            this._evalDelayed();
        }
    },
    isActive: function () {
        return this[computedState].isStale || this[computedState].dependenciesCount > 0;
    },
    respondToChange: function () {
        // Ignore "change" events if we've already scheduled a delayed notification
        if (!this._notificationIsPending) {
            this.evaluatePossiblyAsync();
        }
    },
    subscribeToDependency: function (target) {
        if (target._deferUpdates && !this[computedState].disposeWhenNodeIsRemoved) {
            var dirtySub = target.subscribe(this.markDirty, this, 'dirty'),
                changeSub = target.subscribe(this.respondToChange, this);
            return {
                _target: target,
                dispose: function () {
                    dirtySub.dispose();
                    changeSub.dispose();
                }
            };
        } else {
            return target.subscribe(this.evaluatePossiblyAsync, this);
        }
    },
    evaluatePossiblyAsync: function () {
        var computedObservable = this,
            throttleEvaluationTimeout = computedObservable['throttleEvaluation'];
        if (throttleEvaluationTimeout && throttleEvaluationTimeout >= 0) {
            clearTimeout(this[computedState].evaluationTimeoutInstance);
            this[computedState].evaluationTimeoutInstance = ko.utils.setTimeout(function () {
                computedObservable.evaluateImmediate(true /*notifyChange*/);
            }, throttleEvaluationTimeout);
        } else if (computedObservable._evalDelayed) {
            computedObservable._evalDelayed();
        } else {
            computedObservable.evaluateImmediate(true /*notifyChange*/);
        }
    },
    evaluateImmediate: function (notifyChange) {
        var computedObservable = this,
            state = computedObservable[computedState],
            disposeWhen = state.disposeWhen;

        if (state.isBeingEvaluated) {
            // If the evaluation of a ko.computed causes side effects, it's possible that it will trigger its own re-evaluation.
            // This is not desirable (it's hard for a developer to realise a chain of dependencies might cause this, and they almost
            // certainly didn't intend infinite re-evaluations). So, for predictability, we simply prevent ko.computeds from causing
            // their own re-evaluation. Further discussion at https://github.com/SteveSanderson/knockout/pull/387
            return;
        }

        // Do not evaluate (and possibly capture new dependencies) if disposed
        if (state.isDisposed) {
            return;
        }

        if (state.disposeWhenNodeIsRemoved && !ko.utils.domNodeIsAttachedToDocument(state.disposeWhenNodeIsRemoved) || disposeWhen && disposeWhen()) {
            // See comment above about suppressDisposalUntilDisposeWhenReturnsFalse
            if (!state.suppressDisposalUntilDisposeWhenReturnsFalse) {
                computedObservable.dispose();
                return;
            }
        } else {
            // It just did return false, so we can stop suppressing now
            state.suppressDisposalUntilDisposeWhenReturnsFalse = false;
        }

        state.isBeingEvaluated = true;
        try {
            this.evaluateImmediate_CallReadWithDependencyDetection(notifyChange);
        } finally {
            state.isBeingEvaluated = false;
        }

        if (!state.dependenciesCount) {
            computedObservable.dispose();
        }
    },
    evaluateImmediate_CallReadWithDependencyDetection: function (notifyChange) {
        // This function is really just part of the evaluateImmediate logic. You would never call it from anywhere else.
        // Factoring it out into a separate function means it can be independent of the try/catch block in evaluateImmediate,
        // which contributes to saving about 40% off the CPU overhead of computed evaluation (on V8 at least).

        var computedObservable = this,
            state = computedObservable[computedState];

        // Initially, we assume that none of the subscriptions are still being used (i.e., all are candidates for disposal).
        // Then, during evaluation, we cross off any that are in fact still being used.
        var isInitial = state.pure ? undefined : !state.dependenciesCount,   // If we're evaluating when there are no previous dependencies, it must be the first time
            dependencyDetectionContext = {
                computedObservable: computedObservable,
                disposalCandidates: state.dependencyTracking,
                disposalCount: state.dependenciesCount
            };

        ko.dependencyDetection.begin({
            callbackTarget: dependencyDetectionContext,
            callback: computedBeginDependencyDetectionCallback,
            computed: computedObservable,
            isInitial: isInitial
        });

        state.dependencyTracking = {};
        state.dependenciesCount = 0;

        var newValue = this.evaluateImmediate_CallReadThenEndDependencyDetection(state, dependencyDetectionContext);

        if (computedObservable.isDifferent(state.latestValue, newValue)) {
            if (!state.isSleeping) {
                computedObservable["notifySubscribers"](state.latestValue, "beforeChange");
            }

            state.latestValue = newValue;

            if (state.isSleeping) {
                computedObservable.updateVersion();
            } else if (notifyChange) {
                computedObservable["notifySubscribers"](state.latestValue);
            }
        }

        if (isInitial) {
            computedObservable["notifySubscribers"](state.latestValue, "awake");
        }
    },
    evaluateImmediate_CallReadThenEndDependencyDetection: function (state, dependencyDetectionContext) {
        // This function is really part of the evaluateImmediate_CallReadWithDependencyDetection logic.
        // You'd never call it from anywhere else. Factoring it out means that evaluateImmediate_CallReadWithDependencyDetection
        // can be independent of try/finally blocks, which contributes to saving about 40% off the CPU
        // overhead of computed evaluation (on V8 at least).

        try {
            var readFunction = state.readFunction;
            return state.evaluatorFunctionTarget ? readFunction.call(state.evaluatorFunctionTarget) : readFunction();
        } finally {
            ko.dependencyDetection.end();

            // For each subscription no longer being used, remove it from the active subscriptions list and dispose it
            if (dependencyDetectionContext.disposalCount && !state.isSleeping) {
                ko.utils.objectForEach(dependencyDetectionContext.disposalCandidates, computedDisposeDependencyCallback);
            }

            state.isStale = false;
        }
    },
    peek: function () {
        // Peek won't re-evaluate, except while the computed is sleeping or to get the initial value when "deferEvaluation" is set.
        var state = this[computedState];
        if ((state.isStale && !state.dependenciesCount) || (state.isSleeping && this.haveDependenciesChanged())) {
            this.evaluateImmediate();
        }
        return state.latestValue;
    },
    limit: function (limitFunction) {
        // Override the limit function with one that delays evaluation as well
        ko.subscribable['fn'].limit.call(this, limitFunction);
        this._evalDelayed = function () {
            this._limitBeforeChange(this[computedState].latestValue);

            this[computedState].isStale = true; // Mark as dirty

            // Pass the observable to the "limit" code, which will access it when
            // it's time to do the notification.
            this._limitChange(this);
        }
    },
    dispose: function () {
        var state = this[computedState];
        if (!state.isSleeping && state.dependencyTracking) {
            ko.utils.objectForEach(state.dependencyTracking, function (id, dependency) {
                if (dependency.dispose)
                    dependency.dispose();
            });
        }
        if (state.disposeWhenNodeIsRemoved && state.domNodeDisposalCallback) {
            ko.utils.domNodeDisposal.removeDisposeCallback(state.disposeWhenNodeIsRemoved, state.domNodeDisposalCallback);
        }
        state.dependencyTracking = null;
        state.dependenciesCount = 0;
        state.isDisposed = true;
        state.isStale = false;
        state.isSleeping = false;
        state.disposeWhenNodeIsRemoved = null;
    }
};

var pureComputedOverrides = {
    beforeSubscriptionAdd: function (event) {
        // If asleep, wake up the computed by subscribing to any dependencies.
        var computedObservable = this,
            state = computedObservable[computedState];
        if (!state.isDisposed && state.isSleeping && event == 'change') {
            state.isSleeping = false;
            if (state.isStale || computedObservable.haveDependenciesChanged()) {
                state.dependencyTracking = null;
                state.dependenciesCount = 0;
                state.isStale = true;
                computedObservable.evaluateImmediate();
            } else {
                // First put the dependencies in order
                var dependeciesOrder = [];
                ko.utils.objectForEach(state.dependencyTracking, function (id, dependency) {
                    dependeciesOrder[dependency._order] = id;
                });
                // Next, subscribe to each one
                ko.utils.arrayForEach(dependeciesOrder, function (id, order) {
                    var dependency = state.dependencyTracking[id],
                        subscription = computedObservable.subscribeToDependency(dependency._target);
                    subscription._order = order;
                    subscription._version = dependency._version;
                    state.dependencyTracking[id] = subscription;
                });
            }
            if (!state.isDisposed) {     // test since evaluating could trigger disposal
                computedObservable["notifySubscribers"](state.latestValue, "awake");
            }
        }
    },
    afterSubscriptionRemove: function (event) {
        var state = this[computedState];
        if (!state.isDisposed && event == 'change' && !this.hasSubscriptionsForEvent('change')) {
            ko.utils.objectForEach(state.dependencyTracking, function (id, dependency) {
                if (dependency.dispose) {
                    state.dependencyTracking[id] = {
                        _target: dependency._target,
                        _order: dependency._order,
                        _version: dependency._version
                    };
                    dependency.dispose();
                }
            });
            state.isSleeping = true;
            this["notifySubscribers"](undefined, "asleep");
        }
    },
    getVersion: function () {
        // Because a pure computed is not automatically updated while it is sleeping, we can't
        // simply return the version number. Instead, we check if any of the dependencies have
        // changed and conditionally re-evaluate the computed observable.
        var state = this[computedState];
        if (state.isSleeping && (state.isStale || this.haveDependenciesChanged())) {
            this.evaluateImmediate();
        }
        return ko.subscribable['fn'].getVersion.call(this);
    }
};

var deferEvaluationOverrides = {
    beforeSubscriptionAdd: function (event) {
        // This will force a computed with deferEvaluation to evaluate when the first subscription is registered.
        if (event == 'change' || event == 'beforeChange') {
            this.peek();
        }
    }
};

// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the ko.computed constructor
if (ko.utils.canSetPrototype) {
    ko.utils.setPrototypeOf(computedFn, ko.subscribable['fn']);
}

// Set the proto chain values for ko.hasPrototype
var protoProp = ko.observable.protoProperty; // == "__ko_proto__"
ko.computed[protoProp] = ko.observable;
computedFn[protoProp] = ko.computed;

ko.isComputed = function (instance) {
    return ko.hasPrototype(instance, ko.computed);
};

ko.isPureComputed = function (instance) {
    return ko.hasPrototype(instance, ko.computed)
        && instance[computedState] && instance[computedState].pure;
};

ko.exportSymbol('computed', ko.computed);
ko.exportSymbol('dependentObservable', ko.computed);    // export ko.dependentObservable for backwards compatibility (1.x)
ko.exportSymbol('isComputed', ko.isComputed);
ko.exportSymbol('isPureComputed', ko.isPureComputed);
ko.exportSymbol('computed.fn', computedFn);
ko.exportProperty(computedFn, 'peek', computedFn.peek);
ko.exportProperty(computedFn, 'dispose', computedFn.dispose);
ko.exportProperty(computedFn, 'isActive', computedFn.isActive);
ko.exportProperty(computedFn, 'getDependenciesCount', computedFn.getDependenciesCount);

ko.pureComputed = function (evaluatorFunctionOrOptions, evaluatorFunctionTarget) {
    if (typeof evaluatorFunctionOrOptions === 'function') {
        return ko.computed(evaluatorFunctionOrOptions, evaluatorFunctionTarget, {'pure':true});
    } else {
        evaluatorFunctionOrOptions = ko.utils.extend({}, evaluatorFunctionOrOptions);   // make a copy of the parameter object
        evaluatorFunctionOrOptions['pure'] = true;
        return ko.computed(evaluatorFunctionOrOptions, evaluatorFunctionTarget);
    }
}
ko.exportSymbol('pureComputed', ko.pureComputed);

(function() {
    var maxNestedObservableDepth = 10; // Escape the (unlikely) pathalogical case where an observable's current value is itself (or similar reference cycle)

    ko.toJS = function(rootObject) {
        if (arguments.length == 0)
            throw new Error("When calling ko.toJS, pass the object you want to convert.");

        // We just unwrap everything at every level in the object graph
        return mapJsObjectGraph(rootObject, function(valueToMap) {
            // Loop because an observable's value might in turn be another observable wrapper
            for (var i = 0; ko.isObservable(valueToMap) && (i < maxNestedObservableDepth); i++)
                valueToMap = valueToMap();
            return valueToMap;
        });
    };

    ko.toJSON = function(rootObject, replacer, space) {     // replacer and space are optional
        var plainJavaScriptObject = ko.toJS(rootObject);
        return ko.utils.stringifyJson(plainJavaScriptObject, replacer, space);
    };

    function mapJsObjectGraph(rootObject, mapInputCallback, visitedObjects) {
        visitedObjects = visitedObjects || new objectLookup();

        rootObject = mapInputCallback(rootObject);
        var canHaveProperties = (typeof rootObject == "object") && (rootObject !== null) && (rootObject !== undefined) && (!(rootObject instanceof RegExp)) && (!(rootObject instanceof Date)) && (!(rootObject instanceof String)) && (!(rootObject instanceof Number)) && (!(rootObject instanceof Boolean));
        if (!canHaveProperties)
            return rootObject;

        var outputProperties = rootObject instanceof Array ? [] : {};
        visitedObjects.save(rootObject, outputProperties);

        visitPropertiesOrArrayEntries(rootObject, function(indexer) {
            var propertyValue = mapInputCallback(rootObject[indexer]);

            switch (typeof propertyValue) {
                case "boolean":
                case "number":
                case "string":
                case "function":
                    outputProperties[indexer] = propertyValue;
                    break;
                case "object":
                case "undefined":
                    var previouslyMappedValue = visitedObjects.get(propertyValue);
                    outputProperties[indexer] = (previouslyMappedValue !== undefined)
                        ? previouslyMappedValue
                        : mapJsObjectGraph(propertyValue, mapInputCallback, visitedObjects);
                    break;
            }
        });

        return outputProperties;
    }

    function visitPropertiesOrArrayEntries(rootObject, visitorCallback) {
        if (rootObject instanceof Array) {
            for (var i = 0; i < rootObject.length; i++)
                visitorCallback(i);

            // For arrays, also respect toJSON property for custom mappings (fixes #278)
            if (typeof rootObject['toJSON'] == 'function')
                visitorCallback('toJSON');
        } else {
            for (var propertyName in rootObject) {
                visitorCallback(propertyName);
            }
        }
    };

    function objectLookup() {
        this.keys = [];
        this.values = [];
    };

    objectLookup.prototype = {
        constructor: objectLookup,
        save: function(key, value) {
            var existingIndex = ko.utils.arrayIndexOf(this.keys, key);
            if (existingIndex >= 0)
                this.values[existingIndex] = value;
            else {
                this.keys.push(key);
                this.values.push(value);
            }
        },
        get: function(key) {
            var existingIndex = ko.utils.arrayIndexOf(this.keys, key);
            return (existingIndex >= 0) ? this.values[existingIndex] : undefined;
        }
    };
})();

ko.exportSymbol('toJS', ko.toJS);
ko.exportSymbol('toJSON', ko.toJSON);
(function () {
    var hasDomDataExpandoProperty = '__ko__hasDomDataOptionValue__';

    // Normally, SELECT elements and their OPTIONs can only take value of type 'string' (because the values
    // are stored on DOM attributes). ko.selectExtensions provides a way for SELECTs/OPTIONs to have values
    // that are arbitrary objects. This is very convenient when implementing things like cascading dropdowns.
    ko.selectExtensions = {
        readValue : function(element) {
            switch (ko.utils.tagNameLower(element)) {
                case 'option':
                    if (element[hasDomDataExpandoProperty] === true)
                        return ko.utils.domData.get(element, ko.bindingHandlers.options.optionValueDomDataKey);
                    return ko.utils.ieVersion <= 7
                        ? (element.getAttributeNode('value') && element.getAttributeNode('value').specified ? element.value : element.text)
                        : element.value;
                case 'select':
                    return element.selectedIndex >= 0 ? ko.selectExtensions.readValue(element.options[element.selectedIndex]) : undefined;
                default:
                    return element.value;
            }
        },

        writeValue: function(element, value, allowUnset) {
            switch (ko.utils.tagNameLower(element)) {
                case 'option':
                    switch(typeof value) {
                        case "string":
                            ko.utils.domData.set(element, ko.bindingHandlers.options.optionValueDomDataKey, undefined);
                            if (hasDomDataExpandoProperty in element) { // IE <= 8 throws errors if you delete non-existent properties from a DOM node
                                delete element[hasDomDataExpandoProperty];
                            }
                            element.value = value;
                            break;
                        default:
                            // Store arbitrary object using DomData
                            ko.utils.domData.set(element, ko.bindingHandlers.options.optionValueDomDataKey, value);
                            element[hasDomDataExpandoProperty] = true;

                            // Special treatment of numbers is just for backward compatibility. KO 1.2.1 wrote numerical values to element.value.
                            element.value = typeof value === "number" ? value : "";
                            break;
                    }
                    break;
                case 'select':
                    if (value === "" || value === null)       // A blank string or null value will select the caption
                        value = undefined;
                    var selection = -1;
                    for (var i = 0, n = element.options.length, optionValue; i < n; ++i) {
                        optionValue = ko.selectExtensions.readValue(element.options[i]);
                        // Include special check to handle selecting a caption with a blank string value
                        if (optionValue == value || (optionValue == "" && value === undefined)) {
                            selection = i;
                            break;
                        }
                    }
                    if (allowUnset || selection >= 0 || (value === undefined && element.size > 1)) {
                        element.selectedIndex = selection;
                    }
                    break;
                default:
                    if ((value === null) || (value === undefined))
                        value = "";
                    element.value = value;
                    break;
            }
        }
    };
})();

ko.exportSymbol('selectExtensions', ko.selectExtensions);
ko.exportSymbol('selectExtensions.readValue', ko.selectExtensions.readValue);
ko.exportSymbol('selectExtensions.writeValue', ko.selectExtensions.writeValue);
ko.expressionRewriting = (function () {
    var javaScriptReservedWords = ["true", "false", "null", "undefined"];

    // Matches something that can be assigned to--either an isolated identifier or something ending with a property accessor
    // This is designed to be simple and avoid false negatives, but could produce false positives (e.g., a+b.c).
    // This also will not properly handle nested brackets (e.g., obj1[obj2['prop']]; see #911).
    var javaScriptAssignmentTarget = /^(?:[$_a-z][$\w]*|(.+)(\.\s*[$_a-z][$\w]*|\[.+\]))$/i;

    function getWriteableValue(expression) {
        if (ko.utils.arrayIndexOf(javaScriptReservedWords, expression) >= 0)
            return false;
        var match = expression.match(javaScriptAssignmentTarget);
        return match === null ? false : match[1] ? ('Object(' + match[1] + ')' + match[2]) : expression;
    }

    // The following regular expressions will be used to split an object-literal string into tokens

        // These two match strings, either with double quotes or single quotes
    var stringDouble = '"(?:[^"\\\\]|\\\\.)*"',
        stringSingle = "'(?:[^'\\\\]|\\\\.)*'",
        // Matches a regular expression (text enclosed by slashes), but will also match sets of divisions
        // as a regular expression (this is handled by the parsing loop below).
        stringRegexp = '/(?:[^/\\\\]|\\\\.)*/\w*',
        // These characters have special meaning to the parser and must not appear in the middle of a
        // token, except as part of a string.
        specials = ',"\'{}()/:[\\]',
        // Match text (at least two characters) that does not contain any of the above special characters,
        // although some of the special characters are allowed to start it (all but the colon and comma).
        // The text can contain spaces, but leading or trailing spaces are skipped.
        everyThingElse = '[^\\s:,/][^' + specials + ']*[^\\s' + specials + ']',
        // Match any non-space character not matched already. This will match colons and commas, since they're
        // not matched by "everyThingElse", but will also match any other single character that wasn't already
        // matched (for example: in "a: 1, b: 2", each of the non-space characters will be matched by oneNotSpace).
        oneNotSpace = '[^\\s]',

        // Create the actual regular expression by or-ing the above strings. The order is important.
        bindingToken = RegExp(stringDouble + '|' + stringSingle + '|' + stringRegexp + '|' + everyThingElse + '|' + oneNotSpace, 'g'),

        // Match end of previous token to determine whether a slash is a division or regex.
        divisionLookBehind = /[\])"'A-Za-z0-9_$]+$/,
        keywordRegexLookBehind = {'in':1,'return':1,'typeof':1};

    function parseObjectLiteral(objectLiteralString) {
        // Trim leading and trailing spaces from the string
        var str = ko.utils.stringTrim(objectLiteralString);

        // Trim braces '{' surrounding the whole object literal
        if (str.charCodeAt(0) === 123) str = str.slice(1, -1);

        // Split into tokens
        var result = [], toks = str.match(bindingToken), key, values = [], depth = 0;

        if (toks) {
            // Append a comma so that we don't need a separate code block to deal with the last item
            toks.push(',');

            for (var i = 0, tok; tok = toks[i]; ++i) {
                var c = tok.charCodeAt(0);
                // A comma signals the end of a key/value pair if depth is zero
                if (c === 44) { // ","
                    if (depth <= 0) {
                        result.push((key && values.length) ? {key: key, value: values.join('')} : {'unknown': key || values.join('')});
                        key = depth = 0;
                        values = [];
                        continue;
                    }
                // Simply skip the colon that separates the name and value
                } else if (c === 58) { // ":"
                    if (!depth && !key && values.length === 1) {
                        key = values.pop();
                        continue;
                    }
                // A set of slashes is initially matched as a regular expression, but could be division
                } else if (c === 47 && i && tok.length > 1) {  // "/"
                    // Look at the end of the previous token to determine if the slash is actually division
                    var match = toks[i-1].match(divisionLookBehind);
                    if (match && !keywordRegexLookBehind[match[0]]) {
                        // The slash is actually a division punctuator; re-parse the remainder of the string (not including the slash)
                        str = str.substr(str.indexOf(tok) + 1);
                        toks = str.match(bindingToken);
                        toks.push(',');
                        i = -1;
                        // Continue with just the slash
                        tok = '/';
                    }
                // Increment depth for parentheses, braces, and brackets so that interior commas are ignored
                } else if (c === 40 || c === 123 || c === 91) { // '(', '{', '['
                    ++depth;
                } else if (c === 41 || c === 125 || c === 93) { // ')', '}', ']'
                    --depth;
                // The key will be the first token; if it's a string, trim the quotes
                } else if (!key && !values.length && (c === 34 || c === 39)) { // '"', "'"
                    tok = tok.slice(1, -1);
                }
                values.push(tok);
            }
        }
        return result;
    }

    // Two-way bindings include a write function that allow the handler to update the value even if it's not an observable.
    var twoWayBindings = {};

    function preProcessBindings(bindingsStringOrKeyValueArray, bindingOptions) {
        bindingOptions = bindingOptions || {};

        function processKeyValue(key, val) {
            var writableVal;
            function callPreprocessHook(obj) {
                return (obj && obj['preprocess']) ? (val = obj['preprocess'](val, key, processKeyValue)) : true;
            }
            if (!bindingParams) {
                if (!callPreprocessHook(ko['getBindingHandler'](key)))
                    return;

                if (twoWayBindings[key] && (writableVal = getWriteableValue(val))) {
                    // For two-way bindings, provide a write method in case the value
                    // isn't a writable observable.
                    propertyAccessorResultStrings.push("'" + key + "':function(_z){" + writableVal + "=_z}");
                }
            }
            // Values are wrapped in a function so that each value can be accessed independently
            if (makeValueAccessors) {
                val = 'function(){return ' + val + ' }';
            }
            resultStrings.push("'" + key + "':" + val);
        }

        var resultStrings = [],
            propertyAccessorResultStrings = [],
            makeValueAccessors = bindingOptions['valueAccessors'],
            bindingParams = bindingOptions['bindingParams'],
            keyValueArray = typeof bindingsStringOrKeyValueArray === "string" ?
                parseObjectLiteral(bindingsStringOrKeyValueArray) : bindingsStringOrKeyValueArray;

        ko.utils.arrayForEach(keyValueArray, function(keyValue) {
            processKeyValue(keyValue.key || keyValue['unknown'], keyValue.value);
        });

        if (propertyAccessorResultStrings.length)
            processKeyValue('_ko_property_writers', "{" + propertyAccessorResultStrings.join(",") + " }");

        return resultStrings.join(",");
    }

    return {
        bindingRewriteValidators: [],

        twoWayBindings: twoWayBindings,

        parseObjectLiteral: parseObjectLiteral,

        preProcessBindings: preProcessBindings,

        keyValueArrayContainsKey: function(keyValueArray, key) {
            for (var i = 0; i < keyValueArray.length; i++)
                if (keyValueArray[i]['key'] == key)
                    return true;
            return false;
        },

        // Internal, private KO utility for updating model properties from within bindings
        // property:            If the property being updated is (or might be) an observable, pass it here
        //                      If it turns out to be a writable observable, it will be written to directly
        // allBindings:         An object with a get method to retrieve bindings in the current execution context.
        //                      This will be searched for a '_ko_property_writers' property in case you're writing to a non-observable
        // key:                 The key identifying the property to be written. Example: for { hasFocus: myValue }, write to 'myValue' by specifying the key 'hasFocus'
        // value:               The value to be written
        // checkIfDifferent:    If true, and if the property being written is a writable observable, the value will only be written if
        //                      it is !== existing value on that writable observable
        writeValueToProperty: function(property, allBindings, key, value, checkIfDifferent) {
            if (!property || !ko.isObservable(property)) {
                var propWriters = allBindings.get('_ko_property_writers');
                if (propWriters && propWriters[key])
                    propWriters[key](value);
            } else if (ko.isWriteableObservable(property) && (!checkIfDifferent || property.peek() !== value)) {
                property(value);
            }
        }
    };
})();

ko.exportSymbol('expressionRewriting', ko.expressionRewriting);
ko.exportSymbol('expressionRewriting.bindingRewriteValidators', ko.expressionRewriting.bindingRewriteValidators);
ko.exportSymbol('expressionRewriting.parseObjectLiteral', ko.expressionRewriting.parseObjectLiteral);
ko.exportSymbol('expressionRewriting.preProcessBindings', ko.expressionRewriting.preProcessBindings);

// Making bindings explicitly declare themselves as "two way" isn't ideal in the long term (it would be better if
// all bindings could use an official 'property writer' API without needing to declare that they might). However,
// since this is not, and has never been, a public API (_ko_property_writers was never documented), it's acceptable
// as an internal implementation detail in the short term.
// For those developers who rely on _ko_property_writers in their custom bindings, we expose _twoWayBindings as an
// undocumented feature that makes it relatively easy to upgrade to KO 3.0. However, this is still not an official
// public API, and we reserve the right to remove it at any time if we create a real public property writers API.
ko.exportSymbol('expressionRewriting._twoWayBindings', ko.expressionRewriting.twoWayBindings);

// For backward compatibility, define the following aliases. (Previously, these function names were misleading because
// they referred to JSON specifically, even though they actually work with arbitrary JavaScript object literal expressions.)
ko.exportSymbol('jsonExpressionRewriting', ko.expressionRewriting);
ko.exportSymbol('jsonExpressionRewriting.insertPropertyAccessorsIntoJson', ko.expressionRewriting.preProcessBindings);
(function() {
    // "Virtual elements" is an abstraction on top of the usual DOM API which understands the notion that comment nodes
    // may be used to represent hierarchy (in addition to the DOM's natural hierarchy).
    // If you call the DOM-manipulating functions on ko.virtualElements, you will be able to read and write the state
    // of that virtual hierarchy
    //
    // The point of all this is to support containerless templates (e.g., <!-- ko foreach:someCollection -->blah<!-- /ko -->)
    // without having to scatter special cases all over the binding and templating code.

    // IE 9 cannot reliably read the "nodeValue" property of a comment node (see https://github.com/SteveSanderson/knockout/issues/186)
    // but it does give them a nonstandard alternative property called "text" that it can read reliably. Other browsers don't have that property.
    // So, use node.text where available, and node.nodeValue elsewhere
    var commentNodesHaveTextProperty = document && document.createComment("test").text === "<!--test-->";

    var startCommentRegex = commentNodesHaveTextProperty ? /^<!--\s*ko(?:\s+([\s\S]+))?\s*-->$/ : /^\s*ko(?:\s+([\s\S]+))?\s*$/;
    var endCommentRegex =   commentNodesHaveTextProperty ? /^<!--\s*\/ko\s*-->$/ : /^\s*\/ko\s*$/;
    var htmlTagsWithOptionallyClosingChildren = { 'ul': true, 'ol': true };

    function isStartComment(node) {
        return (node.nodeType == 8) && startCommentRegex.test(commentNodesHaveTextProperty ? node.text : node.nodeValue);
    }

    function isEndComment(node) {
        return (node.nodeType == 8) && endCommentRegex.test(commentNodesHaveTextProperty ? node.text : node.nodeValue);
    }

    function getVirtualChildren(startComment, allowUnbalanced) {
        var currentNode = startComment;
        var depth = 1;
        var children = [];
        while (currentNode = currentNode.nextSibling) {
            if (isEndComment(currentNode)) {
                depth--;
                if (depth === 0)
                    return children;
            }

            children.push(currentNode);

            if (isStartComment(currentNode))
                depth++;
        }
        if (!allowUnbalanced)
            throw new Error("Cannot find closing comment tag to match: " + startComment.nodeValue);
        return null;
    }

    function getMatchingEndComment(startComment, allowUnbalanced) {
        var allVirtualChildren = getVirtualChildren(startComment, allowUnbalanced);
        if (allVirtualChildren) {
            if (allVirtualChildren.length > 0)
                return allVirtualChildren[allVirtualChildren.length - 1].nextSibling;
            return startComment.nextSibling;
        } else
            return null; // Must have no matching end comment, and allowUnbalanced is true
    }

    function getUnbalancedChildTags(node) {
        // e.g., from <div>OK</div><!-- ko blah --><span>Another</span>, returns: <!-- ko blah --><span>Another</span>
        //       from <div>OK</div><!-- /ko --><!-- /ko -->,             returns: <!-- /ko --><!-- /ko -->
        var childNode = node.firstChild, captureRemaining = null;
        if (childNode) {
            do {
                if (captureRemaining)                   // We already hit an unbalanced node and are now just scooping up all subsequent nodes
                    captureRemaining.push(childNode);
                else if (isStartComment(childNode)) {
                    var matchingEndComment = getMatchingEndComment(childNode, /* allowUnbalanced: */ true);
                    if (matchingEndComment)             // It's a balanced tag, so skip immediately to the end of this virtual set
                        childNode = matchingEndComment;
                    else
                        captureRemaining = [childNode]; // It's unbalanced, so start capturing from this point
                } else if (isEndComment(childNode)) {
                    captureRemaining = [childNode];     // It's unbalanced (if it wasn't, we'd have skipped over it already), so start capturing
                }
            } while (childNode = childNode.nextSibling);
        }
        return captureRemaining;
    }

    ko.virtualElements = {
        allowedBindings: {},

        childNodes: function(node) {
            return isStartComment(node) ? getVirtualChildren(node) : node.childNodes;
        },

        emptyNode: function(node) {
            if (!isStartComment(node))
                ko.utils.emptyDomNode(node);
            else {
                var virtualChildren = ko.virtualElements.childNodes(node);
                for (var i = 0, j = virtualChildren.length; i < j; i++)
                    ko.removeNode(virtualChildren[i]);
            }
        },

        setDomNodeChildren: function(node, childNodes) {
            if (!isStartComment(node))
                ko.utils.setDomNodeChildren(node, childNodes);
            else {
                ko.virtualElements.emptyNode(node);
                var endCommentNode = node.nextSibling; // Must be the next sibling, as we just emptied the children
                for (var i = 0, j = childNodes.length; i < j; i++)
                    endCommentNode.parentNode.insertBefore(childNodes[i], endCommentNode);
            }
        },

        prepend: function(containerNode, nodeToPrepend) {
            if (!isStartComment(containerNode)) {
                if (containerNode.firstChild)
                    containerNode.insertBefore(nodeToPrepend, containerNode.firstChild);
                else
                    containerNode.appendChild(nodeToPrepend);
            } else {
                // Start comments must always have a parent and at least one following sibling (the end comment)
                containerNode.parentNode.insertBefore(nodeToPrepend, containerNode.nextSibling);
            }
        },

        insertAfter: function(containerNode, nodeToInsert, insertAfterNode) {
            if (!insertAfterNode) {
                ko.virtualElements.prepend(containerNode, nodeToInsert);
            } else if (!isStartComment(containerNode)) {
                // Insert after insertion point
                if (insertAfterNode.nextSibling)
                    containerNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
                else
                    containerNode.appendChild(nodeToInsert);
            } else {
                // Children of start comments must always have a parent and at least one following sibling (the end comment)
                containerNode.parentNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
            }
        },

        firstChild: function(node) {
            if (!isStartComment(node))
                return node.firstChild;
            if (!node.nextSibling || isEndComment(node.nextSibling))
                return null;
            return node.nextSibling;
        },

        nextSibling: function(node) {
            if (isStartComment(node))
                node = getMatchingEndComment(node);
            if (node.nextSibling && isEndComment(node.nextSibling))
                return null;
            return node.nextSibling;
        },

        hasBindingValue: isStartComment,

        virtualNodeBindingValue: function(node) {
            var regexMatch = (commentNodesHaveTextProperty ? node.text : node.nodeValue).match(startCommentRegex);
            return regexMatch ? regexMatch[1] : null;
        },

        normaliseVirtualElementDomStructure: function(elementVerified) {
            // Workaround for https://github.com/SteveSanderson/knockout/issues/155
            // (IE <= 8 or IE 9 quirks mode parses your HTML weirdly, treating closing </li> tags as if they don't exist, thereby moving comment nodes
            // that are direct descendants of <ul> into the preceding <li>)
            if (!htmlTagsWithOptionallyClosingChildren[ko.utils.tagNameLower(elementVerified)])
                return;

            // Scan immediate children to see if they contain unbalanced comment tags. If they do, those comment tags
            // must be intended to appear *after* that child, so move them there.
            var childNode = elementVerified.firstChild;
            if (childNode) {
                do {
                    if (childNode.nodeType === 1) {
                        var unbalancedTags = getUnbalancedChildTags(childNode);
                        if (unbalancedTags) {
                            // Fix up the DOM by moving the unbalanced tags to where they most likely were intended to be placed - *after* the child
                            var nodeToInsertBefore = childNode.nextSibling;
                            for (var i = 0; i < unbalancedTags.length; i++) {
                                if (nodeToInsertBefore)
                                    elementVerified.insertBefore(unbalancedTags[i], nodeToInsertBefore);
                                else
                                    elementVerified.appendChild(unbalancedTags[i]);
                            }
                        }
                    }
                } while (childNode = childNode.nextSibling);
            }
        }
    };
})();
ko.exportSymbol('virtualElements', ko.virtualElements);
ko.exportSymbol('virtualElements.allowedBindings', ko.virtualElements.allowedBindings);
ko.exportSymbol('virtualElements.emptyNode', ko.virtualElements.emptyNode);
//ko.exportSymbol('virtualElements.firstChild', ko.virtualElements.firstChild);     // firstChild is not minified
ko.exportSymbol('virtualElements.insertAfter', ko.virtualElements.insertAfter);
//ko.exportSymbol('virtualElements.nextSibling', ko.virtualElements.nextSibling);   // nextSibling is not minified
ko.exportSymbol('virtualElements.prepend', ko.virtualElements.prepend);
ko.exportSymbol('virtualElements.setDomNodeChildren', ko.virtualElements.setDomNodeChildren);
(function() {
    var defaultBindingAttributeName = "data-bind";

    ko.bindingProvider = function() {
        this.bindingCache = {};
    };

    ko.utils.extend(ko.bindingProvider.prototype, {
        'nodeHasBindings': function(node) {
            switch (node.nodeType) {
                case 1: // Element
                    return node.getAttribute(defaultBindingAttributeName) != null
                        || ko.components['getComponentNameForNode'](node);
                case 8: // Comment node
                    return ko.virtualElements.hasBindingValue(node);
                default: return false;
            }
        },

        'getBindings': function(node, bindingContext) {
            var bindingsString = this['getBindingsString'](node, bindingContext),
                parsedBindings = bindingsString ? this['parseBindingsString'](bindingsString, bindingContext, node) : null;
            return ko.components.addBindingsForCustomElement(parsedBindings, node, bindingContext, /* valueAccessors */ false);
        },

        'getBindingAccessors': function(node, bindingContext) {
            var bindingsString = this['getBindingsString'](node, bindingContext),
                parsedBindings = bindingsString ? this['parseBindingsString'](bindingsString, bindingContext, node, { 'valueAccessors': true }) : null;
            return ko.components.addBindingsForCustomElement(parsedBindings, node, bindingContext, /* valueAccessors */ true);
        },

        // The following function is only used internally by this default provider.
        // It's not part of the interface definition for a general binding provider.
        'getBindingsString': function(node, bindingContext) {
            switch (node.nodeType) {
                case 1: return node.getAttribute(defaultBindingAttributeName);   // Element
                case 8: return ko.virtualElements.virtualNodeBindingValue(node); // Comment node
                default: return null;
            }
        },

        // The following function is only used internally by this default provider.
        // It's not part of the interface definition for a general binding provider.
        'parseBindingsString': function(bindingsString, bindingContext, node, options) {
            try {
                var bindingFunction = createBindingsStringEvaluatorViaCache(bindingsString, this.bindingCache, options);
                return bindingFunction(bindingContext, node);
            } catch (ex) {
                ex.message = "Unable to parse bindings.\nBindings value: " + bindingsString + "\nMessage: " + ex.message;
                throw ex;
            }
        }
    });

    ko.bindingProvider['instance'] = new ko.bindingProvider();

    function createBindingsStringEvaluatorViaCache(bindingsString, cache, options) {
        var cacheKey = bindingsString + (options && options['valueAccessors'] || '');
        return cache[cacheKey]
            || (cache[cacheKey] = createBindingsStringEvaluator(bindingsString, options));
    }

    function createBindingsStringEvaluator(bindingsString, options) {
        // Build the source for a function that evaluates "expression"
        // For each scope variable, add an extra level of "with" nesting
        // Example result: with(sc1) { with(sc0) { return (expression) } }
        var rewrittenBindings = ko.expressionRewriting.preProcessBindings(bindingsString, options),
            functionBody = "with($context){with($data||{}){return{" + rewrittenBindings + "}}}";
        return new Function("$context", "$element", functionBody);
    }
})();

ko.exportSymbol('bindingProvider', ko.bindingProvider);
(function () {
    ko.bindingHandlers = {};

    // The following element types will not be recursed into during binding.
    var bindingDoesNotRecurseIntoElementTypes = {
        // Don't want bindings that operate on text nodes to mutate <script> and <textarea> contents,
        // because it's unexpected and a potential XSS issue.
        // Also bindings should not operate on <template> elements since this breaks in Internet Explorer
        // and because such elements' contents are always intended to be bound in a different context
        // from where they appear in the document.
        'script': true,
        'textarea': true,
        'template': true
    };

    // Use an overridable method for retrieving binding handlers so that a plugins may support dynamically created handlers
    ko['getBindingHandler'] = function(bindingKey) {
        return ko.bindingHandlers[bindingKey];
    };

    // The ko.bindingContext constructor is only called directly to create the root context. For child
    // contexts, use bindingContext.createChildContext or bindingContext.extend.
    ko.bindingContext = function(dataItemOrAccessor, parentContext, dataItemAlias, extendCallback) {

        // The binding context object includes static properties for the current, parent, and root view models.
        // If a view model is actually stored in an observable, the corresponding binding context object, and
        // any child contexts, must be updated when the view model is changed.
        function updateContext() {
            // Most of the time, the context will directly get a view model object, but if a function is given,
            // we call the function to retrieve the view model. If the function accesses any observables or returns
            // an observable, the dependency is tracked, and those observables can later cause the binding
            // context to be updated.
            var dataItemOrObservable = isFunc ? dataItemOrAccessor() : dataItemOrAccessor,
                dataItem = ko.utils.unwrapObservable(dataItemOrObservable);

            if (parentContext) {
                // When a "parent" context is given, register a dependency on the parent context. Thus whenever the
                // parent context is updated, this context will also be updated.
                if (parentContext._subscribable)
                    parentContext._subscribable();

                // Copy $root and any custom properties from the parent context
                ko.utils.extend(self, parentContext);

                // Because the above copy overwrites our own properties, we need to reset them.
                // During the first execution, "subscribable" isn't set, so don't bother doing the update then.
                if (subscribable) {
                    self._subscribable = subscribable;
                }
            } else {
                self['$parents'] = [];
                self['$root'] = dataItem;

                // Export 'ko' in the binding context so it will be available in bindings and templates
                // even if 'ko' isn't exported as a global, such as when using an AMD loader.
                // See https://github.com/SteveSanderson/knockout/issues/490
                self['ko'] = ko;
            }
            self['$rawData'] = dataItemOrObservable;
            self['$data'] = dataItem;
            if (dataItemAlias)
                self[dataItemAlias] = dataItem;

            // The extendCallback function is provided when creating a child context or extending a context.
            // It handles the specific actions needed to finish setting up the binding context. Actions in this
            // function could also add dependencies to this binding context.
            if (extendCallback)
                extendCallback(self, parentContext, dataItem);

            return self['$data'];
        }
        function disposeWhen() {
            return nodes && !ko.utils.anyDomNodeIsAttachedToDocument(nodes);
        }

        var self = this,
            isFunc = typeof(dataItemOrAccessor) == "function" && !ko.isObservable(dataItemOrAccessor),
            nodes,
            subscribable = ko.dependentObservable(updateContext, null, { disposeWhen: disposeWhen, disposeWhenNodeIsRemoved: true });

        // At this point, the binding context has been initialized, and the "subscribable" computed observable is
        // subscribed to any observables that were accessed in the process. If there is nothing to track, the
        // computed will be inactive, and we can safely throw it away. If it's active, the computed is stored in
        // the context object.
        if (subscribable.isActive()) {
            self._subscribable = subscribable;

            // Always notify because even if the model ($data) hasn't changed, other context properties might have changed
            subscribable['equalityComparer'] = null;

            // We need to be able to dispose of this computed observable when it's no longer needed. This would be
            // easy if we had a single node to watch, but binding contexts can be used by many different nodes, and
            // we cannot assume that those nodes have any relation to each other. So instead we track any node that
            // the context is attached to, and dispose the computed when all of those nodes have been cleaned.

            // Add properties to *subscribable* instead of *self* because any properties added to *self* may be overwritten on updates
            nodes = [];
            subscribable._addNode = function(node) {
                nodes.push(node);
                ko.utils.domNodeDisposal.addDisposeCallback(node, function(node) {
                    ko.utils.arrayRemoveItem(nodes, node);
                    if (!nodes.length) {
                        subscribable.dispose();
                        self._subscribable = subscribable = undefined;
                    }
                });
            };
        }
    }

    // Extend the binding context hierarchy with a new view model object. If the parent context is watching
    // any observables, the new child context will automatically get a dependency on the parent context.
    // But this does not mean that the $data value of the child context will also get updated. If the child
    // view model also depends on the parent view model, you must provide a function that returns the correct
    // view model on each update.
    ko.bindingContext.prototype['createChildContext'] = function (dataItemOrAccessor, dataItemAlias, extendCallback) {
        return new ko.bindingContext(dataItemOrAccessor, this, dataItemAlias, function(self, parentContext) {
            // Extend the context hierarchy by setting the appropriate pointers
            self['$parentContext'] = parentContext;
            self['$parent'] = parentContext['$data'];
            self['$parents'] = (parentContext['$parents'] || []).slice(0);
            self['$parents'].unshift(self['$parent']);
            if (extendCallback)
                extendCallback(self);
        });
    };

    // Extend the binding context with new custom properties. This doesn't change the context hierarchy.
    // Similarly to "child" contexts, provide a function here to make sure that the correct values are set
    // when an observable view model is updated.
    ko.bindingContext.prototype['extend'] = function(properties) {
        // If the parent context references an observable view model, "_subscribable" will always be the
        // latest view model object. If not, "_subscribable" isn't set, and we can use the static "$data" value.
        return new ko.bindingContext(this._subscribable || this['$data'], this, null, function(self, parentContext) {
            // This "child" context doesn't directly track a parent observable view model,
            // so we need to manually set the $rawData value to match the parent.
            self['$rawData'] = parentContext['$rawData'];
            ko.utils.extend(self, typeof(properties) == "function" ? properties() : properties);
        });
    };

    // Returns the valueAccesor function for a binding value
    function makeValueAccessor(value) {
        return function() {
            return value;
        };
    }

    // Returns the value of a valueAccessor function
    function evaluateValueAccessor(valueAccessor) {
        return valueAccessor();
    }

    // Given a function that returns bindings, create and return a new object that contains
    // binding value-accessors functions. Each accessor function calls the original function
    // so that it always gets the latest value and all dependencies are captured. This is used
    // by ko.applyBindingsToNode and getBindingsAndMakeAccessors.
    function makeAccessorsFromFunction(callback) {
        return ko.utils.objectMap(ko.dependencyDetection.ignore(callback), function(value, key) {
            return function() {
                return callback()[key];
            };
        });
    }

    // Given a bindings function or object, create and return a new object that contains
    // binding value-accessors functions. This is used by ko.applyBindingsToNode.
    function makeBindingAccessors(bindings, context, node) {
        if (typeof bindings === 'function') {
            return makeAccessorsFromFunction(bindings.bind(null, context, node));
        } else {
            return ko.utils.objectMap(bindings, makeValueAccessor);
        }
    }

    // This function is used if the binding provider doesn't include a getBindingAccessors function.
    // It must be called with 'this' set to the provider instance.
    function getBindingsAndMakeAccessors(node, context) {
        return makeAccessorsFromFunction(this['getBindings'].bind(this, node, context));
    }

    function validateThatBindingIsAllowedForVirtualElements(bindingName) {
        var validator = ko.virtualElements.allowedBindings[bindingName];
        if (!validator)
            throw new Error("The binding '" + bindingName + "' cannot be used with virtual elements")
    }

    function applyBindingsToDescendantsInternal (bindingContext, elementOrVirtualElement, bindingContextsMayDifferFromDomParentElement) {
        var currentChild,
            nextInQueue = ko.virtualElements.firstChild(elementOrVirtualElement),
            provider = ko.bindingProvider['instance'],
            preprocessNode = provider['preprocessNode'];

        // Preprocessing allows a binding provider to mutate a node before bindings are applied to it. For example it's
        // possible to insert new siblings after it, and/or replace the node with a different one. This can be used to
        // implement custom binding syntaxes, such as {{ value }} for string interpolation, or custom element types that
        // trigger insertion of <template> contents at that point in the document.
        if (preprocessNode) {
            while (currentChild = nextInQueue) {
                nextInQueue = ko.virtualElements.nextSibling(currentChild);
                preprocessNode.call(provider, currentChild);
            }
            // Reset nextInQueue for the next loop
            nextInQueue = ko.virtualElements.firstChild(elementOrVirtualElement);
        }

        while (currentChild = nextInQueue) {
            // Keep a record of the next child *before* applying bindings, in case the binding removes the current child from its position
            nextInQueue = ko.virtualElements.nextSibling(currentChild);
            applyBindingsToNodeAndDescendantsInternal(bindingContext, currentChild, bindingContextsMayDifferFromDomParentElement);
        }
    }

    function applyBindingsToNodeAndDescendantsInternal (bindingContext, nodeVerified, bindingContextMayDifferFromDomParentElement) {
        var shouldBindDescendants = true;

        // Perf optimisation: Apply bindings only if...
        // (1) We need to store the binding context on this node (because it may differ from the DOM parent node's binding context)
        //     Note that we can't store binding contexts on non-elements (e.g., text nodes), as IE doesn't allow expando properties for those
        // (2) It might have bindings (e.g., it has a data-bind attribute, or it's a marker for a containerless template)
        var isElement = (nodeVerified.nodeType === 1);
        if (isElement) // Workaround IE <= 8 HTML parsing weirdness
            ko.virtualElements.normaliseVirtualElementDomStructure(nodeVerified);

        var shouldApplyBindings = (isElement && bindingContextMayDifferFromDomParentElement)             // Case (1)
                               || ko.bindingProvider['instance']['nodeHasBindings'](nodeVerified);       // Case (2)
        if (shouldApplyBindings)
            shouldBindDescendants = applyBindingsToNodeInternal(nodeVerified, null, bindingContext, bindingContextMayDifferFromDomParentElement)['shouldBindDescendants'];

        if (shouldBindDescendants && !bindingDoesNotRecurseIntoElementTypes[ko.utils.tagNameLower(nodeVerified)]) {
            // We're recursing automatically into (real or virtual) child nodes without changing binding contexts. So,
            //  * For children of a *real* element, the binding context is certainly the same as on their DOM .parentNode,
            //    hence bindingContextsMayDifferFromDomParentElement is false
            //  * For children of a *virtual* element, we can't be sure. Evaluating .parentNode on those children may
            //    skip over any number of intermediate virtual elements, any of which might define a custom binding context,
            //    hence bindingContextsMayDifferFromDomParentElement is true
            applyBindingsToDescendantsInternal(bindingContext, nodeVerified, /* bindingContextsMayDifferFromDomParentElement: */ !isElement);
        }
    }

    var boundElementDomDataKey = ko.utils.domData.nextKey();


    function topologicalSortBindings(bindings) {
        // Depth-first sort
        var result = [],                // The list of key/handler pairs that we will return
            bindingsConsidered = {},    // A temporary record of which bindings are already in 'result'
            cyclicDependencyStack = []; // Keeps track of a depth-search so that, if there's a cycle, we know which bindings caused it
        ko.utils.objectForEach(bindings, function pushBinding(bindingKey) {
            if (!bindingsConsidered[bindingKey]) {
                var binding = ko['getBindingHandler'](bindingKey);
                if (binding) {
                    // First add dependencies (if any) of the current binding
                    if (binding['after']) {
                        cyclicDependencyStack.push(bindingKey);
                        ko.utils.arrayForEach(binding['after'], function(bindingDependencyKey) {
                            if (bindings[bindingDependencyKey]) {
                                if (ko.utils.arrayIndexOf(cyclicDependencyStack, bindingDependencyKey) !== -1) {
                                    throw Error("Cannot combine the following bindings, because they have a cyclic dependency: " + cyclicDependencyStack.join(", "));
                                } else {
                                    pushBinding(bindingDependencyKey);
                                }
                            }
                        });
                        cyclicDependencyStack.length--;
                    }
                    // Next add the current binding
                    result.push({ key: bindingKey, handler: binding });
                }
                bindingsConsidered[bindingKey] = true;
            }
        });

        return result;
    }

    function applyBindingsToNodeInternal(node, sourceBindings, bindingContext, bindingContextMayDifferFromDomParentElement) {
        // Prevent multiple applyBindings calls for the same node, except when a binding value is specified
        var alreadyBound = ko.utils.domData.get(node, boundElementDomDataKey);
        if (!sourceBindings) {
            if (alreadyBound) {
                throw Error("You cannot apply bindings multiple times to the same element.");
            }
            ko.utils.domData.set(node, boundElementDomDataKey, true);
        }

        // Optimization: Don't store the binding context on this node if it's definitely the same as on node.parentNode, because
        // we can easily recover it just by scanning up the node's ancestors in the DOM
        // (note: here, parent node means "real DOM parent" not "virtual parent", as there's no O(1) way to find the virtual parent)
        if (!alreadyBound && bindingContextMayDifferFromDomParentElement)
            ko.storedBindingContextForNode(node, bindingContext);

        // Use bindings if given, otherwise fall back on asking the bindings provider to give us some bindings
        var bindings;
        if (sourceBindings && typeof sourceBindings !== 'function') {
            bindings = sourceBindings;
        } else {
            var provider = ko.bindingProvider['instance'],
                getBindings = provider['getBindingAccessors'] || getBindingsAndMakeAccessors;

            // Get the binding from the provider within a computed observable so that we can update the bindings whenever
            // the binding context is updated or if the binding provider accesses observables.
            var bindingsUpdater = ko.dependentObservable(
                function() {
                    bindings = sourceBindings ? sourceBindings(bindingContext, node) : getBindings.call(provider, node, bindingContext);
                    // Register a dependency on the binding context to support observable view models.
                    if (bindings && bindingContext._subscribable)
                        bindingContext._subscribable();
                    return bindings;
                },
                null, { disposeWhenNodeIsRemoved: node }
            );

            if (!bindings || !bindingsUpdater.isActive())
                bindingsUpdater = null;
        }

        var bindingHandlerThatControlsDescendantBindings;
        if (bindings) {
            // Return the value accessor for a given binding. When bindings are static (won't be updated because of a binding
            // context update), just return the value accessor from the binding. Otherwise, return a function that always gets
            // the latest binding value and registers a dependency on the binding updater.
            var getValueAccessor = bindingsUpdater
                ? function(bindingKey) {
                    return function() {
                        return evaluateValueAccessor(bindingsUpdater()[bindingKey]);
                    };
                } : function(bindingKey) {
                    return bindings[bindingKey];
                };

            // Use of allBindings as a function is maintained for backwards compatibility, but its use is deprecated
            function allBindings() {
                return ko.utils.objectMap(bindingsUpdater ? bindingsUpdater() : bindings, evaluateValueAccessor);
            }
            // The following is the 3.x allBindings API
            allBindings['get'] = function(key) {
                return bindings[key] && evaluateValueAccessor(getValueAccessor(key));
            };
            allBindings['has'] = function(key) {
                return key in bindings;
            };

            // First put the bindings into the right order
            var orderedBindings = topologicalSortBindings(bindings);

            // Go through the sorted bindings, calling init and update for each
            ko.utils.arrayForEach(orderedBindings, function(bindingKeyAndHandler) {
                // Note that topologicalSortBindings has already filtered out any nonexistent binding handlers,
                // so bindingKeyAndHandler.handler will always be nonnull.
                var handlerInitFn = bindingKeyAndHandler.handler["init"],
                    handlerUpdateFn = bindingKeyAndHandler.handler["update"],
                    bindingKey = bindingKeyAndHandler.key;

                if (node.nodeType === 8) {
                    validateThatBindingIsAllowedForVirtualElements(bindingKey);
                }

                try {
                    // Run init, ignoring any dependencies
                    if (typeof handlerInitFn == "function") {
                        ko.dependencyDetection.ignore(function() {
                            var initResult = handlerInitFn(node, getValueAccessor(bindingKey), allBindings, bindingContext['$data'], bindingContext);

                            // If this binding handler claims to control descendant bindings, make a note of this
                            if (initResult && initResult['controlsDescendantBindings']) {
                                if (bindingHandlerThatControlsDescendantBindings !== undefined)
                                    throw new Error("Multiple bindings (" + bindingHandlerThatControlsDescendantBindings + " and " + bindingKey + ") are trying to control descendant bindings of the same element. You cannot use these bindings together on the same element.");
                                bindingHandlerThatControlsDescendantBindings = bindingKey;
                            }
                        });
                    }

                    // Run update in its own computed wrapper
                    if (typeof handlerUpdateFn == "function") {
                        ko.dependentObservable(
                            function() {
                                handlerUpdateFn(node, getValueAccessor(bindingKey), allBindings, bindingContext['$data'], bindingContext);
                            },
                            null,
                            { disposeWhenNodeIsRemoved: node }
                        );
                    }
                } catch (ex) {
                    ex.message = "Unable to process binding \"" + bindingKey + ": " + bindings[bindingKey] + "\"\nMessage: " + ex.message;
                    throw ex;
                }
            });
        }

        return {
            'shouldBindDescendants': bindingHandlerThatControlsDescendantBindings === undefined
        };
    };

    var storedBindingContextDomDataKey = ko.utils.domData.nextKey();
    ko.storedBindingContextForNode = function (node, bindingContext) {
        if (arguments.length == 2) {
            ko.utils.domData.set(node, storedBindingContextDomDataKey, bindingContext);
            if (bindingContext._subscribable)
                bindingContext._subscribable._addNode(node);
        } else {
            return ko.utils.domData.get(node, storedBindingContextDomDataKey);
        }
    }

    function getBindingContext(viewModelOrBindingContext) {
        return viewModelOrBindingContext && (viewModelOrBindingContext instanceof ko.bindingContext)
            ? viewModelOrBindingContext
            : new ko.bindingContext(viewModelOrBindingContext);
    }

    ko.applyBindingAccessorsToNode = function (node, bindings, viewModelOrBindingContext) {
        if (node.nodeType === 1) // If it's an element, workaround IE <= 8 HTML parsing weirdness
            ko.virtualElements.normaliseVirtualElementDomStructure(node);
        return applyBindingsToNodeInternal(node, bindings, getBindingContext(viewModelOrBindingContext), true);
    };

    ko.applyBindingsToNode = function (node, bindings, viewModelOrBindingContext) {
        var context = getBindingContext(viewModelOrBindingContext);
        return ko.applyBindingAccessorsToNode(node, makeBindingAccessors(bindings, context, node), context);
    };

    ko.applyBindingsToDescendants = function(viewModelOrBindingContext, rootNode) {
        if (rootNode.nodeType === 1 || rootNode.nodeType === 8)
            applyBindingsToDescendantsInternal(getBindingContext(viewModelOrBindingContext), rootNode, true);
    };

    ko.applyBindings = function (viewModelOrBindingContext, rootNode) {
        // If jQuery is loaded after Knockout, we won't initially have access to it. So save it here.
        if (!jQueryInstance && window['jQuery']) {
            jQueryInstance = window['jQuery'];
        }

        if (rootNode && (rootNode.nodeType !== 1) && (rootNode.nodeType !== 8))
            throw new Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node");
        rootNode = rootNode || window.document.body; // Make "rootNode" parameter optional

        applyBindingsToNodeAndDescendantsInternal(getBindingContext(viewModelOrBindingContext), rootNode, true);
    };

    // Retrieving binding context from arbitrary nodes
    ko.contextFor = function(node) {
        // We can only do something meaningful for elements and comment nodes (in particular, not text nodes, as IE can't store domdata for them)
        switch (node.nodeType) {
            case 1:
            case 8:
                var context = ko.storedBindingContextForNode(node);
                if (context) return context;
                if (node.parentNode) return ko.contextFor(node.parentNode);
                break;
        }
        return undefined;
    };
    ko.dataFor = function(node) {
        var context = ko.contextFor(node);
        return context ? context['$data'] : undefined;
    };

    ko.exportSymbol('bindingHandlers', ko.bindingHandlers);
    ko.exportSymbol('applyBindings', ko.applyBindings);
    ko.exportSymbol('applyBindingsToDescendants', ko.applyBindingsToDescendants);
    ko.exportSymbol('applyBindingAccessorsToNode', ko.applyBindingAccessorsToNode);
    ko.exportSymbol('applyBindingsToNode', ko.applyBindingsToNode);
    ko.exportSymbol('contextFor', ko.contextFor);
    ko.exportSymbol('dataFor', ko.dataFor);
})();
(function(undefined) {
    var loadingSubscribablesCache = {}, // Tracks component loads that are currently in flight
        loadedDefinitionsCache = {};    // Tracks component loads that have already completed

    ko.components = {
        get: function(componentName, callback) {
            var cachedDefinition = getObjectOwnProperty(loadedDefinitionsCache, componentName);
            if (cachedDefinition) {
                // It's already loaded and cached. Reuse the same definition object.
                // Note that for API consistency, even cache hits complete asynchronously by default.
                // You can bypass this by putting synchronous:true on your component config.
                if (cachedDefinition.isSynchronousComponent) {
                    ko.dependencyDetection.ignore(function() { // See comment in loaderRegistryBehaviors.js for reasoning
                        callback(cachedDefinition.definition);
                    });
                } else {
                    ko.tasks.schedule(function() { callback(cachedDefinition.definition); });
                }
            } else {
                // Join the loading process that is already underway, or start a new one.
                loadComponentAndNotify(componentName, callback);
            }
        },

        clearCachedDefinition: function(componentName) {
            delete loadedDefinitionsCache[componentName];
        },

        _getFirstResultFromLoaders: getFirstResultFromLoaders
    };

    function getObjectOwnProperty(obj, propName) {
        return obj.hasOwnProperty(propName) ? obj[propName] : undefined;
    }

    function loadComponentAndNotify(componentName, callback) {
        var subscribable = getObjectOwnProperty(loadingSubscribablesCache, componentName),
            completedAsync;
        if (!subscribable) {
            // It's not started loading yet. Start loading, and when it's done, move it to loadedDefinitionsCache.
            subscribable = loadingSubscribablesCache[componentName] = new ko.subscribable();
            subscribable.subscribe(callback);

            beginLoadingComponent(componentName, function(definition, config) {
                var isSynchronousComponent = !!(config && config['synchronous']);
                loadedDefinitionsCache[componentName] = { definition: definition, isSynchronousComponent: isSynchronousComponent };
                delete loadingSubscribablesCache[componentName];

                // For API consistency, all loads complete asynchronously. However we want to avoid
                // adding an extra task schedule if it's unnecessary (i.e., the completion is already
                // async).
                //
                // You can bypass the 'always asynchronous' feature by putting the synchronous:true
                // flag on your component configuration when you register it.
                if (completedAsync || isSynchronousComponent) {
                    // Note that notifySubscribers ignores any dependencies read within the callback.
                    // See comment in loaderRegistryBehaviors.js for reasoning
                    subscribable['notifySubscribers'](definition);
                } else {
                    ko.tasks.schedule(function() {
                        subscribable['notifySubscribers'](definition);
                    });
                }
            });
            completedAsync = true;
        } else {
            subscribable.subscribe(callback);
        }
    }

    function beginLoadingComponent(componentName, callback) {
        getFirstResultFromLoaders('getConfig', [componentName], function(config) {
            if (config) {
                // We have a config, so now load its definition
                getFirstResultFromLoaders('loadComponent', [componentName, config], function(definition) {
                    callback(definition, config);
                });
            } else {
                // The component has no config - it's unknown to all the loaders.
                // Note that this is not an error (e.g., a module loading error) - that would abort the
                // process and this callback would not run. For this callback to run, all loaders must
                // have confirmed they don't know about this component.
                callback(null, null);
            }
        });
    }

    function getFirstResultFromLoaders(methodName, argsExceptCallback, callback, candidateLoaders) {
        // On the first call in the stack, start with the full set of loaders
        if (!candidateLoaders) {
            candidateLoaders = ko.components['loaders'].slice(0); // Use a copy, because we'll be mutating this array
        }

        // Try the next candidate
        var currentCandidateLoader = candidateLoaders.shift();
        if (currentCandidateLoader) {
            var methodInstance = currentCandidateLoader[methodName];
            if (methodInstance) {
                var wasAborted = false,
                    synchronousReturnValue = methodInstance.apply(currentCandidateLoader, argsExceptCallback.concat(function(result) {
                        if (wasAborted) {
                            callback(null);
                        } else if (result !== null) {
                            // This candidate returned a value. Use it.
                            callback(result);
                        } else {
                            // Try the next candidate
                            getFirstResultFromLoaders(methodName, argsExceptCallback, callback, candidateLoaders);
                        }
                    }));

                // Currently, loaders may not return anything synchronously. This leaves open the possibility
                // that we'll extend the API to support synchronous return values in the future. It won't be
                // a breaking change, because currently no loader is allowed to return anything except undefined.
                if (synchronousReturnValue !== undefined) {
                    wasAborted = true;

                    // Method to suppress exceptions will remain undocumented. This is only to keep
                    // KO's specs running tidily, since we can observe the loading got aborted without
                    // having exceptions cluttering up the console too.
                    if (!currentCandidateLoader['suppressLoaderExceptions']) {
                        throw new Error('Component loaders must supply values by invoking the callback, not by returning values synchronously.');
                    }
                }
            } else {
                // This candidate doesn't have the relevant handler. Synchronously move on to the next one.
                getFirstResultFromLoaders(methodName, argsExceptCallback, callback, candidateLoaders);
            }
        } else {
            // No candidates returned a value
            callback(null);
        }
    }

    // Reference the loaders via string name so it's possible for developers
    // to replace the whole array by assigning to ko.components.loaders
    ko.components['loaders'] = [];

    ko.exportSymbol('components', ko.components);
    ko.exportSymbol('components.get', ko.components.get);
    ko.exportSymbol('components.clearCachedDefinition', ko.components.clearCachedDefinition);
})();
(function(undefined) {

    // The default loader is responsible for two things:
    // 1. Maintaining the default in-memory registry of component configuration objects
    //    (i.e., the thing you're writing to when you call ko.components.register(someName, ...))
    // 2. Answering requests for components by fetching configuration objects
    //    from that default in-memory registry and resolving them into standard
    //    component definition objects (of the form { createViewModel: ..., template: ... })
    // Custom loaders may override either of these facilities, i.e.,
    // 1. To supply configuration objects from some other source (e.g., conventions)
    // 2. Or, to resolve configuration objects by loading viewmodels/templates via arbitrary logic.

    var defaultConfigRegistry = {};

    ko.components.register = function(componentName, config) {
        if (!config) {
            throw new Error('Invalid configuration for ' + componentName);
        }

        if (ko.components.isRegistered(componentName)) {
            throw new Error('Component ' + componentName + ' is already registered');
        }

        defaultConfigRegistry[componentName] = config;
    };

    ko.components.isRegistered = function(componentName) {
        return defaultConfigRegistry.hasOwnProperty(componentName);
    };

    ko.components.unregister = function(componentName) {
        delete defaultConfigRegistry[componentName];
        ko.components.clearCachedDefinition(componentName);
    };

    ko.components.defaultLoader = {
        'getConfig': function(componentName, callback) {
            var result = defaultConfigRegistry.hasOwnProperty(componentName)
                ? defaultConfigRegistry[componentName]
                : null;
            callback(result);
        },

        'loadComponent': function(componentName, config, callback) {
            var errorCallback = makeErrorCallback(componentName);
            possiblyGetConfigFromAmd(errorCallback, config, function(loadedConfig) {
                resolveConfig(componentName, errorCallback, loadedConfig, callback);
            });
        },

        'loadTemplate': function(componentName, templateConfig, callback) {
            resolveTemplate(makeErrorCallback(componentName), templateConfig, callback);
        },

        'loadViewModel': function(componentName, viewModelConfig, callback) {
            resolveViewModel(makeErrorCallback(componentName), viewModelConfig, callback);
        }
    };

    var createViewModelKey = 'createViewModel';

    // Takes a config object of the form { template: ..., viewModel: ... }, and asynchronously convert it
    // into the standard component definition format:
    //    { template: <ArrayOfDomNodes>, createViewModel: function(params, componentInfo) { ... } }.
    // Since both template and viewModel may need to be resolved asynchronously, both tasks are performed
    // in parallel, and the results joined when both are ready. We don't depend on any promises infrastructure,
    // so this is implemented manually below.
    function resolveConfig(componentName, errorCallback, config, callback) {
        var result = {},
            makeCallBackWhenZero = 2,
            tryIssueCallback = function() {
                if (--makeCallBackWhenZero === 0) {
                    callback(result);
                }
            },
            templateConfig = config['template'],
            viewModelConfig = config['viewModel'];

        if (templateConfig) {
            possiblyGetConfigFromAmd(errorCallback, templateConfig, function(loadedConfig) {
                ko.components._getFirstResultFromLoaders('loadTemplate', [componentName, loadedConfig], function(resolvedTemplate) {
                    result['template'] = resolvedTemplate;
                    tryIssueCallback();
                });
            });
        } else {
            tryIssueCallback();
        }

        if (viewModelConfig) {
            possiblyGetConfigFromAmd(errorCallback, viewModelConfig, function(loadedConfig) {
                ko.components._getFirstResultFromLoaders('loadViewModel', [componentName, loadedConfig], function(resolvedViewModel) {
                    result[createViewModelKey] = resolvedViewModel;
                    tryIssueCallback();
                });
            });
        } else {
            tryIssueCallback();
        }
    }

    function resolveTemplate(errorCallback, templateConfig, callback) {
        if (typeof templateConfig === 'string') {
            // Markup - parse it
            callback(ko.utils.parseHtmlFragment(templateConfig));
        } else if (templateConfig instanceof Array) {
            // Assume already an array of DOM nodes - pass through unchanged
            callback(templateConfig);
        } else if (isDocumentFragment(templateConfig)) {
            // Document fragment - use its child nodes
            callback(ko.utils.makeArray(templateConfig.childNodes));
        } else if (templateConfig['element']) {
            var element = templateConfig['element'];
            if (isDomElement(element)) {
                // Element instance - copy its child nodes
                callback(cloneNodesFromTemplateSourceElement(element));
            } else if (typeof element === 'string') {
                // Element ID - find it, then copy its child nodes
                var elemInstance = document.getElementById(element);
                if (elemInstance) {
                    callback(cloneNodesFromTemplateSourceElement(elemInstance));
                } else {
                    errorCallback('Cannot find element with ID ' + element);
                }
            } else {
                errorCallback('Unknown element type: ' + element);
            }
        } else {
            errorCallback('Unknown template value: ' + templateConfig);
        }
    }

    function resolveViewModel(errorCallback, viewModelConfig, callback) {
        if (typeof viewModelConfig === 'function') {
            // Constructor - convert to standard factory function format
            // By design, this does *not* supply componentInfo to the constructor, as the intent is that
            // componentInfo contains non-viewmodel data (e.g., the component's element) that should only
            // be used in factory functions, not viewmodel constructors.
            callback(function (params /*, componentInfo */) {
                return new viewModelConfig(params);
            });
        } else if (typeof viewModelConfig[createViewModelKey] === 'function') {
            // Already a factory function - use it as-is
            callback(viewModelConfig[createViewModelKey]);
        } else if ('instance' in viewModelConfig) {
            // Fixed object instance - promote to createViewModel format for API consistency
            var fixedInstance = viewModelConfig['instance'];
            callback(function (params, componentInfo) {
                return fixedInstance;
            });
        } else if ('viewModel' in viewModelConfig) {
            // Resolved AMD module whose value is of the form { viewModel: ... }
            resolveViewModel(errorCallback, viewModelConfig['viewModel'], callback);
        } else {
            errorCallback('Unknown viewModel value: ' + viewModelConfig);
        }
    }

    function cloneNodesFromTemplateSourceElement(elemInstance) {
        switch (ko.utils.tagNameLower(elemInstance)) {
            case 'script':
                return ko.utils.parseHtmlFragment(elemInstance.text);
            case 'textarea':
                return ko.utils.parseHtmlFragment(elemInstance.value);
            case 'template':
                // For browsers with proper <template> element support (i.e., where the .content property
                // gives a document fragment), use that document fragment.
                if (isDocumentFragment(elemInstance.content)) {
                    return ko.utils.cloneNodes(elemInstance.content.childNodes);
                }
        }

        // Regular elements such as <div>, and <template> elements on old browsers that don't really
        // understand <template> and just treat it as a regular container
        return ko.utils.cloneNodes(elemInstance.childNodes);
    }

    function isDomElement(obj) {
        if (window['HTMLElement']) {
            return obj instanceof HTMLElement;
        } else {
            return obj && obj.tagName && obj.nodeType === 1;
        }
    }

    function isDocumentFragment(obj) {
        if (window['DocumentFragment']) {
            return obj instanceof DocumentFragment;
        } else {
            return obj && obj.nodeType === 11;
        }
    }

    function possiblyGetConfigFromAmd(errorCallback, config, callback) {
        if (typeof config['require'] === 'string') {
            // The config is the value of an AMD module
            if (amdRequire || window['require']) {
                (amdRequire || window['require'])([config['require']], callback);
            } else {
                errorCallback('Uses require, but no AMD loader is present');
            }
        } else {
            callback(config);
        }
    }

    function makeErrorCallback(componentName) {
        return function (message) {
            throw new Error('Component \'' + componentName + '\': ' + message);
        };
    }

    ko.exportSymbol('components.register', ko.components.register);
    ko.exportSymbol('components.isRegistered', ko.components.isRegistered);
    ko.exportSymbol('components.unregister', ko.components.unregister);

    // Expose the default loader so that developers can directly ask it for configuration
    // or to resolve configuration
    ko.exportSymbol('components.defaultLoader', ko.components.defaultLoader);

    // By default, the default loader is the only registered component loader
    ko.components['loaders'].push(ko.components.defaultLoader);

    // Privately expose the underlying config registry for use in old-IE shim
    ko.components._allRegisteredComponents = defaultConfigRegistry;
})();
(function (undefined) {
    // Overridable API for determining which component name applies to a given node. By overriding this,
    // you can for example map specific tagNames to components that are not preregistered.
    ko.components['getComponentNameForNode'] = function(node) {
        var tagNameLower = ko.utils.tagNameLower(node);
        if (ko.components.isRegistered(tagNameLower)) {
            // Try to determine that this node can be considered a *custom* element; see https://github.com/knockout/knockout/issues/1603
            if (tagNameLower.indexOf('-') != -1 || ('' + node) == "[object HTMLUnknownElement]" || (ko.utils.ieVersion <= 8 && node.tagName === tagNameLower)) {
                return tagNameLower;
            }
        }
    };

    ko.components.addBindingsForCustomElement = function(allBindings, node, bindingContext, valueAccessors) {
        // Determine if it's really a custom element matching a component
        if (node.nodeType === 1) {
            var componentName = ko.components['getComponentNameForNode'](node);
            if (componentName) {
                // It does represent a component, so add a component binding for it
                allBindings = allBindings || {};

                if (allBindings['component']) {
                    // Avoid silently overwriting some other 'component' binding that may already be on the element
                    throw new Error('Cannot use the "component" binding on a custom element matching a component');
                }

                var componentBindingValue = { 'name': componentName, 'params': getComponentParamsFromCustomElement(node, bindingContext) };

                allBindings['component'] = valueAccessors
                    ? function() { return componentBindingValue; }
                    : componentBindingValue;
            }
        }

        return allBindings;
    }

    var nativeBindingProviderInstance = new ko.bindingProvider();

    function getComponentParamsFromCustomElement(elem, bindingContext) {
        var paramsAttribute = elem.getAttribute('params');

        if (paramsAttribute) {
            var params = nativeBindingProviderInstance['parseBindingsString'](paramsAttribute, bindingContext, elem, { 'valueAccessors': true, 'bindingParams': true }),
                rawParamComputedValues = ko.utils.objectMap(params, function(paramValue, paramName) {
                    return ko.computed(paramValue, null, { disposeWhenNodeIsRemoved: elem });
                }),
                result = ko.utils.objectMap(rawParamComputedValues, function(paramValueComputed, paramName) {
                    var paramValue = paramValueComputed.peek();
                    // Does the evaluation of the parameter value unwrap any observables?
                    if (!paramValueComputed.isActive()) {
                        // No it doesn't, so there's no need for any computed wrapper. Just pass through the supplied value directly.
                        // Example: "someVal: firstName, age: 123" (whether or not firstName is an observable/computed)
                        return paramValue;
                    } else {
                        // Yes it does. Supply a computed property that unwraps both the outer (binding expression)
                        // level of observability, and any inner (resulting model value) level of observability.
                        // This means the component doesn't have to worry about multiple unwrapping. If the value is a
                        // writable observable, the computed will also be writable and pass the value on to the observable.
                        return ko.computed({
                            'read': function() {
                                return ko.utils.unwrapObservable(paramValueComputed());
                            },
                            'write': ko.isWriteableObservable(paramValue) && function(value) {
                                paramValueComputed()(value);
                            },
                            disposeWhenNodeIsRemoved: elem
                        });
                    }
                });

            // Give access to the raw computeds, as long as that wouldn't overwrite any custom param also called '$raw'
            // This is in case the developer wants to react to outer (binding) observability separately from inner
            // (model value) observability, or in case the model value observable has subobservables.
            if (!result.hasOwnProperty('$raw')) {
                result['$raw'] = rawParamComputedValues;
            }

            return result;
        } else {
            // For consistency, absence of a "params" attribute is treated the same as the presence of
            // any empty one. Otherwise component viewmodels need special code to check whether or not
            // 'params' or 'params.$raw' is null/undefined before reading subproperties, which is annoying.
            return { '$raw': {} };
        }
    }

    // --------------------------------------------------------------------------------
    // Compatibility code for older (pre-HTML5) IE browsers

    if (ko.utils.ieVersion < 9) {
        // Whenever you preregister a component, enable it as a custom element in the current document
        ko.components['register'] = (function(originalFunction) {
            return function(componentName) {
                document.createElement(componentName); // Allows IE<9 to parse markup containing the custom element
                return originalFunction.apply(this, arguments);
            }
        })(ko.components['register']);

        // Whenever you create a document fragment, enable all preregistered component names as custom elements
        // This is needed to make innerShiv/jQuery HTML parsing correctly handle the custom elements
        document.createDocumentFragment = (function(originalFunction) {
            return function() {
                var newDocFrag = originalFunction(),
                    allComponents = ko.components._allRegisteredComponents;
                for (var componentName in allComponents) {
                    if (allComponents.hasOwnProperty(componentName)) {
                        newDocFrag.createElement(componentName);
                    }
                }
                return newDocFrag;
            };
        })(document.createDocumentFragment);
    }
})();(function(undefined) {

    var componentLoadingOperationUniqueId = 0;

    ko.bindingHandlers['component'] = {
        'init': function(element, valueAccessor, ignored1, ignored2, bindingContext) {
            var currentViewModel,
                currentLoadingOperationId,
                disposeAssociatedComponentViewModel = function () {
                    var currentViewModelDispose = currentViewModel && currentViewModel['dispose'];
                    if (typeof currentViewModelDispose === 'function') {
                        currentViewModelDispose.call(currentViewModel);
                    }
                    currentViewModel = null;
                    // Any in-flight loading operation is no longer relevant, so make sure we ignore its completion
                    currentLoadingOperationId = null;
                },
                originalChildNodes = ko.utils.makeArray(ko.virtualElements.childNodes(element));

            ko.utils.domNodeDisposal.addDisposeCallback(element, disposeAssociatedComponentViewModel);

            ko.computed(function () {
                var value = ko.utils.unwrapObservable(valueAccessor()),
                    componentName, componentParams;

                if (typeof value === 'string') {
                    componentName = value;
                } else {
                    componentName = ko.utils.unwrapObservable(value['name']);
                    componentParams = ko.utils.unwrapObservable(value['params']);
                }

                if (!componentName) {
                    throw new Error('No component name specified');
                }

                var loadingOperationId = currentLoadingOperationId = ++componentLoadingOperationUniqueId;
                ko.components.get(componentName, function(componentDefinition) {
                    // If this is not the current load operation for this element, ignore it.
                    if (currentLoadingOperationId !== loadingOperationId) {
                        return;
                    }

                    // Clean up previous state
                    disposeAssociatedComponentViewModel();

                    // Instantiate and bind new component. Implicitly this cleans any old DOM nodes.
                    if (!componentDefinition) {
                        throw new Error('Unknown component \'' + componentName + '\'');
                    }
                    cloneTemplateIntoElement(componentName, componentDefinition, element);
                    var componentViewModel = createViewModel(componentDefinition, element, originalChildNodes, componentParams),
                        childBindingContext = bindingContext['createChildContext'](componentViewModel, /* dataItemAlias */ undefined, function(ctx) {
                            ctx['$component'] = componentViewModel;
                            ctx['$componentTemplateNodes'] = originalChildNodes;
                        });
                    currentViewModel = componentViewModel;
                    ko.applyBindingsToDescendants(childBindingContext, element);
                });
            }, null, { disposeWhenNodeIsRemoved: element });

            return { 'controlsDescendantBindings': true };
        }
    };

    ko.virtualElements.allowedBindings['component'] = true;

    function cloneTemplateIntoElement(componentName, componentDefinition, element) {
        var template = componentDefinition['template'];
        if (!template) {
            throw new Error('Component \'' + componentName + '\' has no template');
        }

        var clonedNodesArray = ko.utils.cloneNodes(template);
        ko.virtualElements.setDomNodeChildren(element, clonedNodesArray);
    }

    function createViewModel(componentDefinition, element, originalChildNodes, componentParams) {
        var componentViewModelFactory = componentDefinition['createViewModel'];
        return componentViewModelFactory
            ? componentViewModelFactory.call(componentDefinition, componentParams, { 'element': element, 'templateNodes': originalChildNodes })
            : componentParams; // Template-only component
    }

})();
var attrHtmlToJavascriptMap = { 'class': 'className', 'for': 'htmlFor' };
ko.bindingHandlers['attr'] = {
    'update': function(element, valueAccessor, allBindings) {
        var value = ko.utils.unwrapObservable(valueAccessor()) || {};
        ko.utils.objectForEach(value, function(attrName, attrValue) {
            attrValue = ko.utils.unwrapObservable(attrValue);

            // To cover cases like "attr: { checked:someProp }", we want to remove the attribute entirely
            // when someProp is a "no value"-like value (strictly null, false, or undefined)
            // (because the absence of the "checked" attr is how to mark an element as not checked, etc.)
            var toRemove = (attrValue === false) || (attrValue === null) || (attrValue === undefined);
            if (toRemove)
                element.removeAttribute(attrName);

            // In IE <= 7 and IE8 Quirks Mode, you have to use the Javascript property name instead of the
            // HTML attribute name for certain attributes. IE8 Standards Mode supports the correct behavior,
            // but instead of figuring out the mode, we'll just set the attribute through the Javascript
            // property for IE <= 8.
            if (ko.utils.ieVersion <= 8 && attrName in attrHtmlToJavascriptMap) {
                attrName = attrHtmlToJavascriptMap[attrName];
                if (toRemove)
                    element.removeAttribute(attrName);
                else
                    element[attrName] = attrValue;
            } else if (!toRemove) {
                element.setAttribute(attrName, attrValue.toString());
            }

            // Treat "name" specially - although you can think of it as an attribute, it also needs
            // special handling on older versions of IE (https://github.com/SteveSanderson/knockout/pull/333)
            // Deliberately being case-sensitive here because XHTML would regard "Name" as a different thing
            // entirely, and there's no strong reason to allow for such casing in HTML.
            if (attrName === "name") {
                ko.utils.setElementName(element, toRemove ? "" : attrValue.toString());
            }
        });
    }
};
(function() {

ko.bindingHandlers['checked'] = {
    'after': ['value', 'attr'],
    'init': function (element, valueAccessor, allBindings) {
        var checkedValue = ko.pureComputed(function() {
            // Treat "value" like "checkedValue" when it is included with "checked" binding
            if (allBindings['has']('checkedValue')) {
                return ko.utils.unwrapObservable(allBindings.get('checkedValue'));
            } else if (allBindings['has']('value')) {
                return ko.utils.unwrapObservable(allBindings.get('value'));
            }

            return element.value;
        });

        function updateModel() {
            // This updates the model value from the view value.
            // It runs in response to DOM events (click) and changes in checkedValue.
            var isChecked = element.checked,
                elemValue = useCheckedValue ? checkedValue() : isChecked;

            // When we're first setting up this computed, don't change any model state.
            if (ko.computedContext.isInitial()) {
                return;
            }

            // We can ignore unchecked radio buttons, because some other radio
            // button will be getting checked, and that one can take care of updating state.
            if (isRadio && !isChecked) {
                return;
            }

            var modelValue = ko.dependencyDetection.ignore(valueAccessor);
            if (valueIsArray) {
                var writableValue = rawValueIsNonArrayObservable ? modelValue.peek() : modelValue;
                if (oldElemValue !== elemValue) {
                    // When we're responding to the checkedValue changing, and the element is
                    // currently checked, replace the old elem value with the new elem value
                    // in the model array.
                    if (isChecked) {
                        ko.utils.addOrRemoveItem(writableValue, elemValue, true);
                        ko.utils.addOrRemoveItem(writableValue, oldElemValue, false);
                    }

                    oldElemValue = elemValue;
                } else {
                    // When we're responding to the user having checked/unchecked a checkbox,
                    // add/remove the element value to the model array.
                    ko.utils.addOrRemoveItem(writableValue, elemValue, isChecked);
                }
                if (rawValueIsNonArrayObservable && ko.isWriteableObservable(modelValue)) {
                    modelValue(writableValue);
                }
            } else {
                ko.expressionRewriting.writeValueToProperty(modelValue, allBindings, 'checked', elemValue, true);
            }
        };

        function updateView() {
            // This updates the view value from the model value.
            // It runs in response to changes in the bound (checked) value.
            var modelValue = ko.utils.unwrapObservable(valueAccessor());

            if (valueIsArray) {
                // When a checkbox is bound to an array, being checked represents its value being present in that array
                element.checked = ko.utils.arrayIndexOf(modelValue, checkedValue()) >= 0;
            } else if (isCheckbox) {
                // When a checkbox is bound to any other value (not an array), being checked represents the value being trueish
                element.checked = modelValue;
            } else {
                // For radio buttons, being checked means that the radio button's value corresponds to the model value
                element.checked = (checkedValue() === modelValue);
            }
        };

        var isCheckbox = element.type == "checkbox",
            isRadio = element.type == "radio";

        // Only bind to check boxes and radio buttons
        if (!isCheckbox && !isRadio) {
            return;
        }

        var rawValue = valueAccessor(),
            valueIsArray = isCheckbox && (ko.utils.unwrapObservable(rawValue) instanceof Array),
            rawValueIsNonArrayObservable = !(valueIsArray && rawValue.push && rawValue.splice),
            oldElemValue = valueIsArray ? checkedValue() : undefined,
            useCheckedValue = isRadio || valueIsArray;

        // IE 6 won't allow radio buttons to be selected unless they have a name
        if (isRadio && !element.name)
            ko.bindingHandlers['uniqueName']['init'](element, function() { return true });

        // Set up two computeds to update the binding:

        // The first responds to changes in the checkedValue value and to element clicks
        ko.computed(updateModel, null, { disposeWhenNodeIsRemoved: element });
        ko.utils.registerEventHandler(element, "click", updateModel);

        // The second responds to changes in the model value (the one associated with the checked binding)
        ko.computed(updateView, null, { disposeWhenNodeIsRemoved: element });

        rawValue = undefined;
    }
};
ko.expressionRewriting.twoWayBindings['checked'] = true;

ko.bindingHandlers['checkedValue'] = {
    'update': function (element, valueAccessor) {
        element.value = ko.utils.unwrapObservable(valueAccessor());
    }
};

})();var classesWrittenByBindingKey = '__ko__cssValue';
ko.bindingHandlers['css'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value !== null && typeof value == "object") {
            ko.utils.objectForEach(value, function(className, shouldHaveClass) {
                shouldHaveClass = ko.utils.unwrapObservable(shouldHaveClass);
                ko.utils.toggleDomNodeCssClass(element, className, shouldHaveClass);
            });
        } else {
            value = ko.utils.stringTrim(String(value || '')); // Make sure we don't try to store or set a non-string value
            ko.utils.toggleDomNodeCssClass(element, element[classesWrittenByBindingKey], false);
            element[classesWrittenByBindingKey] = value;
            ko.utils.toggleDomNodeCssClass(element, value, true);
        }
    }
};
ko.bindingHandlers['enable'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value && element.disabled)
            element.removeAttribute("disabled");
        else if ((!value) && (!element.disabled))
            element.disabled = true;
    }
};

ko.bindingHandlers['disable'] = {
    'update': function (element, valueAccessor) {
        ko.bindingHandlers['enable']['update'](element, function() { return !ko.utils.unwrapObservable(valueAccessor()) });
    }
};
// For certain common events (currently just 'click'), allow a simplified data-binding syntax
// e.g. click:handler instead of the usual full-length event:{click:handler}
function makeEventHandlerShortcut(eventName) {
    ko.bindingHandlers[eventName] = {
        'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var newValueAccessor = function () {
                var result = {};
                result[eventName] = valueAccessor();
                return result;
            };
            return ko.bindingHandlers['event']['init'].call(this, element, newValueAccessor, allBindings, viewModel, bindingContext);
        }
    }
}

ko.bindingHandlers['event'] = {
    'init' : function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        var eventsToHandle = valueAccessor() || {};
        ko.utils.objectForEach(eventsToHandle, function(eventName) {
            if (typeof eventName == "string") {
                ko.utils.registerEventHandler(element, eventName, function (event) {
                    var handlerReturnValue;
                    var handlerFunction = valueAccessor()[eventName];
                    if (!handlerFunction)
                        return;

                    try {
                        // Take all the event args, and prefix with the viewmodel
                        var argsForHandler = ko.utils.makeArray(arguments);
                        viewModel = bindingContext['$data'];
                        argsForHandler.unshift(viewModel);
                        handlerReturnValue = handlerFunction.apply(viewModel, argsForHandler);
                    } finally {
                        if (handlerReturnValue !== true) { // Normally we want to prevent default action. Developer can override this be explicitly returning true.
                            if (event.preventDefault)
                                event.preventDefault();
                            else
                                event.returnValue = false;
                        }
                    }

                    var bubble = allBindings.get(eventName + 'Bubble') !== false;
                    if (!bubble) {
                        event.cancelBubble = true;
                        if (event.stopPropagation)
                            event.stopPropagation();
                    }
                });
            }
        });
    }
};
// "foreach: someExpression" is equivalent to "template: { foreach: someExpression }"
// "foreach: { data: someExpression, afterAdd: myfn }" is equivalent to "template: { foreach: someExpression, afterAdd: myfn }"
ko.bindingHandlers['foreach'] = {
    makeTemplateValueAccessor: function(valueAccessor) {
        return function() {
            var modelValue = valueAccessor(),
                unwrappedValue = ko.utils.peekObservable(modelValue);    // Unwrap without setting a dependency here

            // If unwrappedValue is the array, pass in the wrapped value on its own
            // The value will be unwrapped and tracked within the template binding
            // (See https://github.com/SteveSanderson/knockout/issues/523)
            if ((!unwrappedValue) || typeof unwrappedValue.length == "number")
                return { 'foreach': modelValue, 'templateEngine': ko.nativeTemplateEngine.instance };

            // If unwrappedValue.data is the array, preserve all relevant options and unwrap again value so we get updates
            ko.utils.unwrapObservable(modelValue);
            return {
                'foreach': unwrappedValue['data'],
                'as': unwrappedValue['as'],
                'includeDestroyed': unwrappedValue['includeDestroyed'],
                'afterAdd': unwrappedValue['afterAdd'],
                'beforeRemove': unwrappedValue['beforeRemove'],
                'afterRender': unwrappedValue['afterRender'],
                'beforeMove': unwrappedValue['beforeMove'],
                'afterMove': unwrappedValue['afterMove'],
                'templateEngine': ko.nativeTemplateEngine.instance
            };
        };
    },
    'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        return ko.bindingHandlers['template']['init'](element, ko.bindingHandlers['foreach'].makeTemplateValueAccessor(valueAccessor));
    },
    'update': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        return ko.bindingHandlers['template']['update'](element, ko.bindingHandlers['foreach'].makeTemplateValueAccessor(valueAccessor), allBindings, viewModel, bindingContext);
    }
};
ko.expressionRewriting.bindingRewriteValidators['foreach'] = false; // Can't rewrite control flow bindings
ko.virtualElements.allowedBindings['foreach'] = true;
var hasfocusUpdatingProperty = '__ko_hasfocusUpdating';
var hasfocusLastValue = '__ko_hasfocusLastValue';
ko.bindingHandlers['hasfocus'] = {
    'init': function(element, valueAccessor, allBindings) {
        var handleElementFocusChange = function(isFocused) {
            // Where possible, ignore which event was raised and determine focus state using activeElement,
            // as this avoids phantom focus/blur events raised when changing tabs in modern browsers.
            // However, not all KO-targeted browsers (Firefox 2) support activeElement. For those browsers,
            // prevent a loss of focus when changing tabs/windows by setting a flag that prevents hasfocus
            // from calling 'blur()' on the element when it loses focus.
            // Discussion at https://github.com/SteveSanderson/knockout/pull/352
            element[hasfocusUpdatingProperty] = true;
            var ownerDoc = element.ownerDocument;
            if ("activeElement" in ownerDoc) {
                var active;
                try {
                    active = ownerDoc.activeElement;
                } catch(e) {
                    // IE9 throws if you access activeElement during page load (see issue #703)
                    active = ownerDoc.body;
                }
                isFocused = (active === element);
            }
            var modelValue = valueAccessor();
            ko.expressionRewriting.writeValueToProperty(modelValue, allBindings, 'hasfocus', isFocused, true);

            //cache the latest value, so we can avoid unnecessarily calling focus/blur in the update function
            element[hasfocusLastValue] = isFocused;
            element[hasfocusUpdatingProperty] = false;
        };
        var handleElementFocusIn = handleElementFocusChange.bind(null, true);
        var handleElementFocusOut = handleElementFocusChange.bind(null, false);

        ko.utils.registerEventHandler(element, "focus", handleElementFocusIn);
        ko.utils.registerEventHandler(element, "focusin", handleElementFocusIn); // For IE
        ko.utils.registerEventHandler(element, "blur",  handleElementFocusOut);
        ko.utils.registerEventHandler(element, "focusout",  handleElementFocusOut); // For IE
    },
    'update': function(element, valueAccessor) {
        var value = !!ko.utils.unwrapObservable(valueAccessor());

        if (!element[hasfocusUpdatingProperty] && element[hasfocusLastValue] !== value) {
            value ? element.focus() : element.blur();

            // In IE, the blur method doesn't always cause the element to lose focus (for example, if the window is not in focus).
            // Setting focus to the body element does seem to be reliable in IE, but should only be used if we know that the current
            // element was focused already.
            if (!value && element[hasfocusLastValue]) {
                element.ownerDocument.body.focus();
            }

            // For IE, which doesn't reliably fire "focus" or "blur" events synchronously
            ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, value ? "focusin" : "focusout"]);
        }
    }
};
ko.expressionRewriting.twoWayBindings['hasfocus'] = true;

ko.bindingHandlers['hasFocus'] = ko.bindingHandlers['hasfocus']; // Make "hasFocus" an alias
ko.expressionRewriting.twoWayBindings['hasFocus'] = true;
ko.bindingHandlers['html'] = {
    'init': function() {
        // Prevent binding on the dynamically-injected HTML (as developers are unlikely to expect that, and it has security implications)
        return { 'controlsDescendantBindings': true };
    },
    'update': function (element, valueAccessor) {
        // setHtml will unwrap the value if needed
        ko.utils.setHtml(element, valueAccessor());
    }
};
// Makes a binding like with or if
function makeWithIfBinding(bindingKey, isWith, isNot, makeContextCallback) {
    ko.bindingHandlers[bindingKey] = {
        'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var didDisplayOnLastUpdate,
                savedNodes;
            ko.computed(function() {
                var dataValue = ko.utils.unwrapObservable(valueAccessor()),
                    shouldDisplay = !isNot !== !dataValue, // equivalent to isNot ? !dataValue : !!dataValue
                    isFirstRender = !savedNodes,
                    needsRefresh = isFirstRender || isWith || (shouldDisplay !== didDisplayOnLastUpdate);

                if (needsRefresh) {
                    // Save a copy of the inner nodes on the initial update, but only if we have dependencies.
                    if (isFirstRender && ko.computedContext.getDependenciesCount()) {
                        savedNodes = ko.utils.cloneNodes(ko.virtualElements.childNodes(element), true /* shouldCleanNodes */);
                    }

                    if (shouldDisplay) {
                        if (!isFirstRender) {
                            ko.virtualElements.setDomNodeChildren(element, ko.utils.cloneNodes(savedNodes));
                        }
                        ko.applyBindingsToDescendants(makeContextCallback ? makeContextCallback(bindingContext, dataValue) : bindingContext, element);
                    } else {
                        ko.virtualElements.emptyNode(element);
                    }

                    didDisplayOnLastUpdate = shouldDisplay;
                }
            }, null, { disposeWhenNodeIsRemoved: element });
            return { 'controlsDescendantBindings': true };
        }
    };
    ko.expressionRewriting.bindingRewriteValidators[bindingKey] = false; // Can't rewrite control flow bindings
    ko.virtualElements.allowedBindings[bindingKey] = true;
}

// Construct the actual binding handlers
makeWithIfBinding('if');
makeWithIfBinding('ifnot', false /* isWith */, true /* isNot */);
makeWithIfBinding('with', true /* isWith */, false /* isNot */,
    function(bindingContext, dataValue) {
        return bindingContext['createChildContext'](dataValue);
    }
);
var captionPlaceholder = {};
ko.bindingHandlers['options'] = {
    'init': function(element) {
        if (ko.utils.tagNameLower(element) !== "select")
            throw new Error("options binding applies only to SELECT elements");

        // Remove all existing <option>s.
        while (element.length > 0) {
            element.remove(0);
        }

        // Ensures that the binding processor doesn't try to bind the options
        return { 'controlsDescendantBindings': true };
    },
    'update': function (element, valueAccessor, allBindings) {
        function selectedOptions() {
            return ko.utils.arrayFilter(element.options, function (node) { return node.selected; });
        }

        var selectWasPreviouslyEmpty = element.length == 0,
            multiple = element.multiple,
            previousScrollTop = (!selectWasPreviouslyEmpty && multiple) ? element.scrollTop : null,
            unwrappedArray = ko.utils.unwrapObservable(valueAccessor()),
            valueAllowUnset = allBindings.get('valueAllowUnset') && allBindings['has']('value'),
            includeDestroyed = allBindings.get('optionsIncludeDestroyed'),
            arrayToDomNodeChildrenOptions = {},
            captionValue,
            filteredArray,
            previousSelectedValues = [];

        if (!valueAllowUnset) {
            if (multiple) {
                previousSelectedValues = ko.utils.arrayMap(selectedOptions(), ko.selectExtensions.readValue);
            } else if (element.selectedIndex >= 0) {
                previousSelectedValues.push(ko.selectExtensions.readValue(element.options[element.selectedIndex]));
            }
        }

        if (unwrappedArray) {
            if (typeof unwrappedArray.length == "undefined") // Coerce single value into array
                unwrappedArray = [unwrappedArray];

            // Filter out any entries marked as destroyed
            filteredArray = ko.utils.arrayFilter(unwrappedArray, function(item) {
                return includeDestroyed || item === undefined || item === null || !ko.utils.unwrapObservable(item['_destroy']);
            });

            // If caption is included, add it to the array
            if (allBindings['has']('optionsCaption')) {
                captionValue = ko.utils.unwrapObservable(allBindings.get('optionsCaption'));
                // If caption value is null or undefined, don't show a caption
                if (captionValue !== null && captionValue !== undefined) {
                    filteredArray.unshift(captionPlaceholder);
                }
            }
        } else {
            // If a falsy value is provided (e.g. null), we'll simply empty the select element
        }

        function applyToObject(object, predicate, defaultValue) {
            var predicateType = typeof predicate;
            if (predicateType == "function")    // Given a function; run it against the data value
                return predicate(object);
            else if (predicateType == "string") // Given a string; treat it as a property name on the data value
                return object[predicate];
            else                                // Given no optionsText arg; use the data value itself
                return defaultValue;
        }

        // The following functions can run at two different times:
        // The first is when the whole array is being updated directly from this binding handler.
        // The second is when an observable value for a specific array entry is updated.
        // oldOptions will be empty in the first case, but will be filled with the previously generated option in the second.
        var itemUpdate = false;
        function optionForArrayItem(arrayEntry, index, oldOptions) {
            if (oldOptions.length) {
                previousSelectedValues = !valueAllowUnset && oldOptions[0].selected ? [ ko.selectExtensions.readValue(oldOptions[0]) ] : [];
                itemUpdate = true;
            }
            var option = element.ownerDocument.createElement("option");
            if (arrayEntry === captionPlaceholder) {
                ko.utils.setTextContent(option, allBindings.get('optionsCaption'));
                ko.selectExtensions.writeValue(option, undefined);
            } else {
                // Apply a value to the option element
                var optionValue = applyToObject(arrayEntry, allBindings.get('optionsValue'), arrayEntry);
                ko.selectExtensions.writeValue(option, ko.utils.unwrapObservable(optionValue));

                // Apply some text to the option element
                var optionText = applyToObject(arrayEntry, allBindings.get('optionsText'), optionValue);
                ko.utils.setTextContent(option, optionText);
            }
            return [option];
        }

        // By using a beforeRemove callback, we delay the removal until after new items are added. This fixes a selection
        // problem in IE<=8 and Firefox. See https://github.com/knockout/knockout/issues/1208
        arrayToDomNodeChildrenOptions['beforeRemove'] =
            function (option) {
                element.removeChild(option);
            };

        function setSelectionCallback(arrayEntry, newOptions) {
            if (itemUpdate && valueAllowUnset) {
                // The model value is authoritative, so make sure its value is the one selected
                // There is no need to use dependencyDetection.ignore since setDomNodeChildrenFromArrayMapping does so already.
                ko.selectExtensions.writeValue(element, ko.utils.unwrapObservable(allBindings.get('value')), true /* allowUnset */);
            } else if (previousSelectedValues.length) {
                // IE6 doesn't like us to assign selection to OPTION nodes before they're added to the document.
                // That's why we first added them without selection. Now it's time to set the selection.
                var isSelected = ko.utils.arrayIndexOf(previousSelectedValues, ko.selectExtensions.readValue(newOptions[0])) >= 0;
                ko.utils.setOptionNodeSelectionState(newOptions[0], isSelected);

                // If this option was changed from being selected during a single-item update, notify the change
                if (itemUpdate && !isSelected) {
                    ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, "change"]);
                }
            }
        }

        var callback = setSelectionCallback;
        if (allBindings['has']('optionsAfterRender') && typeof allBindings.get('optionsAfterRender') == "function") {
            callback = function(arrayEntry, newOptions) {
                setSelectionCallback(arrayEntry, newOptions);
                ko.dependencyDetection.ignore(allBindings.get('optionsAfterRender'), null, [newOptions[0], arrayEntry !== captionPlaceholder ? arrayEntry : undefined]);
            }
        }

        ko.utils.setDomNodeChildrenFromArrayMapping(element, filteredArray, optionForArrayItem, arrayToDomNodeChildrenOptions, callback);

        ko.dependencyDetection.ignore(function () {
            if (valueAllowUnset) {
                // The model value is authoritative, so make sure its value is the one selected
                ko.selectExtensions.writeValue(element, ko.utils.unwrapObservable(allBindings.get('value')), true /* allowUnset */);
            } else {
                // Determine if the selection has changed as a result of updating the options list
                var selectionChanged;
                if (multiple) {
                    // For a multiple-select box, compare the new selection count to the previous one
                    // But if nothing was selected before, the selection can't have changed
                    selectionChanged = previousSelectedValues.length && selectedOptions().length < previousSelectedValues.length;
                } else {
                    // For a single-select box, compare the current value to the previous value
                    // But if nothing was selected before or nothing is selected now, just look for a change in selection
                    selectionChanged = (previousSelectedValues.length && element.selectedIndex >= 0)
                        ? (ko.selectExtensions.readValue(element.options[element.selectedIndex]) !== previousSelectedValues[0])
                        : (previousSelectedValues.length || element.selectedIndex >= 0);
                }

                // Ensure consistency between model value and selected option.
                // If the dropdown was changed so that selection is no longer the same,
                // notify the value or selectedOptions binding.
                if (selectionChanged) {
                    ko.utils.triggerEvent(element, "change");
                }
            }
        });

        // Workaround for IE bug
        ko.utils.ensureSelectElementIsRenderedCorrectly(element);

        if (previousScrollTop && Math.abs(previousScrollTop - element.scrollTop) > 20)
            element.scrollTop = previousScrollTop;
    }
};
ko.bindingHandlers['options'].optionValueDomDataKey = ko.utils.domData.nextKey();
ko.bindingHandlers['selectedOptions'] = {
    'after': ['options', 'foreach'],
    'init': function (element, valueAccessor, allBindings) {
        ko.utils.registerEventHandler(element, "change", function () {
            var value = valueAccessor(), valueToWrite = [];
            ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                if (node.selected)
                    valueToWrite.push(ko.selectExtensions.readValue(node));
            });
            ko.expressionRewriting.writeValueToProperty(value, allBindings, 'selectedOptions', valueToWrite);
        });
    },
    'update': function (element, valueAccessor) {
        if (ko.utils.tagNameLower(element) != "select")
            throw new Error("values binding applies only to SELECT elements");

        var newValue = ko.utils.unwrapObservable(valueAccessor()),
            previousScrollTop = element.scrollTop;

        if (newValue && typeof newValue.length == "number") {
            ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                var isSelected = ko.utils.arrayIndexOf(newValue, ko.selectExtensions.readValue(node)) >= 0;
                if (node.selected != isSelected) {      // This check prevents flashing of the select element in IE
                    ko.utils.setOptionNodeSelectionState(node, isSelected);
                }
            });
        }

        element.scrollTop = previousScrollTop;
    }
};
ko.expressionRewriting.twoWayBindings['selectedOptions'] = true;
ko.bindingHandlers['style'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor() || {});
        ko.utils.objectForEach(value, function(styleName, styleValue) {
            styleValue = ko.utils.unwrapObservable(styleValue);

            if (styleValue === null || styleValue === undefined || styleValue === false) {
                // Empty string removes the value, whereas null/undefined have no effect
                styleValue = "";
            }

            element.style[styleName] = styleValue;
        });
    }
};
ko.bindingHandlers['submit'] = {
    'init': function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        if (typeof valueAccessor() != "function")
            throw new Error("The value for a submit binding must be a function");
        ko.utils.registerEventHandler(element, "submit", function (event) {
            var handlerReturnValue;
            var value = valueAccessor();
            try { handlerReturnValue = value.call(bindingContext['$data'], element); }
            finally {
                if (handlerReturnValue !== true) { // Normally we want to prevent default action. Developer can override this be explicitly returning true.
                    if (event.preventDefault)
                        event.preventDefault();
                    else
                        event.returnValue = false;
                }
            }
        });
    }
};
ko.bindingHandlers['text'] = {
    'init': function() {
        // Prevent binding on the dynamically-injected text node (as developers are unlikely to expect that, and it has security implications).
        // It should also make things faster, as we no longer have to consider whether the text node might be bindable.
        return { 'controlsDescendantBindings': true };
    },
    'update': function (element, valueAccessor) {
        ko.utils.setTextContent(element, valueAccessor());
    }
};
ko.virtualElements.allowedBindings['text'] = true;
(function () {

if (window && window.navigator) {
    var parseVersion = function (matches) {
        if (matches) {
            return parseFloat(matches[1]);
        }
    };

    // Detect various browser versions because some old versions don't fully support the 'input' event
    var operaVersion = window.opera && window.opera.version && parseInt(window.opera.version()),
        userAgent = window.navigator.userAgent,
        safariVersion = parseVersion(userAgent.match(/^(?:(?!chrome).)*version\/([^ ]*) safari/i)),
        firefoxVersion = parseVersion(userAgent.match(/Firefox\/([^ ]*)/));
}

// IE 8 and 9 have bugs that prevent the normal events from firing when the value changes.
// But it does fire the 'selectionchange' event on many of those, presumably because the
// cursor is moving and that counts as the selection changing. The 'selectionchange' event is
// fired at the document level only and doesn't directly indicate which element changed. We
// set up just one event handler for the document and use 'activeElement' to determine which
// element was changed.
if (ko.utils.ieVersion < 10) {
    var selectionChangeRegisteredName = ko.utils.domData.nextKey(),
        selectionChangeHandlerName = ko.utils.domData.nextKey();
    var selectionChangeHandler = function(event) {
        var target = this.activeElement,
            handler = target && ko.utils.domData.get(target, selectionChangeHandlerName);
        if (handler) {
            handler(event);
        }
    };
    var registerForSelectionChangeEvent = function (element, handler) {
        var ownerDoc = element.ownerDocument;
        if (!ko.utils.domData.get(ownerDoc, selectionChangeRegisteredName)) {
            ko.utils.domData.set(ownerDoc, selectionChangeRegisteredName, true);
            ko.utils.registerEventHandler(ownerDoc, 'selectionchange', selectionChangeHandler);
        }
        ko.utils.domData.set(element, selectionChangeHandlerName, handler);
    };
}

ko.bindingHandlers['textInput'] = {
    'init': function (element, valueAccessor, allBindings) {

        var previousElementValue = element.value,
            timeoutHandle,
            elementValueBeforeEvent;

        var updateModel = function (event) {
            clearTimeout(timeoutHandle);
            elementValueBeforeEvent = timeoutHandle = undefined;

            var elementValue = element.value;
            if (previousElementValue !== elementValue) {
                // Provide a way for tests to know exactly which event was processed
                if (DEBUG && event) element['_ko_textInputProcessedEvent'] = event.type;
                previousElementValue = elementValue;
                ko.expressionRewriting.writeValueToProperty(valueAccessor(), allBindings, 'textInput', elementValue);
            }
        };

        var deferUpdateModel = function (event) {
            if (!timeoutHandle) {
                // The elementValueBeforeEvent variable is set *only* during the brief gap between an
                // event firing and the updateModel function running. This allows us to ignore model
                // updates that are from the previous state of the element, usually due to techniques
                // such as rateLimit. Such updates, if not ignored, can cause keystrokes to be lost.
                elementValueBeforeEvent = element.value;
                var handler = DEBUG ? updateModel.bind(element, {type: event.type}) : updateModel;
                timeoutHandle = ko.utils.setTimeout(handler, 4);
            }
        };

        // IE9 will mess up the DOM if you handle events synchronously which results in DOM changes (such as other bindings);
        // so we'll make sure all updates are asynchronous
        var ieUpdateModel = ko.utils.ieVersion == 9 ? deferUpdateModel : updateModel;

        var updateView = function () {
            var modelValue = ko.utils.unwrapObservable(valueAccessor());

            if (modelValue === null || modelValue === undefined) {
                modelValue = '';
            }

            if (elementValueBeforeEvent !== undefined && modelValue === elementValueBeforeEvent) {
                ko.utils.setTimeout(updateView, 4);
                return;
            }

            // Update the element only if the element and model are different. On some browsers, updating the value
            // will move the cursor to the end of the input, which would be bad while the user is typing.
            if (element.value !== modelValue) {
                previousElementValue = modelValue;  // Make sure we ignore events (propertychange) that result from updating the value
                element.value = modelValue;
            }
        };

        var onEvent = function (event, handler) {
            ko.utils.registerEventHandler(element, event, handler);
        };

        if (DEBUG && ko.bindingHandlers['textInput']['_forceUpdateOn']) {
            // Provide a way for tests to specify exactly which events are bound
            ko.utils.arrayForEach(ko.bindingHandlers['textInput']['_forceUpdateOn'], function(eventName) {
                if (eventName.slice(0,5) == 'after') {
                    onEvent(eventName.slice(5), deferUpdateModel);
                } else {
                    onEvent(eventName, updateModel);
                }
            });
        } else {
            if (ko.utils.ieVersion < 10) {
                // Internet Explorer <= 8 doesn't support the 'input' event, but does include 'propertychange' that fires whenever
                // any property of an element changes. Unlike 'input', it also fires if a property is changed from JavaScript code,
                // but that's an acceptable compromise for this binding. IE 9 does support 'input', but since it doesn't fire it
                // when using autocomplete, we'll use 'propertychange' for it also.
                onEvent('propertychange', function(event) {
                    if (event.propertyName === 'value') {
                        ieUpdateModel(event);
                    }
                });

                if (ko.utils.ieVersion == 8) {
                    // IE 8 has a bug where it fails to fire 'propertychange' on the first update following a value change from
                    // JavaScript code. It also doesn't fire if you clear the entire value. To fix this, we bind to the following
                    // events too.
                    onEvent('keyup', updateModel);      // A single keystoke
                    onEvent('keydown', updateModel);    // The first character when a key is held down
                }
                if (ko.utils.ieVersion >= 8) {
                    // Internet Explorer 9 doesn't fire the 'input' event when deleting text, including using
                    // the backspace, delete, or ctrl-x keys, clicking the 'x' to clear the input, dragging text
                    // out of the field, and cutting or deleting text using the context menu. 'selectionchange'
                    // can detect all of those except dragging text out of the field, for which we use 'dragend'.
                    // These are also needed in IE8 because of the bug described above.
                    registerForSelectionChangeEvent(element, ieUpdateModel);  // 'selectionchange' covers cut, paste, drop, delete, etc.
                    onEvent('dragend', deferUpdateModel);
                }
            } else {
                // All other supported browsers support the 'input' event, which fires whenever the content of the element is changed
                // through the user interface.
                onEvent('input', updateModel);

                if (safariVersion < 5 && ko.utils.tagNameLower(element) === "textarea") {
                    // Safari <5 doesn't fire the 'input' event for <textarea> elements (it does fire 'textInput'
                    // but only when typing). So we'll just catch as much as we can with keydown, cut, and paste.
                    onEvent('keydown', deferUpdateModel);
                    onEvent('paste', deferUpdateModel);
                    onEvent('cut', deferUpdateModel);
                } else if (operaVersion < 11) {
                    // Opera 10 doesn't always fire the 'input' event for cut, paste, undo & drop operations.
                    // We can try to catch some of those using 'keydown'.
                    onEvent('keydown', deferUpdateModel);
                } else if (firefoxVersion < 4.0) {
                    // Firefox <= 3.6 doesn't fire the 'input' event when text is filled in through autocomplete
                    onEvent('DOMAutoComplete', updateModel);

                    // Firefox <=3.5 doesn't fire the 'input' event when text is dropped into the input.
                    onEvent('dragdrop', updateModel);       // <3.5
                    onEvent('drop', updateModel);           // 3.5
                }
            }
        }

        // Bind to the change event so that we can catch programmatic updates of the value that fire this event.
        onEvent('change', updateModel);

        ko.computed(updateView, null, { disposeWhenNodeIsRemoved: element });
    }
};
ko.expressionRewriting.twoWayBindings['textInput'] = true;

// textinput is an alias for textInput
ko.bindingHandlers['textinput'] = {
    // preprocess is the only way to set up a full alias
    'preprocess': function (value, name, addBinding) {
        addBinding('textInput', value);
    }
};

})();ko.bindingHandlers['uniqueName'] = {
    'init': function (element, valueAccessor) {
        if (valueAccessor()) {
            var name = "ko_unique_" + (++ko.bindingHandlers['uniqueName'].currentIndex);
            ko.utils.setElementName(element, name);
        }
    }
};
ko.bindingHandlers['uniqueName'].currentIndex = 0;
ko.bindingHandlers['value'] = {
    'after': ['options', 'foreach'],
    'init': function (element, valueAccessor, allBindings) {
        // If the value binding is placed on a radio/checkbox, then just pass through to checkedValue and quit
        if (element.tagName.toLowerCase() == "input" && (element.type == "checkbox" || element.type == "radio")) {
            ko.applyBindingAccessorsToNode(element, { 'checkedValue': valueAccessor });
            return;
        }

        // Always catch "change" event; possibly other events too if asked
        var eventsToCatch = ["change"];
        var requestedEventsToCatch = allBindings.get("valueUpdate");
        var propertyChangedFired = false;
        var elementValueBeforeEvent = null;

        if (requestedEventsToCatch) {
            if (typeof requestedEventsToCatch == "string") // Allow both individual event names, and arrays of event names
                requestedEventsToCatch = [requestedEventsToCatch];
            ko.utils.arrayPushAll(eventsToCatch, requestedEventsToCatch);
            eventsToCatch = ko.utils.arrayGetDistinctValues(eventsToCatch);
        }

        var valueUpdateHandler = function() {
            elementValueBeforeEvent = null;
            propertyChangedFired = false;
            var modelValue = valueAccessor();
            var elementValue = ko.selectExtensions.readValue(element);
            ko.expressionRewriting.writeValueToProperty(modelValue, allBindings, 'value', elementValue);
        }

        // Workaround for https://github.com/SteveSanderson/knockout/issues/122
        // IE doesn't fire "change" events on textboxes if the user selects a value from its autocomplete list
        var ieAutoCompleteHackNeeded = ko.utils.ieVersion && element.tagName.toLowerCase() == "input" && element.type == "text"
                                       && element.autocomplete != "off" && (!element.form || element.form.autocomplete != "off");
        if (ieAutoCompleteHackNeeded && ko.utils.arrayIndexOf(eventsToCatch, "propertychange") == -1) {
            ko.utils.registerEventHandler(element, "propertychange", function () { propertyChangedFired = true });
            ko.utils.registerEventHandler(element, "focus", function () { propertyChangedFired = false });
            ko.utils.registerEventHandler(element, "blur", function() {
                if (propertyChangedFired) {
                    valueUpdateHandler();
                }
            });
        }

        ko.utils.arrayForEach(eventsToCatch, function(eventName) {
            // The syntax "after<eventname>" means "run the handler asynchronously after the event"
            // This is useful, for example, to catch "keydown" events after the browser has updated the control
            // (otherwise, ko.selectExtensions.readValue(this) will receive the control's value *before* the key event)
            var handler = valueUpdateHandler;
            if (ko.utils.stringStartsWith(eventName, "after")) {
                handler = function() {
                    // The elementValueBeforeEvent variable is non-null *only* during the brief gap between
                    // a keyX event firing and the valueUpdateHandler running, which is scheduled to happen
                    // at the earliest asynchronous opportunity. We store this temporary information so that
                    // if, between keyX and valueUpdateHandler, the underlying model value changes separately,
                    // we can overwrite that model value change with the value the user just typed. Otherwise,
                    // techniques like rateLimit can trigger model changes at critical moments that will
                    // override the user's inputs, causing keystrokes to be lost.
                    elementValueBeforeEvent = ko.selectExtensions.readValue(element);
                    ko.utils.setTimeout(valueUpdateHandler, 0);
                };
                eventName = eventName.substring("after".length);
            }
            ko.utils.registerEventHandler(element, eventName, handler);
        });

        var updateFromModel = function () {
            var newValue = ko.utils.unwrapObservable(valueAccessor());
            var elementValue = ko.selectExtensions.readValue(element);

            if (elementValueBeforeEvent !== null && newValue === elementValueBeforeEvent) {
                ko.utils.setTimeout(updateFromModel, 0);
                return;
            }

            var valueHasChanged = (newValue !== elementValue);

            if (valueHasChanged) {
                if (ko.utils.tagNameLower(element) === "select") {
                    var allowUnset = allBindings.get('valueAllowUnset');
                    var applyValueAction = function () {
                        ko.selectExtensions.writeValue(element, newValue, allowUnset);
                    };
                    applyValueAction();

                    if (!allowUnset && newValue !== ko.selectExtensions.readValue(element)) {
                        // If you try to set a model value that can't be represented in an already-populated dropdown, reject that change,
                        // because you're not allowed to have a model value that disagrees with a visible UI selection.
                        ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, "change"]);
                    } else {
                        // Workaround for IE6 bug: It won't reliably apply values to SELECT nodes during the same execution thread
                        // right after you've changed the set of OPTION nodes on it. So for that node type, we'll schedule a second thread
                        // to apply the value as well.
                        ko.utils.setTimeout(applyValueAction, 0);
                    }
                } else {
                    ko.selectExtensions.writeValue(element, newValue);
                }
            }
        };

        ko.computed(updateFromModel, null, { disposeWhenNodeIsRemoved: element });
    },
    'update': function() {} // Keep for backwards compatibility with code that may have wrapped value binding
};
ko.expressionRewriting.twoWayBindings['value'] = true;
ko.bindingHandlers['visible'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var isCurrentlyVisible = !(element.style.display == "none");
        if (value && !isCurrentlyVisible)
            element.style.display = "";
        else if ((!value) && isCurrentlyVisible)
            element.style.display = "none";
    }
};
// 'click' is just a shorthand for the usual full-length event:{click:handler}
makeEventHandlerShortcut('click');
// If you want to make a custom template engine,
//
// [1] Inherit from this class (like ko.nativeTemplateEngine does)
// [2] Override 'renderTemplateSource', supplying a function with this signature:
//
//        function (templateSource, bindingContext, options) {
//            // - templateSource.text() is the text of the template you should render
//            // - bindingContext.$data is the data you should pass into the template
//            //   - you might also want to make bindingContext.$parent, bindingContext.$parents,
//            //     and bindingContext.$root available in the template too
//            // - options gives you access to any other properties set on "data-bind: { template: options }"
//            // - templateDocument is the document object of the template
//            //
//            // Return value: an array of DOM nodes
//        }
//
// [3] Override 'createJavaScriptEvaluatorBlock', supplying a function with this signature:
//
//        function (script) {
//            // Return value: Whatever syntax means "Evaluate the JavaScript statement 'script' and output the result"
//            //               For example, the jquery.tmpl template engine converts 'someScript' to '${ someScript }'
//        }
//
//     This is only necessary if you want to allow data-bind attributes to reference arbitrary template variables.
//     If you don't want to allow that, you can set the property 'allowTemplateRewriting' to false (like ko.nativeTemplateEngine does)
//     and then you don't need to override 'createJavaScriptEvaluatorBlock'.

ko.templateEngine = function () { };

ko.templateEngine.prototype['renderTemplateSource'] = function (templateSource, bindingContext, options, templateDocument) {
    throw new Error("Override renderTemplateSource");
};

ko.templateEngine.prototype['createJavaScriptEvaluatorBlock'] = function (script) {
    throw new Error("Override createJavaScriptEvaluatorBlock");
};

ko.templateEngine.prototype['makeTemplateSource'] = function(template, templateDocument) {
    // Named template
    if (typeof template == "string") {
        templateDocument = templateDocument || document;
        var elem = templateDocument.getElementById(template);
        if (!elem)
            throw new Error("Cannot find template with ID " + template);
        return new ko.templateSources.domElement(elem);
    } else if ((template.nodeType == 1) || (template.nodeType == 8)) {
        // Anonymous template
        return new ko.templateSources.anonymousTemplate(template);
    } else
        throw new Error("Unknown template type: " + template);
};

ko.templateEngine.prototype['renderTemplate'] = function (template, bindingContext, options, templateDocument) {
    var templateSource = this['makeTemplateSource'](template, templateDocument);
    return this['renderTemplateSource'](templateSource, bindingContext, options, templateDocument);
};

ko.templateEngine.prototype['isTemplateRewritten'] = function (template, templateDocument) {
    // Skip rewriting if requested
    if (this['allowTemplateRewriting'] === false)
        return true;
    return this['makeTemplateSource'](template, templateDocument)['data']("isRewritten");
};

ko.templateEngine.prototype['rewriteTemplate'] = function (template, rewriterCallback, templateDocument) {
    var templateSource = this['makeTemplateSource'](template, templateDocument);
    var rewritten = rewriterCallback(templateSource['text']());
    templateSource['text'](rewritten);
    templateSource['data']("isRewritten", true);
};

ko.exportSymbol('templateEngine', ko.templateEngine);

ko.templateRewriting = (function () {
    var memoizeDataBindingAttributeSyntaxRegex = /(<([a-z]+\d*)(?:\s+(?!data-bind\s*=\s*)[a-z0-9\-]+(?:=(?:\"[^\"]*\"|\'[^\']*\'|[^>]*))?)*\s+)data-bind\s*=\s*(["'])([\s\S]*?)\3/gi;
    var memoizeVirtualContainerBindingSyntaxRegex = /<!--\s*ko\b\s*([\s\S]*?)\s*-->/g;

    function validateDataBindValuesForRewriting(keyValueArray) {
        var allValidators = ko.expressionRewriting.bindingRewriteValidators;
        for (var i = 0; i < keyValueArray.length; i++) {
            var key = keyValueArray[i]['key'];
            if (allValidators.hasOwnProperty(key)) {
                var validator = allValidators[key];

                if (typeof validator === "function") {
                    var possibleErrorMessage = validator(keyValueArray[i]['value']);
                    if (possibleErrorMessage)
                        throw new Error(possibleErrorMessage);
                } else if (!validator) {
                    throw new Error("This template engine does not support the '" + key + "' binding within its templates");
                }
            }
        }
    }

    function constructMemoizedTagReplacement(dataBindAttributeValue, tagToRetain, nodeName, templateEngine) {
        var dataBindKeyValueArray = ko.expressionRewriting.parseObjectLiteral(dataBindAttributeValue);
        validateDataBindValuesForRewriting(dataBindKeyValueArray);
        var rewrittenDataBindAttributeValue = ko.expressionRewriting.preProcessBindings(dataBindKeyValueArray, {'valueAccessors':true});

        // For no obvious reason, Opera fails to evaluate rewrittenDataBindAttributeValue unless it's wrapped in an additional
        // anonymous function, even though Opera's built-in debugger can evaluate it anyway. No other browser requires this
        // extra indirection.
        var applyBindingsToNextSiblingScript =
            "ko.__tr_ambtns(function($context,$element){return(function(){return{ " + rewrittenDataBindAttributeValue + " } })()},'" + nodeName.toLowerCase() + "')";
        return templateEngine['createJavaScriptEvaluatorBlock'](applyBindingsToNextSiblingScript) + tagToRetain;
    }

    return {
        ensureTemplateIsRewritten: function (template, templateEngine, templateDocument) {
            if (!templateEngine['isTemplateRewritten'](template, templateDocument))
                templateEngine['rewriteTemplate'](template, function (htmlString) {
                    return ko.templateRewriting.memoizeBindingAttributeSyntax(htmlString, templateEngine);
                }, templateDocument);
        },

        memoizeBindingAttributeSyntax: function (htmlString, templateEngine) {
            return htmlString.replace(memoizeDataBindingAttributeSyntaxRegex, function () {
                return constructMemoizedTagReplacement(/* dataBindAttributeValue: */ arguments[4], /* tagToRetain: */ arguments[1], /* nodeName: */ arguments[2], templateEngine);
            }).replace(memoizeVirtualContainerBindingSyntaxRegex, function() {
                return constructMemoizedTagReplacement(/* dataBindAttributeValue: */ arguments[1], /* tagToRetain: */ "<!-- ko -->", /* nodeName: */ "#comment", templateEngine);
            });
        },

        applyMemoizedBindingsToNextSibling: function (bindings, nodeName) {
            return ko.memoization.memoize(function (domNode, bindingContext) {
                var nodeToBind = domNode.nextSibling;
                if (nodeToBind && nodeToBind.nodeName.toLowerCase() === nodeName) {
                    ko.applyBindingAccessorsToNode(nodeToBind, bindings, bindingContext);
                }
            });
        }
    }
})();


// Exported only because it has to be referenced by string lookup from within rewritten template
ko.exportSymbol('__tr_ambtns', ko.templateRewriting.applyMemoizedBindingsToNextSibling);
(function() {
    // A template source represents a read/write way of accessing a template. This is to eliminate the need for template loading/saving
    // logic to be duplicated in every template engine (and means they can all work with anonymous templates, etc.)
    //
    // Two are provided by default:
    //  1. ko.templateSources.domElement       - reads/writes the text content of an arbitrary DOM element
    //  2. ko.templateSources.anonymousElement - uses ko.utils.domData to read/write text *associated* with the DOM element, but
    //                                           without reading/writing the actual element text content, since it will be overwritten
    //                                           with the rendered template output.
    // You can implement your own template source if you want to fetch/store templates somewhere other than in DOM elements.
    // Template sources need to have the following functions:
    //   text() 			- returns the template text from your storage location
    //   text(value)		- writes the supplied template text to your storage location
    //   data(key)			- reads values stored using data(key, value) - see below
    //   data(key, value)	- associates "value" with this template and the key "key". Is used to store information like "isRewritten".
    //
    // Optionally, template sources can also have the following functions:
    //   nodes()            - returns a DOM element containing the nodes of this template, where available
    //   nodes(value)       - writes the given DOM element to your storage location
    // If a DOM element is available for a given template source, template engines are encouraged to use it in preference over text()
    // for improved speed. However, all templateSources must supply text() even if they don't supply nodes().
    //
    // Once you've implemented a templateSource, make your template engine use it by subclassing whatever template engine you were
    // using and overriding "makeTemplateSource" to return an instance of your custom template source.

    ko.templateSources = {};

    // ---- ko.templateSources.domElement -----

    // template types
    var templateScript = 1,
        templateTextArea = 2,
        templateTemplate = 3,
        templateElement = 4;

    ko.templateSources.domElement = function(element) {
        this.domElement = element;

        if (element) {
            var tagNameLower = ko.utils.tagNameLower(element);
            this.templateType =
                tagNameLower === "script" ? templateScript :
                tagNameLower === "textarea" ? templateTextArea :
                    // For browsers with proper <template> element support, where the .content property gives a document fragment
                tagNameLower == "template" && element.content && element.content.nodeType === 11 ? templateTemplate :
                templateElement;
        }
    }

    ko.templateSources.domElement.prototype['text'] = function(/* valueToWrite */) {
        var elemContentsProperty = this.templateType === templateScript ? "text"
                                 : this.templateType === templateTextArea ? "value"
                                 : "innerHTML";

        if (arguments.length == 0) {
            return this.domElement[elemContentsProperty];
        } else {
            var valueToWrite = arguments[0];
            if (elemContentsProperty === "innerHTML")
                ko.utils.setHtml(this.domElement, valueToWrite);
            else
                this.domElement[elemContentsProperty] = valueToWrite;
        }
    };

    var dataDomDataPrefix = ko.utils.domData.nextKey() + "_";
    ko.templateSources.domElement.prototype['data'] = function(key /*, valueToWrite */) {
        if (arguments.length === 1) {
            return ko.utils.domData.get(this.domElement, dataDomDataPrefix + key);
        } else {
            ko.utils.domData.set(this.domElement, dataDomDataPrefix + key, arguments[1]);
        }
    };

    var templatesDomDataKey = ko.utils.domData.nextKey();
    function getTemplateDomData(element) {
        return ko.utils.domData.get(element, templatesDomDataKey) || {};
    }
    function setTemplateDomData(element, data) {
        ko.utils.domData.set(element, templatesDomDataKey, data);
    }

    ko.templateSources.domElement.prototype['nodes'] = function(/* valueToWrite */) {
        var element = this.domElement;
        if (arguments.length == 0) {
            var templateData = getTemplateDomData(element),
                containerData = templateData.containerData;
            return containerData || (
                this.templateType === templateTemplate ? element.content :
                this.templateType === templateElement ? element :
                undefined);
        } else {
            var valueToWrite = arguments[0];
            setTemplateDomData(element, {containerData: valueToWrite});
        }
    };

    // ---- ko.templateSources.anonymousTemplate -----
    // Anonymous templates are normally saved/retrieved as DOM nodes through "nodes".
    // For compatibility, you can also read "text"; it will be serialized from the nodes on demand.
    // Writing to "text" is still supported, but then the template data will not be available as DOM nodes.

    ko.templateSources.anonymousTemplate = function(element) {
        this.domElement = element;
    }
    ko.templateSources.anonymousTemplate.prototype = new ko.templateSources.domElement();
    ko.templateSources.anonymousTemplate.prototype.constructor = ko.templateSources.anonymousTemplate;
    ko.templateSources.anonymousTemplate.prototype['text'] = function(/* valueToWrite */) {
        if (arguments.length == 0) {
            var templateData = getTemplateDomData(this.domElement);
            if (templateData.textData === undefined && templateData.containerData)
                templateData.textData = templateData.containerData.innerHTML;
            return templateData.textData;
        } else {
            var valueToWrite = arguments[0];
            setTemplateDomData(this.domElement, {textData: valueToWrite});
        }
    };

    ko.exportSymbol('templateSources', ko.templateSources);
    ko.exportSymbol('templateSources.domElement', ko.templateSources.domElement);
    ko.exportSymbol('templateSources.anonymousTemplate', ko.templateSources.anonymousTemplate);
})();
(function () {
    var _templateEngine;
    ko.setTemplateEngine = function (templateEngine) {
        if ((templateEngine != undefined) && !(templateEngine instanceof ko.templateEngine))
            throw new Error("templateEngine must inherit from ko.templateEngine");
        _templateEngine = templateEngine;
    }

    function invokeForEachNodeInContinuousRange(firstNode, lastNode, action) {
        var node, nextInQueue = firstNode, firstOutOfRangeNode = ko.virtualElements.nextSibling(lastNode);
        while (nextInQueue && ((node = nextInQueue) !== firstOutOfRangeNode)) {
            nextInQueue = ko.virtualElements.nextSibling(node);
            action(node, nextInQueue);
        }
    }

    function activateBindingsOnContinuousNodeArray(continuousNodeArray, bindingContext) {
        // To be used on any nodes that have been rendered by a template and have been inserted into some parent element
        // Walks through continuousNodeArray (which *must* be continuous, i.e., an uninterrupted sequence of sibling nodes, because
        // the algorithm for walking them relies on this), and for each top-level item in the virtual-element sense,
        // (1) Does a regular "applyBindings" to associate bindingContext with this node and to activate any non-memoized bindings
        // (2) Unmemoizes any memos in the DOM subtree (e.g., to activate bindings that had been memoized during template rewriting)

        if (continuousNodeArray.length) {
            var firstNode = continuousNodeArray[0],
                lastNode = continuousNodeArray[continuousNodeArray.length - 1],
                parentNode = firstNode.parentNode,
                provider = ko.bindingProvider['instance'],
                preprocessNode = provider['preprocessNode'];

            if (preprocessNode) {
                invokeForEachNodeInContinuousRange(firstNode, lastNode, function(node, nextNodeInRange) {
                    var nodePreviousSibling = node.previousSibling;
                    var newNodes = preprocessNode.call(provider, node);
                    if (newNodes) {
                        if (node === firstNode)
                            firstNode = newNodes[0] || nextNodeInRange;
                        if (node === lastNode)
                            lastNode = newNodes[newNodes.length - 1] || nodePreviousSibling;
                    }
                });

                // Because preprocessNode can change the nodes, including the first and last nodes, update continuousNodeArray to match.
                // We need the full set, including inner nodes, because the unmemoize step might remove the first node (and so the real
                // first node needs to be in the array).
                continuousNodeArray.length = 0;
                if (!firstNode) { // preprocessNode might have removed all the nodes, in which case there's nothing left to do
                    return;
                }
                if (firstNode === lastNode) {
                    continuousNodeArray.push(firstNode);
                } else {
                    continuousNodeArray.push(firstNode, lastNode);
                    ko.utils.fixUpContinuousNodeArray(continuousNodeArray, parentNode);
                }
            }

            // Need to applyBindings *before* unmemoziation, because unmemoization might introduce extra nodes (that we don't want to re-bind)
            // whereas a regular applyBindings won't introduce new memoized nodes
            invokeForEachNodeInContinuousRange(firstNode, lastNode, function(node) {
                if (node.nodeType === 1 || node.nodeType === 8)
                    ko.applyBindings(bindingContext, node);
            });
            invokeForEachNodeInContinuousRange(firstNode, lastNode, function(node) {
                if (node.nodeType === 1 || node.nodeType === 8)
                    ko.memoization.unmemoizeDomNodeAndDescendants(node, [bindingContext]);
            });

            // Make sure any changes done by applyBindings or unmemoize are reflected in the array
            ko.utils.fixUpContinuousNodeArray(continuousNodeArray, parentNode);
        }
    }

    function getFirstNodeFromPossibleArray(nodeOrNodeArray) {
        return nodeOrNodeArray.nodeType ? nodeOrNodeArray
                                        : nodeOrNodeArray.length > 0 ? nodeOrNodeArray[0]
                                        : null;
    }

    function executeTemplate(targetNodeOrNodeArray, renderMode, template, bindingContext, options) {
        options = options || {};
        var firstTargetNode = targetNodeOrNodeArray && getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
        var templateDocument = (firstTargetNode || template || {}).ownerDocument;
        var templateEngineToUse = (options['templateEngine'] || _templateEngine);
        ko.templateRewriting.ensureTemplateIsRewritten(template, templateEngineToUse, templateDocument);
        var renderedNodesArray = templateEngineToUse['renderTemplate'](template, bindingContext, options, templateDocument);

        // Loosely check result is an array of DOM nodes
        if ((typeof renderedNodesArray.length != "number") || (renderedNodesArray.length > 0 && typeof renderedNodesArray[0].nodeType != "number"))
            throw new Error("Template engine must return an array of DOM nodes");

        var haveAddedNodesToParent = false;
        switch (renderMode) {
            case "replaceChildren":
                ko.virtualElements.setDomNodeChildren(targetNodeOrNodeArray, renderedNodesArray);
                haveAddedNodesToParent = true;
                break;
            case "replaceNode":
                ko.utils.replaceDomNodes(targetNodeOrNodeArray, renderedNodesArray);
                haveAddedNodesToParent = true;
                break;
            case "ignoreTargetNode": break;
            default:
                throw new Error("Unknown renderMode: " + renderMode);
        }

        if (haveAddedNodesToParent) {
            activateBindingsOnContinuousNodeArray(renderedNodesArray, bindingContext);
            if (options['afterRender'])
                ko.dependencyDetection.ignore(options['afterRender'], null, [renderedNodesArray, bindingContext['$data']]);
        }

        return renderedNodesArray;
    }

    function resolveTemplateName(template, data, context) {
        // The template can be specified as:
        if (ko.isObservable(template)) {
            // 1. An observable, with string value
            return template();
        } else if (typeof template === 'function') {
            // 2. A function of (data, context) returning a string
            return template(data, context);
        } else {
            // 3. A string
            return template;
        }
    }

    ko.renderTemplate = function (template, dataOrBindingContext, options, targetNodeOrNodeArray, renderMode) {
        options = options || {};
        if ((options['templateEngine'] || _templateEngine) == undefined)
            throw new Error("Set a template engine before calling renderTemplate");
        renderMode = renderMode || "replaceChildren";

        if (targetNodeOrNodeArray) {
            var firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);

            var whenToDispose = function () { return (!firstTargetNode) || !ko.utils.domNodeIsAttachedToDocument(firstTargetNode); }; // Passive disposal (on next evaluation)
            var activelyDisposeWhenNodeIsRemoved = (firstTargetNode && renderMode == "replaceNode") ? firstTargetNode.parentNode : firstTargetNode;

            return ko.dependentObservable( // So the DOM is automatically updated when any dependency changes
                function () {
                    // Ensure we've got a proper binding context to work with
                    var bindingContext = (dataOrBindingContext && (dataOrBindingContext instanceof ko.bindingContext))
                        ? dataOrBindingContext
                        : new ko.bindingContext(ko.utils.unwrapObservable(dataOrBindingContext));

                    var templateName = resolveTemplateName(template, bindingContext['$data'], bindingContext),
                        renderedNodesArray = executeTemplate(targetNodeOrNodeArray, renderMode, templateName, bindingContext, options);

                    if (renderMode == "replaceNode") {
                        targetNodeOrNodeArray = renderedNodesArray;
                        firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
                    }
                },
                null,
                { disposeWhen: whenToDispose, disposeWhenNodeIsRemoved: activelyDisposeWhenNodeIsRemoved }
            );
        } else {
            // We don't yet have a DOM node to evaluate, so use a memo and render the template later when there is a DOM node
            return ko.memoization.memoize(function (domNode) {
                ko.renderTemplate(template, dataOrBindingContext, options, domNode, "replaceNode");
            });
        }
    };

    ko.renderTemplateForEach = function (template, arrayOrObservableArray, options, targetNode, parentBindingContext) {
        // Since setDomNodeChildrenFromArrayMapping always calls executeTemplateForArrayItem and then
        // activateBindingsCallback for added items, we can store the binding context in the former to use in the latter.
        var arrayItemContext;

        // This will be called by setDomNodeChildrenFromArrayMapping to get the nodes to add to targetNode
        var executeTemplateForArrayItem = function (arrayValue, index) {
            // Support selecting template as a function of the data being rendered
            arrayItemContext = parentBindingContext['createChildContext'](arrayValue, options['as'], function(context) {
                context['$index'] = index;
            });

            var templateName = resolveTemplateName(template, arrayValue, arrayItemContext);
            return executeTemplate(null, "ignoreTargetNode", templateName, arrayItemContext, options);
        }

        // This will be called whenever setDomNodeChildrenFromArrayMapping has added nodes to targetNode
        var activateBindingsCallback = function(arrayValue, addedNodesArray, index) {
            activateBindingsOnContinuousNodeArray(addedNodesArray, arrayItemContext);
            if (options['afterRender'])
                options['afterRender'](addedNodesArray, arrayValue);

            // release the "cache" variable, so that it can be collected by
            // the GC when its value isn't used from within the bindings anymore.
            arrayItemContext = null;
        };

        return ko.dependentObservable(function () {
            var unwrappedArray = ko.utils.unwrapObservable(arrayOrObservableArray) || [];
            if (typeof unwrappedArray.length == "undefined") // Coerce single value into array
                unwrappedArray = [unwrappedArray];

            // Filter out any entries marked as destroyed
            var filteredArray = ko.utils.arrayFilter(unwrappedArray, function(item) {
                return options['includeDestroyed'] || item === undefined || item === null || !ko.utils.unwrapObservable(item['_destroy']);
            });

            // Call setDomNodeChildrenFromArrayMapping, ignoring any observables unwrapped within (most likely from a callback function).
            // If the array items are observables, though, they will be unwrapped in executeTemplateForArrayItem and managed within setDomNodeChildrenFromArrayMapping.
            ko.dependencyDetection.ignore(ko.utils.setDomNodeChildrenFromArrayMapping, null, [targetNode, filteredArray, executeTemplateForArrayItem, options, activateBindingsCallback]);

        }, null, { disposeWhenNodeIsRemoved: targetNode });
    };

    var templateComputedDomDataKey = ko.utils.domData.nextKey();
    function disposeOldComputedAndStoreNewOne(element, newComputed) {
        var oldComputed = ko.utils.domData.get(element, templateComputedDomDataKey);
        if (oldComputed && (typeof(oldComputed.dispose) == 'function'))
            oldComputed.dispose();
        ko.utils.domData.set(element, templateComputedDomDataKey, (newComputed && newComputed.isActive()) ? newComputed : undefined);
    }

    ko.bindingHandlers['template'] = {
        'init': function(element, valueAccessor) {
            // Support anonymous templates
            var bindingValue = ko.utils.unwrapObservable(valueAccessor());
            if (typeof bindingValue == "string" || bindingValue['name']) {
                // It's a named template - clear the element
                ko.virtualElements.emptyNode(element);
            } else if ('nodes' in bindingValue) {
                // We've been given an array of DOM nodes. Save them as the template source.
                // There is no known use case for the node array being an observable array (if the output
                // varies, put that behavior *into* your template - that's what templates are for), and
                // the implementation would be a mess, so assert that it's not observable.
                var nodes = bindingValue['nodes'] || [];
                if (ko.isObservable(nodes)) {
                    throw new Error('The "nodes" option must be a plain, non-observable array.');
                }
                var container = ko.utils.moveCleanedNodesToContainerElement(nodes); // This also removes the nodes from their current parent
                new ko.templateSources.anonymousTemplate(element)['nodes'](container);
            } else {
                // It's an anonymous template - store the element contents, then clear the element
                var templateNodes = ko.virtualElements.childNodes(element),
                    container = ko.utils.moveCleanedNodesToContainerElement(templateNodes); // This also removes the nodes from their current parent
                new ko.templateSources.anonymousTemplate(element)['nodes'](container);
            }
            return { 'controlsDescendantBindings': true };
        },
        'update': function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var value = valueAccessor(),
                dataValue,
                options = ko.utils.unwrapObservable(value),
                shouldDisplay = true,
                templateComputed = null,
                templateName;

            if (typeof options == "string") {
                templateName = value;
                options = {};
            } else {
                templateName = options['name'];

                // Support "if"/"ifnot" conditions
                if ('if' in options)
                    shouldDisplay = ko.utils.unwrapObservable(options['if']);
                if (shouldDisplay && 'ifnot' in options)
                    shouldDisplay = !ko.utils.unwrapObservable(options['ifnot']);

                dataValue = ko.utils.unwrapObservable(options['data']);
            }

            if ('foreach' in options) {
                // Render once for each data point (treating data set as empty if shouldDisplay==false)
                var dataArray = (shouldDisplay && options['foreach']) || [];
                templateComputed = ko.renderTemplateForEach(templateName || element, dataArray, options, element, bindingContext);
            } else if (!shouldDisplay) {
                ko.virtualElements.emptyNode(element);
            } else {
                // Render once for this single data point (or use the viewModel if no data was provided)
                var innerBindingContext = ('data' in options) ?
                    bindingContext['createChildContext'](dataValue, options['as']) :  // Given an explitit 'data' value, we create a child binding context for it
                    bindingContext;                                                        // Given no explicit 'data' value, we retain the same binding context
                templateComputed = ko.renderTemplate(templateName || element, innerBindingContext, options, element);
            }

            // It only makes sense to have a single template computed per element (otherwise which one should have its output displayed?)
            disposeOldComputedAndStoreNewOne(element, templateComputed);
        }
    };

    // Anonymous templates can't be rewritten. Give a nice error message if you try to do it.
    ko.expressionRewriting.bindingRewriteValidators['template'] = function(bindingValue) {
        var parsedBindingValue = ko.expressionRewriting.parseObjectLiteral(bindingValue);

        if ((parsedBindingValue.length == 1) && parsedBindingValue[0]['unknown'])
            return null; // It looks like a string literal, not an object literal, so treat it as a named template (which is allowed for rewriting)

        if (ko.expressionRewriting.keyValueArrayContainsKey(parsedBindingValue, "name"))
            return null; // Named templates can be rewritten, so return "no error"
        return "This template engine does not support anonymous templates nested within its templates";
    };

    ko.virtualElements.allowedBindings['template'] = true;
})();

ko.exportSymbol('setTemplateEngine', ko.setTemplateEngine);
ko.exportSymbol('renderTemplate', ko.renderTemplate);
// Go through the items that have been added and deleted and try to find matches between them.
ko.utils.findMovesInArrayComparison = function (left, right, limitFailedCompares) {
    if (left.length && right.length) {
        var failedCompares, l, r, leftItem, rightItem;
        for (failedCompares = l = 0; (!limitFailedCompares || failedCompares < limitFailedCompares) && (leftItem = left[l]); ++l) {
            for (r = 0; rightItem = right[r]; ++r) {
                if (leftItem['value'] === rightItem['value']) {
                    leftItem['moved'] = rightItem['index'];
                    rightItem['moved'] = leftItem['index'];
                    right.splice(r, 1);         // This item is marked as moved; so remove it from right list
                    failedCompares = r = 0;     // Reset failed compares count because we're checking for consecutive failures
                    break;
                }
            }
            failedCompares += r;
        }
    }
};

ko.utils.compareArrays = (function () {
    var statusNotInOld = 'added', statusNotInNew = 'deleted';

    // Simple calculation based on Levenshtein distance.
    function compareArrays(oldArray, newArray, options) {
        // For backward compatibility, if the third arg is actually a bool, interpret
        // it as the old parameter 'dontLimitMoves'. Newer code should use { dontLimitMoves: true }.
        options = (typeof options === 'boolean') ? { 'dontLimitMoves': options } : (options || {});
        oldArray = oldArray || [];
        newArray = newArray || [];

        if (oldArray.length < newArray.length)
            return compareSmallArrayToBigArray(oldArray, newArray, statusNotInOld, statusNotInNew, options);
        else
            return compareSmallArrayToBigArray(newArray, oldArray, statusNotInNew, statusNotInOld, options);
    }

    function compareSmallArrayToBigArray(smlArray, bigArray, statusNotInSml, statusNotInBig, options) {
        var myMin = Math.min,
            myMax = Math.max,
            editDistanceMatrix = [],
            smlIndex, smlIndexMax = smlArray.length,
            bigIndex, bigIndexMax = bigArray.length,
            compareRange = (bigIndexMax - smlIndexMax) || 1,
            maxDistance = smlIndexMax + bigIndexMax + 1,
            thisRow, lastRow,
            bigIndexMaxForRow, bigIndexMinForRow;

        for (smlIndex = 0; smlIndex <= smlIndexMax; smlIndex++) {
            lastRow = thisRow;
            editDistanceMatrix.push(thisRow = []);
            bigIndexMaxForRow = myMin(bigIndexMax, smlIndex + compareRange);
            bigIndexMinForRow = myMax(0, smlIndex - 1);
            for (bigIndex = bigIndexMinForRow; bigIndex <= bigIndexMaxForRow; bigIndex++) {
                if (!bigIndex)
                    thisRow[bigIndex] = smlIndex + 1;
                else if (!smlIndex)  // Top row - transform empty array into new array via additions
                    thisRow[bigIndex] = bigIndex + 1;
                else if (smlArray[smlIndex - 1] === bigArray[bigIndex - 1])
                    thisRow[bigIndex] = lastRow[bigIndex - 1];                  // copy value (no edit)
                else {
                    var northDistance = lastRow[bigIndex] || maxDistance;       // not in big (deletion)
                    var westDistance = thisRow[bigIndex - 1] || maxDistance;    // not in small (addition)
                    thisRow[bigIndex] = myMin(northDistance, westDistance) + 1;
                }
            }
        }

        var editScript = [], meMinusOne, notInSml = [], notInBig = [];
        for (smlIndex = smlIndexMax, bigIndex = bigIndexMax; smlIndex || bigIndex;) {
            meMinusOne = editDistanceMatrix[smlIndex][bigIndex] - 1;
            if (bigIndex && meMinusOne === editDistanceMatrix[smlIndex][bigIndex-1]) {
                notInSml.push(editScript[editScript.length] = {     // added
                    'status': statusNotInSml,
                    'value': bigArray[--bigIndex],
                    'index': bigIndex });
            } else if (smlIndex && meMinusOne === editDistanceMatrix[smlIndex - 1][bigIndex]) {
                notInBig.push(editScript[editScript.length] = {     // deleted
                    'status': statusNotInBig,
                    'value': smlArray[--smlIndex],
                    'index': smlIndex });
            } else {
                --bigIndex;
                --smlIndex;
                if (!options['sparse']) {
                    editScript.push({
                        'status': "retained",
                        'value': bigArray[bigIndex] });
                }
            }
        }

        // Set a limit on the number of consecutive non-matching comparisons; having it a multiple of
        // smlIndexMax keeps the time complexity of this algorithm linear.
        ko.utils.findMovesInArrayComparison(notInBig, notInSml, !options['dontLimitMoves'] && smlIndexMax * 10);

        return editScript.reverse();
    }

    return compareArrays;
})();

ko.exportSymbol('utils.compareArrays', ko.utils.compareArrays);
(function () {
    // Objective:
    // * Given an input array, a container DOM node, and a function from array elements to arrays of DOM nodes,
    //   map the array elements to arrays of DOM nodes, concatenate together all these arrays, and use them to populate the container DOM node
    // * Next time we're given the same combination of things (with the array possibly having mutated), update the container DOM node
    //   so that its children is again the concatenation of the mappings of the array elements, but don't re-map any array elements that we
    //   previously mapped - retain those nodes, and just insert/delete other ones

    // "callbackAfterAddingNodes" will be invoked after any "mapping"-generated nodes are inserted into the container node
    // You can use this, for example, to activate bindings on those nodes.

    function mapNodeAndRefreshWhenChanged(containerNode, mapping, valueToMap, callbackAfterAddingNodes, index) {
        // Map this array value inside a dependentObservable so we re-map when any dependency changes
        var mappedNodes = [];
        var dependentObservable = ko.dependentObservable(function() {
            var newMappedNodes = mapping(valueToMap, index, ko.utils.fixUpContinuousNodeArray(mappedNodes, containerNode)) || [];

            // On subsequent evaluations, just replace the previously-inserted DOM nodes
            if (mappedNodes.length > 0) {
                ko.utils.replaceDomNodes(mappedNodes, newMappedNodes);
                if (callbackAfterAddingNodes)
                    ko.dependencyDetection.ignore(callbackAfterAddingNodes, null, [valueToMap, newMappedNodes, index]);
            }

            // Replace the contents of the mappedNodes array, thereby updating the record
            // of which nodes would be deleted if valueToMap was itself later removed
            mappedNodes.length = 0;
            ko.utils.arrayPushAll(mappedNodes, newMappedNodes);
        }, null, { disposeWhenNodeIsRemoved: containerNode, disposeWhen: function() { return !ko.utils.anyDomNodeIsAttachedToDocument(mappedNodes); } });
        return { mappedNodes : mappedNodes, dependentObservable : (dependentObservable.isActive() ? dependentObservable : undefined) };
    }

    var lastMappingResultDomDataKey = ko.utils.domData.nextKey(),
        deletedItemDummyValue = ko.utils.domData.nextKey();

    ko.utils.setDomNodeChildrenFromArrayMapping = function (domNode, array, mapping, options, callbackAfterAddingNodes) {
        // Compare the provided array against the previous one
        array = array || [];
        options = options || {};
        var isFirstExecution = ko.utils.domData.get(domNode, lastMappingResultDomDataKey) === undefined;
        var lastMappingResult = ko.utils.domData.get(domNode, lastMappingResultDomDataKey) || [];
        var lastArray = ko.utils.arrayMap(lastMappingResult, function (x) { return x.arrayEntry; });
        var editScript = ko.utils.compareArrays(lastArray, array, options['dontLimitMoves']);

        // Build the new mapping result
        var newMappingResult = [];
        var lastMappingResultIndex = 0;
        var newMappingResultIndex = 0;

        var nodesToDelete = [];
        var itemsToProcess = [];
        var itemsForBeforeRemoveCallbacks = [];
        var itemsForMoveCallbacks = [];
        var itemsForAfterAddCallbacks = [];
        var mapData;

        function itemMovedOrRetained(editScriptIndex, oldPosition) {
            mapData = lastMappingResult[oldPosition];
            if (newMappingResultIndex !== oldPosition)
                itemsForMoveCallbacks[editScriptIndex] = mapData;
            // Since updating the index might change the nodes, do so before calling fixUpContinuousNodeArray
            mapData.indexObservable(newMappingResultIndex++);
            ko.utils.fixUpContinuousNodeArray(mapData.mappedNodes, domNode);
            newMappingResult.push(mapData);
            itemsToProcess.push(mapData);
        }

        function callCallback(callback, items) {
            if (callback) {
                for (var i = 0, n = items.length; i < n; i++) {
                    if (items[i]) {
                        ko.utils.arrayForEach(items[i].mappedNodes, function(node) {
                            callback(node, i, items[i].arrayEntry);
                        });
                    }
                }
            }
        }

        for (var i = 0, editScriptItem, movedIndex; editScriptItem = editScript[i]; i++) {
            movedIndex = editScriptItem['moved'];
            switch (editScriptItem['status']) {
                case "deleted":
                    if (movedIndex === undefined) {
                        mapData = lastMappingResult[lastMappingResultIndex];

                        // Stop tracking changes to the mapping for these nodes
                        if (mapData.dependentObservable) {
                            mapData.dependentObservable.dispose();
                            mapData.dependentObservable = undefined;
                        }

                        // Queue these nodes for later removal
                        if (ko.utils.fixUpContinuousNodeArray(mapData.mappedNodes, domNode).length) {
                            if (options['beforeRemove']) {
                                newMappingResult.push(mapData);
                                itemsToProcess.push(mapData);
                                if (mapData.arrayEntry === deletedItemDummyValue) {
                                    mapData = null;
                                } else {
                                    itemsForBeforeRemoveCallbacks[i] = mapData;
                                }
                            }
                            if (mapData) {
                                nodesToDelete.push.apply(nodesToDelete, mapData.mappedNodes);
                            }
                        }
                    }
                    lastMappingResultIndex++;
                    break;

                case "retained":
                    itemMovedOrRetained(i, lastMappingResultIndex++);
                    break;

                case "added":
                    if (movedIndex !== undefined) {
                        itemMovedOrRetained(i, movedIndex);
                    } else {
                        mapData = { arrayEntry: editScriptItem['value'], indexObservable: ko.observable(newMappingResultIndex++) };
                        newMappingResult.push(mapData);
                        itemsToProcess.push(mapData);
                        if (!isFirstExecution)
                            itemsForAfterAddCallbacks[i] = mapData;
                    }
                    break;
            }
        }

        // Store a copy of the array items we just considered so we can difference it next time
        ko.utils.domData.set(domNode, lastMappingResultDomDataKey, newMappingResult);

        // Call beforeMove first before any changes have been made to the DOM
        callCallback(options['beforeMove'], itemsForMoveCallbacks);

        // Next remove nodes for deleted items (or just clean if there's a beforeRemove callback)
        ko.utils.arrayForEach(nodesToDelete, options['beforeRemove'] ? ko.cleanNode : ko.removeNode);

        // Next add/reorder the remaining items (will include deleted items if there's a beforeRemove callback)
        for (var i = 0, nextNode = ko.virtualElements.firstChild(domNode), lastNode, node; mapData = itemsToProcess[i]; i++) {
            // Get nodes for newly added items
            if (!mapData.mappedNodes)
                ko.utils.extend(mapData, mapNodeAndRefreshWhenChanged(domNode, mapping, mapData.arrayEntry, callbackAfterAddingNodes, mapData.indexObservable));

            // Put nodes in the right place if they aren't there already
            for (var j = 0; node = mapData.mappedNodes[j]; nextNode = node.nextSibling, lastNode = node, j++) {
                if (node !== nextNode)
                    ko.virtualElements.insertAfter(domNode, node, lastNode);
            }

            // Run the callbacks for newly added nodes (for example, to apply bindings, etc.)
            if (!mapData.initialized && callbackAfterAddingNodes) {
                callbackAfterAddingNodes(mapData.arrayEntry, mapData.mappedNodes, mapData.indexObservable);
                mapData.initialized = true;
            }
        }

        // If there's a beforeRemove callback, call it after reordering.
        // Note that we assume that the beforeRemove callback will usually be used to remove the nodes using
        // some sort of animation, which is why we first reorder the nodes that will be removed. If the
        // callback instead removes the nodes right away, it would be more efficient to skip reordering them.
        // Perhaps we'll make that change in the future if this scenario becomes more common.
        callCallback(options['beforeRemove'], itemsForBeforeRemoveCallbacks);

        // Replace the stored values of deleted items with a dummy value. This provides two benefits: it marks this item
        // as already "removed" so we won't call beforeRemove for it again, and it ensures that the item won't match up
        // with an actual item in the array and appear as "retained" or "moved".
        for (i = 0; i < itemsForBeforeRemoveCallbacks.length; ++i) {
            if (itemsForBeforeRemoveCallbacks[i]) {
                itemsForBeforeRemoveCallbacks[i].arrayEntry = deletedItemDummyValue;
            }
        }

        // Finally call afterMove and afterAdd callbacks
        callCallback(options['afterMove'], itemsForMoveCallbacks);
        callCallback(options['afterAdd'], itemsForAfterAddCallbacks);
    }
})();

ko.exportSymbol('utils.setDomNodeChildrenFromArrayMapping', ko.utils.setDomNodeChildrenFromArrayMapping);
ko.nativeTemplateEngine = function () {
    this['allowTemplateRewriting'] = false;
}

ko.nativeTemplateEngine.prototype = new ko.templateEngine();
ko.nativeTemplateEngine.prototype.constructor = ko.nativeTemplateEngine;
ko.nativeTemplateEngine.prototype['renderTemplateSource'] = function (templateSource, bindingContext, options, templateDocument) {
    var useNodesIfAvailable = !(ko.utils.ieVersion < 9), // IE<9 cloneNode doesn't work properly
        templateNodesFunc = useNodesIfAvailable ? templateSource['nodes'] : null,
        templateNodes = templateNodesFunc ? templateSource['nodes']() : null;

    if (templateNodes) {
        return ko.utils.makeArray(templateNodes.cloneNode(true).childNodes);
    } else {
        var templateText = templateSource['text']();
        return ko.utils.parseHtmlFragment(templateText, templateDocument);
    }
};

ko.nativeTemplateEngine.instance = new ko.nativeTemplateEngine();
ko.setTemplateEngine(ko.nativeTemplateEngine.instance);

ko.exportSymbol('nativeTemplateEngine', ko.nativeTemplateEngine);
(function() {
    ko.jqueryTmplTemplateEngine = function () {
        // Detect which version of jquery-tmpl you're using. Unfortunately jquery-tmpl
        // doesn't expose a version number, so we have to infer it.
        // Note that as of Knockout 1.3, we only support jQuery.tmpl 1.0.0pre and later,
        // which KO internally refers to as version "2", so older versions are no longer detected.
        var jQueryTmplVersion = this.jQueryTmplVersion = (function() {
            if (!jQueryInstance || !(jQueryInstance['tmpl']))
                return 0;
            // Since it exposes no official version number, we use our own numbering system. To be updated as jquery-tmpl evolves.
            try {
                if (jQueryInstance['tmpl']['tag']['tmpl']['open'].toString().indexOf('__') >= 0) {
                    // Since 1.0.0pre, custom tags should append markup to an array called "__"
                    return 2; // Final version of jquery.tmpl
                }
            } catch(ex) { /* Apparently not the version we were looking for */ }

            return 1; // Any older version that we don't support
        })();

        function ensureHasReferencedJQueryTemplates() {
            if (jQueryTmplVersion < 2)
                throw new Error("Your version of jQuery.tmpl is too old. Please upgrade to jQuery.tmpl 1.0.0pre or later.");
        }

        function executeTemplate(compiledTemplate, data, jQueryTemplateOptions) {
            return jQueryInstance['tmpl'](compiledTemplate, data, jQueryTemplateOptions);
        }

        this['renderTemplateSource'] = function(templateSource, bindingContext, options, templateDocument) {
            templateDocument = templateDocument || document;
            options = options || {};
            ensureHasReferencedJQueryTemplates();

            // Ensure we have stored a precompiled version of this template (don't want to reparse on every render)
            var precompiled = templateSource['data']('precompiled');
            if (!precompiled) {
                var templateText = templateSource['text']() || "";
                // Wrap in "with($whatever.koBindingContext) { ... }"
                templateText = "{{ko_with $item.koBindingContext}}" + templateText + "{{/ko_with}}";

                precompiled = jQueryInstance['template'](null, templateText);
                templateSource['data']('precompiled', precompiled);
            }

            var data = [bindingContext['$data']]; // Prewrap the data in an array to stop jquery.tmpl from trying to unwrap any arrays
            var jQueryTemplateOptions = jQueryInstance['extend']({ 'koBindingContext': bindingContext }, options['templateOptions']);

            var resultNodes = executeTemplate(precompiled, data, jQueryTemplateOptions);
            resultNodes['appendTo'](templateDocument.createElement("div")); // Using "appendTo" forces jQuery/jQuery.tmpl to perform necessary cleanup work

            jQueryInstance['fragments'] = {}; // Clear jQuery's fragment cache to avoid a memory leak after a large number of template renders
            return resultNodes;
        };

        this['createJavaScriptEvaluatorBlock'] = function(script) {
            return "{{ko_code ((function() { return " + script + " })()) }}";
        };

        this['addTemplate'] = function(templateName, templateMarkup) {
            document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "<" + "/script>");
        };

        if (jQueryTmplVersion > 0) {
            jQueryInstance['tmpl']['tag']['ko_code'] = {
                open: "__.push($1 || '');"
            };
            jQueryInstance['tmpl']['tag']['ko_with'] = {
                open: "with($1) {",
                close: "} "
            };
        }
    };

    ko.jqueryTmplTemplateEngine.prototype = new ko.templateEngine();
    ko.jqueryTmplTemplateEngine.prototype.constructor = ko.jqueryTmplTemplateEngine;

    // Use this one by default *only if jquery.tmpl is referenced*
    var jqueryTmplTemplateEngineInstance = new ko.jqueryTmplTemplateEngine();
    if (jqueryTmplTemplateEngineInstance.jQueryTmplVersion > 0)
        ko.setTemplateEngine(jqueryTmplTemplateEngineInstance);

    ko.exportSymbol('jqueryTmplTemplateEngine', ko.jqueryTmplTemplateEngine);
})();
}));
}());
})();

},{}],2:[function(require,module,exports){
/*
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Vivliostyle Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Vivliostyle core 2016.2.0-pre.20160330130244
 */
(function(factory) {
    if (typeof define === "function" && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof module === "object") {
        // Node.js
        var enclosingObject = {};
        module.exports = factory(enclosingObject);
    } else if (typeof exports === "object") {
        // CommonJS
        var enclosingObject = {};
        exports = factory(enclosingObject);
    } else {
        // Attach to the window object
        factory(window);
    }
})(function(enclosingObject) {
    enclosingObject = enclosingObject || {};
    var n,ba=this;function ca(a,b){var c=a.split("."),d=("undefined"!==typeof enclosingObject&&enclosingObject?enclosingObject:window)||ba;c[0]in d||!d.execScript||d.execScript("var "+c[0]);for(var e;c.length&&(e=c.shift());)c.length||void 0===b?d[e]?d=d[e]:d=d[e]={}:d[e]=b}
function t(a,b){function c(){}c.prototype=b.prototype;a.Cd=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.ke=function(a,c,f){for(var g=Array(arguments.length-2),k=2;k<arguments.length;k++)g[k-2]=arguments[k];return b.prototype[c].apply(a,g)}};function da(a,b,c,d){d=d[b];if(!d)throw Error("unknown writing-mode: "+b);b=d[c||"ltr"];if(!b)throw Error("unknown direction: "+c);for(c=0;c<b.length;c++)if(d=b[c],d=a.replace(d.f,d.b),d!==a)return d;return a}function ea(a){var b=fa,c={};Object.keys(b).forEach(function(d){var e=c[d]={},f=b[d];Object.keys(f).forEach(function(b){e[b]=f[b].map(function(b){return{f:new RegExp("(-?)"+(a?b.I:b.J)+"(-?)"),b:"$1"+(a?b.J:b.I)+"$2"}})})});return c}
var fa={"horizontal-tb":{ltr:[{I:"inline-start",J:"left"},{I:"inline-end",J:"right"},{I:"block-start",J:"top"},{I:"block-end",J:"bottom"},{I:"inline-size",J:"width"},{I:"block-size",J:"height"}],rtl:[{I:"inline-start",J:"right"},{I:"inline-end",J:"left"},{I:"block-start",J:"top"},{I:"block-end",J:"bottom"},{I:"inline-size",J:"width"},{I:"block-size",J:"height"}]},"vertical-rl":{ltr:[{I:"inline-start",J:"top"},{I:"inline-end",J:"bottom"},{I:"block-start",J:"right"},{I:"block-end",J:"left"},{I:"inline-size",
J:"height"},{I:"block-size",J:"width"}],rtl:[{I:"inline-start",J:"bottom"},{I:"inline-end",J:"top"},{I:"block-start",J:"right"},{I:"block-end",J:"left"},{I:"inline-size",J:"height"},{I:"block-size",J:"width"}]},"vertical-lr":{ltr:[{I:"inline-start",J:"top"},{I:"inline-end",J:"bottom"},{I:"block-start",J:"left"},{I:"block-end",J:"right"},{I:"inline-size",J:"height"},{I:"block-size",J:"width"}],rtl:[{I:"inline-start",J:"bottom"},{I:"inline-end",J:"top"},{I:"block-start",J:"left"},{I:"block-end",J:"right"},
{I:"inline-size",J:"height"},{I:"block-size",J:"width"}]}},ga=ea(!0),ha=ea(!1),ia={"horizontal-tb":[{I:"line-left",J:"left"},{I:"line-right",J:"right"},{I:"over",J:"top"},{I:"under",J:"bottom"}],"vertical-rl":[{I:"line-left",J:"top"},{I:"line-right",J:"bottom"},{I:"over",J:"right"},{I:"under",J:"left"}],"vertical-lr":[{I:"line-left",J:"top"},{I:"line-right",J:"bottom"},{I:"over",J:"right"},{I:"under",J:"left"}]};var ja=!1,ka={ce:"ltr",de:"rtl"};ca("vivliostyle.constants.PageProgression",ka);ka.LTR="ltr";ka.RTL="rtl";var la={Dd:"left",Ed:"right"};ca("vivliostyle.constants.PageSide",la);la.LEFT="left";la.RIGHT="right";function na(a){var b=a.error,c=b&&(b.frameTrace||b.stack);a=[].concat(a.messages);b&&(0<a.length&&(a=a.concat(["\n"])),a=a.concat([b.toString()]),c&&(a=a.concat(["\n"]).concat(c)));return a}function oa(a){a=Array.b(a);var b=null;a[0]instanceof Error&&(b=a.shift());return{error:b,messages:a}}function pa(a){function b(a){return function(b){return a.apply(c,b)}}var c=a||console;this.f=b(c.debug||c.log);this.h=b(c.info||c.log);this.j=b(c.warn||c.log);this.g=b(c.error||c.log);this.d={}}
function qa(a,b,c){(a=a.d[b])&&a.forEach(function(a){a(c)})}function ra(a,b){var c=v,d=c.d[a];d||(d=c.d[a]=[]);d.push(b)}pa.prototype.debug=function(a){var b=oa(arguments);this.f(na(b));qa(this,1,b)};pa.prototype.e=function(a){var b=oa(arguments);this.h(na(b));qa(this,2,b)};pa.prototype.b=function(a){var b=oa(arguments);this.j(na(b));qa(this,3,b)};pa.prototype.error=function(a){var b=oa(arguments);this.g(na(b));qa(this,4,b)};var v=new pa;function sa(a){var b=a.match(/^([^#]*)/);return b?b[1]:a}var ua=window.location.href;
function va(a,b){if(!b||a.match(/^\w{2,}:/))return a.toLowerCase().match("^javascript:")?"#":a;b.match(/^\w{2,}:\/\/[^\/]+$/)&&(b+="/");var c;if(a.match(/^\/\//))return(c=b.match(/^(\w{2,}:)\/\//))?c[1]+a:a;if(a.match(/^\//))return(c=b.match(/^(\w{2,}:\/\/[^\/]+)\//))?c[1]+a:a;a.match(/^\.(\/|$)/)&&(a=a.substr(1));c=b;var d=c.match(/^([^#?]*)/);b=d?d[1]:c;if(a.match(/^\#/))return b+a;c=b.lastIndexOf("/");if(0>c)return a;for(d=b.substr(0,c+1)+a;;){c=d.indexOf("/../");if(0>=c)break;var e=d.lastIndexOf("/",
c-1);if(0>=e)break;d=d.substr(0,e)+d.substr(c+3)}return d.replace(/\/(\.\/)+/g,"/")}function wa(a){a=new RegExp("#(.*&)?"+xa(a)+"=([^#&]*)");return(a=window.location.href.match(a))?a[2]:null}function ya(a,b){var c=new RegExp("#(.*&)?"+xa("f")+"=([^#&]*)"),d=a.match(c);return d?(c=d[2].length,d=d.index+d[0].length-c,a.substr(0,d)+b+a.substr(d+c)):a.match(/#/)?a+"&f="+b:a+"#f="+b}function za(a){return null==a?a:a.toString()}function Aa(){this.b=[null]}
Aa.prototype.length=function(){return this.b.length-1};function Ba(){return Ca.replace(/-[a-z]/g,function(a){return a.substr(1).toUpperCase()})}var Da="-webkit- -moz- -ms- -o- -epub- ".split(" "),Ea;
a:{var Fa="transform transform-origin hyphens writing-mode text-orientation box-decoration-break column-count column-width column-rule-color column-rule-style column-rule-width font-kerning text-size-adjust line-break tab-size text-align-last text-justify word-break word-wrap text-decoration-color text-decoration-line text-decoration-skip text-decoration-style text-emphasis-color text-emphasis-position text-emphasis-style text-underline-position backface-visibility text-overflow text-combine text-combine-horizontal text-combine-upright text-orientation touch-action".split(" "),Ga=
{},Ha=document.createElement("span"),Ia=Ha.style,Ja=null;try{if(Ha.style.setProperty("-ms-transform-origin","0% 0%"),"0% 0%"==Ha.style.getPropertyValue("-ms-transform-origin")){for(var Ka=0;Ka<Fa.length;Ka++)Ga[Fa[Ka]]="-ms-"+Fa[Ka];Ea=Ga;break a}}catch(La){}for(Ka=0;Ka<Fa.length;Ka++){var Ma=Fa[Ka],Ca=null,Na=null;Ja&&(Ca=Ja+Ma,Na=Ba());if(!Na||null==Ia[Na])for(var Oa=0;Oa<Da.length&&(Ja=Da[Oa],Ca=Ja+Ma,Na=Ba(),null==Ia[Na]);Oa++);null!=Ia[Na]&&(Ga[Ma]=Ca)}Ea=Ga}var Pa=Ea;
function w(a,b,c){try{b=Pa[b]||b,"-ms-writing-mode"==b&&"vertical-rl"==c&&(c="tb-rl"),a&&a.style&&a.style.setProperty(b,c)}catch(d){v.b(d)}}function Qa(a,b,c){try{return a.style.getPropertyValue(Pa[b]||b)}catch(d){}return c||""}function Ra(){this.b=[]}Ra.prototype.append=function(a){this.b.push(a);return this};Ra.prototype.toString=function(){var a=this.b.join("");this.b=[a];return a};function Sa(a){return"\\"+a.charCodeAt(0).toString(16)+" "}
function Ta(a){return a.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g,Sa)}function Ua(a){return a.replace(/[\u0000-\u001F"]/g,Sa)}function Va(a){return a.replace(/[\s+&?=#\u007F-\uFFFF]+/g,encodeURIComponent)}function Wa(a){return!!a.match(/^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/)}function Xa(a){return"\\u"+(65536|a.charCodeAt(0)).toString(16).substr(1)}function xa(a){return a.replace(/[^-a-zA-Z0-9_]/g,Xa)}
function Ya(a){if(!a)throw"Assert failed";}function Za(a,b){for(var c=0,d=a;;){Ya(c<=d);Ya(0==c||!b(c-1));Ya(d==a||b(d));if(c==d)return c;var e=c+d>>1;b(e)?d=e:c=e+1}}function $a(a,b){return a-b}function ab(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&!c[f]&&(c[f]=e)}return c}var bb={};function cb(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&(c[f]?c[f].push(e):c[f]=[e])}return c}function db(a,b){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]=b(a[d],d);return c}
function eb(a,b){var c={},d;for(d in a)c[d]=b(a[d],d);return c}function fb(){this.e={}}function gb(a,b){var c=a.e[b.type];if(c){b.target=a;b.currentTarget=a;for(var d=0;d<c.length;d++)c[d](b)}}fb.prototype.addEventListener=function(a,b,c){c||((c=this.e[a])?c.push(b):this.e[a]=[b])};fb.prototype.removeEventListener=function(a,b,c){!c&&(a=this.e[a])&&(b=a.indexOf(b),0<=b&&a.splice(b,0))};var hb=null;
function ib(a){if(null==hb){var b=a.ownerDocument,c=b.createElement("div");c.style.position="absolute";c.style.top="0px";c.style.left="0px";c.style.width="100px";c.style.height="100px";c.style.overflow="hidden";c.style.lineHeight="16px";c.style.fontSize="16px";a.appendChild(c);var d=b.createElement("div");d.style.width="0px";d.style.height="14px";d.style.cssFloat="left";c.appendChild(d);d=b.createElement("div");d.style.width="50px";d.style.height="50px";d.style.cssFloat="left";d.style.clear="left";
c.appendChild(d);d=b.createTextNode("a a a a a a a a a a a a a a a a");c.appendChild(d);b=b.createRange();b.setStart(d,0);b.setEnd(d,1);hb=40>b.getBoundingClientRect().left;a.removeChild(c)}return hb}var jb=null;function kb(a){return 1==a.nodeType&&(a=a.getAttribute("id"))&&a.match(/^[-a-zA-Z_0-9.\u007F-\uFFFF]+$/)?a:null}function lb(a){return"^"+a}function mb(a){return a.substr(1)}function nb(a){return a?a.replace(/\^[\[\]\(\),=;^]/g,mb):a}
function ob(a){for(var b={};a;){var c=a.match(/^;([^;=]+)=(([^;]|\^;)*)/);if(!c)break;var d=c[1],e;a:{e=c[2];var f=[];do{var g=e.match(/^(\^,|[^,])*/),k=nb(g[0]);e=e.substr(g[0].length+1);if(!e&&!f.length){e=k;break a}f.push(k)}while(e);e=f}b[d]=e;a=a.substr(c[0].length)}return b}function pb(){}pb.prototype.e=function(a){a.append("!")};pb.prototype.f=function(){return!1};function qb(a,b,c){this.b=a;this.id=b;this.Va=c}
qb.prototype.e=function(a){a.append("/");a.append(this.b.toString());if(this.id||this.Va)a.append("["),this.id&&a.append(this.id),this.Va&&(a.append(";s="),a.append(this.Va)),a.append("]")};
qb.prototype.f=function(a){if(1!=a.ha.nodeType)throw Error("E_CFI_NOT_ELEMENT");var b=a.ha,c=b.children,d=c.length,e=Math.floor(this.b/2)-1;0>e||0==d?(c=b.firstChild,a.ha=c||b):(c=c[Math.min(e,d-1)],this.b&1&&((b=c.nextSibling)&&1!=b.nodeType?c=b:a.K=!0),a.ha=c);if(this.id&&(a.K||this.id!=kb(a.ha)))throw Error("E_CFI_ID_MISMATCH");a.Va=this.Va;return!0};function rb(a,b,c,d){this.offset=a;this.d=b;this.b=c;this.Va=d}
rb.prototype.f=function(a){if(0<this.offset&&!a.K){for(var b=this.offset,c=a.ha;;){var d=c.nodeType;if(1==d)break;var e=c.nextSibling;if(3<=d&&5>=d){d=c.textContent.length;if(b<=d)break;if(!e){b=d;break}b-=d}if(!e){b=0;break}c=e}a.ha=c;a.offset=b}a.Va=this.Va;return!0};
rb.prototype.e=function(a){a.append(":");a.append(this.offset.toString());if(this.d||this.b||this.Va){a.append("[");if(this.d||this.b)this.d&&a.append(this.d.replace(/[\[\]\(\),=;^]/g,lb)),a.append(","),this.b&&a.append(this.b.replace(/[\[\]\(\),=;^]/g,lb));this.Va&&(a.append(";s="),a.append(this.Va));a.append("]")}};function sb(){this.ka=null}
function tb(a,b){var c=b.match(/^#?epubcfi\((.*)\)$/);if(!c)throw Error("E_CFI_NOT_CFI");for(var d=c[1],e=0,f=[];;)switch(d.charAt(e)){case "/":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");var e=e+c[0].length,g=parseInt(c[1],10),k=c[3],c=ob(c[4]);f.push(new qb(g,k,za(c.s)));break;case ":":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[((([^\];,]|\^[\];,])*)(,(([^\];,]|\^[\];,])*))?)(;([^]]|\^\])*)?\])?/);
if(!c)throw Error("E_CFI_NUMBER_EXPECTED");e+=c[0].length;g=parseInt(c[1],10);(k=c[4])&&(k=nb(k));var h=c[7];h&&(h=nb(h));c=ob(c[10]);f.push(new rb(g,k,h,za(c.s)));break;case "!":e++;f.push(new pb);break;case "~":case "@":case "":a.ka=f;return;default:throw Error("E_CFI_PARSE_ERROR");}}function ub(a,b){for(var c={ha:b.documentElement,offset:0,K:!1,Va:null,Xb:null},d=0;d<a.ka.length;d++)if(!a.ka[d].f(c)){++d<a.ka.length&&(c.Xb=new sb,c.Xb.ka=a.ka.slice(d));break}return c}
sb.prototype.trim=function(a,b){return a.replace(/\s+/g," ").match(b?/^[ -\uD7FF\uE000-\uFFFF]{0,8}/:/[ -\uD7FF\uE000-\uFFFF]{0,8}$/)[0].replace(/^\s/,"").replace(/\s$/,"")};
function vb(a,b,c){for(var d=!1,e=null,f=[],g=b.parentNode,k="",h="";b;){switch(b.nodeType){case 3:case 4:case 5:var l=b.textContent,m=l.length;d?(c+=m,k||(k=l)):(c>m&&(c=m),d=!0,k=l.substr(0,c),h=l.substr(c));b=b.previousSibling;continue;case 8:b=b.previousSibling;continue}break}if(0<c||k||h)k=a.trim(k,!1),h=a.trim(h,!0),f.push(new rb(c,k,h,e)),e=null;for(;g&&g&&9!=g.nodeType;){c=d?null:kb(b);for(d=d?1:0;b;)1==b.nodeType&&(d+=2),b=b.previousSibling;f.push(new qb(d,c,e));e=null;b=g;g=g.parentNode;
d=!1}f.reverse();a.ka?(f.push(new pb),a.ka=f.concat(a.ka)):a.ka=f}sb.prototype.toString=function(){if(!this.ka)return"";var a=new Ra;a.append("epubcfi(");for(var b=0;b<this.ka.length;b++)this.ka[b].e(a);a.append(")");return a.toString()};function wb(a){a=a.substr(1);if(a.match(/^[^0-9a-fA-F\n\r]$/))return a;a=parseInt(a,16);return isNaN(a)?"":65535>=a?String.fromCharCode(a):1114111>=a?String.fromCharCode(55296|a>>10&1023,56320|a&1023):"\ufffd"}function xb(a){return a.replace(/\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,wb)}function yb(){this.type=0;this.b=!1;this.B=0;this.text="";this.position=0}
function zb(a,b){var c=Array(128),d;for(d=0;128>d;d++)c[d]=a;c[NaN]=35==a?35:72;for(d=0;d<b.length;d+=2)c[b[d]]=b[d+1];return c}var Ab=[72,72,72,72,72,72,72,72,72,1,1,72,1,1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,1,4,34,6,7,8,9,33,10,11,12,13,14,15,16,17,2,2,2,2,2,2,2,2,2,2,18,19,20,21,22,23,24,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,29,26,30,3,72,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,27,31,28,32,72];Ab[NaN]=80;
var Bb=[43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,52,43,43,43,43,39,43,43,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43,43,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,44,43,43,39,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43];Bb[NaN]=43;
var Cb=[72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,78,59,72,59,59,59,59,59,59,59,59,59,59,72,72,72,72,72,72,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,61,72,72,78,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,72,72,72,72];Bb[NaN]=43;
var Db=[35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,57,59,35,58,58,58,58,58,58,58,58,58,58,35,35,35,35,35,35,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,61,35,35,60,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,35,35,35,35];Db[NaN]=35;
var Eb=[45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,53,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,44,45,45,39,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45];Eb[NaN]=45;
var Fb=[37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,41,37,37,37,37,37,37,37,37,42,37,39,39,39,39,39,39,39,39,39,39,37,37,37,37,37,37,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,40,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,37];Fb[NaN]=37;
var Gb=[38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,41,38,38,38,38,38,38,38,38,38,38,39,39,39,39,39,39,39,39,39,39,38,38,38,38,38,38,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,40,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,38];Gb[NaN]=38;
var Hb=zb(35,[61,36]),Ib=zb(35,[58,77]),Jb=zb(35,[61,36,124,50]),Kb=zb(35,[38,51]),Lb=zb(35,[42,54]),Mb=zb(39,[42,55]),Nb=zb(54,[42,55,47,56]),Ob=zb(62,[62,56]),Pb=zb(35,[61,36,33,70]),Qb=zb(62,[45,71]),Rb=zb(63,[45,56]),Sb=zb(76,[9,72,10,72,13,72,32,72]),Tb=zb(39,[39,46,10,72,13,72,92,48]),Ub=zb(39,[34,46,10,72,13,72,92,49]),Vb=zb(39,[39,47,10,74,13,74,92,48]),Wb=zb(39,[34,47,10,74,13,74,92,49]),Xb=zb(64,[9,39,32,39,34,66,39,65,41,72,10,39,13,39]),Yb=zb(39,[41,67,9,79,10,79,13,79,32,79,92,75,40,
72,91,72,93,72,123,72,125,72,NaN,67]),Zb=zb(39,[39,68,10,74,13,74,92,75,NaN,67]),ac=zb(39,[34,68,10,74,13,74,92,75,NaN,67]),bc=zb(72,[9,39,10,39,13,39,32,39,41,69]);function cc(a,b){this.h=b;this.e=15;this.j=a;this.g=Array(this.e+1);this.b=-1;for(var c=this.position=this.d=this.f=0;c<=this.e;c++)this.g[c]=new yb}function x(a){a.f==a.d&&dc(a);return a.g[a.d]}function z(a,b){(a.f-a.d&a.e)<=b&&dc(a);return a.g[a.d+b&a.e]}function A(a){a.d=a.d+1&a.e}
function ec(a){if(0>a.b)throw Error("F_CSSTOK_BAD_CALL reset");a.d=a.b;a.b=-1}cc.prototype.error=function(a,b,c){this.h&&this.h.error(c,b)};
function dc(a){var b=a.f,c=0<=a.b?a.b:a.d,d=a.e;b>=c?c+=d:c--;if(c==b){if(0>a.b)throw Error("F_CSSTOK_INTERNAL");for(var b=2*(a.e+1)-1,c=Array(b+1),d=a.b,e=0;d!=a.f;)c[e]=a.g[d],d==a.d&&(a.d=e),d=d+1&a.e,e++;a.b=0;a.f=e;a.e=b;for(a.g=c;e<=b;)c[e++]=new yb;b=a.f;c=d=a.e}for(var e=Ab,f=a.j,g=a.position,k=a.g,h=0,l=0,m="",p=0,q=!1,u=k[b],r=-9;;){var y=f.charCodeAt(g);switch(e[y]||e[65]){case 72:h=51;m=isNaN(y)?"E_CSS_UNEXPECTED_EOF":"E_CSS_UNEXPECTED_CHAR";g++;break;case 1:g++;q=!0;continue;case 2:l=
g++;e=Fb;continue;case 3:h=1;l=g++;e=Bb;continue;case 4:l=g++;h=31;e=Hb;continue;case 33:h=2;l=++g;e=Tb;continue;case 34:h=2;l=++g;e=Ub;continue;case 6:l=++g;h=7;e=Bb;continue;case 7:l=g++;h=32;e=Hb;continue;case 8:l=g++;h=21;break;case 9:l=g++;h=32;e=Kb;continue;case 10:l=g++;h=10;break;case 11:l=g++;h=11;break;case 12:l=g++;h=36;e=Hb;continue;case 13:l=g++;h=23;break;case 14:l=g++;h=16;break;case 15:h=24;l=g++;e=Db;continue;case 16:l=g++;e=Cb;continue;case 78:l=g++;h=9;e=Bb;continue;case 17:l=g++;
h=19;e=Lb;continue;case 18:l=g++;h=18;e=Ib;continue;case 77:g++;h=50;break;case 19:l=g++;h=17;break;case 20:l=g++;h=38;e=Pb;continue;case 21:l=g++;h=39;e=Hb;continue;case 22:l=g++;h=37;e=Hb;continue;case 23:l=g++;h=22;break;case 24:l=++g;h=20;e=Bb;continue;case 25:l=g++;h=14;break;case 26:l=g++;h=15;break;case 27:l=g++;h=12;break;case 28:l=g++;h=13;break;case 29:r=l=g++;h=1;e=Sb;continue;case 30:l=g++;h=33;e=Hb;continue;case 31:l=g++;h=34;e=Jb;continue;case 32:l=g++;h=35;e=Hb;continue;case 35:break;
case 36:g++;h=h+41-31;break;case 37:h=5;p=parseInt(f.substring(l,g),10);break;case 38:h=4;p=parseFloat(f.substring(l,g));break;case 39:g++;continue;case 40:h=3;p=parseFloat(f.substring(l,g));l=g++;e=Bb;continue;case 41:h=3;p=parseFloat(f.substring(l,g));m="%";l=g++;break;case 42:g++;e=Gb;continue;case 43:m=f.substring(l,g);break;case 44:r=g++;e=Sb;continue;case 45:m=xb(f.substring(l,g));break;case 46:m=f.substring(l,g);g++;break;case 47:m=xb(f.substring(l,g));g++;break;case 48:r=g;g+=2;e=Vb;continue;
case 49:r=g;g+=2;e=Wb;continue;case 50:g++;h=25;break;case 51:g++;h=26;break;case 52:m=f.substring(l,g);if(1==h){g++;if("url"==m.toLowerCase()){e=Xb;continue}h=6}break;case 53:m=xb(f.substring(l,g));if(1==h){g++;if("url"==m.toLowerCase()){e=Xb;continue}h=6}break;case 54:e=Mb;g++;continue;case 55:e=Nb;g++;continue;case 56:e=Ab;g++;continue;case 57:e=Ob;g++;continue;case 58:h=5;e=Fb;g++;continue;case 59:h=4;e=Gb;g++;continue;case 60:h=1;e=Bb;g++;continue;case 61:h=1;e=Sb;r=g++;continue;case 62:g--;
break;case 63:g-=2;break;case 64:l=g++;e=Yb;continue;case 65:l=++g;e=Zb;continue;case 66:l=++g;e=ac;continue;case 67:h=8;m=xb(f.substring(l,g));g++;break;case 69:g++;break;case 70:e=Qb;g++;continue;case 71:e=Rb;g++;continue;case 79:if(8>g-r&&f.substring(r+1,g+1).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)){g++;continue}case 68:h=8;m=xb(f.substring(l,g));g++;e=bc;continue;case 74:g++;if(9>g-r&&f.substring(r+1,g).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/))continue;h=51;m="E_CSS_UNEXPECTED_NEWLINE";
break;case 73:if(9>g-r&&f.substring(r+1,g+1).match(/^[0-9a-fA-F]{0,6}[ \t]$/)){g++;continue}m=xb(f.substring(l,g));break;case 75:r=g++;continue;case 76:g++;e=Eb;continue;default:if(e!==Ab){h=51;m="E_CSS_UNEXPECTED_STATE";break}l=g;h=0}u.type=h;u.b=q;u.B=p;u.text=m;u.position=l;b++;if(b>=c)break;e=Ab;q=!1;u=k[b&d]}a.position=g;a.f=b&d};function fc(){return{fontFamily:"serif",lineHeight:1.25,margin:8,Jc:!0,Ec:25,Ic:!1,Qc:!1,Wa:!1,Fb:1,dd:{print:!0}}}function gc(a){return{fontFamily:a.fontFamily,lineHeight:a.lineHeight,margin:a.margin,Jc:a.Jc,Ec:a.Ec,Ic:a.Ic,Qc:a.Qc,Wa:a.Wa,Fb:a.Fb,dd:Object.Pb({},a.dd)}}var hc=fc(),ic={};function jc(a,b,c,d){a=Math.min((a-0)/c,(b-0)/d);return"matrix("+a+",0,0,"+a+",0,0)"}function kc(a){return'"'+Ua(a+"")+'"'}function lc(a){return Ta(a+"")}function mc(a,b){return a?Ta(a)+"."+Ta(b):Ta(b)}var nc=0;
function oc(a,b){this.parent=a;this.j="S"+nc++;this.children=[];this.b=new pc(this,0);this.d=new pc(this,1);this.g=new pc(this,!0);this.f=new pc(this,!1);a&&a.children.push(this);this.values={};this.l={};this.k={};this.h=b;if(!a){var c=this.k;c.floor=Math.floor;c.ceil=Math.ceil;c.round=Math.round;c.sqrt=Math.sqrt;c.min=Math.min;c.max=Math.max;c.letterbox=jc;c["css-string"]=kc;c["css-name"]=lc;c["typeof"]=function(a){return typeof a};qc(this,"page-width",function(){return this.lb()});qc(this,"page-height",
function(){return this.kb()});qc(this,"pref-font-family",function(){return this.R.fontFamily});qc(this,"pref-night-mode",function(){return this.R.Qc});qc(this,"pref-hyphenate",function(){return this.R.Jc});qc(this,"pref-margin",function(){return this.R.margin});qc(this,"pref-line-height",function(){return this.R.lineHeight});qc(this,"pref-column-width",function(){return this.R.Ec*this.fontSize});qc(this,"pref-horizontal",function(){return this.R.Ic});qc(this,"pref-spread-view",function(){return this.R.Wa})}}
function qc(a,b,c){a.values[b]=new rc(a,c,b)}function sc(a,b){a.values["page-number"]=b}function tc(a,b){a.k["has-content"]=b}var uc={px:1,"in":96,pt:4/3,pc:16,cm:96/2.54,mm:96/25.4,q:96/2.54/40,em:16,rem:16,ex:8,rex:8};function vc(a){switch(a){case "q":case "rem":case "rex":return!0;default:return!1}}
function wc(a,b,c,d){this.sa=b;this.Qa=c;this.D=null;this.lb=function(){return this.D?this.D:this.R.Wa?Math.floor(b/2)-this.R.Fb:b};this.A=null;this.kb=function(){return this.A?this.A:c};this.h=d;this.Z=null;this.fontSize=function(){return this.Z?this.Z:d};this.R=hc;this.u={}}function xc(a,b){a.u[b.j]={};for(var c=0;c<b.children.length;c++)xc(a,b.children[c])}
function yc(a,b,c){return"vw"==b?a.lb()/100:"vh"==b?a.kb()/100:"em"==b||"rem"==b?c?a.h:a.fontSize():"ex"==b||"rex"==b?uc.ex*(c?a.h:a.fontSize())/uc.em:uc[b]}function zc(a,b,c){do{var d=b.values[c];if(d||b.h&&(d=b.h.call(a,c,!1)))return d;b=b.parent}while(b);throw Error("Name '"+c+"' is undefined");}
function Ac(a,b,c,d,e){do{var f=b.l[c];if(f||b.h&&(f=b.h.call(a,c,!0)))return f;if(f=b.k[c]){if(e)return b.b;c=Array(d.length);for(e=0;e<d.length;e++)c[e]=d[e].evaluate(a);return new pc(b,f.apply(a,c))}b=b.parent}while(b);throw Error("Function '"+c+"' is undefined");}
function Bc(a,b,c){var d="",e=b.match(/^(min|max)-(.*)$/);e&&(d=e[1],b=e[2]);var f=e=null;switch(b){case "width":case "height":case "device-width":case "device-height":case "color":c&&(e=c.evaluate(a))}switch(b){case "width":f=a.lb();break;case "height":f=a.kb();break;case "device-width":f=window.screen.availWidth;break;case "device-height":f=window.screen.availHeight;break;case "color":f=window.screen.pixelDepth}if(null!=f&&null!=e)switch(d){case "min":return f>=e;case "max":return f<=e;default:return f==
e}else if(null!=f&&null==c)return 0!==f;return!1}function B(a){this.b=a;this.f="_"+nc++}n=B.prototype;n.toString=function(){var a=new Ra;this.la(a,0);return a.toString()};n.la=function(){throw Error("F_ABSTRACT");};n.Ma=function(){throw Error("F_ABSTRACT");};n.Ca=function(){return this};n.vb=function(a){return a===this};function Cc(a,b,c,d){var e=d[a.f];if(null!=e)return e===ic?!1:e;d[a.f]=ic;b=a.vb(b,c,d);return d[a.f]=b}
n.evaluate=function(a){var b;b=(b=a.u[this.b.j])?b[this.f]:void 0;if("undefined"!=typeof b)return b;b=this.Ma(a);var c=this.f,d=this.b,e=a.u[d.j];e||(e={},a.u[d.j]=e);return e[c]=b};n.gd=function(){return!1};function Dc(a,b){B.call(this,a);this.d=b}t(Dc,B);n=Dc.prototype;n.cd=function(){throw Error("F_ABSTRACT");};n.ed=function(){throw Error("F_ABSTRACT");};n.Ma=function(a){a=this.d.evaluate(a);return this.ed(a)};n.vb=function(a,b,c){return a===this||Cc(this.d,a,b,c)};
n.la=function(a,b){10<b&&a.append("(");a.append(this.cd());this.d.la(a,10);10<b&&a.append(")")};n.Ca=function(a,b){var c=this.d.Ca(a,b);return c===this.d?this:new this.constructor(this.b,c)};function C(a,b,c){B.call(this,a);this.d=b;this.e=c}t(C,B);n=C.prototype;n.ec=function(){throw Error("F_ABSTRACT");};n.Ba=function(){throw Error("F_ABSTRACT");};n.Sa=function(){throw Error("F_ABSTRACT");};n.Ma=function(a){var b=this.d.evaluate(a);a=this.e.evaluate(a);return this.Sa(b,a)};
n.vb=function(a,b,c){return a===this||Cc(this.d,a,b,c)||Cc(this.e,a,b,c)};n.la=function(a,b){var c=this.ec();c<=b&&a.append("(");this.d.la(a,c);a.append(this.Ba());this.e.la(a,c);c<=b&&a.append(")")};n.Ca=function(a,b){var c=this.d.Ca(a,b),d=this.e.Ca(a,b);return c===this.d&&d===this.e?this:new this.constructor(this.b,c,d)};function Ec(a,b,c){C.call(this,a,b,c)}t(Ec,C);Ec.prototype.ec=function(){return 1};function Fc(a,b,c){C.call(this,a,b,c)}t(Fc,C);Fc.prototype.ec=function(){return 2};
function Gc(a,b,c){C.call(this,a,b,c)}t(Gc,C);Gc.prototype.ec=function(){return 3};function Hc(a,b,c){C.call(this,a,b,c)}t(Hc,C);Hc.prototype.ec=function(){return 4};function Ic(a,b){Dc.call(this,a,b)}t(Ic,Dc);Ic.prototype.cd=function(){return"!"};Ic.prototype.ed=function(a){return!a};function Jc(a,b){Dc.call(this,a,b)}t(Jc,Dc);Jc.prototype.cd=function(){return"-"};Jc.prototype.ed=function(a){return-a};function Kc(a,b,c){C.call(this,a,b,c)}t(Kc,Ec);Kc.prototype.Ba=function(){return"&&"};
Kc.prototype.Ma=function(a){return this.d.evaluate(a)&&this.e.evaluate(a)};function Lc(a,b,c){C.call(this,a,b,c)}t(Lc,Kc);Lc.prototype.Ba=function(){return" and "};function Mc(a,b,c){C.call(this,a,b,c)}t(Mc,Ec);Mc.prototype.Ba=function(){return"||"};Mc.prototype.Ma=function(a){return this.d.evaluate(a)||this.e.evaluate(a)};function Nc(a,b,c){C.call(this,a,b,c)}t(Nc,Mc);Nc.prototype.Ba=function(){return", "};function Oc(a,b,c){C.call(this,a,b,c)}t(Oc,Fc);Oc.prototype.Ba=function(){return"<"};
Oc.prototype.Sa=function(a,b){return a<b};function Pc(a,b,c){C.call(this,a,b,c)}t(Pc,Fc);Pc.prototype.Ba=function(){return"<="};Pc.prototype.Sa=function(a,b){return a<=b};function Qc(a,b,c){C.call(this,a,b,c)}t(Qc,Fc);Qc.prototype.Ba=function(){return">"};Qc.prototype.Sa=function(a,b){return a>b};function Rc(a,b,c){C.call(this,a,b,c)}t(Rc,Fc);Rc.prototype.Ba=function(){return">="};Rc.prototype.Sa=function(a,b){return a>=b};function Sc(a,b,c){C.call(this,a,b,c)}t(Sc,Fc);Sc.prototype.Ba=function(){return"=="};
Sc.prototype.Sa=function(a,b){return a==b};function Tc(a,b,c){C.call(this,a,b,c)}t(Tc,Fc);Tc.prototype.Ba=function(){return"!="};Tc.prototype.Sa=function(a,b){return a!=b};function Uc(a,b,c){C.call(this,a,b,c)}t(Uc,Gc);Uc.prototype.Ba=function(){return"+"};Uc.prototype.Sa=function(a,b){return a+b};function Vc(a,b,c){C.call(this,a,b,c)}t(Vc,Gc);Vc.prototype.Ba=function(){return" - "};Vc.prototype.Sa=function(a,b){return a-b};function Wc(a,b,c){C.call(this,a,b,c)}t(Wc,Hc);Wc.prototype.Ba=function(){return"*"};
Wc.prototype.Sa=function(a,b){return a*b};function Xc(a,b,c){C.call(this,a,b,c)}t(Xc,Hc);Xc.prototype.Ba=function(){return"/"};Xc.prototype.Sa=function(a,b){return a/b};function Yc(a,b,c){C.call(this,a,b,c)}t(Yc,Hc);Yc.prototype.Ba=function(){return"%"};Yc.prototype.Sa=function(a,b){return a%b};function Zc(a,b,c){B.call(this,a);this.B=b;this.fa=c.toLowerCase()}t(Zc,B);Zc.prototype.la=function(a){a.append(this.B.toString());a.append(Ta(this.fa))};
Zc.prototype.Ma=function(a){return this.B*yc(a,this.fa,!1)};function $c(a,b){B.call(this,a);this.d=b}t($c,B);$c.prototype.la=function(a){a.append(this.d)};$c.prototype.Ma=function(a){return zc(a,this.b,this.d).evaluate(a)};$c.prototype.vb=function(a,b,c){return a===this||Cc(zc(b,this.b,this.d),a,b,c)};function ad(a,b,c){B.call(this,a);this.d=b;this.name=c}t(ad,B);ad.prototype.la=function(a){this.d&&a.append("not ");a.append(Ta(this.name))};
ad.prototype.Ma=function(a){var b=this.name;a="all"===b||!!a.R.dd[b];return this.d?!a:a};ad.prototype.vb=function(a,b,c){return a===this||Cc(this.value,a,b,c)};ad.prototype.gd=function(){return!0};function rc(a,b,c){B.call(this,a);this.Eb=b;this.d=c}t(rc,B);rc.prototype.la=function(a){a.append(this.d)};rc.prototype.Ma=function(a){return this.Eb.call(a)};function bd(a,b,c){B.call(this,a);this.e=b;this.d=c}t(bd,B);
bd.prototype.la=function(a){a.append(this.e);var b=this.d;a.append("(");for(var c=0;c<b.length;c++)c&&a.append(","),b[c].la(a,0);a.append(")")};bd.prototype.Ma=function(a){return Ac(a,this.b,this.e,this.d,!1).Ca(a,this.d).evaluate(a)};bd.prototype.vb=function(a,b,c){if(a===this)return!0;for(var d=0;d<this.d.length;d++)if(Cc(this.d[d],a,b,c))return!0;return Cc(Ac(b,this.b,this.e,this.d,!0),a,b,c)};
bd.prototype.Ca=function(a,b){for(var c,d=c=this.d,e=0;e<c.length;e++){var f=c[e].Ca(a,b);if(c!==d)d[e]=f;else if(f!==c[e]){for(var d=Array(c.length),g=0;g<e;g++)d[g]=c[g];d[e]=f}}c=d;return c===this.d?this:new bd(this.b,this.e,c)};function cd(a,b,c,d){B.call(this,a);this.d=b;this.g=c;this.e=d}t(cd,B);cd.prototype.la=function(a,b){0<b&&a.append("(");this.d.la(a,0);a.append("?");this.g.la(a,0);a.append(":");this.e.la(a,0);0<b&&a.append(")")};
cd.prototype.Ma=function(a){return this.d.evaluate(a)?this.g.evaluate(a):this.e.evaluate(a)};cd.prototype.vb=function(a,b,c){return a===this||Cc(this.d,a,b,c)||Cc(this.g,a,b,c)||Cc(this.e,a,b,c)};cd.prototype.Ca=function(a,b){var c=this.d.Ca(a,b),d=this.g.Ca(a,b),e=this.e.Ca(a,b);return c===this.d&&d===this.g&&e===this.e?this:new cd(this.b,c,d,e)};function pc(a,b){B.call(this,a);this.d=b}t(pc,B);
pc.prototype.la=function(a){switch(typeof this.d){case "number":case "boolean":a.append(this.d.toString());break;case "string":a.append('"');a.append(Ua(this.d));a.append('"');break;default:throw Error("F_UNEXPECTED_STATE");}};pc.prototype.Ma=function(){return this.d};function dd(a,b,c){B.call(this,a);this.name=b;this.value=c}t(dd,B);dd.prototype.la=function(a){a.append("(");a.append(Ua(this.name.name));a.append(":");this.value.la(a,0);a.append(")")};
dd.prototype.Ma=function(a){return Bc(a,this.name.name,this.value)};dd.prototype.vb=function(a,b,c){return a===this||Cc(this.value,a,b,c)};dd.prototype.Ca=function(a,b){var c=this.value.Ca(a,b);return c===this.value?this:new dd(this.b,this.name,c)};function ed(a,b){B.call(this,a);this.d=b}t(ed,B);ed.prototype.la=function(a){a.append("$");a.append(this.d.toString())};ed.prototype.Ca=function(a,b){var c=b[this.d];if(!c)throw Error("Parameter missing: "+this.d);return c};
function fd(a,b,c){return b===a.f||b===a.b||c==a.f||c==a.b?a.f:b===a.g||b===a.d?c:c===a.g||c===a.d?b:new Kc(a,b,c)}function D(a,b,c){return b===a.b?c:c===a.b?b:new Uc(a,b,c)}function E(a,b,c){return b===a.b?new Jc(a,c):c===a.b?b:new Vc(a,b,c)}function gd(a,b,c){return b===a.b||c===a.b?a.b:b===a.d?c:c===a.d?b:new Wc(a,b,c)}function hd(a,b,c){return b===a.b?a.b:c===a.d?b:new Xc(a,b,c)};var id={};function jd(){}n=jd.prototype;n.qb=function(a){for(var b=0;b<a.length;b++)a[b].T(this)};n.Yc=function(){throw Error("E_CSS_EMPTY_NOT_ALLOWED");};n.Zc=function(){throw Error("E_CSS_SLASH_NOT_ALLOWED");};n.bc=function(){throw Error("E_CSS_STR_NOT_ALLOWED");};n.pb=function(){throw Error("E_CSS_IDENT_NOT_ALLOWED");};n.Mb=function(){throw Error("E_CSS_NUMERIC_NOT_ALLOWED");};n.Lb=function(){throw Error("E_CSS_NUM_NOT_ALLOWED");};n.Kb=function(a){return this.Lb(a)};
n.xc=function(){throw Error("E_CSS_COLOR_NOT_ALLOWED");};n.cc=function(){throw Error("E_CSS_URL_NOT_ALLOWED");};n.$a=function(){throw Error("E_CSS_LIST_NOT_ALLOWED");};n.ob=function(){throw Error("E_CSS_COMMA_NOT_ALLOWED");};n.yb=function(){throw Error("E_CSS_FUNC_NOT_ALLOWED");};n.Jb=function(){throw Error("E_CSS_EXPR_NOT_ALLOWED");};function kd(){}t(kd,jd);n=kd.prototype;
n.qb=function(a){for(var b=null,c=0;c<a.length;c++){var d=a[c],e=d.T(this);if(b)b[c]=e;else if(d!==e){b=Array(a.length);for(d=0;d<c;d++)b[d]=a[d];b[c]=e}}return b||a};n.bc=function(a){return a};n.pb=function(a){return a};n.Zc=function(a){return a};n.Mb=function(a){return a};n.Lb=function(a){return a};n.Kb=function(a){return a};n.xc=function(a){return a};n.cc=function(a){return a};n.$a=function(a){var b=this.qb(a.values);return b===a.values?a:new ld(b)};
n.ob=function(a){var b=this.qb(a.values);return b===a.values?a:new md(b)};n.yb=function(a){var b=this.qb(a.values);return b===a.values?a:new nd(a.name,b)};n.Jb=function(a){return a};function od(){}n=od.prototype;n.toString=function(){var a=new Ra;this.ya(a,!0);return a.toString()};n.stringValue=function(){var a=new Ra;this.ya(a,!1);return a.toString()};n.ia=function(){throw Error("F_ABSTRACT");};n.ya=function(a){a.append("[error]")};n.fd=function(){return!1};n.Sb=function(){return!1};n.hd=function(){return!1};
n.xd=function(){return!1};n.Oc=function(){return!1};function pd(){if(G)throw Error("E_INVALID_CALL");}t(pd,od);pd.prototype.ia=function(a){return new pc(a,"")};pd.prototype.ya=function(){};pd.prototype.T=function(a){return a.Yc(this)};var G=new pd;function qd(){if(rd)throw Error("E_INVALID_CALL");}t(qd,od);qd.prototype.ia=function(a){return new pc(a,"/")};qd.prototype.ya=function(a){a.append("/")};qd.prototype.T=function(a){return a.Zc(this)};var rd=new qd;function sd(a){this.b=a}t(sd,od);
sd.prototype.ia=function(a){return new pc(a,this.b)};sd.prototype.ya=function(a,b){b?(a.append('"'),a.append(Ua(this.b)),a.append('"')):a.append(this.b)};sd.prototype.T=function(a){return a.bc(this)};function td(a){this.name=a;if(id[a])throw Error("E_INVALID_CALL");id[a]=this}t(td,od);td.prototype.ia=function(a){return new pc(a,this.name)};td.prototype.ya=function(a,b){b?a.append(Ta(this.name)):a.append(this.name)};td.prototype.T=function(a){return a.pb(this)};td.prototype.xd=function(){return!0};
function H(a){var b=id[a];b||(b=new td(a));return b}function I(a,b){this.B=a;this.fa=b.toLowerCase()}t(I,od);I.prototype.ia=function(a,b){return 0==this.B?a.b:b&&"%"==this.fa?100==this.B?b:new Wc(a,b,new pc(a,this.B/100)):new Zc(a,this.B,this.fa)};I.prototype.ya=function(a){a.append(this.B.toString());a.append(this.fa)};I.prototype.T=function(a){return a.Mb(this)};I.prototype.Sb=function(){return!0};function ud(a){this.B=a}t(ud,od);
ud.prototype.ia=function(a){return 0==this.B?a.b:1==this.B?a.d:new pc(a,this.B)};ud.prototype.ya=function(a){a.append(this.B.toString())};ud.prototype.T=function(a){return a.Lb(this)};ud.prototype.hd=function(){return!0};function vd(a){this.B=a}t(vd,ud);vd.prototype.T=function(a){return a.Kb(this)};function wd(a){this.b=a}t(wd,od);wd.prototype.ya=function(a){a.append("#");var b=this.b.toString(16);a.append("000000".substr(b.length));a.append(b)};wd.prototype.T=function(a){return a.xc(this)};
function xd(a){this.url=a}t(xd,od);xd.prototype.ya=function(a){a.append('url("');a.append(Ua(this.url));a.append('")')};xd.prototype.T=function(a){return a.cc(this)};function yd(a,b,c,d){var e=b.length;b[0].ya(a,d);for(var f=1;f<e;f++)a.append(c),b[f].ya(a,d)}function ld(a){this.values=a}t(ld,od);ld.prototype.ya=function(a,b){yd(a,this.values," ",b)};ld.prototype.T=function(a){return a.$a(this)};ld.prototype.Oc=function(){return!0};function md(a){this.values=a}t(md,od);
md.prototype.ya=function(a,b){yd(a,this.values,",",b)};md.prototype.T=function(a){return a.ob(this)};function nd(a,b){this.name=a;this.values=b}t(nd,od);nd.prototype.ya=function(a,b){a.append(Ta(this.name));a.append("(");yd(a,this.values,",",b);a.append(")")};nd.prototype.T=function(a){return a.yb(this)};function K(a){this.d=a}t(K,od);K.prototype.ia=function(){return this.d};K.prototype.ya=function(a){a.append("-epubx-expr(");this.d.la(a,0);a.append(")")};K.prototype.T=function(a){return a.Jb(this)};
K.prototype.fd=function(){return!0};function zd(a,b){if(a){if(a.Sb())return yc(b,a.fa,!1)*a.B;if(a.hd())return a.B}return 0}var Ad=H("absolute"),Bd=H("all"),Cd=H("always"),Dd=H("auto");H("avoid");
var Ed=H("block"),Fd=H("block-end"),Gd=H("block-start"),Hd=H("both"),Id=H("bottom"),Jd=H("crop"),Kd=H("cross"),Ld=H("exclusive"),Md=H("false"),Nd=H("flex"),Od=H("footnote"),Pd=H("hidden"),Qd=H("horizontal-tb"),Rd=H("inherit"),Sd=H("inline"),Td=H("inline-end"),Ud=H("inline-start"),Vd=H("landscape"),Wd=H("left"),Xd=H("list-item"),Yd=H("ltr"),Zd=H("none"),$d=H("normal"),ae=H("oeb-page-foot"),be=H("oeb-page-head"),ce=H("page"),de=H("relative"),ee=H("right"),fe=H("scale"),ge=H("static"),he=H("rtl");H("table");
var ie=H("table-row"),je=H("top"),ke=H("transparent"),le=H("vertical-lr"),me=H("vertical-rl"),ne=H("visible"),oe=H("true"),pe=new I(100,"%"),qe=new I(100,"vw"),re=new I(100,"vh"),se=new I(0,"px"),te={"font-size":1,color:2};function ue(a,b){return(te[a]||Number.MAX_VALUE)-(te[b]||Number.MAX_VALUE)};function ve(a,b,c,d){this.X=a;this.V=b;this.U=c;this.P=d}function we(a,b){this.x=a;this.y=b}function xe(){this.bottom=this.right=this.top=this.left=0}function ye(a,b,c,d){this.b=a;this.d=b;this.f=c;this.e=d}function ze(a,b,c,d){this.V=a;this.P=b;this.X=c;this.U=d;this.right=this.left=null}function Ae(a,b){return a.b.y-b.b.y||a.b.x-b.b.x}function Be(a){this.b=a}function Ce(a,b,c){a=a.b;for(var d=a.length,e=a[d-1],f=0;f<d;f++){var g=a[f];b.push(e.y<g.y?new ye(e,g,1,c):new ye(g,e,-1,c));e=g}}
function De(a,b,c){for(var d=[],e=0;e<a.b.length;e++){var f=a.b[e];d.push(new we(f.x+b,f.y+c))}return new Be(d)}function Ee(a,b,c,d){for(var e=[],f=0;20>f;f++){var g=2*f*Math.PI/20;e.push(new we(a+c*Math.sin(g),b+d*Math.cos(g)))}return new Be(e)}function Fe(a,b,c,d){return new Be([new we(a,b),new we(c,b),new we(c,d),new we(a,d)])}function Ge(a,b,c,d){this.x=a;this.e=b;this.b=c;this.d=d}
function He(a,b){var c=a.b.x+(a.d.x-a.b.x)*(b-a.b.y)/(a.d.y-a.b.y);if(isNaN(c))throw Error("Bad intersection");return c}function Ie(a,b,c,d){var e,f;b.d.y<c&&v.b("Error: inconsistent segment (1)");b.b.y<=c?(c=He(b,c),e=b.f):(c=b.b.x,e=0);b.d.y>=d?(d=He(b,d),f=b.f):(d=b.d.x,f=0);c<d?(a.push(new Ge(c,e,b.e,-1)),a.push(new Ge(d,f,b.e,1))):(a.push(new Ge(d,f,b.e,-1)),a.push(new Ge(c,e,b.e,1)))}
function Je(a,b,c){c=b+c;for(var d=Array(c),e=Array(c),f=0;f<=c;f++)d[f]=0,e[f]=0;for(var g=[],k=!1,h=a.length,l=0;l<h;l++){var m=a[l];d[m.b]+=m.e;e[m.b]+=m.d;for(var p=!1,f=0;f<b;f++)if(d[f]&&!e[f]){p=!0;break}if(p)for(f=b;f<=c;f++)if(d[f]||e[f]){p=!1;break}k!=p&&(g.push(m.x),k=p)}return g}function Ke(a,b){return b?Math.ceil(a/b)*b:a}function Le(a,b){return b?Math.floor(a/b)*b:a}function Me(a){return new we(a.y,-a.x)}function Ne(a){return new ve(a.V,-a.U,a.P,-a.X)}
function Oe(a){return new Be(db(a.b,Me))}
function Pe(a,b,c,d,e){e&&(a=Ne(a),b=db(b,Oe),c=db(c,Oe));e=b.length;var f=c?c.length:0,g=[],k=[],h,l,m;for(h=0;h<e;h++)Ce(b[h],k,h);for(h=0;h<f;h++)Ce(c[h],k,h+e);b=k.length;k.sort(Ae);for(c=0;k[c].e>=e;)c++;c=k[c].b.y;c>a.V&&g.push(new ze(a.V,c,a.U,a.U));h=0;for(var p=[];h<b&&(m=k[h]).b.y<c;)m.d.y>c&&p.push(m),h++;for(;h<b||0<p.length;){var q=a.P,u=Ke(Math.ceil(c+8),d);for(l=0;l<p.length&&q>u;l++)m=p[l],m.b.x==m.d.x?m.d.y<q&&(q=Math.max(Le(m.d.y,d),u)):m.b.x!=m.d.x&&(q=u);q>a.P&&(q=a.P);for(;h<
b&&(m=k[h]).b.y<q;)if(m.d.y<c)h++;else if(m.b.y<u){if(m.b.y!=m.d.y||m.b.y!=c)p.push(m),q=u;h++}else{l=Le(m.b.y,d);l<q&&(q=l);break}u=[];for(l=0;l<p.length;l++)Ie(u,p[l],c,q);u.sort(function(a,b){return a.x-b.x||a.d-b.d});u=Je(u,e,f);if(0==u.length)g.push(new ze(c,q,a.U,a.U));else{var r=0,y=a.X;for(l=0;l<u.length;l+=2){var J=Math.max(a.X,u[l]),W=Math.min(a.U,u[l+1])-J;W>r&&(r=W,y=J)}0==r?g.push(new ze(c,q,a.U,a.U)):g.push(new ze(c,q,Math.max(y,a.X),Math.min(y+r,a.U)))}if(q==a.P)break;c=q;for(l=p.length-
1;0<=l;l--)p[l].d.y<=q&&p.splice(l,1)}Qe(a,g);return g}function Qe(a,b){for(var c=b.length-1,d=new ze(a.P,a.P,a.X,a.U);0<=c;){var e=d,d=b[c];d.X==e.X&&d.U==e.U&&(e.V=d.V,b.splice(c,1),d=e);c--}}function Re(a,b){for(var c=0,d=a.length;c<d;){var e=Math.floor((c+d)/2);b>=a[e].P?c=e+1:d=e}return c}
function Se(a,b,c,d){for(var e=c.V,f=c.U-c.X,g=c.P-c.V,k=Re(b,e);;){var h=e+g;if(h>a.P)break;for(var l=a.X,m=a.U,p=k;p<b.length&&b[p].V<h;p++){var q=b[p];q.X>l&&(l=q.X);q.U<m&&(m=q.U)}if(l+f<=m||k>=b.length){"left"==d?(c.X=l,c.U=l+f):(c.X=m-f,c.U=m);c.P+=e-c.V;c.V=e;break}e=b[k].P;k++}}
function Te(a,b,c,d){for(var e=null,e=[new ze(c.V,c.P,c.X,c.U)];0<e.length&&e[0].P<=a.V;)e.shift();if(0!=e.length){e[0].V<a.V&&(e[0].V=a.V);c=0==b.length?a.V:b[b.length-1].P;c<a.P&&b.push(new ze(c,a.P,a.X,a.U));for(var f=Re(b,e[0].V),g=0;g<e.length;g++){var k=e[g];if(f==b.length)break;b[f].V<k.V&&(c=b[f],f++,b.splice(f,0,new ze(k.V,c.P,c.X,c.U)),c.P=k.V);for(;f<b.length&&(c=b[f++],c.P>k.P&&(b.splice(f,0,new ze(k.P,c.P,c.X,c.U)),c.P=k.P),k.X!=k.U&&("left"==d?c.X=k.U:c.U=k.X),c.P!=k.P););}Qe(a,b)}}
;function Ue(a){return String.fromCharCode(a>>>24&255,a>>>16&255,a>>>8&255,a&255)}
function Ve(a){var b=new Ra;b.append(a);var c=55-a.length&63;for(b.append("\u0080");0<c;)c--,b.append("\x00");b.append("\x00\x00\x00\x00");b.append(Ue(8*a.length));a=b.toString();for(var b=[1732584193,4023233417,2562383102,271733878,3285377520],c=[],d,e=0;e<a.length;e+=64){for(d=0;16>d;d++){var f=a.substr(e+4*d,4);c[d]=(f.charCodeAt(0)&255)<<24|(f.charCodeAt(1)&255)<<16|(f.charCodeAt(2)&255)<<8|f.charCodeAt(3)&255}for(;80>d;d++)f=c[d-3]^c[d-8]^c[d-14]^c[d-16],c[d]=f<<1|f>>>31;var f=b[0],g=b[1],k=
b[2],h=b[3],l=b[4],m;for(d=0;80>d;d++)m=20>d?(g&k|~g&h)+1518500249:40>d?(g^k^h)+1859775393:60>d?(g&k|g&h|k&h)+2400959708:(g^k^h)+3395469782,m+=(f<<5|f>>>27)+l+c[d],l=h,h=k,k=g<<30|g>>>2,g=f,f=m;b[0]=b[0]+f|0;b[1]=b[1]+g|0;b[2]=b[2]+k|0;b[3]=b[3]+h|0;b[4]=b[4]+l|0}return b}function We(a){a=Ve(a);for(var b=[],c=0;c<a.length;c++){var d=a[c];b.push(d>>>24&255,d>>>16&255,d>>>8&255,d&255)}return b}
function Xe(a){a=Ve(a);for(var b=new Ra,c=0;c<a.length;c++)b.append(Ue(a[c]));a=b.toString();b=new Ra;for(c=0;c<a.length;c++)b.append((a.charCodeAt(c)|256).toString(16).substr(1));return b.toString()};var Ye=null,Ze=null;function L(a){if(!Ye)throw Error("E_TASK_NO_CONTEXT");Ye.name||(Ye.name=a);var b=Ye;a=new $e(b,b.top,a);b.top=a;a.b=af;return a}function M(a){return new bf(a)}function cf(a,b,c){a=L(a);a.g=c;try{b(a)}catch(d){df(a.d,d,a)}return N(a)}function ef(a){var b=ff,c;Ye?c=Ye.d:(c=Ze)||(c=new gf(new hf));b(c,a,void 0)}var af=1;function hf(){}hf.prototype.currentTime=function(){return(new Date).valueOf()};function jf(a,b){return setTimeout(a,b)}
function gf(a){this.e=a;this.f=1;this.slice=25;this.h=0;this.d=new Aa;this.b=this.j=null;this.g=!1;this.O=0;Ze||(Ze=this)}
function kf(a){if(!a.g){var b=a.d.b[1].b,c=a.e.currentTime();if(null!=a.b){if(c+a.f>a.j)return;clearTimeout(a.b)}b-=c;b<=a.f&&(b=a.f);a.j=c+b;a.b=jf(function(){a.b=null;null!=a.b&&(clearTimeout(a.b),a.b=null);a.g=!0;try{var b=a.e.currentTime();for(a.h=b+a.slice;a.d.length();){var c=a.d.b[1];if(c.b>b)break;var f=a.d,g=f.b.pop(),k=f.b.length;if(1<k){for(var h=1;;){var l=2*h;if(l>=k)break;if(0<lf(f.b[l],g))l+1<k&&0<lf(f.b[l+1],f.b[l])&&l++;else if(l+1<k&&0<lf(f.b[l+1],g))l++;else break;f.b[h]=f.b[l];
h=l}f.b[h]=g}var h=c,m=h.d;h.d=null;m&&m.e==h&&(m.e=null,l=Ye,Ye=m,O(m.top,h.e),Ye=l);b=a.e.currentTime();if(b>=a.h)break}}catch(p){v.error(p)}a.g=!1;a.d.length()&&kf(a)},b)}}gf.prototype.Ua=function(a,b){var c=this.e.currentTime();a.O=this.O++;a.b=c+(b||0);a:{for(var c=this.d,d=c.b.length;1<d;){var e=Math.floor(d/2),f=c.b[e];if(0<lf(f,a)){c.b[d]=a;break a}c.b[d]=f;d=e}c.b[1]=a}kf(this)};
function ff(a,b,c){var d=new mf(a,c||"");d.top=new $e(d,null,"bootstrap");d.top.b=af;d.top.then(function(){function a(){d.h=!1;for(var b=0;b<d.g.length;b++){var c=d.g[b];try{c()}catch(e){v.error(e)}}}try{b().then(function(b){d.f=b;a()})}catch(c){df(d,c),a()}});c=Ye;Ye=d;a.Ua(nf(d.top,"bootstrap"));Ye=c;return d}function of(a){this.d=a;this.O=this.b=0;this.e=null}function lf(a,b){return b.b-a.b||b.O-a.O}of.prototype.Ua=function(a,b){this.e=a;this.d.d.Ua(this,b)};
function mf(a,b){this.d=a;this.name=b;this.g=[];this.b=null;this.h=!0;this.e=this.top=this.j=this.f=null}function pf(a,b){a.g.push(b)}mf.prototype.join=function(){var a=L("Task.join");if(this.h){var b=nf(a,this),c=this;pf(this,function(){b.Ua(c.f)})}else O(a,this.f);return N(a)};
function df(a,b,c){var d=b.frameTrace;if(!d){for(var d=b.stack?b.stack+"\n\t---- async ---\n":"",e=a.top;e;e=e.parent)d+="\t",d+=e.name,d+="\n";b.frameTrace=d}if(c){for(d=a.top;d&&d!=c;)d=d.parent;d==c&&(a.top=d)}for(a.b=b;a.top&&!a.top.g;)a.top=a.top.parent;a.top?(b=a.b,a.b=null,a.top.g(a.top,b)):a.b&&v.error(a.b,"Unhandled exception in task",a.name)}function bf(a){this.value=a}n=bf.prototype;n.then=function(a){a(this.value)};n.vc=function(a){return a(this.value)};n.Xc=function(a){return new bf(a)};
n.ra=function(a){O(a,this.value)};n.Aa=function(){return!1};n.fc=function(){return this.value};function qf(a){this.b=a}n=qf.prototype;n.then=function(a){this.b.then(a)};n.vc=function(a){if(this.Aa()){var b=new $e(this.b.d,this.b.parent,"AsyncResult.thenAsync");b.b=af;this.b.parent=b;this.b.then(function(c){a(c).then(function(a){O(b,a)})});return N(b)}return a(this.b.e)};n.Xc=function(a){return this.Aa()?this.vc(function(){return new bf(a)}):new bf(a)};
n.ra=function(a){this.Aa()?this.then(function(b){O(a,b)}):O(a,this.b.e)};n.Aa=function(){return this.b.b==af};n.fc=function(){if(this.Aa())throw Error("Result is pending");return this.b.e};function $e(a,b,c){this.d=a;this.parent=b;this.name=c;this.e=null;this.b=0;this.g=this.f=null}function rf(a){if(!Ye)throw Error("F_TASK_NO_CONTEXT");if(a!==Ye.top)throw Error("F_TASK_NOT_TOP_FRAME");}function N(a){return new qf(a)}
function O(a,b){rf(a);Ye.b||(a.e=b);a.b=2;var c=a.parent;Ye.top=c;if(a.f){try{a.f(b)}catch(d){df(a.d,d,c)}a.b=3}}$e.prototype.then=function(a){switch(this.b){case af:if(this.f)throw Error("F_TASK_FRAME_ALREADY_HAS_CALLBACK");this.f=a;break;case 2:var b=this.d,c=this.parent;try{a(this.e),this.b=3}catch(d){this.b=3,df(b,d,c)}break;case 3:throw Error("F_TASK_DEAD_FRAME");default:throw Error("F_TASK_UNEXPECTED_FRAME_STATE "+this.b);}};
function sf(){var a=L("Frame.timeSlice"),b=a.d.d;b.e.currentTime()>=b.h?(v.debug("-- time slice --"),nf(a).Ua(!0)):O(a,!0);return N(a)}function tf(a){function b(d){try{for(;d;){var e=a();if(e.Aa()){e.then(b);return}e.then(function(a){d=a})}O(c,!0)}catch(f){df(c.d,f,c)}}var c=L("Frame.loop");b(!0);return N(c)}function uf(a){var b=Ye;if(!b)throw Error("E_TASK_NO_CONTEXT");return tf(function(){var c;do c=new vf(b,b.top),b.top=c,c.b=af,a(c),c=N(c);while(!c.Aa()&&c.fc());return c})}
function nf(a,b){rf(a);if(a.d.e)throw Error("E_TASK_ALREADY_SUSPENDED");var c=new of(a.d);a.d.e=c;Ye=null;a.d.j=b||null;return c}function vf(a,b){$e.call(this,a,b,"loop")}t(vf,$e);function wf(a){O(a,!0)}function P(a){O(a,!1)};function xf(a,b,c,d,e){var f=L("ajax"),g=new XMLHttpRequest,k=nf(f,g),h={status:0,url:a,contentType:null,responseText:null,responseXML:null,lc:null};g.open(c||"GET",a,!0);b&&(g.responseType=b);g.onreadystatechange=function(){if(4===g.readyState){h.status=g.status;if(200==h.status||0==h.status)if(b&&"document"!==b||!g.responseXML){var c=g.response;b&&"text"!==b||"string"!=typeof c?c?"string"==typeof c?h.lc=yf([c]):h.lc=c:v.b("Unexpected empty success response for",a):h.responseText=c;if(c=g.getResponseHeader("Content-Type"))h.contentType=
c.replace(/(.*);.*$/,"$1")}else h.responseXML=g.responseXML,h.contentType=g.responseXML.contentType;k.Ua(h)}};try{d?(g.setRequestHeader("Content-Type",e||"text/plain; charset=UTF-8"),g.send(d)):g.send(null)}catch(l){v.b(l,"Error fetching "+a),k.Ua(h)}return N(f)}function yf(a){var b=window.WebKitBlobBuilder||window.MSBlobBuilder;if(b){for(var b=new b,c=0;c<a.length;c++)b.append(a[c]);return b.getBlob("application/octet-stream")}return new Blob(a,{type:"application/octet-stream"})}
function zf(a){var b=L("readBlob"),c=new FileReader,d=nf(b,c);c.addEventListener("load",function(){d.Ua(c.result)},!1);c.readAsArrayBuffer(a);return N(b)}function Af(a,b){this.H=a;this.type=b;this.g={};this.e={}}Af.prototype.load=function(a,b,c){a=sa(a);var d=this.g[a];return"undefined"!=typeof d?M(d):Bf(this.hc(a,b,c))};
function Cf(a,b,c,d){var e=L("fetch");xf(b,a.type).then(function(f){if(c&&400<=f.status)throw Error(d||"Failed to fetch required resource: "+b);a.H(f,a).then(function(c){delete a.e[b];a.g[b]=c;O(e,c)})});return N(e)}Af.prototype.hc=function(a,b,c){a=sa(a);if(this.g[a])return null;var d=this.e[a];if(!d){var e=this,d=new Df(function(){return Cf(e,a,b,c)},"Fetch "+a);e.e[a]=d;d.start()}return d};function Ef(a){a=a.responseText;return M(a?JSON.parse(a):null)};function Ff(a){var b=parseInt(a,16);if(isNaN(b))throw Error("E_CSS_COLOR");if(6==a.length)return new wd(b);if(3==a.length)return new wd(b&15|(b&15)<<4|(b&240)<<4|(b&240)<<8|(b&3840)<<8|(b&3840)<<12);throw Error("E_CSS_COLOR");}function Gf(a){this.d=a;this.Xa="Author"}n=Gf.prototype;n.Qb=function(){return null};n.W=function(){return this.d};n.error=function(){};n.Ib=function(a){this.Xa=a};n.fb=function(){};n.Dc=function(){};n.Vb=function(){};n.Wb=function(){};n.Kc=function(){};n.gc=function(){};
n.hb=function(){};n.Cc=function(){};n.Bc=function(){};n.Hc=function(){};n.Tb=function(){};n.eb=function(){};n.qc=function(){};n.Yb=function(){};n.uc=function(){};n.nc=function(){};n.tc=function(){};n.Hb=function(){};n.Wc=function(){};n.xb=function(){};n.oc=function(){};n.sc=function(){};n.rc=function(){};n.$b=function(){};n.Zb=function(){};n.na=function(){};n.Ya=function(){};n.ib=function(){};function Hf(a){switch(a.Xa){case "UA":return 0;case "User":return 100663296;default:return 83886080}}
function If(a){switch(a.Xa){case "UA":return 0;case "User":return 16777216;default:return 33554432}}function Jf(){Gf.call(this,null);this.e=[];this.b=null}t(Jf,Gf);function Kf(a,b){a.e.push(a.b);a.b=b}n=Jf.prototype;n.Qb=function(){return null};n.W=function(){return this.b.W()};n.error=function(a,b){this.b.error(a,b)};n.Ib=function(a){Gf.prototype.Ib.call(this,a);0<this.e.length&&(this.b=this.e[0],this.e=[]);this.b.Ib(a)};n.fb=function(a,b){this.b.fb(a,b)};n.Dc=function(a){this.b.Dc(a)};
n.Vb=function(a,b){this.b.Vb(a,b)};n.Wb=function(a,b){this.b.Wb(a,b)};n.Kc=function(a){this.b.Kc(a)};n.gc=function(a,b,c,d){this.b.gc(a,b,c,d)};n.hb=function(){this.b.hb()};n.Cc=function(){this.b.Cc()};n.Bc=function(){this.b.Bc()};n.Hc=function(){this.b.Hc()};n.Tb=function(){this.b.Tb()};n.eb=function(){this.b.eb()};n.qc=function(){this.b.qc()};n.Yb=function(a){this.b.Yb(a)};n.uc=function(){this.b.uc()};n.nc=function(){this.b.nc()};n.tc=function(){this.b.tc()};n.Hb=function(){this.b.Hb()};n.Wc=function(a){this.b.Wc(a)};
n.xb=function(a){this.b.xb(a)};n.oc=function(a){this.b.oc(a)};n.sc=function(){this.b.sc()};n.rc=function(a,b,c){this.b.rc(a,b,c)};n.$b=function(a,b,c){this.b.$b(a,b,c)};n.Zb=function(a,b,c){this.b.Zb(a,b,c)};n.na=function(){this.b.na()};n.Ya=function(a,b,c){this.b.Ya(a,b,c)};n.ib=function(){this.b.ib()};function Lf(a,b,c){Gf.call(this,a);this.F=c;this.D=0;this.aa=b}t(Lf,Gf);Lf.prototype.Qb=function(){return this.aa.Qb()};Lf.prototype.error=function(a){v.b(a)};Lf.prototype.na=function(){this.D++};
Lf.prototype.ib=function(){if(0==--this.D&&!this.F){var a=this.aa;a.b=a.e.pop()}};function Mf(a,b,c){Lf.call(this,a,b,c)}t(Mf,Lf);function Nf(a,b){a.error(b,a.Qb())}function Of(a,b){Nf(a,b);Kf(a.aa,new Lf(a.d,a.aa,!1))}n=Mf.prototype;n.eb=function(){Of(this,"E_CSS_UNEXPECTED_SELECTOR")};n.qc=function(){Of(this,"E_CSS_UNEXPECTED_FONT_FACE")};n.Yb=function(){Of(this,"E_CSS_UNEXPECTED_FOOTNOTE")};n.uc=function(){Of(this,"E_CSS_UNEXPECTED_VIEWPORT")};n.nc=function(){Of(this,"E_CSS_UNEXPECTED_DEFINE")};
n.tc=function(){Of(this,"E_CSS_UNEXPECTED_REGION")};n.Hb=function(){Of(this,"E_CSS_UNEXPECTED_PAGE")};n.xb=function(){Of(this,"E_CSS_UNEXPECTED_WHEN")};n.oc=function(){Of(this,"E_CSS_UNEXPECTED_FLOW")};n.sc=function(){Of(this,"E_CSS_UNEXPECTED_PAGE_TEMPLATE")};n.rc=function(){Of(this,"E_CSS_UNEXPECTED_PAGE_MASTER")};n.$b=function(){Of(this,"E_CSS_UNEXPECTED_PARTITION")};n.Zb=function(){Of(this,"E_CSS_UNEXPECTED_PARTITION_GROUP")};n.Ya=function(){this.error("E_CSS_UNEXPECTED_PROPERTY",this.Qb())};
var Pf=[],Qf=[],Q=[],Rf=[],Sf=[],Tf=[],Uf=[],R=[],Vf=[],Wf=[],Xf=[],Yf=[];Pf[1]=28;Pf[36]=29;Pf[7]=29;Pf[9]=29;Pf[14]=29;Pf[18]=29;Pf[20]=30;Pf[13]=27;Pf[0]=200;Qf[1]=46;Qf[0]=200;Sf[1]=2;Sf[36]=4;Sf[7]=6;Sf[9]=8;Sf[14]=10;Sf[18]=14;Q[37]=11;Q[23]=12;Q[35]=56;Q[1]=1;Q[36]=3;Q[7]=5;Q[9]=7;Q[14]=9;Q[12]=13;Q[18]=55;Q[50]=42;Q[16]=41;Rf[1]=2;Rf[36]=4;Rf[7]=6;Rf[9]=8;Rf[18]=14;Rf[50]=42;Rf[14]=10;Rf[12]=13;Tf[1]=15;Tf[7]=16;Tf[4]=17;Tf[5]=18;Tf[3]=19;Tf[2]=20;Tf[8]=21;Tf[16]=22;Tf[19]=23;Tf[6]=24;
Tf[11]=25;Tf[17]=26;Tf[13]=48;Tf[31]=47;Tf[23]=54;Tf[0]=44;Uf[1]=31;Uf[4]=32;Uf[5]=32;Uf[3]=33;Uf[2]=34;Uf[10]=40;Uf[6]=38;Uf[31]=36;Uf[24]=36;Uf[32]=35;R[1]=45;R[16]=37;R[37]=37;R[38]=37;R[47]=37;R[48]=37;R[39]=37;R[49]=37;R[26]=37;R[25]=37;R[23]=37;R[24]=37;R[19]=37;R[21]=37;R[36]=37;R[18]=37;R[22]=37;R[11]=39;R[12]=43;R[17]=49;Vf[0]=200;Vf[12]=50;Vf[13]=51;Vf[14]=50;Vf[15]=51;Vf[10]=50;Vf[11]=51;Vf[17]=53;Wf[0]=200;Wf[12]=50;Wf[13]=52;Wf[14]=50;Wf[15]=51;Wf[10]=50;Wf[11]=51;Wf[17]=53;Xf[0]=200;
Xf[12]=50;Xf[13]=51;Xf[14]=50;Xf[15]=51;Xf[10]=50;Xf[11]=51;Yf[11]=0;Yf[16]=0;Yf[22]=1;Yf[18]=1;Yf[26]=2;Yf[25]=2;Yf[38]=3;Yf[37]=3;Yf[48]=3;Yf[47]=3;Yf[39]=3;Yf[49]=3;Yf[41]=3;Yf[23]=4;Yf[24]=4;Yf[36]=5;Yf[19]=5;Yf[21]=5;Yf[0]=6;Yf[52]=2;function Zf(a,b,c,d){this.b=a;this.d=b;this.j=c;this.ea=d;this.u=[];this.H={};this.e=this.D=null;this.l=!1;this.g=2;this.w=null;this.A=!1;this.k=this.F=null;this.h=[];this.f=[];this.N=this.Z=!1}
function $f(a,b){for(var c=[],d=a.u;;){c.push(d[b++]);if(b==d.length)break;if(","!=d[b++])throw Error("Unexpected state");}return c}
function ag(a,b,c){var d=a.u,e=d.length,f;do f=d[--e];while("undefined"!=typeof f&&"string"!=typeof f);var g=d.length-(e+1);1<g&&d.splice(e+1,g,new ld(d.slice(e+1,d.length)));if(","==b)return null;e++;do f=d[--e];while("undefined"!=typeof f&&("string"!=typeof f||","==f));g=d.length-(e+1);if("("==f){if(")"!=b)return a.j.error("E_CSS_MISMATCHED_C_PAR",c),a.b=Wf,null;a=new nd(d[e-1],$f(a,e+1));d.splice(e-1,g+2,a);return null}return";"!=b||0<=e?(a.j.error("E_CSS_UNEXPECTED_VAL_END",c),a.b=Wf,null):1<
g?new md($f(a,e+1)):d[0]}function bg(a,b,c){a.b=a.e?Wf:Vf;a.j.error(b,c)}
function cg(a,b,c){for(var d=a.u,e=a.j,f=d.pop(),g;;){var k=d.pop();if(11==b){for(g=[f];16==k;)g.unshift(d.pop()),k=d.pop();if("string"==typeof k){if("{"==k){for(;2<=g.length;)a=g.shift(),c=g.shift(),a=new Nc(e.W(),a,c),g.unshift(a);d.push(new K(g[0]));return!0}if("("==k){b=d.pop();f=d.pop();f=new bd(e.W(),mc(f,b),g);b=0;continue}}if(10==k){f.gd()&&(f=new dd(e.W(),f,null));b=0;continue}}else if("string"==typeof k){d.push(k);break}if(0>k)if(-31==k)f=new Ic(e.W(),f);else if(-24==k)f=new Jc(e.W(),f);
else return bg(a,"F_UNEXPECTED_STATE",c),!1;else{if(Yf[b]>Yf[k]){d.push(k);break}g=d.pop();switch(k){case 26:f=new Kc(e.W(),g,f);break;case 52:f=new Lc(e.W(),g,f);break;case 25:f=new Mc(e.W(),g,f);break;case 38:f=new Oc(e.W(),g,f);break;case 37:f=new Qc(e.W(),g,f);break;case 48:f=new Pc(e.W(),g,f);break;case 47:f=new Rc(e.W(),g,f);break;case 39:case 49:f=new Sc(e.W(),g,f);break;case 41:f=new Tc(e.W(),g,f);break;case 23:f=new Uc(e.W(),g,f);break;case 24:f=new Vc(e.W(),g,f);break;case 36:f=new Wc(e.W(),
g,f);break;case 19:f=new Xc(e.W(),g,f);break;case 21:f=new Yc(e.W(),g,f);break;case 18:if(1<d.length)switch(d[d.length-1]){case 22:d.pop();f=new cd(e.W(),d.pop(),g,f);break;case 10:if(g.gd())f=new dd(e.W(),g,f);else return bg(a,"E_CSS_MEDIA_TEST",c),!1}else return bg(a,"E_CSS_EXPR_COND",c),!1;break;case 22:if(18!=b)return bg(a,"E_CSS_EXPR_COND",c),!1;case 10:return d.push(g),d.push(k),d.push(f),!1;default:return bg(a,"F_UNEXPECTED_STATE",c),!1}}}d.push(f);return!1}
function dg(a){for(var b=[];;){var c=x(a.d);switch(c.type){case 1:b.push(c.text);break;case 23:b.push("+");break;case 4:case 5:b.push(c.B);break;default:return b}A(a.d)}}
function eg(a){var b=!1,c=x(a.d);if(23===c.type)b=!0,A(a.d),c=x(a.d);else if(1===c.type&&("even"===c.text||"odd"===c.text))return A(a.d),[2,"odd"===c.text?1:0];switch(c.type){case 3:if(b&&0>c.B)break;case 1:if(b&&"-"===c.text.charAt(0))break;if("n"===c.text||"-n"===c.text){if(b&&c.b)break;b="-n"===c.text?-1:1;3===c.type&&(b=c.B);var d=0;A(a.d);var c=x(a.d),e=24===c.type,f=23===c.type||e;f&&(A(a.d),c=x(a.d));if(5===c.type){d=c.B;if(1/d===1/-0){if(d=0,f)break}else if(0>d){if(f)break}else if(0<=d&&!f)break;
A(a.d)}else if(f)break;return[b,e&&0<d?-d:d]}if("n-"===c.text||"-n-"===c.text){if(b&&c.b)break;b="-n-"===c.text?-1:1;3===c.type&&(b=c.B);A(a.d);c=x(a.d);if(5===c.type&&!(0>c.B||1/c.B===1/-0))return A(a.d),[b,c.B]}else{if(d=c.text.match(/^n(-[0-9]+)$/)){if(b&&c.b)break;A(a.d);return[3===c.type?c.B:1,parseInt(d[1],10)]}if(d=c.text.match(/^-n(-[0-9]+)$/))return A(a.d),[-1,parseInt(d[1],10)]}break;case 5:if(b&&(c.b||0>c.B))break;A(a.d);return[0,c.B]}return null}
function fg(a,b,c){a=a.j.W();if(!a)return null;c=c||a.g;if(b){b=b.split(/\s+/);for(var d=0;d<b.length;d++)switch(b[d]){case "vertical":c=fd(a,c,new Ic(a,new $c(a,"pref-horizontal")));break;case "horizontal":c=fd(a,c,new $c(a,"pref-horizontal"));break;case "day":c=fd(a,c,new Ic(a,new $c(a,"pref-night-mode")));break;case "night":c=fd(a,c,new $c(a,"pref-night-mode"));break;default:c=a.f}}return c===a.g?null:new K(c)}
function gg(a){switch(a.f[a.f.length-1]){case "[selector]":case "font-face":case "-epubx-flow":case "-epubx-viewport":case "-epubx-define":case "-adapt-footnote-area":return!0}return!1}
function hg(a,b,c,d,e){var f=a.j,g=a.d,k=a.u,h,l,m,p;e&&(a.g=2,a.u.push("{"));for(;0<b;--b)switch(h=x(g),a.b[h.type]){case 28:if(18!=z(g,1).type){gg(a)?(f.error("E_CSS_COLON_EXPECTED",z(g,1)),a.b=Wf):(a.b=Sf,f.eb());continue}l=z(g,2);if(!(l.b||1!=l.type&&6!=l.type)){if(0<=g.b)throw Error("F_CSSTOK_BAD_CALL mark");g.b=g.d}a.e=h.text;a.l=!1;A(g);A(g);a.b=Tf;k.splice(0,k.length);continue;case 46:if(18!=z(g,1).type){a.b=Wf;f.error("E_CSS_COLON_EXPECTED",z(g,1));continue}a.e=h.text;a.l=!1;A(g);A(g);a.b=
Tf;k.splice(0,k.length);continue;case 29:a.b=Sf;f.eb();continue;case 1:if(!h.b){a.b=Xf;f.error("E_CSS_SPACE_EXPECTED",h);continue}f.hb();case 2:if(34==z(g,1).type)if(A(g),A(g),m=a.H[h.text],null!=m)switch(h=x(g),h.type){case 1:f.fb(m,h.text);a.b=Q;A(g);break;case 36:f.fb(m,null);a.b=Q;A(g);break;default:a.b=Vf,f.error("E_CSS_NAMESPACE",h)}else a.b=Vf,f.error("E_CSS_UNDECLARED_PREFIX",h);else f.fb(a.D,h.text),a.b=Q,A(g);continue;case 3:if(!h.b){a.b=Xf;f.error("E_CSS_SPACE_EXPECTED",h);continue}f.hb();
case 4:if(34==z(g,1).type)switch(A(g),A(g),h=x(g),h.type){case 1:f.fb(null,h.text);a.b=Q;A(g);break;case 36:f.fb(null,null);a.b=Q;A(g);break;default:a.b=Vf,f.error("E_CSS_NAMESPACE",h)}else f.fb(a.D,null),a.b=Q,A(g);continue;case 5:h.b&&f.hb();case 6:f.Kc(h.text);a.b=Q;A(g);continue;case 7:h.b&&f.hb();case 8:f.Dc(h.text);a.b=Q;A(g);continue;case 55:h.b&&f.hb();case 14:A(g);h=x(g);a:switch(h.type){case 1:f.Vb(h.text,null);A(g);a.b=Q;continue;case 6:l=h.text;A(g);switch(l){case "lang":case "href-epub-type":if(h=
x(g),1===h.type){m=[h.text];A(g);break}else break a;case "nth-child":case "nth-of-type":case "nth-last-child":case "nth-last-of-type":if(m=eg(a))break;else break a;default:m=dg(a)}h=x(g);if(11==h.type){f.Vb(l,m);A(g);a.b=Q;continue}}f.error("E_CSS_PSEUDOCLASS_SYNTAX",h);a.b=Vf;continue;case 42:A(g);h=x(g);switch(h.type){case 1:f.Wb(h.text,null);a.b=Q;A(g);continue;case 6:if(l=h.text,A(g),m=dg(a),h=x(g),11==h.type){f.Wb(l,m);a.b=Q;A(g);continue}}f.error("E_CSS_PSEUDOELEM_SYNTAX",h);a.b=Vf;continue;
case 9:h.b&&f.hb();case 10:A(g);h=x(g);if(1==h.type)l=h.text,A(g);else if(36==h.type)l=null,A(g);else if(34==h.type)l="";else{a.b=Xf;f.error("E_CSS_ATTR",h);A(g);continue}h=x(g);if(34==h.type){m=l?a.H[l]:l;if(null==m){a.b=Xf;f.error("E_CSS_UNDECLARED_PREFIX",h);A(g);continue}A(g);h=x(g);if(1!=h.type){a.b=Xf;f.error("E_CSS_ATTR_NAME_EXPECTED",h);continue}l=h.text;A(g);h=x(g)}else m="";switch(h.type){case 39:case 45:case 44:case 43:case 42:case 46:case 50:p=h.type;A(g);h=x(g);break;case 15:f.gc(m,l,
0,null);a.b=Q;A(g);continue;default:a.b=Xf;f.error("E_CSS_ATTR_OP_EXPECTED",h);continue}switch(h.type){case 1:case 2:f.gc(m,l,p,h.text);A(g);h=x(g);break;default:a.b=Xf;f.error("E_CSS_ATTR_VAL_EXPECTED",h);continue}if(15!=h.type){a.b=Xf;f.error("E_CSS_ATTR",h);continue}a.b=Q;A(g);continue;case 11:f.Cc();a.b=Rf;A(g);continue;case 12:f.Bc();a.b=Rf;A(g);continue;case 56:f.Hc();a.b=Rf;A(g);continue;case 13:a.Z?(a.f.push("-epubx-region"),a.Z=!1):a.N?(a.f.push("page"),a.N=!1):a.f.push("[selector]");f.na();
a.b=Pf;A(g);continue;case 41:f.Tb();a.b=Sf;A(g);continue;case 15:k.push(H(h.text));A(g);continue;case 16:try{k.push(Ff(h.text))}catch(q){f.error("E_CSS_COLOR",h),a.b=Vf}A(g);continue;case 17:k.push(new ud(h.B));A(g);continue;case 18:k.push(new vd(h.B));A(g);continue;case 19:k.push(new I(h.B,h.text));A(g);continue;case 20:k.push(new sd(h.text));A(g);continue;case 21:k.push(new xd(va(h.text,a.ea)));A(g);continue;case 22:ag(a,",",h);k.push(",");A(g);continue;case 23:k.push(rd);A(g);continue;case 24:l=
h.text.toLowerCase();"-epubx-expr"==l?(a.b=Uf,a.g=0,k.push("{")):(k.push(l),k.push("("));A(g);continue;case 25:ag(a,")",h);A(g);continue;case 47:A(g);h=x(g);l=z(g,1);if(1==h.type&&"important"==h.text.toLowerCase()&&(17==l.type||0==l.type||13==l.type)){A(g);a.l=!0;continue}bg(a,"E_CSS_SYNTAX",h);continue;case 54:l=z(g,1);switch(l.type){case 4:case 3:case 5:if(!l.b){A(g);continue}}a.b===Tf&&0<=g.b?(ec(g),a.b=Sf,f.eb()):bg(a,"E_CSS_UNEXPECTED_PLUS",h);continue;case 26:A(g);case 48:g.b=-1;(l=ag(a,";",
h))&&a.e&&f.Ya(a.e,l,a.l);a.b=d?Qf:Pf;continue;case 44:A(g);g.b=-1;l=ag(a,";",h);if(c)return a.w=l,!0;a.e&&l&&f.Ya(a.e,l,a.l);if(d)return!0;bg(a,"E_CSS_SYNTAX",h);continue;case 31:l=z(g,1);9==l.type?(10!=z(g,2).type||z(g,2).b?(k.push(new $c(f.W(),mc(h.text,l.text))),a.b=R):(k.push(h.text,l.text,"("),A(g)),A(g)):(2==a.g||3==a.g?"not"==h.text.toLowerCase()?(A(g),k.push(new ad(f.W(),!0,l.text))):("only"==h.text.toLowerCase()&&(A(g),h=l),k.push(new ad(f.W(),!1,h.text))):k.push(new $c(f.W(),h.text)),a.b=
R);A(g);continue;case 38:k.push(null,h.text,"(");A(g);continue;case 32:k.push(new pc(f.W(),h.B));A(g);a.b=R;continue;case 33:l=h.text;"%"==l&&(l=a.e&&a.e.match(/height|^(top|bottom)$/)?"vh":"vw");k.push(new Zc(f.W(),h.B,l));A(g);a.b=R;continue;case 34:k.push(new pc(f.W(),h.text));A(g);a.b=R;continue;case 35:A(g);h=x(g);5!=h.type||h.b?bg(a,"E_CSS_SYNTAX",h):(k.push(new ed(f.W(),h.B)),A(g),a.b=R);continue;case 36:k.push(-h.type);A(g);continue;case 37:a.b=Uf;cg(a,h.type,h);k.push(h.type);A(g);continue;
case 45:"and"==h.text.toLowerCase()?(a.b=Uf,cg(a,52,h),k.push(52),A(g)):bg(a,"E_CSS_SYNTAX",h);continue;case 39:cg(a,h.type,h)&&(a.e?a.b=Tf:bg(a,"E_CSS_UNBALANCED_PAR",h));A(g);continue;case 43:cg(a,11,h)&&(a.e||3==a.g?bg(a,"E_CSS_UNEXPECTED_BRC",h):(1==a.g?f.xb(k.pop()):(h=k.pop(),f.xb(h)),a.f.push("media"),f.na(),a.b=Pf));A(g);continue;case 49:if(cg(a,11,h))if(a.e||3!=a.g)bg(a,"E_CSS_UNEXPECTED_SEMICOL",h);else return a.k=k.pop(),a.A=!0,a.b=Pf,A(g),!1;A(g);continue;case 40:k.push(h.type);A(g);continue;
case 27:a.b=Pf;A(g);f.ib();a.f.length&&a.f.pop();continue;case 30:l=h.text.toLowerCase();switch(l){case "import":A(g);h=x(g);if(2==h.type||8==h.type){a.F=h.text;A(g);h=x(g);if(17==h.type||0==h.type)return a.A=!0,A(g),!1;a.e=null;a.g=3;a.b=Uf;k.push("{");continue}f.error("E_CSS_IMPORT_SYNTAX",h);a.b=Vf;continue;case "namespace":A(g);h=x(g);switch(h.type){case 1:l=h.text;A(g);h=x(g);if((2==h.type||8==h.type)&&17==z(g,1).type){a.H[l]=h.text;A(g);A(g);continue}break;case 2:case 8:if(17==z(g,1).type){a.D=
h.text;A(g);A(g);continue}}f.error("E_CSS_NAMESPACE_SYNTAX",h);a.b=Vf;continue;case "charset":A(g);h=x(g);if(2==h.type&&17==z(g,1).type){l=h.text.toLowerCase();"utf-8"!=l&&"utf-16"!=l&&f.error("E_CSS_UNEXPECTED_CHARSET "+l,h);A(g);A(g);continue}f.error("E_CSS_CHARSET_SYNTAX",h);a.b=Vf;continue;case "font-face":case "-epubx-page-template":case "-epubx-define":case "-epubx-viewport":if(12==z(g,1).type){A(g);A(g);switch(l){case "font-face":f.qc();break;case "-epubx-page-template":f.sc();break;case "-epubx-define":f.nc();
break;case "-epubx-viewport":f.uc()}a.f.push(l);f.na();continue}break;case "-adapt-footnote-area":A(g);h=x(g);switch(h.type){case 12:A(g);f.Yb(null);a.f.push(l);f.na();continue;case 50:if(A(g),h=x(g),1==h.type&&12==z(g,1).type){l=h.text;A(g);A(g);f.Yb(l);a.f.push("-adapt-footnote-area");f.na();continue}}break;case "-epubx-region":A(g);f.tc();a.Z=!0;a.b=Sf;continue;case "page":A(g);f.Hb();a.N=!0;a.b=Rf;continue;case "top-left-corner":case "top-left":case "top-center":case "top-right":case "top-right-corner":case "right-top":case "right-middle":case "right-bottom":case "bottom-right-corner":case "bottom-right":case "bottom-center":case "bottom-left":case "bottom-left-corner":case "left-bottom":case "left-middle":case "left-top":A(g);
h=x(g);if(12==h.type){A(g);f.Wc(l);a.f.push(l);f.na();continue}break;case "-epubx-when":A(g);a.e=null;a.g=1;a.b=Uf;k.push("{");continue;case "media":A(g);a.e=null;a.g=2;a.b=Uf;k.push("{");continue;case "-epubx-flow":if(1==z(g,1).type&&12==z(g,2).type){f.oc(z(g,1).text);A(g);A(g);A(g);a.f.push(l);f.na();continue}break;case "-epubx-page-master":case "-epubx-partition":case "-epubx-partition-group":A(g);h=x(g);p=m=null;var u=[];1==h.type&&(m=h.text,A(g),h=x(g));18==h.type&&1==z(g,1).type&&(p=z(g,1).text,
A(g),A(g),h=x(g));for(;6==h.type&&"class"==h.text.toLowerCase()&&1==z(g,1).type&&11==z(g,2).type;)u.push(z(g,1).text),A(g),A(g),A(g),h=x(g);if(12==h.type){A(g);switch(l){case "-epubx-page-master":f.rc(m,p,u);break;case "-epubx-partition":f.$b(m,p,u);break;case "-epubx-partition-group":f.Zb(m,p,u)}a.f.push(l);f.na();continue}break;case "":f.error("E_CSS_UNEXPECTED_AT"+l,h);a.b=Xf;continue;default:f.error("E_CSS_AT_UNKNOWN "+l,h);a.b=Vf;continue}f.error("E_CSS_AT_SYNTAX "+l,h);a.b=Vf;continue;case 50:if(c||
d)return!0;a.h.push(h.type+1);A(g);continue;case 52:if(c||d)return!0;if(0==a.h.length){a.b=Pf;continue}case 51:0<a.h.length&&a.h[a.h.length-1]==h.type&&a.h.pop();0==a.h.length&&13==h.type&&(a.b=Pf);A(g);continue;case 53:if(c||d)return!0;0==a.h.length&&(a.b=Pf);A(g);continue;case 200:return!0;default:if(c||d)return!0;if(e)return cg(a,11,h)?(a.w=k.pop(),!0):!1;if(a.b===Tf&&0<=g.b){ec(g);a.b=Sf;f.eb();continue}if(a.b!==Vf&&a.b!==Xf&&a.b!==Wf){51==h.type?f.error(h.text,h):f.error("E_CSS_SYNTAX",h);a.b=
gg(a)?Wf:Xf;continue}A(g)}return!1}function ig(a){Gf.call(this,null);this.d=a}t(ig,Gf);ig.prototype.error=function(a){throw Error(a);};ig.prototype.W=function(){return this.d};
function jg(a,b,c,d,e){var f=L("parseStylesheet"),g=new Zf(Pf,a,b,c),k=null;e&&(k=kg(new cc(e,b),b,c));if(k=fg(g,d,k&&k.ia()))b.xb(k),b.na();tf(function(){for(;!hg(g,100,!1,!1,!1);){if(g.A){var a=va(g.F,c);g.k&&(b.xb(g.k),b.na());var d=L("parseStylesheet.import");lg(a,b,null,null).then(function(){g.k&&b.ib();g.A=!1;g.F=null;g.k=null;O(d,!0)});return N(d)}a=sf();if(a.Aa)return a}return M(!1)}).then(function(){k&&b.ib();O(f,!0)});return N(f)}
function mg(a,b,c,d,e){return cf("parseStylesheetFromText",function(f){var g=new cc(a,b);jg(g,b,c,d,e).ra(f)},function(b,c){v.b(c,"Failed to parse stylesheet text: "+a);O(b,!1)})}function lg(a,b,c,d){return cf("parseStylesheetFromURL",function(e){xf(a).then(function(f){f.responseText?mg(f.responseText,b,a,c,d).then(function(b){b||v.b("Failed to parse stylesheet from "+a);O(e,!0)}):O(e,!0)})},function(b,c){v.b(c,"Exception while fetching and parsing:",a);O(b,!0)})}
function ng(a,b){var c=new Zf(Tf,b,new ig(a),"");hg(c,Number.POSITIVE_INFINITY,!0,!1,!1);return c.w}function kg(a,b,c){a=new Zf(Uf,a,b,c);hg(a,Number.POSITIVE_INFINITY,!1,!1,!0);return a.w}var og={"z-index":!0,"column-count":!0,"flow-linger":!0,opacity:!0,page:!0,"flow-priority":!0,utilization:!0};
function pg(a,b,c){if(b.fd())a:{b=b.d;a=b.evaluate(a);switch(typeof a){case "number":c=og[c]?a==Math.round(a)?new vd(a):new ud(a):new I(a,"px");break a;case "string":c=a?ng(b.b,new cc(a,null)):G;break a;case "boolean":c=a?oe:Md;break a;case "undefined":c=G;break a}throw Error("E_UNEXPECTED");}else c=b;return c};function qg(){this.b={}}t(qg,jd);qg.prototype.pb=function(a){this.b[a.name]=!0;return a};qg.prototype.$a=function(a){this.qb(a.values);return a};function rg(a){this.value=a}t(rg,jd);rg.prototype.Kb=function(a){this.value=a.B;return a};function sg(a,b){if(a){var c=new rg(b);try{return a.T(c),c.value}catch(d){v.b(d,"toInt: ")}}return b}function tg(){this.d=!1;this.b=[];this.name=null}t(tg,jd);tg.prototype.Mb=function(a){this.d&&this.b.push(a);return null};
tg.prototype.Lb=function(a){this.d&&0==a.B&&this.b.push(new I(0,"px"));return null};tg.prototype.$a=function(a){this.qb(a.values);return null};tg.prototype.yb=function(a){this.d||(this.d=!0,this.qb(a.values),this.d=!1,this.name=a.name.toLowerCase());return null};
function ug(a,b,c,d,e,f){if(a){var g=new tg;try{a.T(g);var k;a:{if(0<g.b.length){a=[];for(var h=0;h<g.b.length;h++){var l=g.b[h];if("%"==l.fa){var m=0==h%2?d:e;3==h&&"circle"==g.name&&(m=Math.sqrt((d*d+e*e)/2));a.push(l.B*m/100)}else a.push(l.B*yc(f,l.fa,!1))}switch(g.name){case "polygon":if(0==a.length%2){f=[];for(g=0;g<a.length;g+=2)f.push({x:b+a[g],y:c+a[g+1]});k=new Be(f);break a}break;case "rectangle":if(4==a.length){k=Fe(b+a[0],c+a[1],b+a[0]+a[2],c+a[1]+a[3]);break a}break;case "ellipse":if(4==
a.length){k=Ee(b+a[0],c+a[1],a[2],a[3]);break a}break;case "circle":if(3==a.length){k=Ee(b+a[0],c+a[1],a[2],a[2]);break a}}}k=null}return k}catch(p){v.b(p,"toShape:")}}return Fe(b,c,b+d,c+e)}function vg(a){this.d=a;this.b={};this.name=null}t(vg,jd);vg.prototype.pb=function(a){this.name=a.toString();this.b[this.name]=this.d?0:(this.b[this.name]||0)+1;return a};vg.prototype.Kb=function(a){this.name&&(this.b[this.name]+=a.B-(this.d?0:1));return a};vg.prototype.$a=function(a){this.qb(a.values);return a};
function wg(a,b){var c=new vg(b);try{a.T(c)}catch(d){v.b(d,"toCounters:")}return c.b};function Df(a,b){this.hc=a;this.name=b;this.d=!1;this.b=this.f=null;this.e=[]}Df.prototype.start=function(){if(!this.b){var a=this;this.b=ff(Ye.d,function(){var b=L("Fetcher.run");a.hc().then(function(c){var d=a.e;a.d=!0;a.f=c;a.b=null;a.e=[];if(d)for(var e=0;e<d.length;e++)try{d[e](c)}catch(f){v.error(f,"Error:")}O(b,c)});return N(b)},this.name)}};function xg(a,b){a.d?b(a.f):a.e.push(b)}function Bf(a){if(a.d)return M(a.f);a.start();return a.b.join()}
function yg(a){if(0==a.length)return M(!0);if(1==a.length)return Bf(a[0]).Xc(!0);var b=L("waitForFetches"),c=0;tf(function(){for(;c<a.length;){var b=a[c++];if(!b.d)return Bf(b).Xc(!0)}return M(!1)}).then(function(){O(b,!0)});return N(b)}
function zg(a,b){var c=null,d=null;"img"==a.localName&&(c=a.getAttribute("width"),d=a.getAttribute("height"));var e=new Df(function(){function e(b){"img"==a.localName&&(c||a.removeAttribute("width"),d||a.removeAttribute("height"));k.Ua(b?b.type:"timeout")}var g=L("loadImage"),k=nf(g,a);a.addEventListener("load",e,!1);a.addEventListener("error",e,!1);a.addEventListener("abort",e,!1);"http://www.w3.org/2000/svg"==a.namespaceURI?(a.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",b),setTimeout(e,
300)):a.src=b;return N(g)},"loadElement "+b);e.start();return e};function Ag(a){this.f=this.e=null;this.b=0;this.d=a}function Bg(a,b){this.b=-1;this.d=a;this.e=b}function Cg(){this.b=[];this.d=[];this.match=[];this.e=[];this.error=[];this.f=!0}function Dg(a,b,c){for(var d=0;d<b.length;d++)a.d[b[d]].b=c;b.splice(0,b.length)}
Cg.prototype.clone=function(){for(var a=new Cg,b=0;b<this.b.length;b++){var c=this.b[b],d=new Ag(c.d);d.b=c.b;a.b.push(d)}for(b=0;b<this.d.length;b++)c=this.d[b],d=new Bg(c.d,c.e),d.b=c.b,a.d.push(d);a.match.push.apply(a.match,this.match);a.e.push.apply(a.e,this.e);a.error.push.apply(a.error,this.error);return a};
function Eg(a,b,c,d){var e=a.b.length,f=new Ag(Fg);f.b=0<=d?c?2*d+1:2*d+2:c?-1:-2;a.b.push(f);Dg(a,b,e);c=new Bg(e,!0);e=new Bg(e,!1);b.push(a.d.length);a.d.push(e);b.push(a.d.length);a.d.push(c)}function Gg(a){return 1==a.b.length&&0==a.b[0].b&&a.b[0].d instanceof Hg}
function Ig(a,b,c){if(0!=b.b.length){var d=a.b.length;if(4==c&&1==d&&Gg(b)&&Gg(a)){c=a.b[0].d;b=b.b[0].d;var d={},e={},f;for(f in c.d)d[f]=c.d[f];for(f in b.d)d[f]=b.d[f];for(var g in c.e)e[g]=c.e[g];for(g in b.e)e[g]=b.e[g];a.b[0].d=new Hg(c.b|b.b,d,e)}else{for(f=0;f<b.b.length;f++)a.b.push(b.b[f]);4==c?(a.f=!0,Dg(a,a.e,d)):Dg(a,a.match,d);g=a.d.length;for(f=0;f<b.d.length;f++)e=b.d[f],e.d+=d,0<=e.b&&(e.b+=d),a.d.push(e);for(f=0;f<b.match.length;f++)a.match.push(b.match[f]+g);3==c&&Dg(a,a.match,
d);if(2==c||3==c)for(f=0;f<b.e.length;f++)a.match.push(b.e[f]+g);else if(a.f){for(f=0;f<b.e.length;f++)a.e.push(b.e[f]+g);a.f=b.f}else for(f=0;f<b.e.length;f++)a.error.push(b.e[f]+g);for(f=0;f<b.error.length;f++)a.error.push(b.error[f]+g);b.b=null;b.d=null}}}var S={};function Jg(){}t(Jg,jd);Jg.prototype.f=function(a,b){var c=a[b].T(this);return c?[c]:null};function Hg(a,b,c){this.b=a;this.d=b;this.e=c}t(Hg,Jg);n=Hg.prototype;n.Yc=function(a){return this.b&1?a:null};
n.Zc=function(a){return this.b&2048?a:null};n.bc=function(a){return this.b&2?a:null};n.pb=function(a){var b=this.d[a.name.toLowerCase()];return b?b:this.b&4?a:null};n.Mb=function(a){return 0!=a.B||this.b&512?0>a.B&&!(this.b&256)?null:this.e[a.fa]?a:null:"%"==a.fa&&this.b&1024?a:null};n.Lb=function(a){return 0==a.B?this.b&512?a:null:0>=a.B&&!(this.b&256)?null:this.b&16?a:null};n.Kb=function(a){return 0==a.B?this.b&512?a:null:0>=a.B&&!(this.b&256)?null:this.b&48?a:(a=this.d[""+a.B])?a:null};
n.xc=function(a){return this.b&64?a:null};n.cc=function(a){return this.b&128?a:null};n.$a=function(){return null};n.ob=function(){return null};n.yb=function(){return null};n.Jb=function(){return null};var Fg=new Hg(0,S,S);
function Kg(a){this.b=new Ag(null);var b=this.e=new Ag(null),c=a.b.length;a.b.push(this.b);a.b.push(b);Dg(a,a.match,c);Dg(a,a.e,c+1);Dg(a,a.error,c+1);for(b=0;b<a.d.length;b++){var d=a.d[b];d.e?a.b[d.d].e=a.b[d.b]:a.b[d.d].f=a.b[d.b]}for(b=0;b<c;b++)if(null==a.b[b].f||null==a.b[b].e)throw Error("Invalid validator state");this.d=a.b[0]}t(Kg,Jg);
function Lg(a,b,c,d){for(var e=c?[]:b,f=a.d,g=d,k=null,h=null;f!==a.b&&f!==a.e;)if(g>=b.length)f=f.f;else{var l=b[g],m=l;if(0!=f.b)m=!0,-1==f.b?(k?k.push(h):k=[h],h=[]):-2==f.b?0<k.length?h=k.pop():h=null:0<f.b&&0==f.b%2?h[Math.floor((f.b-1)/2)]="taken":m=null==h[Math.floor((f.b-1)/2)],f=m?f.e:f.f;else{if(0==g&&!c&&f.d instanceof Mg&&a instanceof Mg){if(m=(new ld(b)).T(f.d)){g=b.length;f=f.e;continue}}else if(0==g&&!c&&f.d instanceof Ng&&a instanceof Mg){if(m=(new md(b)).T(f.d)){g=b.length;f=f.e;
continue}}else m=l.T(f.d);if(m){if(m!==l&&b===e)for(e=[],l=0;l<g;l++)e[l]=b[l];b!==e&&(e[g-d]=m);g++;f=f.e}else f=f.f}}return f===a.b&&(c?0<e.length:g==b.length)?e:null}n=Kg.prototype;n.Ra=function(a){for(var b=null,c=this.d;c!==this.b&&c!==this.e;)a?0!=c.b?c=c.e:(b=a.T(c.d))?(a=null,c=c.e):c=c.f:c=c.f;return c===this.b?b:null};n.Yc=function(a){return this.Ra(a)};n.Zc=function(a){return this.Ra(a)};n.bc=function(a){return this.Ra(a)};n.pb=function(a){return this.Ra(a)};n.Mb=function(a){return this.Ra(a)};
n.Lb=function(a){return this.Ra(a)};n.Kb=function(a){return this.Ra(a)};n.xc=function(a){return this.Ra(a)};n.cc=function(a){return this.Ra(a)};n.$a=function(){return null};n.ob=function(){return null};n.yb=function(a){return this.Ra(a)};n.Jb=function(){return null};function Mg(a){Kg.call(this,a)}t(Mg,Kg);Mg.prototype.$a=function(a){var b=Lg(this,a.values,!1,0);return b===a.values?a:b?new ld(b):null};
Mg.prototype.ob=function(a){for(var b=this.d,c=!1;b;){if(b.d instanceof Ng){c=!0;break}b=b.f}return c?(b=Lg(this,a.values,!1,0),b===a.values?a:b?new md(b):null):null};Mg.prototype.f=function(a,b){return Lg(this,a,!0,b)};function Ng(a){Kg.call(this,a)}t(Ng,Kg);Ng.prototype.$a=function(a){return this.Ra(a)};Ng.prototype.ob=function(a){var b=Lg(this,a.values,!1,0);return b===a.values?a:b?new md(b):null};function Og(a,b){Kg.call(this,b);this.name=a}t(Og,Kg);Og.prototype.Ra=function(){return null};
Og.prototype.yb=function(a){if(a.name.toLowerCase()!=this.name)return null;var b=Lg(this,a.values,!1,0);return b===a.values?a:b?new nd(a.name,b):null};function Pg(){}Pg.prototype.b=function(a,b){return b};Pg.prototype.e=function(){};function Qg(a,b){this.name=b;this.f=a.e[this.name]}t(Qg,Pg);Qg.prototype.b=function(a,b,c){if(c.values[this.name])return b;if(a=this.f.f(a,b)){var d=a.length;this.e(1<d?new ld(a):a[0],c);return b+d}return b};Qg.prototype.e=function(a,b){b.values[this.name]=a};
function Rg(a,b){Qg.call(this,a,b[0]);this.d=b}t(Rg,Qg);Rg.prototype.e=function(a,b){for(var c=0;c<this.d.length;c++)b.values[this.d[c]]=a};function Sg(a,b){this.d=a;this.md=b}t(Sg,Pg);Sg.prototype.b=function(a,b,c){var d=b;if(this.md)if(a[b]==rd){if(++b==a.length)return d}else return d;var e=this.d[0].b(a,b,c);if(e==b)return d;b=e;for(d=1;d<this.d.length&&b<a.length;d++){e=this.d[d].b(a,b,c);if(e==b)break;b=e}return b};function Tg(){this.b=this.Oa=null;this.error=!1;this.values={};this.d=null}
n=Tg.prototype;n.clone=function(){var a=new this.constructor;a.Oa=this.Oa;a.b=this.b;a.d=this.d;return a};n.bd=function(a,b){this.Oa=a;this.b=b};n.Ab=function(){this.error=!0;return 0};function Ug(a,b){a.Ab([b]);return null}n.Yc=function(a){return Ug(this,a)};n.bc=function(a){return Ug(this,a)};n.pb=function(a){return Ug(this,a)};n.Mb=function(a){return Ug(this,a)};n.Lb=function(a){return Ug(this,a)};n.Kb=function(a){return Ug(this,a)};n.xc=function(a){return Ug(this,a)};
n.cc=function(a){return Ug(this,a)};n.$a=function(a){this.Ab(a.values);return null};n.ob=function(){this.error=!0;return null};n.yb=function(a){return Ug(this,a)};n.Jb=function(){this.error=!0;return null};function Vg(){Tg.call(this)}t(Vg,Tg);Vg.prototype.Ab=function(a){for(var b=0,c=0;b<a.length;){var d=this.Oa[c].b(a,b,this);if(d>b)b=d,c=0;else if(++c==this.Oa.length){this.error=!0;break}}return b};function Wg(){Tg.call(this)}t(Wg,Tg);
Wg.prototype.Ab=function(a){if(a.length>this.Oa.length||0==a.length)return this.error=!0,0;for(var b=0;b<this.Oa.length;b++){for(var c=b;c>=a.length;)c=1==c?0:c-2;if(this.Oa[b].b(a,c,this)!=c+1)return this.error=!0,0}return a.length};function Xg(){Tg.call(this)}t(Xg,Tg);
Xg.prototype.Ab=function(a){for(var b=a.length,c=0;c<a.length;c++)if(a[c]===rd){b=c;break}if(b>this.Oa.length||0==a.length)return this.error=!0,0;for(c=0;c<this.Oa.length;c++){for(var d=c;d>=b;)d=1==d?0:d-2;var e;if(b+1<a.length)for(e=b+c+1;e>=a.length;)e-=e==b+2?1:2;else e=d;if(2!=this.Oa[c].b([a[d],a[e]],0,this))return this.error=!0,0}return a.length};function Yg(){Tg.call(this)}t(Yg,Vg);
Yg.prototype.ob=function(a){for(var b={},c=0;c<a.values.length;c++){this.values={};if(a.values[c]instanceof md)this.error=!0;else{a.values[c].T(this);for(var d=b,e=this.values,f=0;f<this.b.length;f++){var g=this.b[f],k=e[g]||this.d.h[g],h=d[g];h||(h=[],d[g]=h);h.push(k)}this.values["background-color"]&&c!=a.values.length-1&&(this.error=!0)}if(this.error)return null}this.values={};for(var l in b)this.values[l]="background-color"==l?b[l].pop():new md(b[l]);return null};function Zg(){Tg.call(this)}
t(Zg,Vg);Zg.prototype.bd=function(a,b){Vg.prototype.bd.call(this,a,b);this.b.push("font-family","line-height","font-size")};
Zg.prototype.Ab=function(a){var b=Vg.prototype.Ab.call(this,a);if(b+2>a.length)return this.error=!0,b;this.error=!1;var c=this.d.e;if(!a[b].T(c["font-size"]))return this.error=!0,b;this.values["font-size"]=a[b++];if(a[b]===rd){b++;if(b+2>a.length||!a[b].T(c["line-height"]))return this.error=!0,b;this.values["line-height"]=a[b++]}var d=b==a.length-1?a[b]:new ld(a.slice(b,a.length));if(!d.T(c["font-family"]))return this.error=!0,b;this.values["font-family"]=d;return a.length};
Zg.prototype.ob=function(a){a.values[0].T(this);if(this.error)return null;for(var b=[this.values["font-family"]],c=1;c<a.values.length;c++)b.push(a.values[c]);a=new md(b);a.T(this.d.e["font-family"])?this.values["font-family"]=a:this.error=!0;return null};Zg.prototype.pb=function(a){if(a=this.d.d[a.name])for(var b in a)this.values[b]=a[b];else this.error=!0;return null};var $g={SIMPLE:Vg,INSETS:Wg,INSETS_SLASH:Xg,COMMA:Yg,FONT:Zg};
function ah(){this.e={};this.k={};this.h={};this.b={};this.d={};this.f={};this.j=[];this.g=[]}function bh(a,b){var c;if(3==b.type)c=new I(b.B,b.text);else if(7==b.type)c=Ff(b.text);else if(1==b.type)c=H(b.text);else throw Error("unexpected replacement");if(Gg(a)){var d=a.b[0].d.d,e;for(e in d)d[e]=c;return a}throw Error("unexpected replacement");}
function ch(a,b,c){for(var d=new Cg,e=0;e<b;e++)Ig(d,a.clone(),1);if(c==Number.POSITIVE_INFINITY)Ig(d,a,3);else for(e=b;e<c;e++)Ig(d,a.clone(),2);return d}function dh(a){var b=new Cg,c=b.b.length;b.b.push(new Ag(a));a=new Bg(c,!0);var d=new Bg(c,!1);Dg(b,b.match,c);b.f?(b.e.push(b.d.length),b.f=!1):b.error.push(b.d.length);b.d.push(d);b.match.push(b.d.length);b.d.push(a);return b}
function eh(a,b){var c;switch(a){case "COMMA":c=new Ng(b);break;case "SPACE":c=new Mg(b);break;default:c=new Og(a.toLowerCase(),b)}return dh(c)}
function fh(a){a.b.HASHCOLOR=dh(new Hg(64,S,S));a.b.POS_INT=dh(new Hg(32,S,S));a.b.POS_NUM=dh(new Hg(16,S,S));a.b.POS_PERCENTAGE=dh(new Hg(8,S,{"%":G}));a.b.NEGATIVE=dh(new Hg(256,S,S));a.b.ZERO=dh(new Hg(512,S,S));a.b.ZERO_PERCENTAGE=dh(new Hg(1024,S,S));a.b.POS_LENGTH=dh(new Hg(8,S,{em:G,ex:G,ch:G,rem:G,vh:G,vw:G,vmin:G,vmax:G,cm:G,mm:G,"in":G,px:G,pt:G,pc:G,q:G}));a.b.POS_ANGLE=dh(new Hg(8,S,{deg:G,grad:G,rad:G,turn:G}));a.b.POS_TIME=dh(new Hg(8,S,{s:G,ms:G}));a.b.FREQUENCY=dh(new Hg(8,S,{Hz:G,
kHz:G}));a.b.RESOLUTION=dh(new Hg(8,S,{dpi:G,dpcm:G,dppx:G}));a.b.URI=dh(new Hg(128,S,S));a.b.IDENT=dh(new Hg(4,S,S));a.b.STRING=dh(new Hg(2,S,S));var b={"font-family":H("sans-serif")};a.d.caption=b;a.d.icon=b;a.d.menu=b;a.d["message-box"]=b;a.d["small-caption"]=b;a.d["status-bar"]=b}function gh(a){return!!a.match(/^[A-Z_0-9]+$/)}
function hh(a,b,c){var d=x(b);if(0==d.type)return null;var e={"":!0};if(14==d.type){do{A(b);d=x(b);if(1!=d.type)throw Error("Prefix name expected");e[d.text]=!0;A(b);d=x(b)}while(16==d.type);if(15!=d.type)throw Error("']' expected");A(b);d=x(b)}if(1!=d.type)throw Error("Property name expected");if(2==c?"SHORTHANDS"==d.text:"DEFAULTS"==d.text)return A(b),null;d=d.text;A(b);if(2!=c){if(39!=x(b).type)throw Error("'=' expected");gh(d)||(a.k[d]=e)}else if(18!=x(b).type)throw Error("':' expected");return d}
function ih(a,b){for(;;){var c=hh(a,b,1);if(!c)break;for(var d=[],e=[],f="",g,k=!0,h=function(){if(0==d.length)throw Error("No values");var a;if(1==d.length)a=d[0];else{var b=f,c=d;a=new Cg;if("||"==b){for(b=0;b<c.length;b++){var e=new Cg,g=e;if(g.b.length)throw Error("invalid call");var h=new Ag(Fg);h.b=2*b+1;g.b.push(h);var h=new Bg(0,!0),k=new Bg(0,!1);g.e.push(g.d.length);g.d.push(k);g.match.push(g.d.length);g.d.push(h);Ig(e,c[b],1);Eg(e,e.match,!1,b);Ig(a,e,0==b?1:4)}c=new Cg;if(c.b.length)throw Error("invalid call");
Eg(c,c.match,!0,-1);Ig(c,a,3);a=[c.match,c.e,c.error];for(b=0;b<a.length;b++)Eg(c,a[b],!1,-1);a=c}else{switch(b){case " ":e=1;break;case "|":case "||":e=4;break;default:throw Error("unexpected op");}for(b=0;b<c.length;b++)Ig(a,c[b],0==b?1:e)}}return a},l=function(a){if(k)throw Error("'"+a+"': unexpected");if(f&&f!=a)throw Error("mixed operators: '"+a+"' and '"+f+"'");f=a;k=!0},m=null;!m;)switch(A(b),g=x(b),g.type){case 1:k||l(" ");if(gh(g.text)){var p=a.b[g.text];if(!p)throw Error("'"+g.text+"' unexpected");
d.push(p.clone())}else p={},p[g.text]=H(g.text),d.push(dh(new Hg(0,p,S)));k=!1;break;case 5:p={};p[""+g.B]=new vd(g.B);d.push(dh(new Hg(0,p,S)));k=!1;break;case 34:l("|");break;case 25:l("||");break;case 14:k||l(" ");e.push({od:d,kd:f,Nb:"["});f="";d=[];k=!0;break;case 6:k||l(" ");e.push({od:d,kd:f,Nb:"(",Eb:g.text});f="";d=[];k=!0;break;case 15:g=h();p=e.pop();if("["!=p.Nb)throw Error("']' unexpected");d=p.od;d.push(g);f=p.kd;k=!1;break;case 11:g=h();p=e.pop();if("("!=p.Nb)throw Error("')' unexpected");
d=p.od;d.push(eh(p.Eb,g));f=p.kd;k=!1;break;case 18:if(k)throw Error("':' unexpected");A(b);d.push(bh(d.pop(),x(b)));break;case 22:if(k)throw Error("'?' unexpected");d.push(ch(d.pop(),0,1));break;case 36:if(k)throw Error("'*' unexpected");d.push(ch(d.pop(),0,Number.POSITIVE_INFINITY));break;case 23:if(k)throw Error("'+' unexpected");d.push(ch(d.pop(),1,Number.POSITIVE_INFINITY));break;case 12:A(b);g=x(b);if(5!=g.type)throw Error("<int> expected");var q=p=g.B;A(b);g=x(b);if(16==g.type){A(b);g=x(b);
if(5!=g.type)throw Error("<int> expected");q=g.B;A(b);g=x(b)}if(13!=g.type)throw Error("'}' expected");d.push(ch(d.pop(),p,q));break;case 17:m=h();if(0<e.length)throw Error("unclosed '"+e.pop().Nb+"'");break;default:throw Error("unexpected token");}A(b);gh(c)?a.b[c]=m:a.e[c]=1!=m.b.length||0!=m.b[0].b?new Mg(m):m.b[0].d}}
function jh(a,b){for(var c={},d=0;d<b.length;d++)for(var e=b[d],f=a.f[e],e=f?f.b:[e],f=0;f<e.length;f++){var g=e[f],k=a.h[g];k?c[g]=k:v.b("Unknown property in makePropSet:",g)}return c}
function kh(a,b,c,d,e){var f="",g=b;b=b.toLowerCase();var k=b.match(/^-([a-z]+)-([-a-z0-9]+)$/);k&&(f=k[1],b=k[2]);if((k=a.k[b])&&k[f])if(f=a.e[b])(a=c===Rd||c.fd()?c:c.T(f))?e.Za(b,a,d):e.Rb(g,c);else if(b=a.f[b].clone(),c===Rd)for(c=0;c<b.b.length;c++)e.Za(b.b[c],Rd,d);else{c.T(b);if(b.error)d=!1;else{for(a=0;a<b.b.length;a++)f=b.b[a],e.Za(f,b.values[f]||b.d.h[f],d);d=!0}d||e.Rb(g,c)}else e.wc(g,c)}
var lh=new Df(function(){var a=L("loadValidatorSet.load"),b=va("validation.txt",ua),c=xf(b),d=new ah;fh(d);c.then(function(c){try{if(c.responseText){var f=new cc(c.responseText,null);for(ih(d,f);;){var g=hh(d,f,2);if(!g)break;for(c=[];;){A(f);var k=x(f);if(17==k.type){A(f);break}switch(k.type){case 1:c.push(H(k.text));break;case 4:c.push(new ud(k.B));break;case 5:c.push(new vd(k.B));break;case 3:c.push(new I(k.B,k.text));break;default:throw Error("unexpected token");}}d.h[g]=1<c.length?new ld(c):
c[0]}for(;;){var h=hh(d,f,3);if(!h)break;var l=z(f,1),m;1==l.type&&$g[l.text]?(m=new $g[l.text],A(f)):m=new Vg;m.d=d;g=!1;k=[];c=!1;for(var p=[],q=[];!g;)switch(A(f),l=x(f),l.type){case 1:if(d.e[l.text])k.push(new Qg(m.d,l.text)),q.push(l.text);else if(d.f[l.text]instanceof Wg){var u=d.f[l.text];k.push(new Rg(u.d,u.b));q.push.apply(q,u.b)}else throw Error("'"+l.text+"' is neither a simple property nor an inset shorthand");break;case 19:if(0<k.length||c)throw Error("unexpected slash");c=!0;break;case 14:p.push({md:c,
Oa:k});k=[];c=!1;break;case 15:var r=new Sg(k,c),y=p.pop(),k=y.Oa;c=y.md;k.push(r);break;case 17:g=!0;A(f);break;default:throw Error("unexpected token");}m.bd(k,q);d.f[h]=m}d.g=jh(d,["background"]);d.j=jh(d,"margin border padding columns column-gap column-rule column-fill".split(" "))}else v.error("Error: missing",b)}catch(J){v.error(J,"Error:")}O(a,d)});return N(a)},"validatorFetcher");var mh={"font-style":$d,"font-variant":$d,"font-weight":$d},nh="OTTO"+(new Date).valueOf(),oh=1;function ph(a,b){var c={},d;for(d in a)c[d]=a[d].evaluate(b,d);for(var e in mh)c[e]||(c[e]=mh[e]);return c}function qh(a){a=this.wb=a;var b=new Ra,c;for(c in mh)b.append(" "),b.append(a[c].toString());this.d=b.toString();this.src=this.wb.src?this.wb.src.toString():null;this.e=[];this.f=[];this.b=(c=this.wb["font-family"])?c.stringValue():null}
function rh(a,b,c){var d=new Ra;d.append("@font-face {\n  font-family: ");d.append(a.b);d.append(";\n  ");for(var e in mh)d.append(e),d.append(": "),a.wb[e].ya(d,!0),d.append(";\n  ");c?(d.append('src: url("'),b=(window.URL||window.webkitURL).createObjectURL(c),d.append(b),a.e.push(b),a.f.push(c),d.append('")')):(d.append("src: "),d.append(b));d.append(";\n}\n");return d.toString()}function sh(a){this.d=a;this.b={}}
function th(a,b){if(b instanceof md){for(var c=b.values,d=[],e=0;e<c.length;e++){var f=c[e],g=a.b[f.stringValue()];g&&d.push(H(g));d.push(f)}return new md(d)}return(c=a.b[b.stringValue()])?new md([H(c),b]):b}function uh(a,b){this.d=a;this.b=b;this.e={};this.f=0}function vh(a,b,c){b=b.b;var d=c.b[b];if(d)return d;d="Fnt_"+ ++a.f;return c.b[b]=d}
function wh(a,b,c,d){var e=L("initFont"),f=b.src,g={},k;for(k in mh)g[k]=b.wb[k];d=vh(a,b,d);g["font-family"]=H(d);var h=new qh(g),l=a.b.ownerDocument.createElement("span");l.textContent="M";var m=(new Date).valueOf()+1E3;b=a.d.ownerDocument.createElement("style");k=nh+oh++;b.textContent=rh(h,"",yf([k]));a.d.appendChild(b);a.b.appendChild(l);l.style.visibility="hidden";l.style.fontFamily=d;for(var p in mh)w(l,p,g[p].toString());var g=l.getBoundingClientRect(),q=g.right-g.left,u=g.bottom-g.top;b.textContent=
rh(h,f,c);v.e("Starting to load font:",f);var r=!1;tf(function(){var a=l.getBoundingClientRect(),b=a.bottom-a.top;if(q!=a.right-a.left||u!=b)return r=!0,M(!1);(new Date).valueOf()>m?a=M(!1):(a=L("Frame.sleep"),nf(a).Ua(!0,10),a=N(a));return a}).then(function(){r?v.e("Loaded font:",f):v.b("Failed to load font:",f);a.b.removeChild(l);O(e,h)});return N(e)}
function xh(a,b,c){var d=b.src,e=a.e[d];e?xg(e,function(a){if(a.d==b.d){var e=b.b,k=c.b[e];a=a.b;if(k){if(k!=a)throw Error("E_FONT_FAMILY_INCONSISTENT "+b.b);}else c.b[e]=a;v.b("Found already-loaded font:",d)}else v.b("E_FONT_FACE_INCOMPATIBLE",b.src)}):(e=new Df(function(){var e=L("loadFont"),g=c.d?c.d(d):null;g?xf(d,"blob").then(function(d){d.lc?g(d.lc).then(function(d){wh(a,b,d,c).ra(e)}):O(e,null)}):wh(a,b,null,c).ra(e);return N(e)},"loadFont "+d),a.e[d]=e,e.start());return e}
function yh(a,b,c){for(var d=[],e=0;e<b.length;e++){var f=b[e];f.src&&f.b?d.push(xh(a,f,c)):v.b("E_FONT_FACE_INVALID")}return yg(d)};function zh(a,b,c){this.j=a;this.url=b;this.b=c;this.lang=null;this.f=-1;this.root=c.documentElement;a=null;if("http://www.w3.org/1999/xhtml"==this.root.namespaceURI){for(b=this.root.firstChild;b;b=b.nextSibling)if(1==b.nodeType&&(c=b,"http://www.w3.org/1999/xhtml"==c.namespaceURI))switch(c.localName){case "head":a=c}this.lang=this.root.getAttribute("lang")}else if("http://www.gribuser.ru/xml/fictionbook/2.0"==this.root.namespaceURI){a=this.root;for(b=this.root.firstChild;b;b=b.nextSibling);b=Ah(Ah(Ah(Ah(new Bh([this.b]),
"FictionBook"),"description"),"title-info"),"lang").textContent();0<b.length&&(this.lang=b[0])}else if("http://example.com/sse"==this.root.namespaceURI)for(c=this.root.firstElementChild;c;c=c.nextElementSibling)"meta"===c.localName&&(a=c);this.h=a;this.e=this.root;this.g=1;this.e.setAttribute("data-adapt-eloff","0")}
function Ch(a,b){var c=b.getAttribute("data-adapt-eloff");if(c)return parseInt(c,10);for(var c=a.g,d=a.e;d!=b;){var e=d.firstChild;if(!e)for(;!(e=d.nextSibling);)if(d=d.parentNode,null==d)throw Error("Internal error");d=e;1==e.nodeType?(e.setAttribute("data-adapt-eloff",c.toString()),++c):c+=e.textContent.length}a.g=c;a.e=b;return c-1}
function Dh(a,b,c,d){var e=0,f=null;if(1==b.nodeType){if(!d)return Ch(a,b)}else{e=c;f=b.previousSibling;if(!f)return b=b.parentNode,e+=1,Ch(a,b)+e;b=f}for(;;){for(;b.lastChild;)b=b.lastChild;if(1==b.nodeType)break;e+=b.textContent.length;f=b.previousSibling;if(!f){b=b.parentNode;break}b=f}e+=1;return Ch(a,b)+e}function Eh(a){0>a.f&&(a.f=Dh(a,a.root,0,!0));return a.f}
function Fh(a,b){for(var c,d=a.root;;){c=Ch(a,d);if(c>=b)return d;var e=d.children;if(!e)break;var f=Za(e.length,function(c){return Ch(a,e[c])>b});if(0==f)break;if(f<e.length&&Ch(a,e[f])<=b)throw Error("Consistency check failed!");d=e[f-1]}c=c+1;for(var f=d,g=f.firstChild||f.nextSibling,k=null;;){if(g){if(1==g.nodeType)break;k=f=g;c+=g.textContent.length;if(c>b)break}else if(f=f.parentNode,!f)break;g=f.nextSibling}return k||d}
function Hh(a,b){var c=b.getAttribute("id");c&&!a.d[c]&&(a.d[c]=b);(c=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&!a.d[c]&&(a.d[c]=b);for(c=b.firstElementChild;c;c=c.nextElementSibling)Hh(a,c)}function Ih(a,b){var c=b.match(/([^#]*)\#(.+)$/);if(!c||c[1]&&c[1]!=a.url)return null;var c=c[2],d=a.b.getElementById(c);!d&&a.b.getElementsByName&&(d=a.b.getElementsByName(c)[0]);d||(a.d||(a.d={},Hh(a,a.b.documentElement)),d=a.d[c]);return d}
var Jh={ee:"text/html",fe:"text/xml",Xd:"application/xml",Wd:"application/xhtml_xml",be:"image/svg+xml"};function Kh(a,b,c){c=c||new DOMParser;var d;try{d=c.parseFromString(a,b)}catch(e){}if(d){a=d.documentElement;if("parsererror"===a.localName)return null;for(a=a.firstChild;a;a=a.nextSibling)if("parsererror"===a.localName)return null}else return null;return d}
function Lh(a){var b=a.contentType;if(b){for(var c=Object.keys(Jh),d=0;d<c.length;d++)if(Jh[c[d]]===b)return b;if(b.match(/\+xml$/))return"application/xml"}if(a=a.url.match(/\.([^./]+)$/))switch(a[1]){case "html":case "htm":return"text/html";case "xhtml":case "xht":return"application/xhtml_xml";case "svg":case "svgz":return"image/svg+xml";case "opf":case "xml":return"application/xml"}return null}
function Mh(a,b){var c=a.responseXML;if(!c){var d=new DOMParser,e=a.responseText;if(e){var f=Lh(a);(c=Kh(e,f||"application/xml",d))&&!f&&(f=c.documentElement,"html"!==f.localName.toLowerCase()||f.namespaceURI?"svg"===f.localName.toLowerCase()&&"image/svg+xml"!==c.contentType&&(c=Kh(e,"image/svg+xml",d)):c=Kh(e,"text/html",d));c||(c=Kh(e,"text/html",d))}}c=c?new zh(b,a.url,c):null;return M(c)}function Nh(a){this.Eb=a}
function Oh(){var a=Ph;return new Nh(function(b){return a.Eb(b)&&1==b.nodeType&&"http://www.idpf.org/2008/embedding"==b.getAttribute("Algorithm")})}function Qh(){var a=Oh(),b=Ph;return new Nh(function(c){if(!b.Eb(c))return!1;c=new Bh([c]);c=Ah(c,"EncryptionMethod");a&&(c=Rh(c,a));return 0<c.b.length})}var Ph=new Nh(function(){return!0});function Bh(a){this.b=a}function Sh(a){return a.b}function Rh(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=a.b[d];b.Eb(e)&&c.push(e)}return new Bh(c)}
function Th(a,b){function c(a){d.push(a)}for(var d=[],e=0;e<a.b.length;e++)b(a.b[e],c);return new Bh(d)}Bh.prototype.forEach=function(a){for(var b=[],c=0;c<this.b.length;c++)b.push(a(this.b[c]));return b};function Uh(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=b(a.b[d]);null!=e&&c.push(e)}return c}function Ah(a,b){return Th(a,function(a,d){for(var e=a.firstChild;e;e=e.nextSibling)e.localName==b&&d(e)})}
function Vh(a){return Th(a,function(a,c){for(var d=a.firstChild;d;d=d.nextSibling)1==d.nodeType&&c(d)})}function Wh(a,b){return Uh(a,function(a){return 1==a.nodeType?a.getAttribute(b):null})}Bh.prototype.textContent=function(){return this.forEach(function(a){return a.textContent})};var Xh={transform:!0,"transform-origin":!0},Yh={top:!0,bottom:!0,left:!0,right:!0};function Zh(a,b,c){this.target=a;this.name=b;this.value=c}var $h={show:function(a){a.style.visibility="visible"},hide:function(a){a.style.visibility="hidden"},play:function(a){a.currentTime=0;a.play()},pause:function(a){a.pause()},resume:function(a){a.play()},mute:function(a){a.muted=!0},unmute:function(a){a.muted=!1}};
function ai(a,b){var c=$h[b];return c?function(){for(var b=0;b<a.length;b++)try{c(a[b])}catch(e){}}:null}
function bi(a,b){this.e={};this.M=a;this.b=b;this.w=null;this.h=[];var c=this;this.D=function(a){var b=a.currentTarget,f=b.getAttribute("href")||b.getAttributeNS("http://www.w3.org/1999/xlink","href");f&&(a.preventDefault(),gb(c,{type:"hyperlink",target:null,currentTarget:null,je:b,href:f}))};this.j={};this.d={width:0,height:0};this.l=this.k=!1;this.G=0;this.position=null;this.offset=-1;this.g=null;this.f=[];this.u={top:{},bottom:{},left:{},right:{}}}t(bi,fb);
function ci(a){a.H=!0;a.M.setAttribute("data-vivliostyle-auto-page-width",!0)}function di(a){a.F=!0;a.M.setAttribute("data-vivliostyle-auto-page-height",!0)}function ei(a,b,c){var d=a.j[c];d?d.push(b):a.j[c]=[b]}bi.prototype.zoom=function(a){w(this.M,"transform","scale("+a+")")};bi.prototype.A=function(){return this.w||this.M};
function fi(a,b){if(1==a.nodeType)return!1;var c=a.textContent;switch(b){case 0:return!!c.match(/^\s*$/);case 1:return!!c.match(/^[ \t\f]*$/);case 2:return 0==c.length}throw Error("Unexpected whitespace: "+b);}function gi(a,b,c,d,e,f,g,k){this.f=a;this.g=b;this.b=c;this.Ea=d;this.j=e;this.d=f;this.Rd=g;this.h=k;this.e=-1}function hi(a,b){return a.d?!b.d||a.Ea>b.Ea?!0:a.h:!1}function ii(a,b){return a.top-b.top}function ji(a,b){return b.right-a.right}
function ki(a,b,c,d,e,f,g){this.aa=a;this.Sc=d;this.nd=null;this.root=b;this.ba=c;this.type=f;e&&(e.nd=this);this.b=g}function li(a,b){this.Pd=a;this.count=b}function mi(a,b,c){this.Y=a;this.parent=b;this.ga=c;this.ca=0;this.K=!1;this.Na=0;this.da=b?b.da:null;this.qa=this.xa=null;this.H=!1;this.b=!0;this.e=!1;this.h=b?b.h:0;this.u=this.j=this.N=null;this.A=!1;this.w=b?b.w:0;this.k=b?b.k:!1;this.C=this.D=this.g=null;this.l=b?b.l:{};this.f=b?b.f:!1;this.F=b?b.F:"ltr";this.d=b?b.d:null}
function ni(a){a.b=!0;a.h=a.parent?a.parent.h:0;a.C=null;a.ca=0;a.K=!1;a.j=null;a.u=null;a.A=!1;a.g=null;a.D=null;a.xa=null;a.k=a.parent?a.parent.k:!1;a.f=a.parent?a.parent.f:!1;a.xa=null}function oi(a){var b=new mi(a.Y,a.parent,a.ga);b.ca=a.ca;b.K=a.K;b.xa=a.xa;b.Na=a.Na;b.da=a.da;b.qa=a.qa;b.b=a.b;b.h=a.h;b.j=a.j;b.u=a.u;b.k=a.k;b.A=a.A;b.w=a.w;b.g=a.g;b.D=a.D;b.C=a.C;b.d=a.d;b.f=a.f;b.e=a.e;return b}mi.prototype.modify=function(){return this.H?oi(this):this};
function pi(a){var b=a;do{if(b.H)break;b.H=!0;b=b.parent}while(b);return a}mi.prototype.clone=function(){for(var a=oi(this),b=a,c;null!=(c=b.parent);)c=oi(c),b=b.parent=c;return a};function qi(a){return{ha:a.Y,Na:a.Na,da:a.da,xa:a.xa,qa:a.qa?qi(a.qa):null}}function ri(a){var b=a,c=[];do b.d&&b.parent&&b.parent.d!==b.d||c.push(qi(b)),b=b.parent;while(b);return{ka:c,ca:a.ca,K:a.K}}function si(a){this.Ta=a;this.b=this.d=null}
si.prototype.clone=function(){var a=new si(this.Ta);if(this.d){a.d=[];for(var b=0;b<this.d.length;++b)a.d[b]=this.d[b]}if(this.b)for(a.b=[],b=0;b<this.b.length;++b)a.b[b]=this.b[b];return a};function ti(a,b){this.d=a;this.b=b}ti.prototype.clone=function(){return new ti(this.d.clone(),this.b)};function ui(){this.b=[]}ui.prototype.clone=function(){for(var a=new ui,b=this.b,c=a.b,d=0;d<b.length;d++)c[d]=b[d].clone();return a};function vi(){this.d=0;this.b={};this.e=0}
vi.prototype.clone=function(){var a=new vi;a.d=this.d;a.f=this.f;a.e=this.e;a.g=this.g;for(var b in this.b)a.b[b]=this.b[b].clone();return a};function wi(a){this.d=a;this.F=this.D=this.height=this.width=this.w=this.k=this.H=this.j=this.sa=this.ea=this.Fa=this.Z=this.marginBottom=this.marginTop=this.marginRight=this.marginLeft=this.top=this.left=0;this.rb=this.N=null;this.pa=this.sb=this.Ka=this.tb=this.e=0;this.b=!1}function xi(a){return a.marginTop+a.ea+a.k}
function yi(a){return a.marginBottom+a.sa+a.w}function zi(a){return a.marginLeft+a.Z+a.j}function Ai(a){return a.marginRight+a.Fa+a.H}function Bi(a,b){a.d=b.d;a.left=b.left;a.top=b.top;a.marginLeft=b.marginLeft;a.marginRight=b.marginRight;a.marginTop=b.marginTop;a.marginBottom=b.marginBottom;a.Z=b.Z;a.Fa=b.Fa;a.ea=b.ea;a.sa=b.sa;a.j=b.j;a.H=b.H;a.k=b.k;a.w=b.w;a.width=b.width;a.height=b.height;a.D=b.D;a.F=b.F;a.rb=b.rb;a.N=b.N;a.e=b.e;a.tb=b.tb;a.Ka=b.Ka;a.b=b.b}
function Ci(a,b,c){a.top=b;a.height=c;w(a.d,"top",b+"px");w(a.d,"height",c+"px")}function Di(a,b,c){a.left=b;a.width=c;w(a.d,"left",b+"px");w(a.d,"width",c+"px")}function Ei(a,b){this.b=a;this.d=b}t(Ei,jd);Ei.prototype.bc=function(a){this.b.appendChild(this.b.ownerDocument.createTextNode(a.b));return null};Ei.prototype.cc=function(a){var b=this.b.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","img");b.setAttribute("src",a.url);this.b.appendChild(b);return null};
Ei.prototype.$a=function(a){this.qb(a.values);return null};Ei.prototype.Jb=function(a){a=a.ia().evaluate(this.d);"string"===typeof a&&this.b.appendChild(this.b.ownerDocument.createTextNode(a));return null};function Fi(a){return null!=a&&a!==$d&&a!==Zd&&a!==Rd};function Gi(a,b,c){b=b?"vertical-rl":"horizontal-tb";if("top"===a||"bottom"===a)a=da(a,b,c||null,ha);"block-start"===a&&(a="inline-start");"block-end"===a&&(a="inline-end");if("inline-start"===a||"inline-end"===a){c=da(a,b,c||null,ga);a:{var d=ia[b];if(!d)throw Error("unknown writing-mode: "+b);for(b=0;b<d.length;b++)if(d[b].J===c){b=d[b].I;break a}b=c}"line-left"===b?a="left":"line-right"===b&&(a="right")}"left"!==a&&"right"!==a&&(v.b("Invalid float value: "+a+". Fallback to left."),a="left");return a}
function Hi(a,b){this.d=pi(a);this.b=b}function Ii(a,b,c){this.e=a;this.g=b;this.f=c;this.d=[];this.b=[]}
function Ji(a,b,c){b.parentNode&&b.parentNode.removeChild(b);w(b,"float","none");w(b,"position","absolute");var d=a.g.toString(),e=a.f.toString(),f=da(c,d,e||null,ga),g=da(c,d,e||null,ha);w(b,f,"0");switch(g){case "inline-start":case "inline-end":d=da("block-start",d,e||null,ga);w(b,d,"0");break;case "block-start":case "block-end":c=da("inline-start",d,e||null,ga);w(b,c,"0");d=da("max-inline-size",d,e||null,ga);Qa(b,d)||w(b,d,"100%");break;default:throw Error("unknown float direction: "+c);}a.e().appendChild(b)}
function Ki(a,b,c){b=ri(b);for(var d=0;d<a.d.length;d++){var e=a.d[d];if(Li(c,b,ri(e.d)))return e}return null}function Mi(a,b,c){var d=L("tryToAddFloat");b=new Hi(b,c);a.d.push(b);a.b.push(b);O(d,b);return N(d)}function Ni(a){return a.b.map(function(a){a=a.b;return new Be([new we(a.X,a.V),new we(a.U,a.V),new we(a.U,a.P),new we(a.X,a.P)])})};var Oi={SIMPLE_PROPERTY:"SIMPLE_PROPERTY"},Pi={};function Qi(a,b){if(Oi[a]){var c=Pi[a];c||(c=Pi[a]=[]);c.push(b)}else v.b(Error("Skipping unknown plugin hook '"+a+"'."))}ca("vivliostyle.plugin.registerHook",Qi);ca("vivliostyle.plugin.removeHook",function(a,b){if(Oi[a]){var c=Pi[a];if(c){var d=c.indexOf(b);0<=d&&c.splice(d,1)}}else v.b(Error("Ignoring unknown plugin hook '"+a+"'."))});for(var Ri={azimuth:!0,"border-collapse":!0,"border-spacing":!0,"caption-side":!0,color:!0,cursor:!0,direction:!0,elevation:!0,"empty-cells":!0,"font-kerning":!0,"font-size":!0,"font-family":!0,"font-feature-settings":!0,"font-style":!0,"font-variant":!0,"font-weight":!0,"letter-spacing":!0,"line-break":!0,"line-height":!0,"list-style-image":!0,"list-style-position":!0,"list-style-type":!0,orphans:!0,"overflow-wrap":!0,"pitch-range":!0,quotes:!0,richness:!0,"ruby-align":!0,"ruby-position":!0,"speak-header":!0,
"speak-numeral":!0,"speak-punctuation":!0,"speech-rate":!0,stress:!0,"tab-size":!0,"text-align":!0,"text-align-last":!0,"text-decoration-skip":!0,"text-emphasis-color":!0,"text-emphasis-position":!0,"text-emphasis-style":!0,"text-combine-upright":!0,"text-indent":!0,"text-justify":!0,"text-size-adjust":!0,"text-transform":!0,"text-underline-position":!0,visibility:!0,"voice-family":!0,volume:!0,"white-space":!0,widows:!0,"word-break":!0,"word-spacing":!0,"word-wrap":!0,"writing-mode":!0},Si={"http://www.idpf.org/2007/ops":!0,
"http://www.w3.org/1999/xhtml":!0,"http://www.w3.org/2000/svg":!0},Ti="margin-% padding-% border-%-width border-%-style border-%-color %".split(" "),Ui=["left","right","top","bottom"],Vi={width:!0,height:!0},Wi=0;Wi<Ti.length;Wi++)for(var Xi=0;Xi<Ui.length;Xi++){var Yi=Ti[Wi].replace("%",Ui[Xi]);Vi[Yi]=!0}function Zi(a){for(var b={},c=0;c<Ti.length;c++)for(var d in a){var e=Ti[c].replace("%",d),f=Ti[c].replace("%",a[d]);b[e]=f;b[f]=e}return b}
var $i=Zi({before:"right",after:"left",start:"top",end:"bottom"}),aj=Zi({before:"top",after:"bottom",start:"left",end:"right"});function T(a,b){this.value=a;this.Ea=b}n=T.prototype;n.ud=function(){return this};n.Gc=function(a){a=this.value.T(a);return a===this.value?this:new T(a,this.Ea)};n.vd=function(a){return 0==a?this:new T(this.value,this.Ea+a)};n.evaluate=function(a,b){return pg(a,this.value,b)};n.rd=function(){return!0};function bj(a,b,c){T.call(this,a,b);this.L=c}t(bj,T);
bj.prototype.ud=function(){return new T(this.value,this.Ea)};bj.prototype.Gc=function(a){a=this.value.T(a);return a===this.value?this:new bj(a,this.Ea,this.L)};bj.prototype.vd=function(a){return 0==a?this:new bj(this.value,this.Ea+a,this.L)};bj.prototype.rd=function(a){return!!this.L.evaluate(a)};function cj(a,b,c){return(null==b||c.Ea>b.Ea)&&c.rd(a)?c.ud():b}var dj={"region-id":!0};function ej(a){return"_"!=a.charAt(0)&&!dj[a]}function fj(a,b,c){c?a[b]=c:delete a[b]}
function gj(a,b){var c=a[b];c||(c={},a[b]=c);return c}function hj(a,b){var c=a[b];c||(c=[],a[b]=c);return c}function ij(a,b,c,d,e,f){if(e){var g=gj(b,"_pseudos");b=g[e];b||(b={},g[e]=b)}f&&(e=gj(b,"_regions"),b=e[f],b||(b={},e[f]=b));for(var k in c)"_"!=k.charAt(0)&&(dj[k]?(f=c[k],e=hj(b,k),Array.prototype.push.apply(e,f)):fj(b,k,cj(a,b[k],c[k].vd(d))))}function jj(a,b){this.e=a;this.d=b;this.b=""}t(jj,kd);
function kj(a){a=a.e["font-size"].value;var b;a:switch(a.fa.toLowerCase()){case "px":case "in":case "pt":case "pc":case "cm":case "mm":case "q":b=!0;break a;default:b=!1}if(!b)throw Error("Unexpected state");return a.B*uc[a.fa]}
jj.prototype.Mb=function(a){if("em"==a.fa||"ex"==a.fa){var b=yc(this.d,a.fa,!1)/yc(this.d,"em",!1);return new I(a.B*b*kj(this),"px")}if("%"==a.fa){if("font-size"===this.b)return new I(a.B/100*kj(this),"px");b=this.b.match(/height|^(top|bottom)$/)?"vh":"vw";return new I(a.B,b)}return a};jj.prototype.Jb=function(a){return"font-size"==this.b?pg(this.d,a,this.b).T(this):a};function lj(){}lj.prototype.apply=function(){};lj.prototype.g=function(a){return new mj([this,a])};lj.prototype.clone=function(){return this};
function nj(a){this.b=a}t(nj,lj);nj.prototype.apply=function(a){a.f[a.f.length-1].push(this.b.b())};function mj(a){this.b=a}t(mj,lj);mj.prototype.apply=function(a){for(var b=0;b<this.b.length;b++)this.b[b].apply(a)};mj.prototype.g=function(a){this.b.push(a);return this};mj.prototype.clone=function(){return new mj([].concat(this.b))};function oj(a,b,c,d){this.style=a;this.S=b;this.b=c;this.d=d}t(oj,lj);oj.prototype.apply=function(a){ij(a.g,a.w,this.style,this.S,this.b,this.d)};
function U(){this.b=null}t(U,lj);U.prototype.apply=function(a){this.b.apply(a)};U.prototype.d=function(){return 0};U.prototype.e=function(){return!1};function pj(a){this.b=null;this.f=a}t(pj,U);pj.prototype.apply=function(a){0<=a.u.indexOf(this.f)&&this.b.apply(a)};pj.prototype.d=function(){return 10};pj.prototype.e=function(a){this.b&&qj(a.za,this.f,this.b);return!0};function rj(a){this.b=null;this.id=a}t(rj,U);rj.prototype.apply=function(a){a.Z!=this.id&&a.sa!=this.id||this.b.apply(a)};
rj.prototype.d=function(){return 11};rj.prototype.e=function(a){this.b&&qj(a.e,this.id,this.b);return!0};function sj(a){this.b=null;this.localName=a}t(sj,U);sj.prototype.apply=function(a){a.d==this.localName&&this.b.apply(a)};sj.prototype.d=function(){return 8};sj.prototype.e=function(a){this.b&&qj(a.ac,this.localName,this.b);return!0};function tj(a,b){this.b=null;this.f=a;this.localName=b}t(tj,U);tj.prototype.apply=function(a){a.d==this.localName&&a.e==this.f&&this.b.apply(a)};tj.prototype.d=function(){return 8};
tj.prototype.e=function(a){if(this.b){var b=a.b[this.f];b||(b="ns"+a.g++ +":",a.b[this.f]=b);qj(a.f,b+this.localName,this.b)}return!0};function uj(a){this.b=null;this.f=a}t(uj,U);uj.prototype.apply=function(a){var b=a.b;if(b&&"a"==a.d){var c=b.getAttribute("href");c&&c.match(/^#/)&&(b=b.ownerDocument.getElementById(c.substring(1)))&&(b=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))&&b.match(this.f)&&this.b.apply(a)}};function vj(a){this.b=null;this.f=a}t(vj,U);
vj.prototype.apply=function(a){a.e==this.f&&this.b.apply(a)};function wj(a,b){this.b=null;this.f=a;this.name=b}t(wj,U);wj.prototype.apply=function(a){a.b&&a.b.hasAttributeNS(this.f,this.name)&&this.b.apply(a)};function xj(a,b,c){this.b=null;this.f=a;this.name=b;this.value=c}t(xj,U);xj.prototype.apply=function(a){a.b&&a.b.getAttributeNS(this.f,this.name)==this.value&&this.b.apply(a)};xj.prototype.d=function(){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.f?9:0};
xj.prototype.e=function(a){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.f?(this.b&&qj(a.d,this.value,this.b),!0):!1};function yj(a,b){this.b=null;this.f=a;this.name=b}t(yj,U);yj.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.f,this.name);b&&Si[b]&&this.b.apply(a)}};yj.prototype.d=function(){return 0};yj.prototype.e=function(){return!1};function zj(a,b,c){this.b=null;this.h=a;this.name=b;this.f=c}t(zj,U);
zj.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.h,this.name);b&&b.match(this.f)&&this.b.apply(a)}};function Aj(a){this.b=null;this.f=a}t(Aj,U);Aj.prototype.apply=function(a){a.lang.match(this.f)&&this.b.apply(a)};function Bj(){this.b=null}t(Bj,U);Bj.prototype.apply=function(a){a.Fa&&this.b.apply(a)};Bj.prototype.d=function(){return 6};function Cj(){this.b=null}t(Cj,U);Cj.prototype.apply=function(a){a.sb&&this.b.apply(a)};Cj.prototype.d=function(){return 12};
function Dj(a,b){this.b=null;this.f=a;this.Nb=b}t(Dj,U);function Ej(a,b){var c=a.f;b-=a.Nb;return 0===c?0===b:0===b%c&&0<=b/c}function Fj(a,b){Dj.call(this,a,b)}t(Fj,Dj);Fj.prototype.apply=function(a){Ej(this,a.pa)&&this.b.apply(a)};Fj.prototype.d=function(){return 5};function Gj(a,b){Dj.call(this,a,b)}t(Gj,Dj);Gj.prototype.apply=function(a){Ej(this,a.La[a.e][a.d])&&this.b.apply(a)};Gj.prototype.d=function(){return 5};function Hj(a,b){Dj.call(this,a,b)}t(Hj,Dj);
Hj.prototype.apply=function(a){var b=a.H;null===b&&(b=a.H=a.b.parentNode.childElementCount-a.pa+1);Ej(this,b)&&this.b.apply(a)};Hj.prototype.d=function(){return 4};function Ij(a,b){Dj.call(this,a,b)}t(Ij,Dj);Ij.prototype.apply=function(a){var b=a.Ka;if(!b[a.e]){var c=a.b;do{var d=c.namespaceURI,e=c.localName,f=b[d];f||(f=b[d]={});f[e]=(f[e]||0)+1}while(c=c.nextElementSibling)}Ej(this,b[a.e][a.d])&&this.b.apply(a)};Ij.prototype.d=function(){return 4};function Jj(){this.b=null}t(Jj,U);
Jj.prototype.apply=function(a){for(var b=a.b.firstChild;b;){switch(b.nodeType){case Node.ELEMENT_NODE:return;case Node.TEXT_NODE:if(0<b.length)return}b=b.nextSibling}this.b.apply(a)};Jj.prototype.d=function(){return 4};function Kj(){this.b=null}t(Kj,U);Kj.prototype.apply=function(a){!1===a.b.disabled&&this.b.apply(a)};Kj.prototype.d=function(){return 5};function Lj(){this.b=null}t(Lj,U);Lj.prototype.apply=function(a){!0===a.b.disabled&&this.b.apply(a)};Lj.prototype.d=function(){return 5};
function Mj(){this.b=null}t(Mj,U);Mj.prototype.apply=function(a){var b=a.b;!0!==b.selected&&!0!==b.checked||this.b.apply(a)};Mj.prototype.d=function(){return 5};function V(a){this.b=null;this.L=a}t(V,U);V.prototype.apply=function(a){a.j[this.L]&&this.b.apply(a)};V.prototype.d=function(){return 5};function Nj(a){this.L=a}Nj.prototype.b=function(){return this};Nj.prototype.push=function(a,b){0==b&&Oj(a,this.L);return!1};Nj.prototype.pop=function(a,b){return 0==b?(a.j[this.L]--,!0):!1};
function Pj(a){this.L=a}Pj.prototype.b=function(){return this};Pj.prototype.push=function(a,b){0==b?Oj(a,this.L):1==b&&a.j[this.L]--;return!1};Pj.prototype.pop=function(a,b){if(0==b)return a.j[this.L]--,!0;1==b&&Oj(a,this.L);return!1};function Qj(a){this.L=a;this.d=!1}Qj.prototype.b=function(){return new Qj(this.L)};Qj.prototype.push=function(a){return this.d?(a.j[this.L]--,!0):!1};Qj.prototype.pop=function(a,b){if(this.d)return a.j[this.L]--,!0;0==b&&(this.d=!0,Oj(a,this.L));return!1};
function Rj(a){this.L=a;this.d=!1}Rj.prototype.b=function(){return new Rj(this.L)};Rj.prototype.push=function(a,b){this.d&&(-1==b?Oj(a,this.L):0==b&&a.j[this.L]--);return!1};Rj.prototype.pop=function(a,b){if(this.d){if(-1==b)return a.j[this.L]--,!0;0==b&&Oj(a,this.L)}else 0==b&&(this.d=!0,Oj(a,this.L));return!1};function Sj(a,b){this.e=a;this.d=b}Sj.prototype.b=function(){return this};Sj.prototype.push=function(){return!1};Sj.prototype.pop=function(a,b){return 0==b?(Tj(a,this.e,this.d),!0):!1};
function Uj(a){this.lang=a}Uj.prototype.b=function(){return this};Uj.prototype.push=function(){return!1};Uj.prototype.pop=function(a,b){return 0==b?(a.lang=this.lang,!0):!1};function Vj(a){this.d=a}Vj.prototype.b=function(){return this};Vj.prototype.push=function(){return!1};Vj.prototype.pop=function(a,b){return 0==b?(a.D=this.d,!0):!1};function Wj(a,b){this.b=a;this.d=b}t(Wj,kd);
Wj.prototype.pb=function(a){var b=this.b,c=b.D,d=Math.floor(c.length/2)-1;switch(a.name){case "open-quote":a=c[2*Math.min(d,b.l)];b.l++;break;case "close-quote":return 0<b.l&&b.l--,c[2*Math.min(d,b.l)+1];case "no-open-quote":return b.l++,new sd("");case "no-close-quote":return 0<b.l&&b.l--,new sd("")}return a};
var Xj={roman:[4999,1E3,"M",900,"CM",500,"D",400,"CD",100,"C",90,"XC",50,"L",40,"XL",10,"X",9,"IX",5,"V",4,"IV",1,"I"],armenian:[9999,9E3,"\u0584",8E3,"\u0583",7E3,"\u0582",6E3,"\u0581",5E3,"\u0580",4E3,"\u057f",3E3,"\u057e",2E3,"\u057d",1E3,"\u057c",900,"\u057b",800,"\u057a",700,"\u0579",600,"\u0578",500,"\u0577",400,"\u0576",300,"\u0575",200,"\u0574",100,"\u0573",90,"\u0572",80,"\u0571",70,"\u0570",60,"\u056f",50,"\u056e",40,"\u056d",30,"\u056c",20,"\u056b",10,"\u056a",9,"\u0569",8,"\u0568",7,"\u0567",
6,"\u0566",5,"\u0565",4,"\u0564",3,"\u0563",2,"\u0562",1,"\u0561"],georgian:[19999,1E4,"\u10f5",9E3,"\u10f0",8E3,"\u10ef",7E3,"\u10f4",6E3,"\u10ee",5E3,"\u10ed",4E3,"\u10ec",3E3,"\u10eb",2E3,"\u10ea",1E3,"\u10e9",900,"\u10e8",800,"\u10e7",700,"\u10e6",600,"\u10e5",500,"\u10e4",400,"\u10f3",300,"\u10e2",200,"\u10e1",100,"\u10e0",90,"\u10df",80,"\u10de",70,"\u10dd",60,"\u10f2",50,"\u10dc",40,"\u10db",30,"\u10da",20,"\u10d9",10,"\u10d8",9,"\u10d7",8,"\u10f1",7,"\u10d6",6,"\u10d5",5,"\u10d4",4,"\u10d3",
3,"\u10d2",2,"\u10d1",1,"\u10d0"],hebrew:[999,400,"\u05ea",300,"\u05e9",200,"\u05e8",100,"\u05e7",90,"\u05e6",80,"\u05e4",70,"\u05e2",60,"\u05e1",50,"\u05e0",40,"\u05de",30,"\u05dc",20,"\u05db",19,"\u05d9\u05d8",18,"\u05d9\u05d7",17,"\u05d9\u05d6",16,"\u05d8\u05d6",15,"\u05d8\u05d5",10,"\u05d9",9,"\u05d8",8,"\u05d7",7,"\u05d6",6,"\u05d5",5,"\u05d4",4,"\u05d3",3,"\u05d2",2,"\u05d1",1,"\u05d0"]},Yj={latin:"a-z",alpha:"a-z",greek:"\u03b1-\u03c1\u03c3-\u03c9",russian:"\u0430-\u0438\u043a-\u0449\u044d-\u044f"},
Zj={square:"\u25a0",disc:"\u2022",circle:"\u25e6",none:""},ak={le:!1,Ob:"\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d",kc:"\u5341\u767e\u5343",Md:"\u8ca0"};
function bk(a){if(9999<a||-9999>a)return""+a;if(0==a)return ak.Ob.charAt(0);var b=new Ra;0>a&&(b.append(ak.Md),a=-a);if(10>a)b.append(ak.Ob.charAt(a));else if(ak.me&&19>=a)b.append(ak.kc.charAt(0)),0!=a&&b.append(ak.kc.charAt(a-10));else{var c=Math.floor(a/1E3);c&&(b.append(ak.Ob.charAt(c)),b.append(ak.kc.charAt(2)));if(c=Math.floor(a/100)%10)b.append(ak.Ob.charAt(c)),b.append(ak.kc.charAt(1));if(c=Math.floor(a/10)%10)b.append(ak.Ob.charAt(c)),b.append(ak.kc.charAt(0));(a%=10)&&b.append(ak.Ob.charAt(a))}return b.toString()}
function ck(a,b){var c=!1,d=!1,e;null!=(e=b.match(/^upper-(.*)/))?(c=!0,b=e[1]):null!=(e=b.match(/^lower-(.*)/))&&(d=!0,b=e[1]);e="";if(Xj[b])a:{e=Xj[b];var f=a;if(f>e[0]||0>=f||f!=Math.round(f))e="";else{for(var g="",k=1;k<e.length;k+=2){var h=e[k],l=Math.floor(f/h);if(20<l){e="";break a}for(f-=l*h;0<l;)g+=e[k+1],l--}e=g}}else if(Yj[b])if(e=a,0>=e||e!=Math.round(e))e="";else{g=Yj[b];f=[];for(k=0;k<g.length;)if("-"==g.substr(k+1,1))for(l=g.charCodeAt(k),h=g.charCodeAt(k+2),k+=3;l<=h;l++)f.push(String.fromCharCode(l));
else f.push(g.substr(k++,1));g="";do e--,k=e%f.length,g=f[k]+g,e=(e-k)/f.length;while(0<e);e=g}else null!=Zj[b]?e=Zj[b]:"decimal-leading-zero"==b?(e=a+"",1==e.length&&(e="0"+e)):"cjk-ideographic"==b||"trad-chinese-informal"==b?e=bk(a):e=a+"";return c?e.toUpperCase():d?e.toLowerCase():e}
function dk(a,b){var c=b[0].toString(),d=1<b.length?b[1].stringValue():"decimal",e=a.b.h[c];if(e&&e.length)return new sd(ck(e&&e.length&&e[e.length-1]||0,d));c=new K(ek(a.b.tb,c,function(a){return ck(a||0,d)}));return new ld([c])}
function fk(a,b){var c=b[0].toString(),d=b[1].stringValue(),e=2<b.length?b[2].stringValue():"decimal",f=a.b.h[c],g=new Ra;if(f&&f.length)for(var k=0;k<f.length;k++)0<k&&g.append(d),g.append(ck(f[k],e));c=new K(gk(a.b.tb,c,function(a){var b=[];if(a.length)for(var c=0;c<a.length;c++)b.push(ck(a[c],e));a=g.toString();a.length&&b.push(a);return b.length?b.join(d):ck(0,e)}));return new ld([c])}
Wj.prototype.yb=function(a){switch(a.name){case "attr":if(1==a.values.length)return new sd(this.d&&this.d.getAttribute(a.values[0].stringValue())||"");break;case "counter":if(2>=a.values.length)return dk(this,a.values);break;case "counters":if(3>=a.values.length)return fk(this,a.values)}v.b("E_CSS_CONTENT_PROP:",a.toString());return new sd("")};var hk=1/1048576;function ik(a,b){for(var c in a)b[c]=a[c].clone()}
function jk(){this.g=0;this.b={};this.ac={};this.f={};this.d={};this.za={};this.e={};this.Ub={};this.O=0}jk.prototype.clone=function(){var a=new jk;a.g=this.g;for(var b in this.b)a.b[b]=this.b[b];ik(this.ac,a.ac);ik(this.f,a.f);ik(this.d,a.d);ik(this.za,a.za);ik(this.e,a.e);ik(this.Ub,a.Ub);a.O=this.O;return a};function qj(a,b,c){var d=a[b];d&&(c=d.g(c));a[b]=c}
function kk(a,b,c){this.k=a;this.g=b;this.tb=c;this.f=[[],[]];this.j={};this.u=this.w=this.b=null;this.oa=this.sa=this.Z=this.e=this.d="";this.N=this.F=null;this.sb=this.Fa=!0;this.h={};this.A=[{}];this.D=[new sd("\u201c"),new sd("\u201d"),new sd("\u2018"),new sd("\u2019")];this.l=0;this.lang="";this.zb=[0];this.pa=0;this.ea=[{}];this.La=this.ea[0];this.H=null;this.ab=[this.H];this.rb=[{}];this.Ka=this.ea[0];this.Qa=[]}function Oj(a,b){a.j[b]=(a.j[b]||0)+1}
function lk(a,b,c){(b=b[c])&&b.apply(a)}var mk=[];function nk(a,b,c,d){a.b=null;a.w=d;a.e="";a.d="";a.Z="";a.sa="";a.u=b;a.oa="";a.F=mk;a.N=c;ok(a)}function pk(a,b,c){a.h[b]?a.h[b].push(c):a.h[b]=[c];c=a.A[a.A.length-1];c||(c={},a.A[a.A.length-1]=c);c[b]=!0}
function qk(a,b){var c=Sd,d=b.display;d&&(c=d.evaluate(a.g));var e=null,d=null,f=b["counter-reset"];f&&(f=f.evaluate(a.g))&&(e=wg(f,!0));(f=b["counter-increment"])&&(f=f.evaluate(a.g))&&(d=wg(f,!1));"ol"!=a.d&&"ul"!=a.d||"http://www.w3.org/1999/xhtml"!=a.e||(e||(e={}),e["ua-list-item"]=0);c===Xd&&(d||(d={}),d["ua-list-item"]=1);if(e)for(var g in e)pk(a,g,e[g]);if(d)for(var k in d)a.h[k]||pk(a,k,0),g=a.h[k],g[g.length-1]+=d[k];c===Xd&&(c=a.h["ua-list-item"],b["ua-list-item-count"]=new T(new ud(c[c.length-
1]),0));a.A.push(null)}function rk(a){var b=a.A.pop();if(b)for(var c in b)(b=a.h[c])&&(1==b.length?delete a.h[c]:b.pop())}function Tj(a,b,c){qk(a,b);b.content&&(b.content=b.content.Gc(new Wj(a,c)));rk(a)}var sk="before transclusion-before footnote-call footnote-marker inner first-letter first-line  transclusion-after after".split(" ");
function tk(a,b,c){a.Qa.push(b);a.N=null;a.b=b;a.w=c;a.e=b.namespaceURI;a.d=b.localName;var d=a.k.b[a.e];a.oa=d?d+a.d:"";a.Z=b.getAttribute("id");a.sa=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id");(d=b.getAttribute("class"))?a.u=d.split(/\s+/):a.u=mk;(d=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))?a.F=d.split(/\s+/):a.F=mk;"style"==a.d&&"http://www.gribuser.ru/xml/fictionbook/2.0"==a.e&&(a.u=[b.getAttribute("name")||""]);(d=b.getAttributeNS("http://www.w3.org/XML/1998/namespace",
"lang"))||"http://www.w3.org/1999/xhtml"!=a.e||(d=b.getAttribute("lang"));d&&(a.f[a.f.length-1].push(new Uj(a.lang)),a.lang=d.toLowerCase());d=a.zb;a.pa=++d[d.length-1];d.push(0);var d=a.ea,e=a.La=d[d.length-1],f=e[a.e];f||(f=e[a.e]={});f[a.d]=(f[a.d]||0)+1;d.push({});d=a.ab;null!==d[d.length-1]?a.H=--d[d.length-1]:a.H=null;d.push(null);d=a.rb;(e=a.Ka=d[d.length-1])&&e[a.e]&&e[a.e][a.d]--;d.push({});ok(a);d=c.quotes;c=null;d&&(d=d.evaluate(a.g))&&(c=new Vj(a.D),d===Zd?a.D=[new sd(""),new sd("")]:
d instanceof ld&&(a.D=d.values));qk(a,a.w);if(d=a.w._pseudos)for(e=!0,f=0;f<sk.length;f++){var g=sk[f];g||(e=!1);(g=d[g])&&(e?Tj(a,g,b):a.f[a.f.length-2].push(new Sj(g,b)))}c&&a.f[a.f.length-2].push(c)}
function ok(a){var b;for(b=0;b<a.u.length;b++)lk(a,a.k.za,a.u[b]);for(b=0;b<a.F.length;b++)lk(a,a.k.d,a.F[b]);lk(a,a.k.e,a.Z);lk(a,a.k.ac,a.d);""!=a.d&&lk(a,a.k.ac,"*");lk(a,a.k.f,a.oa);null!==a.N&&(lk(a,a.k.Ub,a.N),lk(a,a.k.Ub,"*"));a.b=null;a.f.push([]);for(var c=1;-1<=c;--c){var d=a.f[a.f.length-c-2];for(b=0;b<d.length;)d[b].push(a,c)?d.splice(b,1):b++}a.Fa=!0;a.sb=!1}
kk.prototype.pop=function(){for(var a=1;-1<=a;--a)for(var b=this.f[this.f.length-a-2],c=0;c<b.length;)b[c].pop(this,a)?b.splice(c,1):c++;this.f.pop();this.Fa=!1};var uk=null;function vk(a,b,c,d,e,f,g){Lf.call(this,a,b,g);this.b=null;this.S=0;this.f=this.h=null;this.k=!1;this.L=c;this.g=d?d.g:uk?uk.clone():new jk;this.A=e;this.l=f;this.j=0}t(vk,Mf);vk.prototype.wd=function(a){qj(this.g.ac,"*",a)};
function wk(a,b){var c=a.b;if(0<c.length){c.sort(function(a,b){return b.d()-a.d()});for(var d=null,e=c.length-1;0<=e;e--)d=c[e],d.b=b,b=d;if(d.e(a.g))return}a.wd(b)}vk.prototype.fb=function(a,b){if(b||a)this.S+=1,b&&a?this.b.push(new tj(a,b.toLowerCase())):b?this.b.push(new sj(b.toLowerCase())):this.b.push(new vj(a))};vk.prototype.Dc=function(a){this.f?(v.b("::"+this.f,"followed by ."+a),this.b.push(new V(""))):(this.S+=256,this.b.push(new pj(a)))};
var xk={"nth-child":Fj,"nth-of-type":Gj,"nth-last-child":Hj,"nth-last-of-type":Ij};
vk.prototype.Vb=function(a,b){if(this.f)v.b("::"+this.f,"followed by :"+a),this.b.push(new V(""));else{switch(a.toLowerCase()){case "enabled":this.b.push(new Kj);break;case "disabled":this.b.push(new Lj);break;case "checked":this.b.push(new Mj);break;case "root":this.b.push(new Cj);break;case "link":this.b.push(new sj("a"));this.b.push(new wj("","href"));break;case "-adapt-href-epub-type":case "href-epub-type":if(b&&1==b.length&&"string"==typeof b[0]){var c=new RegExp("(^|s)"+xa(b[0])+"($|s)");this.b.push(new uj(c))}else this.b.push(new V(""));
break;case "-adapt-footnote-content":case "footnote-content":this.k=!0;break;case "visited":case "active":case "hover":case "focus":this.b.push(new V(""));break;case "lang":b&&1==b.length&&"string"==typeof b[0]?this.b.push(new Aj(new RegExp("^"+xa(b[0].toLowerCase())+"($|-)"))):this.b.push(new V(""));break;case "nth-child":case "nth-last-child":case "nth-of-type":case "nth-last-of-type":c=xk[a.toLowerCase()];b&&2==b.length?this.b.push(new c(b[0],b[1])):this.b.push(new V(""));break;case "first-child":this.b.push(new Bj);
break;case "last-child":this.b.push(new Hj(0,1));break;case "first-of-type":this.b.push(new Gj(0,1));break;case "last-of-type":this.b.push(new Ij(0,1));break;case "only-child":this.b.push(new Bj);this.b.push(new Hj(0,1));break;case "only-of-type":this.b.push(new Gj(0,1));this.b.push(new Ij(0,1));break;case "empty":this.b.push(new Jj);break;case "before":case "after":case "first-line":case "first-letter":this.Wb(a,b);return;default:v.b("unknown pseudo-class selector: "+a),this.b.push(new V(""))}this.S+=
256}};
vk.prototype.Wb=function(a,b){switch(a){case "before":case "after":case "first-line":case "first-letter":case "footnote-call":case "footnote-marker":case "inner":this.f?(v.b("Double pseudoelement ::"+this.f+"::"+a),this.b.push(new V(""))):this.f=a;break;case "first-n-lines":if(b&&1==b.length&&"number"==typeof b[0]){var c=Math.round(b[0]);if(0<c&&c==b[0]){this.f?(v.b("Double pseudoelement ::"+this.f+"::"+a),this.b.push(new V(""))):this.f="first-"+c+"-lines";break}}default:v.b("Unrecognized pseudoelement: ::"+a),
this.b.push(new V(""))}this.S+=1};vk.prototype.Kc=function(a){this.S+=65536;this.b.push(new rj(a))};
vk.prototype.gc=function(a,b,c,d){this.S+=256;b=b.toLowerCase();d=d||"";var e;switch(c){case 0:e=new wj(a,b);break;case 39:e=new xj(a,b,d);break;case 45:!d||d.match(/\s/)?e=new V(""):e=new zj(a,b,new RegExp("(^|\\s)"+xa(d)+"($|\\s)"));break;case 44:e=new zj(a,b,new RegExp("^"+xa(d)+"($|-)"));break;case 43:d?e=new zj(a,b,new RegExp("^"+xa(d))):e=new V("");break;case 42:d?e=new zj(a,b,new RegExp(xa(d)+"$")):e=new V("");break;case 46:d?e=new zj(a,b,new RegExp(xa(d))):e=new V("");break;case 50:"supported"==
d?e=new yj(a,b):(v.b("Unsupported :: attr selector op:",d),e=new V(""));break;default:v.b("Unsupported attr selector:",c),e=new V("")}this.b.push(e)};var yk=0;n=vk.prototype;n.hb=function(){var a="d"+yk++;wk(this,new nj(new Nj(a)));this.b=[new V(a)]};n.Cc=function(){var a="c"+yk++;wk(this,new nj(new Pj(a)));this.b=[new V(a)]};n.Bc=function(){var a="a"+yk++;wk(this,new nj(new Qj(a)));this.b=[new V(a)]};n.Hc=function(){var a="f"+yk++;wk(this,new nj(new Rj(a)));this.b=[new V(a)]};
n.Tb=function(){zk(this);this.f=null;this.k=!1;this.S=0;this.b=[]};n.eb=function(){var a;0!=this.j?(Of(this,"E_CSS_UNEXPECTED_SELECTOR"),a=!0):a=!1;a||(this.j=1,this.h={},this.f=null,this.S=0,this.k=!1,this.b=[])};n.error=function(a,b){Mf.prototype.error.call(this,a,b);1==this.j&&(this.j=0)};n.Ib=function(a){Mf.prototype.Ib.call(this,a);this.j=0};n.na=function(){zk(this);Mf.prototype.na.call(this);1==this.j&&(this.j=0)};n.ib=function(){Mf.prototype.ib.call(this)};
function zk(a){if(a.b){var b=a.S,c;c=a.g;c=c.O+=hk;wk(a,a.yd(b+c));a.b=null;a.f=null;a.k=!1;a.S=0}}n.yd=function(a){var b=this.A;this.k&&(b=b?"xxx-bogus-xxx":"footnote");return new oj(this.h,a,this.f,b)};n.Ya=function(a,b,c){kh(this.l,a,b,c,this)};n.Rb=function(a,b){Nf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};n.wc=function(a,b){Nf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
n.Za=function(a,b,c){"display"!=a||b!==be&&b!==ae||(this.Za("flow-options",new ld([Ld,ge]),c),this.Za("flow-into",b,c),b=Ed);(Pi.SIMPLE_PROPERTY||[]).forEach(function(d){d=d({name:a,value:b,important:c});a=d.name;b=d.value;c=d.important});var d=c?Hf(this):If(this);fj(this.h,a,this.L?new bj(b,d,this.L):new T(b,d))};function Ak(a,b){Lf.call(this,a,b,!1)}t(Ak,Mf);
Ak.prototype.Ya=function(a,b){if(this.d.values[a])this.error("E_CSS_NAME_REDEFINED "+a,this.Qb());else{var c=a.match(/height|^(top|bottom)$/)?"vh":"vw",c=new Zc(this.d,100,c),c=b.ia(this.d,c);this.d.values[a]=c}};function Bk(a,b,c,d,e){Lf.call(this,a,b,!1);this.b=d;this.L=c;this.e=e}t(Bk,Mf);Bk.prototype.Ya=function(a,b,c){c?v.b("E_IMPORTANT_NOT_ALLOWED"):kh(this.e,a,b,c,this)};Bk.prototype.Rb=function(a,b){v.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};
Bk.prototype.wc=function(a,b){v.b("E_INVALID_PROPERTY",a+":",b.toString())};Bk.prototype.Za=function(a,b,c){c=c?Hf(this):If(this);c+=this.O;this.O+=hk;fj(this.b,a,this.L?new bj(b,c,this.L):new T(b,c))};function Ck(a,b){ig.call(this,a);this.b={};this.e=b;this.O=0}t(Ck,ig);Ck.prototype.Ya=function(a,b,c){kh(this.e,a,b,c,this)};Ck.prototype.Rb=function(a,b){v.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};Ck.prototype.wc=function(a,b){v.b("E_INVALID_PROPERTY",a+":",b.toString())};
Ck.prototype.Za=function(a,b,c){c=(c?67108864:50331648)+this.O;this.O+=hk;fj(this.b,a,new T(b,c))};var Dk=new Df(function(){var a=L("uaStylesheetBase");Bf(lh).then(function(b){var c=va("user-agent-base.css",ua);b=new vk(null,null,null,null,null,b,!0);b.Ib("UA");uk=b.g;lg(c,b,null,null).ra(a)});return N(a)},"uaStylesheetBaseFetcher");function Ek(a,b,c){return(a=a["writing-mode"])&&(b=a.evaluate(b,"writing-mode"))&&b!==Rd?b===me:c}
function Fk(a,b,c,d){var e={},f;for(f in a)ej(f)&&(e[f]=a[f]);a=a._regions;if((c||d)&&a)for(d&&(d=["footnote"],c=c?c.concat(d):d),d=0;d<c.length;d++){f=a[c[d]];for(var g in f)ej(g)&&(e[g]=cj(b,e[g],f[g]))}return e}function Gk(a,b,c,d){c=c?$i:aj;for(var e in a)if(a.hasOwnProperty(e)){var f=a[e];if(f){var g=c[e];if(g){var k=a[g];if(k&&k.Ea>f.Ea)continue;g=Vi[g]?g:e}else g=e;b[g]=d(e,f)}}};function Hk(a,b,c){this.e=a;this.d=b;this.b=c}function Ik(){this.map=[]}function Jk(a){return 0==a.map.length?0:a.map[a.map.length-1].b}function Kk(a,b){if(0==a.map.length)a.map.push(new Hk(b,b,b));else{var c=a.map[a.map.length-1],d=c.b+b-c.d;c.d==c.e?(c.d=b,c.e=b,c.b=d):a.map.push(new Hk(b,b,d))}}function Lk(a,b){0==a.map.length?a.map.push(new Hk(b,0,0)):a.map[a.map.length-1].d=b}function Mk(a,b){var c=Za(a.map.length,function(c){return b<=a.map[c].d}),c=a.map[c];return c.b-Math.max(0,c.e-b)}
function Nk(a,b){var c=Za(a.map.length,function(c){return b<=a.map[c].b}),c=a.map[c];return c.e-(c.b-b)}
function Ok(a,b,c,d,e,f,g){this.ba=a;this.root=a.root;this.ea=c;this.f=d;this.h=f;this.d=this.root;this.u={};this.w={};this.D=[];this.l=this.k=null;this.A=new kk(b,d,g);this.e=new Ik;this.Ta=!0;this.F=[];this.Z=e;this.N=this.H=!1;this.b=a=Ch(a,this.root);Kk(this.e,a);b=Pk(this,this.root);tk(this.A,this.root,b);Qk(this,b,!1);this.j=!0;switch(this.root.namespaceURI){case "http://www.w3.org/1999/xhtml":case "http://www.gribuser.ru/xml/fictionbook/2.0":this.j=!1}this.F.push(!0);this.w={};this.w["e"+a]=
b;this.b++;Rk(this,-1)}function Sk(a,b,c,d){return(b=b[d])&&b.evaluate(a.f)!==c[d]}function Tk(a,b,c){for(var d in c){var e=b[d];e?(a.u[d]=e,delete b[d]):(e=c[d])&&(a.u[d]=new T(e,33554432))}}var Uk=["column-count","column-width"];
function Qk(a,b,c){c||["writing-mode","direction"].forEach(function(a){b[a]&&(this.u[a]=b[a])},a);if(!a.H){c=Sk(a,b,a.h.g,"background-color")?b["background-color"].evaluate(a.f):null;var d=Sk(a,b,a.h.g,"background-image")?b["background-image"].evaluate(a.f):null;if(c&&c!==Rd||d&&d!==Rd)Tk(a,b,a.h.g),a.H=!0}if(!a.N)for(c=0;c<Uk.length;c++)if(Sk(a,b,a.h.j,Uk[c])){Tk(a,b,a.h.j);a.N=!0;break}if(c=b["font-size"]){d=c.evaluate(a.f);c=d.B;switch(d.fa){case "em":case "rem":c*=a.f.h;break;case "ex":case "rex":c*=
a.f.h*uc.ex/uc.em;break;case "%":c*=a.f.h/100;break;default:(d=uc[d.fa])&&(c*=d)}a.f.Z=c}}function Vk(a){for(var b=0;!a.j&&(b+=5E3,Wk(a,b,0)!=Number.POSITIVE_INFINITY););return a.u}function Pk(a,b){if(b.style instanceof CSSStyleDeclaration){var c=b.getAttribute("style");if(c){var d=a.ba.url,e=new Ck(a.ea,a.h),c=new cc(c,e);try{hg(new Zf(Qf,c,e,d),Number.POSITIVE_INFINITY,!1,!0,!1)}catch(f){v.b(f,"Style attribute parse error:")}return e.b}}return{}}
function Rk(a,b){if(!(b>=a.b)){var c=a.f,d=Ch(a.ba,a.root);if(b<d){var e=a.g(a.root,!1),f=e["flow-into"],f=f?f.evaluate(c,"flow-into").toString():"body";Yk(a,f,e,a.root,d)}d=Fh(a.ba,b);e=Dh(a.ba,d,0,!1);if(!(e>=a.b))for(;;){if(1!=d.nodeType)e+=d.textContent.length;else{var g=d;if(e!=Ch(a.ba,g))throw Error("Inconsistent offset");var k=a.g(g,!1);if(f=k["flow-into"])f=f.evaluate(c,"flow-into").toString(),Yk(a,f,k,g,e);e++}if(e>=a.b)break;f=d.firstChild;if(null==f)for(;!(f=d.nextSibling);)if(d=d.parentNode,
d===a.root)return;d=f}}}function al(a,b){a.k=b;for(var c=0;c<a.D.length;c++)bl(a.k,a.D[c])}
function Yk(a,b,c,d,e){var f=0,g=Number.POSITIVE_INFINITY,k=!1,h=!1,l=!1,m=c["flow-options"];if(m){var p;a:{if(k=m.evaluate(a.f,"flow-options")){h=new qg;try{k.T(h);p=h.b;break a}catch(q){v.b(q,"toSet:")}}p={}}k=!!p.exclusive;h=!!p["static"];l=!!p.last}(p=c["flow-linger"])&&(g=sg(p.evaluate(a.f,"flow-linger"),Number.POSITIVE_INFINITY));(c=c["flow-priority"])&&(f=sg(c.evaluate(a.f,"flow-priority"),0));d=new gi(b,d,e,f,g,k,h,l);a.D.push(d);a.l==b&&(a.l=null);a.k&&bl(a.k,d)}
function Wk(a,b,c){var d=-1;if(b<=a.b&&(d=Mk(a.e,b),d+=c,d<Jk(a.e)))return Nk(a.e,d);if(null==a.d)return Number.POSITIVE_INFINITY;for(var e=a.f;;){var f=a.d.firstChild;if(null==f)for(;;){if(1==a.d.nodeType){var f=a.A,g=a.d;if(f.Qa.pop()!==g)throw Error("Invalid call to popElement");f.zb.pop();f.ea.pop();f.ab.pop();f.rb.pop();f.pop();rk(f);a.Ta=a.F.pop()}if(f=a.d.nextSibling)break;a.d=a.d.parentNode;if(a.d===a.root)return a.d=null,b<a.b&&(0>d&&(d=Mk(a.e,b),d+=c),d<=Jk(a.e))?Nk(a.e,d):Number.POSITIVE_INFINITY}a.d=
f;if(1!=a.d.nodeType)a.b+=a.d.textContent.length,a.Ta?Kk(a.e,a.b):Lk(a.e,a.b);else{g=a.d;f=Pk(a,g);a.F.push(a.Ta);tk(a.A,g,f);a.j||"body"!=g.localName||g.parentNode!=a.root||(Qk(a,f,!0),a.j=!0);var k=f["flow-into"];k&&(k=k.evaluate(e,"flow-into").toString(),Yk(a,k,f,g,a.b),a.Ta=!!a.Z[k]);a.Ta&&(g=f.display)&&g.evaluate(e,"display")===Zd&&(a.Ta=!1);if(Ch(a.ba,a.d)!=a.b)throw Error("Inconsistent offset");a.w["e"+a.b]=f;a.b++;a.Ta?Kk(a.e,a.b):Lk(a.e,a.b);if(b<a.b&&(0>d&&(d=Mk(a.e,b),d+=c),d<=Jk(a.e)))return Nk(a.e,
d)}}}Ok.prototype.g=function(a,b){var c=Ch(this.ba,a),d="e"+c;b&&(c=Dh(this.ba,a,0,!0));this.b<=c&&Wk(this,c,0);return this.w[d]};var cl=1;function dl(a,b,c,d,e){this.b={};this.children=[];this.e=null;this.h=0;this.d=a;this.name=b;this.nb=c;this.za=d;this.parent=e;this.g="p"+cl++;e&&(this.h=e.children.length,e.children.push(this))}dl.prototype.f=function(){throw Error("E_UNEXPECTED_CALL");};dl.prototype.clone=function(){throw Error("E_UNEXPECTED_CALL");};function el(a,b){var c=a.b,d=b.b,e;for(e in c)Object.prototype.hasOwnProperty.call(c,e)&&(d[e]=c[e])}
function fl(a,b){for(var c=0;c<a.children.length;c++)a.children[c].clone({parent:b})}function gl(a){dl.call(this,a,null,null,[],null);this.b.width=new T(qe,0);this.b.height=new T(re,0)}t(gl,dl);
function hl(a,b){this.e=b;var c=this;oc.call(this,a,function(a,b){var f=a.match(/^([^.]+)\.([^.]+)$/);if(f){var g=c.e.j[f[1]];if(g&&(g=this.oa[g])){if(b){var f=f[2],k=g.ea[f];if(k)g=k;else{switch(f){case "columns":var k=g.d.d,h=new ed(k,0),l=il(g,"column-count"),m=il(g,"column-width"),p=il(g,"column-gap"),k=E(k,gd(k,new bd(k,"min",[h,l]),D(k,m,p)),p)}k&&(g.ea[f]=k);g=k}}else g=il(g,f[2]);return g}}return null})}t(hl,oc);
function jl(a,b,c,d,e,f,g){a=a instanceof hl?a:new hl(a,this);dl.call(this,a,b,c,d,e);this.e=this;this.L=f;this.S=g;this.b.width=new T(qe,0);this.b.height=new T(re,0);this.b["wrap-flow"]=new T(Dd,0);this.b.position=new T(de,0);this.b.overflow=new T(ne,0);this.j={}}t(jl,dl);jl.prototype.f=function(a){return new kl(a,this)};jl.prototype.clone=function(a){a=new jl(this.d,this.name,a.nb||this.nb,this.za,this.parent,this.L,this.S);el(this,a);fl(this,a);return a};
function ll(a,b,c,d,e){dl.call(this,a,b,c,d,e);this.e=e.e;b&&(this.e.j[b]=this.g);this.b["wrap-flow"]=new T(Dd,0)}t(ll,dl);ll.prototype.f=function(a){return new ml(a,this)};ll.prototype.clone=function(a){a=new ll(a.parent.d,this.name,this.nb,this.za,a.parent);el(this,a);fl(this,a);return a};function nl(a,b,c,d,e){dl.call(this,a,b,c,d,e);this.e=e.e;b&&(this.e.j[b]=this.g)}t(nl,dl);nl.prototype.f=function(a){return new ol(a,this)};
nl.prototype.clone=function(a){a=new nl(a.parent.d,this.name,this.nb,this.za,a.parent);el(this,a);fl(this,a);return a};function Y(a,b,c){return b&&b!==Dd?b.ia(a,c):null}function pl(a,b,c){return b&&b!==Dd?b.ia(a,c):a.b}function ql(a,b,c){return b?b===Dd?null:b.ia(a,c):a.b}function rl(a,b,c,d){return b&&c!==Zd?b.ia(a,d):a.b}function sl(a,b,c){return b?b===oe?a.g:b===Md?a.f:b.ia(a,a.b):c}
function tl(a,b){this.e=a;this.d=b;this.D={};this.style={};this.k=this.l=null;this.children=[];this.F=this.H=this.f=this.g=!1;this.w=this.A=0;this.u=null;this.oa={};this.ea={};this.sa=this.b=!1;a&&a.children.push(this)}function ul(a){a.A=0;a.w=0}function vl(a,b,c){b=il(a,b);c=il(a,c);if(!b||!c)throw Error("E_INTERNAL");return D(a.d.d,b,c)}
function il(a,b){var c=a.oa[b];if(c)return c;var d=a.style[b];d&&(c=d.ia(a.d.d,a.d.d.b));switch(b){case "margin-left-edge":c=il(a,"left");break;case "margin-top-edge":c=il(a,"top");break;case "margin-right-edge":c=vl(a,"border-right-edge","margin-right");break;case "margin-bottom-edge":c=vl(a,"border-bottom-edge","margin-bottom");break;case "border-left-edge":c=vl(a,"margin-left-edge","margin-left");break;case "border-top-edge":c=vl(a,"margin-top-edge","margin-top");break;case "border-right-edge":c=
vl(a,"padding-right-edge","border-right-width");break;case "border-bottom-edge":c=vl(a,"padding-bottom-edge","border-bottom-width");break;case "padding-left-edge":c=vl(a,"border-left-edge","border-left-width");break;case "padding-top-edge":c=vl(a,"border-top-edge","border-top-width");break;case "padding-right-edge":c=vl(a,"right-edge","padding-right");break;case "padding-bottom-edge":c=vl(a,"bottom-edge","padding-bottom");break;case "left-edge":c=vl(a,"padding-left-edge","padding-left");break;case "top-edge":c=
vl(a,"padding-top-edge","padding-top");break;case "right-edge":c=vl(a,"left-edge","width");break;case "bottom-edge":c=vl(a,"top-edge","height")}if(!c){if("extent"==b)d=a.b?"width":"height";else if("measure"==b)d=a.b?"height":"width";else{var e=a.b?$i:aj,d=b,f;for(f in e)d=d.replace(f,e[f])}d!=b&&(c=il(a,d))}c&&(a.oa[b]=c);return c}
function wl(a){var b=a.d.d,c=a.style,d=sl(b,c.enabled,b.g),e=Y(b,c.page,b.b);if(e)var f=new $c(b,"page-number"),d=fd(b,d,new Sc(b,e,f));(e=Y(b,c["min-page-width"],b.b))&&(d=fd(b,d,new Rc(b,new $c(b,"page-width"),e)));(e=Y(b,c["min-page-height"],b.b))&&(d=fd(b,d,new Rc(b,new $c(b,"page-height"),e)));d=a.N(d);c.enabled=new K(d)}tl.prototype.N=function(a){return a};
tl.prototype.Lc=function(){var a=this.d.d,b=this.style,c=this.e?this.e.style.width.ia(a,null):null,d=Y(a,b.left,c),e=Y(a,b["margin-left"],c),f=rl(a,b["border-left-width"],b["border-left-style"],c),g=pl(a,b["padding-left"],c),k=Y(a,b.width,c),h=Y(a,b["max-width"],c),l=pl(a,b["padding-right"],c),m=rl(a,b["border-right-width"],b["border-right-style"],c),p=Y(a,b["margin-right"],c),q=Y(a,b.right,c),u=D(a,f,g),r=D(a,f,l);d&&q&&k?(u=E(a,c,D(a,k,D(a,D(a,d,u),r))),e?p?q=E(a,u,p):p=E(a,u,D(a,q,e)):(u=E(a,u,
q),p?e=E(a,u,p):p=e=gd(a,u,new pc(a,.5)))):(e||(e=a.b),p||(p=a.b),d||q||k||(d=a.b),d||k?d||q?k||q||(k=this.l,this.g=!0):d=a.b:(k=this.l,this.g=!0),u=E(a,c,D(a,D(a,e,u),D(a,p,r))),this.g&&(h||(h=E(a,u,d?d:q)),this.b||!Y(a,b["column-width"],null)&&!Y(a,b["column-count"],null)||(k=h,this.g=!1)),d?k?q||(q=E(a,u,D(a,d,k))):k=E(a,u,D(a,d,q)):d=E(a,u,D(a,q,k)));a=pl(a,b["snap-width"]||(this.e?this.e.style["snap-width"]:null),c);b.left=new K(d);b["margin-left"]=new K(e);b["border-left-width"]=new K(f);b["padding-left"]=
new K(g);b.width=new K(k);b["max-width"]=new K(h?h:k);b["padding-right"]=new K(l);b["border-right-width"]=new K(m);b["margin-right"]=new K(p);b.right=new K(q);b["snap-width"]=new K(a)};
tl.prototype.Mc=function(){var a=this.d.d,b=this.style,c=this.e?this.e.style.width.ia(a,null):null,d=this.e?this.e.style.height.ia(a,null):null,e=Y(a,b.top,d),f=Y(a,b["margin-top"],c),g=rl(a,b["border-top-width"],b["border-top-style"],c),k=pl(a,b["padding-top"],c),h=Y(a,b.height,d),l=Y(a,b["max-height"],d),m=pl(a,b["padding-bottom"],c),p=rl(a,b["border-bottom-width"],b["border-bottom-style"],c),q=Y(a,b["margin-bottom"],c),u=Y(a,b.bottom,d),r=D(a,g,k),y=D(a,p,m);e&&u&&h?(d=E(a,d,D(a,h,D(a,D(a,e,r),
y))),f?q?u=E(a,d,f):q=E(a,d,D(a,u,f)):(d=E(a,d,u),q?f=E(a,d,q):q=f=gd(a,d,new pc(a,.5)))):(f||(f=a.b),q||(q=a.b),e||u||h||(e=a.b),e||h?e||u?h||u||(h=this.k,this.f=!0):e=a.b:(h=this.k,this.f=!0),d=E(a,d,D(a,D(a,f,r),D(a,q,y))),this.f&&(l||(l=E(a,d,e?e:u)),this.b&&(Y(a,b["column-width"],null)||Y(a,b["column-count"],null))&&(h=l,this.f=!1)),e?h?u||(u=E(a,d,D(a,e,h))):h=E(a,d,D(a,u,e)):e=E(a,d,D(a,u,h)));a=pl(a,b["snap-height"]||(this.e?this.e.style["snap-height"]:null),c);b.top=new K(e);b["margin-top"]=
new K(f);b["border-top-width"]=new K(g);b["padding-top"]=new K(k);b.height=new K(h);b["max-height"]=new K(l?l:h);b["padding-bottom"]=new K(m);b["border-bottom-width"]=new K(p);b["margin-bottom"]=new K(q);b.bottom=new K(u);b["snap-height"]=new K(a)};
function xl(a){var b=a.d.d,c=a.style;a=Y(b,c[a.b?"height":"width"],null);var d=Y(b,c["column-width"],a),e=Y(b,c["column-count"],null),f;(f=(f=c["column-gap"])&&f!==$d?f.ia(b,null):null)||(f=new Zc(b,1,"em"));d&&!e&&(e=new bd(b,"floor",[hd(b,D(b,a,f),D(b,d,f))]),e=new bd(b,"max",[b.d,e]));e||(e=b.d);d=E(b,hd(b,D(b,a,f),e),f);c["column-width"]=new K(d);c["column-count"]=new K(e);c["column-gap"]=new K(f)}function yl(a,b,c,d){a=a.style[b].ia(a.d.d,null);return Cc(a,c,d,{})}
function zl(a,b){b.oa[a.d.g]=a;var c=a.d.d,d=a.style,e=a.e?Al(a.e,b):null,e=Fk(a.D,b,e,!1);a.b=Ek(e,b,a.e?a.e.b:!1);Gk(e,d,a.b,function(a,b){return b.value});a.l=new rc(c,function(){return a.A},"autoWidth");a.k=new rc(c,function(){return a.w},"autoHeight");a.Lc();a.Mc();xl(a);wl(a)}function Bl(a,b,c){(a=a.style[c])&&(a=pg(b,a,c));return a}function Z(a,b,c){(a=a.style[c])&&(a=pg(b,a,c));return zd(a,b)}
function Al(a,b){var c;a:{if(c=a.D["region-id"]){for(var d=[],e=0;e<c.length;e++){var f=c[e].evaluate(b,"");f&&f!==G&&d.push(f)}if(d.length){c=d;break a}}c=null}if(c){d=[];for(e=0;e<c.length;e++)d[e]=c[e].toString();return d}return null}function Cl(a,b,c,d,e){if(a=Bl(a,b,d))a.Sb()&&vc(a.fa)&&(a=new I(zd(a,b),"px")),"font-family"===d&&(a=th(e,a)),w(c.d,d,a.toString())}
function Dl(a,b,c){var d=Z(a,b,"left"),e=Z(a,b,"margin-left"),f=Z(a,b,"padding-left"),g=Z(a,b,"border-left-width");a=Z(a,b,"width");Di(c,d,a);w(c.d,"margin-left",e+"px");w(c.d,"padding-left",f+"px");w(c.d,"border-left-width",g+"px");c.marginLeft=e;c.Z=g;c.j=f}
function El(a,b,c){var d=Z(a,b,"right"),e=Z(a,b,"snap-height"),f=Z(a,b,"margin-right"),g=Z(a,b,"padding-right");b=Z(a,b,"border-right-width");w(c.d,"margin-right",f+"px");w(c.d,"padding-right",g+"px");w(c.d,"border-right-width",b+"px");c.marginRight=f;c.Fa=b;a.b&&0<e&&(a=d+Ai(c),a=a-Math.floor(a/e)*e,0<a&&(c.sb=e-a,g+=c.sb));c.H=g;c.tb=e}
function Fl(a,b,c){var d=Z(a,b,"snap-height"),e=Z(a,b,"top"),f=Z(a,b,"margin-top"),g=Z(a,b,"padding-top");b=Z(a,b,"border-top-width");c.top=e;c.marginTop=f;c.ea=b;c.Ka=d;!a.b&&0<d&&(a=e+xi(c),a=a-Math.floor(a/d)*d,0<a&&(c.pa=d-a,g+=c.pa));c.k=g;w(c.d,"top",e+"px");w(c.d,"margin-top",f+"px");w(c.d,"padding-top",g+"px");w(c.d,"border-top-width",b+"px")}
function Gl(a,b,c){var d=Z(a,b,"margin-bottom"),e=Z(a,b,"padding-bottom"),f=Z(a,b,"border-bottom-width");a=Z(a,b,"height")-c.pa;w(c.d,"height",a+"px");w(c.d,"margin-bottom",d+"px");w(c.d,"padding-bottom",e+"px");w(c.d,"border-bottom-width",f+"px");c.height=a-c.pa;c.marginBottom=d;c.sa=f;c.w=e}function Hl(a,b,c){a.b?(Fl(a,b,c),Gl(a,b,c)):(El(a,b,c),Dl(a,b,c))}
function Il(a,b,c){w(c.d,"border-top-width","0px");var d=Z(a,b,"max-height");a.H?Ci(c,0,d):(Fl(a,b,c),d-=c.pa,c.height=d,w(c.d,"height",d+"px"))}function Jl(a,b,c){w(c.d,"border-left-width","0px");var d=Z(a,b,"max-width");a.F?Di(c,0,d):(El(a,b,c),d-=c.sb,c.width=d,a=Z(a,b,"right"),w(c.d,"right",a+"px"),w(c.d,"width",d+"px"))}
var Kl="border-left-style border-right-style border-top-style border-bottom-style border-left-color border-right-color border-top-color border-bottom-color outline-style outline-color outline-width overflow visibility".split(" "),Ll="border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-image-source border-image-slice border-image-width border-image-outset border-image-repeat background-attachment background-color background-image background-repeat background-position background-clip background-origin background-size opacity z-index".split(" "),
Ml="color font-family font-size font-style font-weight font-variant line-height letter-spacing text-align text-decoration text-indent text-transform white-space word-spacing".split(" "),Nl=["transform","transform-origin"];
tl.prototype.mb=function(a,b,c,d){this.e&&this.b==this.e.b||w(b.d,"writing-mode",this.b?"vertical-rl":"horizontal-tb");(this.b?this.g:this.f)?this.b?Jl(this,a,b):Il(this,a,b):(this.b?El(this,a,b):Fl(this,a,b),this.b?Dl(this,a,b):Gl(this,a,b));(this.b?this.f:this.g)?this.b?Il(this,a,b):Jl(this,a,b):Hl(this,a,b);for(c=0;c<Kl.length;c++)Cl(this,a,b,Kl[c],d)};function Ol(a,b,c,d){for(var e=0;e<Ml.length;e++)Cl(a,b,c,Ml[e],d)}
tl.prototype.ic=function(a,b,c,d,e,f,g){this.b?this.A=b.e+b.sb:this.w=b.e+b.pa;f=(this.b||!d)&&this.f;var k=(!this.b||!d)&&this.g,h=null;if(k||f)k&&w(b.d,"width","auto"),f&&w(b.d,"height","auto"),h=(d?d.d:b.d).getBoundingClientRect(),k&&(this.A=Math.ceil(h.right-h.left-b.j-b.Z-b.H-b.Fa),this.b&&(this.A+=b.sb)),f&&(this.w=h.bottom-h.top-b.k-b.ea-b.w-b.sa,this.b||(this.w+=b.pa));(this.b?this.f:this.g)&&Hl(this,a,b);if(this.b?this.g:this.f){if(this.b?this.F:this.H)this.b?El(this,a,b):Fl(this,a,b);this.b?
Dl(this,a,b):Gl(this,a,b)}if(1<e&&(f=Z(this,a,"column-rule-width"),k=Bl(this,a,"column-rule-style"),h=Bl(this,a,"column-rule-color"),0<f&&k&&k!=Zd&&h!=ke)){var l=Z(this,a,"column-gap"),m=this.b?b.height:b.width,p=this.b?"border-top":"border-left";for(d=1;d<e;d++){var q=(m+l)*d/e-l/2+b.j-f/2,u=b.height+b.k+b.w,r=b.d.ownerDocument.createElement("div");w(r,"position","absolute");w(r,this.b?"left":"top","0px");w(r,this.b?"top":"left",q+"px");w(r,this.b?"height":"width","0px");w(r,this.b?"width":"height",
u+"px");w(r,p,f+"px "+k.toString()+(h?" "+h.toString():""));b.d.insertBefore(r,b.d.firstChild)}}for(d=0;d<Ll.length;d++)Cl(this,a,b,Ll[d],g);for(d=0;d<Nl.length;d++)e=b,g=Nl[d],f=c.h,(k=Bl(this,a,g))&&f.push(new Zh(e.d,g,k))};
tl.prototype.h=function(a,b){var c=this.D,d=this.d.b,e;for(e in d)ej(e)&&fj(c,e,d[e]);if("background-host"==this.d.nb)for(e in b)if(e.match(/^background-/)||"writing-mode"==e)c[e]=b[e];if("layout-host"==this.d.nb)for(e in b)e.match(/^background-/)||"writing-mode"==e||(c[e]=b[e]);nk(a,this.d.za,null,c);c.content&&(c.content=c.content.Gc(new Wj(a,null)));zl(this,a.g);for(c=0;c<this.d.children.length;c++)this.d.children[c].f(this).h(a,b);a.pop()};
function Pl(a,b){a.g&&(a.F=yl(a,"right",a.l,b)||yl(a,"margin-right",a.l,b)||yl(a,"border-right-width",a.l,b)||yl(a,"padding-right",a.l,b));a.f&&(a.H=yl(a,"top",a.k,b)||yl(a,"margin-top",a.k,b)||yl(a,"border-top-width",a.k,b)||yl(a,"padding-top",a.k,b));for(var c=0;c<a.children.length;c++)Pl(a.children[c],b)}function Ql(a){tl.call(this,null,a)}t(Ql,tl);Ql.prototype.h=function(a,b){tl.prototype.h.call(this,a,b);this.children.sort(function(a,b){return b.d.S-a.d.S||a.d.h-b.d.h})};
function kl(a,b){tl.call(this,a,b);this.u=this}t(kl,tl);kl.prototype.N=function(a){var b=this.d.e;b.L&&(a=fd(b.d,a,b.L));return a};kl.prototype.Z=function(){};function ml(a,b){tl.call(this,a,b);this.u=a.u}t(ml,tl);function ol(a,b){tl.call(this,a,b);this.u=a.u}t(ol,tl);function Rl(a,b,c,d){var e=null;c instanceof td&&(e=[c]);c instanceof md&&(e=c.values);if(e)for(a=a.d.d,c=0;c<e.length;c++)if(e[c]instanceof td){var f=mc(e[c].name,"enabled"),f=new $c(a,f);d&&(f=new Ic(a,f));b=fd(a,b,f)}return b}
ol.prototype.N=function(a){var b=this.d.d,c=this.style,d=sl(b,c.required,b.f)!==b.f;if(d||this.f){var e;e=(e=c["flow-from"])?e.ia(b,b.b):new pc(b,"body");e=new bd(b,"has-content",[e]);a=fd(b,a,e)}a=Rl(this,a,c["required-partitions"],!1);a=Rl(this,a,c["conflicting-partitions"],!0);d&&(c=(c=this.u.style.enabled)?c.ia(b,null):b.g,c=fd(b,c,a),this.u.style.enabled=new K(c));return a};ol.prototype.mb=function(a,b,c,d){w(b.d,"overflow","hidden");tl.prototype.mb.call(this,a,b,c,d)};
function Sl(a,b,c,d){Lf.call(this,a,b,!1);this.target=c;this.b=d}t(Sl,Mf);Sl.prototype.Ya=function(a,b,c){kh(this.b,a,b,c,this)};Sl.prototype.wc=function(a,b){Nf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};Sl.prototype.Rb=function(a,b){Nf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};Sl.prototype.Za=function(a,b,c){this.target.b[a]=new T(b,c?50331648:67108864)};function Tl(a,b,c,d){Sl.call(this,a,b,c,d)}t(Tl,Sl);
function Ul(a,b,c,d){Sl.call(this,a,b,c,d);c.b.width=new T(pe,0);c.b.height=new T(pe,0)}t(Ul,Sl);Ul.prototype.$b=function(a,b,c){a=new nl(this.d,a,b,c,this.target);Kf(this.aa,new Tl(this.d,this.aa,a,this.b))};Ul.prototype.Zb=function(a,b,c){a=new ll(this.d,a,b,c,this.target);a=new Ul(this.d,this.aa,a,this.b);Kf(this.aa,a)};function Vl(a,b,c,d){Sl.call(this,a,b,c,d)}t(Vl,Sl);Vl.prototype.$b=function(a,b,c){a=new nl(this.d,a,b,c,this.target);Kf(this.aa,new Tl(this.d,this.aa,a,this.b))};
Vl.prototype.Zb=function(a,b,c){a=new ll(this.d,a,b,c,this.target);a=new Ul(this.d,this.aa,a,this.b);Kf(this.aa,a)};var Wl={"text-indent":"0px","margin-top":"0px","padding-top":"0px","border-top-width":"0px","border-top-style":"none","border-top-color":"transparent"},Xl={"text-indent":"0px","margin-right":"0px","padding-right":"0px","border-right-width":"0px","border-right-style":"none","border-right-color":"transparent"},Yl={"margin-top":"0px"},Zl={"margin-right":"0px"},$l={};
function am(a){a.addEventListener("load",function(){a.contentWindow.navigator.epubReadingSystem={name:"adapt",version:"0.1",layoutStyle:"paginated",hasFeature:function(a){switch(a){case "mouse-events":return!0}return!1}}},!1)}var bm=(new DOMParser).parseFromString('<root xmlns="http://www.pyroxy.com/ns/shadow"/>',"text/xml"),cm="footnote-marker first-5-lines first-4-lines first-3-lines first-2-lines first-line first-letter before  after".split(" ");
function dm(a){return a.getAttribute("data-adapt-pseudo")||""}function em(a,b,c,d){this.style=b;this.f=a;this.b=c;this.d=d;this.e={}}
em.prototype.g=function(a){var b=dm(a);this.b&&b&&b.match(/after$/)&&(this.style=this.b.g(this.f,!0),this.b=null);var c=this.style._pseudos[b]||{};if(!this.e[b]){this.e[b]=!0;var d=c.content;d&&(d=d.evaluate(this.d),Fi(d)&&d.T(new Ei(a,this.d)))}if(b.match(/^first-/)&&!c["x-first-pseudo"]){a=1;var e;"first-letter"==b?a=0:null!=(e=b.match(/^first-([0-9]+)-lines$/))&&(a=e[1]-0);c["x-first-pseudo"]=new T(new vd(a),0)}return c};
function fm(a,b,c,d,e,f,g,k,h,l,m,p,q){this.w=a;this.d=b;this.viewport=c;this.l=c.b;this.j=d;this.D=e;this.ba=f;this.A=g;this.k=k;this.F=h;this.e=l;this.g=m;this.u=p;this.f=q;this.H=this.b=null;this.h=!1;this.Y=null;this.ca=0;this.C=null}fm.prototype.clone=function(){return new fm(this.w,this.d,this.viewport,this.j,this.D,this.ba,this.A,this.k,this.F,this.e,this.g,this.u,this.f)};
function gm(a,b,c,d,e,f){var g=L("createRefShadow");a.ba.j.load(b).then(function(k){if(k){var h=Ih(k,b);if(h){var l=a.F,m=l.w[k.url];if(!m){var m=l.style.h.b[k.url],p=new wc(0,l.lb(),l.kb(),l.h),m=new Ok(k,m.d,m.g,p,l.e,m.j,l.k);l.w[k.url]=m}f=new ki(d,h,k,e,f,c,m)}}O(g,f)});return N(g)}
function hm(a,b,c,d,e,f,g,k){var h=L("createShadows"),l=e.template,m;l instanceof xd?m=gm(a,l.url,2,b,k,null):m=M(null);m.then(function(l){var m=null;if("http://www.pyroxy.com/ns/shadow"==b.namespaceURI&&"include"==b.localName){var u=b.getAttribute("href"),r=null;u?r=k?k.ba:a.ba:k&&(u="http://www.w3.org/1999/xhtml"==k.aa.namespaceURI?k.aa.getAttribute("href"):k.aa.getAttributeNS("http://www.w3.org/1999/xlink","href"),r=k.Sc?k.Sc.ba:a.ba);u&&(u=va(u,r.url),m=gm(a,u,3,b,k,l))}null==m&&(m=M(l));m.then(function(l){var m;
if(m=d._pseudos){for(var p=bm.createElementNS("http://www.pyroxy.com/ns/shadow","root"),q=p,u=0;u<cm.length;u++){var r=cm[u],ta;if(r){if(!m[r])continue;if(!("footnote-marker"!=r||c&&a.h))continue;if(r.match(/^first-/)&&(ta=e.display,!ta||ta===Sd))continue;ta=bm.createElementNS("http://www.w3.org/1999/xhtml","span");ta.setAttribute("data-adapt-pseudo",r)}else ta=bm.createElementNS("http://www.pyroxy.com/ns/shadow","content");q.appendChild(ta);r.match(/^first-/)&&(q=ta)}l=new ki(b,p,null,k,l,2,new em(b,
d,f,g))}O(h,l)})});return N(h)}function im(a,b,c){a.H=b;a.h=c}function jm(a,b,c,d){var e=a.d;c=Fk(c,e,a.D,a.h);b=Ek(c,e,b);Gk(c,d,b,function(b,c){var d=c.evaluate(e,b);"font-family"==b&&(d=th(a.A,d));return d});return b}
function km(a,b){for(var c=a.b.Y,d=[],e=a.b.da,f=-1;c&&1==c.nodeType;){var g=e&&e.root==c;if(!g||2==e.type){var k=(e?e.b:a.j).g(c,!1);d.push(k)}g?(c=e.aa,e=e.Sc):(c=c.parentNode,f++)}c=yc(a.d,"em",0===f);c={"font-size":new T(new I(c,"px"),0)};e=new jj(c,a.d);for(f=d.length-1;0<=f;--f){var g=d[f],k=[],h;for(h in g)Ri[h]&&k.push(h);k.sort(ue);for(var l=0;l<k.length;l++){var m=k[l];e.b=m;c[m]=g[m].Gc(e)}}for(var p in b)Ri[p]||(c[p]=b[p]);return c}
var lm={a:"a",sub:"sub",sup:"sup",table:"table",tr:"tr",td:"td",th:"th",code:"code",body:"div",p:"p",v:"p",date:"p",emphasis:"em",strong:"strong",style:"span",strikethrough:"del"};function mm(a,b){b=va(b,a.ba.url);return a.u[b]||b}
function nm(a,b,c){var d=!0,e=L("createElementView"),f=a.Y,g=a.b.da?a.b.da.b:a.j,k=g.g(f,!1),h={};a.b.parent||(k=km(a,k));a.b.f=jm(a,a.b.f,k,h);h.direction&&(a.b.F=h.direction.toString());var l=h["flow-into"];if(l&&l.toString()!=a.w)return O(e,!1),N(e);var m=h.display;if(m===Zd)return O(e,!1),N(e);a.b.A=m===Nd;hm(a,f,null==a.b.parent,k,h,g,a.d,a.b.da).then(function(g){a.b.xa=g;var k=a.b.parent&&a.b.parent.k;g=h["float-reference"];var l=h["float"],r=h.clear;if(h.position===Ad||h.position===de)a.b.k=
!0,l=null;k&&(r=null,l!==Od&&(l=null));k=l===Wd||l===ee||l===je||l===Id||l===Ud||l===Td||l===Gd||l===Fd||l===Od;l&&(delete h["float"],l===Od&&(a.h?(k=!1,h.display=Ed):h.display=Sd),a.b.k=!0);r&&(r===Rd&&a.b.parent&&a.b.parent.u&&(r=H(a.b.parent.u)),r===Wd||r===ee||r===Hd)&&(delete h.clear,h.display&&h.display!=Sd&&(a.b.u=r.toString()));h.overflow===Pd&&(a.b.k=!0);var y=m===Xd&&h["ua-list-item-count"];k||h["break-inside"]&&h["break-inside"]!==Dd?a.b.h++:m===ie&&(a.b.h+=10);a.b.b=!k&&!m||m===Sd;a.b.j=
k?l.toString():null;a.b.N=g?g.toString():null;if(!a.b.b){if(g=h["break-after"])a.b.D=g.toString();if(g=h["break-before"])a.b.g=g.toString()}if(g=h["x-first-pseudo"])a.b.d=new li(a.b.parent?a.b.parent.d:null,g.B);if(g=h["white-space"])switch(g.toString()){case "normal":case "nowrap":a.b.w=0;break;case "pre-line":a.b.w=1;break;case "pre":case "pre-wrap":a.b.w=2}var J=!1,W=null,ma=[],X=f.namespaceURI,F=f.localName;if("http://www.w3.org/1999/xhtml"==X)"html"==F||"body"==F||"script"==F||"link"==F||"meta"==
F?F="div":"vide_"==F?F="video":"audi_"==F?F="audio":"object"==F&&(J=!!a.g);else if("http://www.idpf.org/2007/ops"==X)F="span",X="http://www.w3.org/1999/xhtml";else if("http://www.gribuser.ru/xml/fictionbook/2.0"==X){X="http://www.w3.org/1999/xhtml";if("image"==F){if(F="div",(g=f.getAttributeNS("http://www.w3.org/1999/xlink","href"))&&"#"==g.charAt(0)&&(g=Ih(a.ba,g)))W=a.createElement(X,"img"),g="data:"+(g.getAttribute("content-type")||"image/jpeg")+";base64,"+g.textContent.replace(/[ \t\n\t]/g,""),
ma.push(zg(W,g))}else F=lm[F];F||(F=a.b.b?"span":"div")}else if("http://www.daisy.org/z3986/2005/ncx/"==X)if(X="http://www.w3.org/1999/xhtml","ncx"==F||"navPoint"==F)F="div";else if("navLabel"==F){if(F="span",l=f.parentNode){g=null;for(l=l.firstChild;l;l=l.nextSibling)if(1==l.nodeType&&(r=l,"http://www.daisy.org/z3986/2005/ncx/"==r.namespaceURI&&"content"==r.localName)){g=r.getAttribute("src");break}g&&(F="a",f=f.ownerDocument.createElementNS(X,"a"),f.setAttribute("href",g))}}else F="span";else"http://www.pyroxy.com/ns/shadow"==
X?(X="http://www.w3.org/1999/xhtml",F=a.b.b?"span":"div"):J=!!a.g;y?b?F="li":(F="div",m=Ed,h.display=m):"body"==F||"li"==F?F="div":"q"==F?F="span":"a"==F&&(g=h["hyperlink-processing"])&&"normal"!=g.toString()&&(F="span");h.behavior&&"none"!=h.behavior.toString()&&a.g&&(J=!0);var ta;J?ta=a.g(f,a.b.parent?a.b.parent.C:null,h):ta=M(null);ta.then(function(g){g?J&&(d="true"==g.getAttribute("data-adapt-process-children")):g=a.createElement(X,F);"a"==F&&g.addEventListener("click",a.e.D,!1);W&&(om(a,a.b,
"inner",W),g.appendChild(W));"iframe"==g.localName&&"http://www.w3.org/1999/xhtml"==g.namespaceURI&&am(g);if("http://www.gribuser.ru/xml/fictionbook/2.0"!=f.namespaceURI||"td"==F){for(var k=f.attributes,l=k.length,m=null,p=0;p<l;p++){var q=k[p],r=q.namespaceURI,u=q.localName,q=q.nodeValue;if(r)if("http://www.w3.org/2000/xmlns/"==r)continue;else"http://www.w3.org/1999/xlink"==r&&"href"==u&&(q=mm(a,q));else{if(u.match(/^on/))continue;if("style"==u)continue;if("id"==u){ei(a.e,g,q);continue}"src"==u||
"href"==u||"poster"==u?q=mm(a,q):"srcset"==u&&(q=q.split(",").map(function(b){return mm(a,b.trim())}).join(","))}if(r){var ta=$l[r];ta&&(u=ta+":"+u)}"src"!=u||r||"img"!=F||"http://www.w3.org/1999/xhtml"!=X?"href"==u&&"image"==F&&"http://www.w3.org/2000/svg"==X&&"http://www.w3.org/1999/xlink"==r?a.e.f.push(zg(g,q)):r?g.setAttributeNS(r,u,q):g.setAttribute(u,q):m=q}m&&(k=zg(g,m),l=h.width,m=h.height,l&&l!==Dd&&m&&m!==Dd?a.e.f.push(k):ma.push(k))}delete h.content;(k=h["list-style-image"])&&k instanceof
xd&&(k=k.url,ma.push(zg(new Image,k)));pm(a,g,h);k=h.widows;l=h.orphans;if(k||l){if(a.b.parent){a.b.l={};for(var $b in a.b.parent.l)a.b.l[$b]=a.b.parent.l[$b]}k instanceof vd&&(a.b.l.widows=k.B);l instanceof vd&&(a.b.l.orphans=l.B)}if(!a.b.b&&($b=null,b?c&&($b=a.b.f?Zl:Yl):$b=a.b.f?Xl:Wl,$b))for(var $k in $b)w(g,$k,$b[$k]);y&&g.setAttribute("value",h["ua-list-item-count"].stringValue());a.C=g;ma.length?yg(ma).then(function(){O(e,d)}):sf().then(function(){O(e,d)})})});return N(e)}
function qm(a,b,c){var d=L("createNodeView"),e=!0;1==a.Y.nodeType?b=nm(a,b,c):(8==a.Y.nodeType?a.C=null:a.C=document.createTextNode(a.Y.textContent.substr(a.ca||0)),b=M(!0));b.then(function(b){e=b;(a.b.C=a.C)&&(b=a.b.parent?a.b.parent.C:a.H)&&b.appendChild(a.C);O(d,e)});return N(d)}function rm(a,b,c,d){(a.b=b)?(a.Y=b.Y,a.ca=b.ca):(a.Y=null,a.ca=-1);a.C=null;return a.b?qm(a,c,!!d):M(!0)}
function sm(a){if(null==a.da||"content"!=a.Y.localName||"http://www.pyroxy.com/ns/shadow"!=a.Y.namespaceURI)return a;var b=a.ga,c=a.da,d=a.parent,e,f;c.nd?(f=c.nd,e=c.root,c=c.type,2==c&&(e=e.firstChild)):(f=c.Sc,e=c.aa.firstChild,c=2);var g=a.Y.nextSibling;g?(a.Y=g,ni(a)):a.qa?a=a.qa:e?a=null:(a=a.parent.modify(),a.K=!0);if(e)return b=new mi(e,d,b),b.da=f,b.Na=c,b.qa=a,b;a.ga=b;return a}
function tm(a){var b=a.ga+1;if(a.K){if(!a.parent)return null;if(3!=a.Na){var c=a.Y.nextSibling;if(c)return a=a.modify(),a.ga=b,a.Y=c,ni(a),sm(a)}if(a.qa)return a=a.qa.modify(),a.ga=b,a;a=a.parent.modify()}else{if(a.xa&&(c=a.xa.root,2==a.xa.type&&(c=c.firstChild),c))return b=new mi(c,a,b),b.da=a.xa,b.Na=a.xa.type,sm(b);if(c=a.Y.firstChild)return sm(new mi(c,a,b));1!=a.Y.nodeType&&(b+=a.Y.textContent.length-1-a.ca);a=a.modify()}a.ga=b;a.K=!0;return a}
function um(a,b,c){b=tm(b);if(!b||b.K)return M(b);var d=L("nextInTree");rm(a,b,!0,c).then(function(a){b.C&&a||(b=b.modify(),b.K=!0,b.C||(b.b=!0));O(d,b)});return N(d)}function vm(a,b){if(b instanceof md)for(var c=b.values,d=0;d<c.length;d++)vm(a,c[d]);else b instanceof xd&&(c=b.url,a.e.f.push(zg(new Image,c)))}
function pm(a,b,c){var d=c["background-image"];d&&vm(a,d);var d=c.position===de,e;for(e in c){var f=c[e];Xh[e]||d&&Yh[e]?a.e.h.push(new Zh(b,e,f)):(f.Sb()&&vc(f.fa)&&(f=new I(zd(f,a.d),"px")),w(b,e,f.toString()))}}function om(a,b,c,d){if(!b.K){var e=(b.da?b.da.b:a.j).g(a.Y,!1);if(e=e._pseudos)if(e=e[c])c={},b.f=jm(a,b.f,e,c),b=c.content,Fi(b)&&(b.T(new Ei(d,a.d)),delete c.content),pm(a,d,c)}}
function wm(a,b,c){var d=L("peelOff"),e=b.d,f=b.ca,g=b.K;if(0<c)b.C.textContent=b.C.textContent.substr(0,c),f+=c;else if(!g&&b.C&&0==f){var k=b.C.parentNode;k&&k.removeChild(b.C)}for(var h=b.ga+c,l=[];b.d===e;)l.push(b),b=b.parent;var m=l.pop(),p=m.qa;tf(function(){for(;0<l.length;){m=l.pop();b=new mi(m.Y,b,h);0==l.length&&(b.ca=f,b.K=g);b.Na=m.Na;b.da=m.da;b.xa=m.xa;b.qa=m.qa?m.qa:p;p=null;var c=rm(a,b,!1);if(c.Aa())return c}return M(!1)}).then(function(){O(d,b)});return N(d)}
fm.prototype.createElement=function(a,b){return"http://www.w3.org/1999/xhtml"==a?this.l.createElement(b):this.l.createElementNS(a,b)};function xm(a,b,c){var d={},e=a.k._pseudos;b=jm(a,b,a.k,d);if(e&&e.before){var f={},g=a.createElement("http://www.w3.org/1999/xhtml","span");g.setAttribute("data-adapt-pseudo","before");c.appendChild(g);jm(a,b,e.before,f);delete f.content;pm(a,g,f)}delete d.content;pm(a,c,d);return b}
function Li(a,b,c){return b.ca===c.ca&&b.K==c.K&&b.ka.length===c.ka.length&&b.ka.every(function(a,b){var f;f=c.ka[b];if(a.da)if(f.da){var g=1===a.ha.nodeType?a.ha:a.ha.parentElement,k=1===f.ha.nodeType?f.ha:f.ha.parentElement;f=a.da.aa===f.da.aa&&dm(g)===dm(k)}else f=!1;else f=a.ha===f.ha;return f}.bind(a))}function ym(a){this.b=a}function zm(a){return a.getClientRects()}
function Am(a,b,c,d,e){this.f=a;this.fontSize=b;this.b=a.document;this.root=c||this.b.body;b=this.root.firstElementChild;b||(b=this.b.createElement("div"),b.setAttribute("data-vivliostyle-outer-zoom-box",!0),this.root.appendChild(b));c=b.firstElementChild;c||(c=this.b.createElement("div"),c.setAttribute("data-vivliostyle-spread-container",!0),b.appendChild(c));this.e=b;this.d=c;b=(new ym(a)).b.getComputedStyle(this.root,null);this.width=d||parseFloat(b.width)||a.innerWidth;this.height=e||parseFloat(b.height)||
a.innerHeight}Am.prototype.zoom=function(a,b,c){w(this.e,"width",a*c+"px");w(this.e,"height",b*c+"px");w(this.d,"width",a+"px");w(this.d,"height",b+"px");w(this.d,"transform","scale("+c+")")};Qi("SIMPLE_PROPERTY",function(a){var b=a.name,c=a.value;switch(b){case "page-break-before":case "page-break-after":case "page-break-inside":return{name:b.replace(/^page-/,""),value:c===Cd?ce:c,important:a.important};default:return a}});var Bm={page:!0,left:!0,right:!0,recto:!0,verso:!0,column:!0,region:!0},Cm={avoid:!0,"avoid-page":!0,"avoid-column":!0,"avoid-region":!0};
function Dm(a,b){if(a)if(b){var c=!!Bm[a],d=!!Bm[b];if(c&&d)switch(b){case "column":return a;case "region":return"column"===a?b:a;default:return b}else return d?b:c?a:Cm[b]?b:Cm[a]?a:b}else return a;else return b};var Em={img:!0,svg:!0,audio:!0,video:!0};
function Fm(a,b,c){var d=a.C;if(!d)return NaN;if(1==d.nodeType){if(a.K){var e=d.getBoundingClientRect();if(e.right>=e.left&&e.bottom>=e.top)return c?e.left:e.bottom}return NaN}var e=NaN,f=d.ownerDocument.createRange(),g=d.textContent.length;if(!g)return NaN;a.K&&(b+=g);b>=g&&(b=g-1);f.setStart(d,b);f.setEnd(d,b+1);a=zm(f);if(b=c){b=document.body;if(null==jb){var k=b.ownerDocument,f=k.createElement("div");f.style.position="absolute";f.style.top="0px";f.style.left="0px";f.style.width="100px";f.style.height=
"100px";f.style.overflow="hidden";f.style.lineHeight="16px";f.style.fontSize="16px";w(f,"writing-mode","vertical-rl");b.appendChild(f);g=k.createTextNode("a a a a a a a a a a a a a a a a");f.appendChild(g);k=k.createRange();k.setStart(g,0);k.setEnd(g,1);jb=50>k.getBoundingClientRect().left;b.removeChild(f)}b=jb}if(b){b=d.ownerDocument.createRange();b.setStart(d,0);b.setEnd(d,d.textContent.length);d=zm(b);b=[];for(f=0;f<a.length;f++){g=a[f];for(k=0;k<d.length;k++){var h=d[k];if(g.top>=h.top&&g.bottom<=
h.bottom&&1>Math.abs(g.right-h.right)){b.push({top:g.top,left:h.left,bottom:h.bottom,right:h.right});break}}k==d.length&&(v.b("Could not fix character box"),b.push(g))}a=b}for(b=d=0;b<a.length;b++)f=a[b],g=c?f.bottom-f.top:f.right-f.left,f.right>f.left&&f.bottom>f.top&&(isNaN(e)||g>d)&&(e=c?f.left:f.bottom,d=g);return e}function Gm(a,b){this.e=a;this.f=b}Gm.prototype.d=function(a,b){return b<this.f?null:Hm(a,this,0<b)};Gm.prototype.b=function(){return this.f};
function Im(a,b,c,d){this.position=a;this.f=b;this.g=c;this.e=d}Im.prototype.d=function(a,b){var c;b<this.b()?c=null:(a.e=this.e,c=this.position);return c};Im.prototype.b=function(){return(Cm[this.f]?1:0)+(this.g?3:0)+(this.position.parent?this.position.parent.h:0)};function Jm(a,b,c){this.ga=a;this.d=b;this.b=c}
function Km(a){for(var b=1;b<a.length;b++){var c=a[b-1],d=a[b];c===d?v.b("validateCheckPoints: duplicate entry"):c.ga>=d.ga?v.b("validateCheckPoints: incorrect boxOffset"):c.Y==d.Y&&(d.K?c.K&&v.b("validateCheckPoints: duplicate after points"):c.K?v.b("validateCheckPoints: inconsistent after point"):d.ga-c.ga!=d.ca-c.ca&&v.b("validateCheckPoints: boxOffset inconsistent with offsetInNode"))}}
function Lm(a,b,c){wi.call(this,a);this.$c=a.lastChild;this.g=b;this.zb=c;this.Fd=a.ownerDocument;this.yc=!1;this.oa=this.bb=this.Ga=this.pd=this.La=0;this.Qa=this.ab=this.l=this.h=null;this.ad=!1;this.u=this.f=this.A=null;this.qd=!0;this.Ac=this.zc=0}t(Lm,wi);Lm.prototype.clone=function(){var a=new Lm(this.d,this.g,this.zb);Bi(a,this);a.$c=this.$c;a.yc=this.yc;a.l=this.l?this.l.clone():null;a.ab=this.ab.concat();return a};
function Mm(a,b){var c=(a.b?a.bb:a.La)-a.h.X,d=(a.b?a.La:a.Ga)-a.h.V;return new ve(b.X-c,b.V-d,b.U-c,b.P-d)}function Nm(a,b){return a.b?b<a.oa:b>a.oa}function Om(a,b,c){var d=new mi(b.ha,c,0);d.Na=b.Na;d.da=b.da;d.xa=b.xa;d.qa=b.qa?Om(a,b.qa,pi(c)):null;return d}
function Pm(a,b){var c=L("openAllViews"),d=b.ka;im(a.g,a.d,a.yc);var e=d.length-1,f=null;tf(function(){for(;0<=e;){f=Om(a,d[e],f);if(0==e&&(f.ca=b.ca,f.K=b.K,f.K))break;var c=rm(a.g,f,0==e&&0==f.ca);e--;if(c.Aa())return c}return M(!1)}).then(function(){O(c,f)});return N(c)}var Qm=/^[^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*([A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527][^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*)?/;
function Rm(a,b){if(b.d&&b.b&&!b.K&&0==b.d.count&&1!=b.C.nodeType){var c=b.C.textContent.match(Qm);return wm(a.g,b,c[0].length)}return M(b)}function Sm(a,b,c){var d=L("buildViewToNextBlockEdge");uf(function(d){b.C&&c.push(pi(b));Rm(a,b).then(function(f){f!==b&&(b=f,c.push(pi(b)));um(a.g,b).then(function(c){(b=c)?b.j&&!a.b?Tm(a,b).then(function(c){b=c;!b||b.e||0<a.g.f.b.length?P(d):wf(d)}):b.b?wf(d):P(d):P(d)})})}).then(function(){O(d,b)});return N(d)}
function Um(a,b){if(!b.C)return M(b);var c=b.Y,d=L("buildDeepElementView");uf(function(d){Rm(a,b).then(function(f){if(f!==b){for(var g=f;g&&g.Y!=c;)g=g.parent;if(null==g){b=f;P(d);return}}um(a.g,f).then(function(a){(b=a)&&b.Y!=c?wf(d):P(d)})})}).then(function(){O(d,b)});return N(d)}function Vm(a,b,c,d,e){var f=a.Fd.createElement("div");a.b?(w(f,"height",d+"px"),w(f,"width",e+"px")):(w(f,"width",d+"px"),w(f,"height",e+"px"));w(f,"float",c);w(f,"clear",c);a.d.insertBefore(f,b);return f}
function Wm(a){for(var b=a.d.firstChild;b;){var c=b.nextSibling;if(1==b.nodeType){var d=b.style.cssFloat;if("left"==d||"right"==d)a.d.removeChild(b);else break}b=c}}function Xm(a){for(var b=a.d.firstChild,c=a.Qa,d=a.b?a.h.V:a.h.X,e=a.b?a.h.P:a.h.U,f=0;f<c.length;f++){var g=c[f],k=g.P-g.V;g.left=Vm(a,b,"left",g.X-d,k);g.right=Vm(a,b,"right",e-g.U,k)}}
function Ym(a,b,c,d,e){var f;if(b&&b.K&&!b.b&&(f=Fm(b,0,a.b),!isNaN(f)))return f;b=c[d];for(e-=b.ga;;){f=Fm(b,e,a.b);if(!isNaN(f))return f;if(0<e)e--;else{d--;if(0>d)return a.Ga;b=c[d];1!=b.C.nodeType&&(e=b.C.textContent.length)}}}function Zm(a){return"number"==typeof a?a:(a=a.match(/^(-?[0-9]*(\.[0-9]*)?)px$/))?parseFloat(a[0]):0}
function $m(a,b){var c=a.zb.b.getComputedStyle(b,null),d=new xe;c&&(d.left=Zm(c.marginLeft),d.top=Zm(c.marginTop),d.right=Zm(c.marginRight),d.bottom=Zm(c.marginBottom));return d}
function an(a,b,c){if(a=a.zb.b.getComputedStyle(b,null))c.marginLeft=Zm(a.marginLeft),c.Z=Zm(a.borderLeftWidth),c.j=Zm(a.paddingLeft),c.marginTop=Zm(a.marginTop),c.ea=Zm(a.borderTopWidth),c.k=Zm(a.paddingTop),c.marginRight=Zm(a.marginRight),c.Fa=Zm(a.borderRightWidth),c.H=Zm(a.paddingRight),c.marginBottom=Zm(a.marginBottom),c.sa=Zm(a.borderBottomWidth),c.w=Zm(a.paddingBottom)}function bn(a,b,c){b=new Jm(b,c,c);a.f?a.f.push(b):a.f=[b]}
function cn(a,b,c,d){if(a.f&&a.f[a.f.length-1].b)return bn(a,b,c),M(!0);d+=40*(a.b?-1:1);var e=a.l,f=!e;if(f){var g=a.d.ownerDocument.createElement("div");w(g,"position","absolute");var k=a.g.clone(),e=new Lm(g,k,a.zb);a.l=e;e.b=xm(a.g,a.b,g);e.yc=!0;a.b?(e.left=0,w(e.d,"width","2em")):(e.top=a.bb,w(e.d,"height","2em"))}a.d.appendChild(e.d);an(a,e.d,e);g=(a.b?-1:1)*(d-a.Ga);a.b?e.height=a.h.P-a.h.V-xi(e)-yi(e):e.width=a.h.U-a.h.X-zi(e)-Ai(e);d=(a.b?-1:1)*(a.bb-d)-(a.b?zi(e)-Ai(e):xi(e)+yi(e));if(f&&
18>d)return a.d.removeChild(e.d),a.l=null,bn(a,b,c),M(!0);if(!a.b&&e.top<g)return a.d.removeChild(e.d),bn(a,b,c),M(!0);var h=L("layoutFootnoteInner");a.b?Di(e,0,d):Ci(e,g,d);e.D=a.D+a.left+zi(a);e.F=a.F+a.top+xi(a);e.N=a.N;var l=new si(c);f?(dn(e),f=M(!0)):0==e.N.length?(en(e),f=M(!0)):f=fn(e);f.then(function(){gn(e,l).then(function(d){a.b?(a.oa=a.bb+(e.e+zi(e)+Ai(e)),Di(e,0,e.e)):(a.oa=a.bb-(e.e+xi(e)+yi(e)),Ci(e,a.oa-a.Ga,e.e));var f;!a.b&&0<e.N.length?f=fn(e):f=M(d);f.then(function(d){d=new Jm(b,
c,d?d.Ta:null);a.f?a.f.push(d):a.f=[d];O(h,!0)})})});return N(h)}
function hn(a,b){var c=L("layoutFootnote"),d=b.C;d.setAttribute("style","");w(d,"display","inline-block");d.textContent="M";var e=d.getBoundingClientRect(),f=a.b?e.left:e.bottom;d.textContent="";om(a.g,b,"footnote-call",d);d.textContent||d.parentNode.removeChild(d);d={ka:[{ha:b.Y,Na:0,da:b.da,xa:null,qa:null}],ca:0,K:!1};e=b.ga;b=b.modify();b.K=!0;cn(a,e,d,f).then(function(){a.l&&a.l.d.parentNode&&a.d.removeChild(a.l.d);Nm(a,f)&&0!=a.A.length&&(b.e=!0);O(c,b)});return N(c)}
function jn(a,b){var c=L("layoutFloat"),d=b.C,e=b.j,f=b.N,g=b.parent?b.parent.F:"ltr",k=a.g.f,h=b.C.parentNode;"page"===f?Ji(k,d,e):(w(d,"float","none"),w(d,"position","absolute"),w(d,"left","auto"),w(d,"right","auto"),w(d,"top","auto"));Um(a,b).then(function(l){var m=d.getBoundingClientRect(),p=$m(a,d),m=new ve(m.left-p.left,m.top-p.top,m.right+p.right,m.bottom+p.bottom);if("page"===f)Ki(k,b,a.g)?(m=h.ownerDocument.createElement("span"),w(m,"width","0"),w(m,"height","0"),h.appendChild(m),l.C=m,O(c,
l)):Mi(k,b,Mm(a,m)).then(function(){O(c,null)});else{e=Gi(e,a.b,g);for(var p=a.La,q=a.pd,u=b.parent;u&&u.b;)u=u.parent;if(u){var r=u.C.ownerDocument.createElement("div");r.style.left="0px";r.style.top="0px";a.b?(r.style.bottom="0px",r.style.width="1px"):(r.style.right="0px",r.style.height="1px");u.C.appendChild(r);var y=r.getBoundingClientRect(),p=Math.max(a.b?y.top:y.left,p),q=Math.min(a.b?y.bottom:y.right,q);u.C.removeChild(r);u=a.b?m.P-m.V:m.U-m.X;"left"==e?q=Math.max(q,p+u):p=Math.min(p,q-u)}p=
new ve(p,(a.b?-1:1)*a.Ga,q,(a.b?-1:1)*a.bb);q=m;a.b&&(q=Ne(m));Se(p,a.Qa,q,e);a.b&&(m=new ve(-q.P,q.X,-q.V,q.U));w(d,"left",m.X-(a.b?a.bb:a.La)+a.j+"px");w(d,"top",m.V-(a.b?a.La:a.Ga)+a.k+"px");m=a.b?m.X:m.P;Nm(a,m)&&0!=a.A.length?(b=b.modify(),b.e=!0,O(c,b)):(Wm(a),p=a.b?Ne(a.h):a.h,a.b?q=Ne(Mm(a,new ve(-q.P,q.X,-q.V,q.U))):q=Mm(a,q),Te(p,a.Qa,q,e),Xm(a),"left"==e?a.zc=m:a.Ac=m,kn(a,m),O(c,l))}});return N(c)}
function ln(a,b){for(var c=a.C,d="";c&&b&&!d&&(1!=c.nodeType||(d=c.style.textAlign,b));c=c.parentNode);if(!b||"justify"==d){var c=a.C,e=c.ownerDocument,d=e.createElement("span");d.style.visibility="hidden";d.textContent=" ########################";d.setAttribute("data-adapt-spec","1");var f=b&&(a.K||1!=c.nodeType)?c.nextSibling:c;if(c=c.parentNode)c.insertBefore(d,f),b||(e=e.createElement("div"),c.insertBefore(e,f),d.style.lineHeight="80px",e.style.marginTop="-80px",e.style.height="0px",e.setAttribute("data-adapt-spec",
"1"))}}function mn(a,b,c,d){var e=L("processLineStyling");Km(d);var f=d.concat([]);d.splice(0,d.length);var g=0,k=b.d;0==k.count&&(k=k.Pd);uf(function(d){if(k){var e=nn(a,f),m=k.count-g;if(e.length<=m)P(d);else{var p=on(a,f,e[m-1]);pn(a,p,!1,!1).then(function(){g+=m;wm(a.g,p,0).then(function(e){b=e;ln(b,!1);k=b.d;f=[];Sm(a,b,f).then(function(b){c=b;0<a.g.f.b.length?P(d):wf(d)})})})}}else P(d)}).then(function(){Array.prototype.push.apply(d,f);Km(d);O(e,c)});return N(e)}
function qn(a,b){for(var c=0,d=0,e=b.length-1;0<=e;e--){var f=b[e];if(!f.K||!f.C||1!=f.C.nodeType)break;f=$m(a,f.C);f=a.b?-f.left:f.bottom;0<f?c=Math.max(c,f):d=Math.min(d,f)}return c-d}
function rn(a,b){var c=L("layoutBreakableBlock"),d=[];Sm(a,b,d).then(function(e){if(0<a.g.f.b.length)O(c,e);else{var f=d.length-1;if(0>f)O(c,e);else{var f=Ym(a,e,d,f,d[f].ga),g=Nm(a,f);null==e&&(f+=qn(a,d));kn(a,f);var k;b.d?k=mn(a,b,e,d):k=M(e);k.then(function(b){0<d.length&&(a.A.push(new Gm(d,d[0].h)),g&&(2!=d.length&&0<a.A.length||d[0].Y!=d[1].Y||!Em[d[0].Y.localName])&&b&&(b=b.modify(),b.e=!0));O(c,b)})}}});return N(c)}
function on(a,b,c){Km(b);for(var d=0,e=b[0].ga,f=d,g=b.length-1,k=b[g].ga,h;e<k;){h=e+Math.ceil((k-e)/2);for(var f=d,l=g;f<l;){var m=f+Math.ceil((l-f)/2);b[m].ga>h?l=m-1:f=m}l=Ym(a,null,b,f,h);if(a.b?l<c:l>c){for(k=h-1;b[f].ga==h;)f--;g=f}else kn(a,l),e=h,d=f}a=b[f];b=a.C;1!=b.nodeType&&(a.K?a.ca=b.length:(e-=a.ga,c=b.data,173==c.charCodeAt(e)?(b.replaceData(e,c.length-e,"-"),e++):(d=c.charAt(e),e++,f=c.charAt(e),b.replaceData(e,c.length-e,Wa(d)&&Wa(f)?"-":"")),0<e&&(a=a.modify(),a.ca+=e,a.g=null)));
return a}
function nn(a,b){for(var c=[],d=b[0].C,e=b[b.length-1].C,f=[],g=d.ownerDocument.createRange(),k=!1,h=null,l=!1,m=!0;m;){var p=!0;do{var q=null;d==e&&(m=!1);1!=d.nodeType?(l||(g.setStartBefore(d),l=!0),h=d):k?k=!1:d.getAttribute("data-adapt-spec")?p=!l:q=d.firstChild;q||(q=d.nextSibling,q||(k=!0,q=d.parentNode));d=q}while(p&&m);if(l){g.setEndAfter(h);l=zm(g);for(p=0;p<l.length;p++)f.push(l[p]);l=!1}}f.sort(a.b?ji:ii);h=d=k=g=e=0;for(m=a.b?-1:1;;){if(h<f.length&&(l=f[h],p=1,0<d&&(p=Math.max(a.b?l.right-
l.left:l.bottom-l.top,1),p=m*(a.b?l.right:l.top)<m*e?m*((a.b?l.left:l.bottom)-e)/p:m*(a.b?l.left:l.bottom)>m*g?m*(g-(a.b?l.right:l.top))/p:1),0==d||.6<=p||.2<=p&&(a.b?l.top:l.left)>=k-1)){k=a.b?l.bottom:l.right;a.b?(e=0==d?l.right:Math.max(e,l.right),g=0==d?l.left:Math.min(g,l.left)):(e=0==d?l.top:Math.min(e,l.top),g=0==d?l.bottom:Math.max(g,l.bottom));d++;h++;continue}0<d&&(c.push(g),d=0);if(h>=f.length)break}c.sort($a);a.b&&c.reverse();return c}
function sn(a,b){if(!a.f)return M(!0);for(var c=!1,d=a.f.length-1;0<=d;--d){var e=a.f[d];if(e.ga<=b)break;a.f.pop();e.b!==e.d&&(c=!0)}if(!c)return M(!0);var f=L("clearFootnotes"),g=a.e+a.Ga,k=a.f;a.l=null;a.f=null;var h=0;tf(function(){for(;h<k.length;){var b=k[h++],b=cn(a,b.ga,b.d,g);if(b.Aa())return b}return M(!1)}).then(function(){O(f,!0)});return N(f)}
function Hm(a,b,c){var d=b.e,e;if(c)e=c=1;else{for(e=d[0];e.parent&&e.b;)e=e.parent;c=Math.max((e.l.widows||2)-0,1);e=Math.max((e.l.orphans||2)-0,1)}var f=nn(a,d),g=a.oa,d=Za(f.length,function(b){return a.b?f[b]<g:f[b]>g}),d=Math.min(f.length-c,d);if(d<e)return null;g=f[d-1];if(b=on(a,b.e,g))a.e=(a.b?-1:1)*(g-a.Ga);return b}
function pn(a,b,c,d){var e=b;c=c||null!=b.C&&1==b.C.nodeType&&!b.K;do{var f=e.C.parentNode;if(!f)break;var g=f,k=e.C;if(g)for(var h=void 0;(h=g.lastChild)!=k;)g.removeChild(h);c&&(f.removeChild(e.C),c=!1);e=e.parent}while(e);d&&ln(b,!0);return sn(a,b.ga)}
function tn(a,b,c){var d=L("findAcceptableBreak"),e=null,f=0,g=0;do for(var f=g,g=Number.MAX_VALUE,k=a.A.length-1;0<=k&&!e;--k){var e=a.A[k].d(a,f),h=a.A[k].b();h>f&&(g=Math.min(g,h))}while(g>f&&!e);var l=!1;if(!e){v.b("Could not find any page breaks?!!");if(a.qd)return un(a,b).then(function(b){b?(b=b.modify(),b.e=!1,pn(a,b,l,!0).then(function(){O(d,b)})):O(d,b)}),N(d);e=c;l=!0}pn(a,e,l,!0).then(function(){O(d,e)});return N(d)}
function vn(a){a=a.toString();return""==a||"auto"==a||!!a.match(/^0+(.0*)?[^0-9]/)}function wn(a,b,c,d,e){if(!b)return!1;var f=Fm(b,0,a.b),g=Nm(a,f);c&&(f+=qn(a,c));kn(a,f);if(d||!g)b=new Im(pi(b),e,g,a.e),a.A.push(b);return g}
function xn(a,b){if(b.C.parentNode){var c=$m(a,b.C),d=b.C.ownerDocument.createElement("div");a.b?(d.style.bottom="0px",d.style.width="1px",d.style.marginRight=c.right+"px"):(d.style.right="0px",d.style.height="1px",d.style.marginTop=c.top+"px");b.C.parentNode.insertBefore(d,b.C);var e=d.getBoundingClientRect(),e=a.b?e.right:e.top,f=a.b?-1:1,g;switch(b.u){case "left":g=a.zc;break;case "right":g=a.Ac;break;default:g=f*Math.max(a.Ac*f,a.zc*f)}e*f>=g*f?b.C.parentNode.removeChild(d):(e=Math.max(1,(g-e)*
f),a.b?d.style.width=e+"px":d.style.height=e+"px",e=d.getBoundingClientRect(),e=a.b?e.left:e.bottom,a.b?(g=e+c.right-g,0<g==0<=c.right&&(g+=c.right),d.style.marginLeft=g+"px"):(g-=e+c.top,0<g==0<=c.top&&(g+=c.top),d.style.marginBottom=g+"px"))}}
function yn(a,b,c){function d(){b=l[0]||b;b.C.parentNode.removeChild(b.C);e.u=k}var e=a,f=L("skipEdges"),g=c&&b&&b.K,k=null,h=null,l=[],m=[],p=!1;uf(function(a){for(;b;){do if(b.C){if(b.b&&1!=b.C.nodeType){if(fi(b.C,b.w))break;if(!b.K){!c&&Bm[k]?d():wn(e,h,null,!0,k)?(b=(h||b).modify(),b.e=!0):(b=b.modify(),b.g=k);P(a);return}}if(!b.K&&(b.u&&xn(e,b),b.j||b.A)){l.push(pi(b));k=Dm(k,b.g);!c&&Bm[k]?d():wn(e,h,null,!0,k)&&(b=(h||b).modify(),b.e=!0);P(a);return}if(1==b.C.nodeType){var f=b.C.style;if(b.K){if(p){if(!c&&
Bm[k]){d();P(a);return}l=[];g=c=!1;k=null}p=!1;h=pi(b);m.push(h);k=Dm(k,b.D);if(f&&(!vn(f.paddingBottom)||!vn(f.borderBottomWidth))){if(wn(e,h,null,!0,k)){b=(h||b).modify();b.e=!0;P(a);return}m=[h];h=null}}else{l.push(pi(b));k=Dm(k,b.g);if(Em[b.C.localName]){!c&&Bm[k]?d():wn(e,h,null,!0,k)&&(b=(h||b).modify(),b.e=!0);P(a);return}!f||vn(f.paddingTop)&&vn(f.borderTopWidth)||(g=!1,m=[]);p=!0}}}while(0);f=um(e.g,b,g);if(f.Aa()){f.then(function(c){b=c;wf(a)});return}b=f.fc()}wn(e,h,m,!1,k)&&h&&(b=h.modify(),
b.e=!0);P(a)}).then(function(){O(f,b)});return N(f)}
function un(a,b){var c=b,d=L("skipEdges"),e=null,f=!1;uf(function(d){for(;b;){do if(b.C){if(b.b&&1!=b.C.nodeType){if(fi(b.C,b.w))break;if(!b.K){Bm[e]&&(a.u=e);P(d);return}}if(!b.K&&(b.j||b.A)){e=Dm(e,b.g);Bm[e]&&(a.u=e);P(d);return}if(1==b.C.nodeType){var k=b.C.style;if(b.K){if(f){if(Bm[e]){a.u=e;P(d);return}e=null}f=!1;e=Dm(e,b.D)}else{e=Dm(e,b.g);if(Em[b.C.localName]){Bm[e]&&(a.u=e);P(d);return}if(k&&(!vn(k.paddingTop)||!vn(k.borderTopWidth))){P(d);return}}f=!0}}while(0);k=um(a.g,b);if(k.Aa()){k.then(function(a){b=
a;wf(d)});return}b=k.fc()}c=null;P(d)}).then(function(){O(d,c)});return N(d)}function Tm(a,b){return"footnote"==b.j?hn(a,b):jn(a,b)}function zn(a,b,c){var d=L("layoutNext");yn(a,b,c).then(function(c){b=c;if(!b||a.u||b.e)O(d,b);else if(b.j)Tm(a,b).ra(d);else{a:if(b.K)c=!0;else{switch(b.Y.namespaceURI){case "http://www.w3.org/2000/svg":c=!1;break a}c=!b.A}c?rn(a,b).ra(d):Um(a,b).ra(d)}});return N(d)}
function en(a){var b=a.d.ownerDocument.createElement("div");b.style.position="absolute";b.style.top=a.k+"px";b.style.right=a.H+"px";b.style.bottom=a.w+"px";b.style.left=a.j+"px";a.d.appendChild(b);var c=b.getBoundingClientRect();a.d.removeChild(b);var b=a.D+a.left+zi(a),d=a.F+a.top+xi(a);a.h=new ve(b,d,b+a.width,d+a.height);a.La=c?a.b?c.top:c.left:0;a.pd=c?a.b?c.bottom:c.right:0;a.Ga=c?a.b?c.right:c.top:0;a.bb=c?a.b?c.left:c.bottom:0;a.zc=a.Ga;a.Ac=a.Ga;a.oa=a.bb;c=a.h;b=a.D+a.left+zi(a);d=a.F+a.top+
xi(a);b=a.rb?De(a.rb,b,d):Fe(b,d,b+a.width,d+a.height);a.Qa=Pe(c,[b],a.N,a.Ka,a.b);Xm(a);a.f=null}function dn(a){a.ab=[];w(a.d,"width",a.width+"px");w(a.d,"height",a.height+"px");en(a);a.e=0;a.ad=!1;a.u=null}function kn(a,b){a.e=Math.max((a.b?-1:1)*(b-a.Ga),a.e)}function An(a,b){var c=b.b;if(!c)return M(!0);var d=L("layoutOverflownFootnotes"),e=0;tf(function(){for(;e<c.length;){var b=c[e++],b=cn(a,0,b,a.Ga);if(b.Aa())return b}return M(!1)}).then(function(){O(d,!0)});return N(d)}
function gn(a,b){a.ab.push(b);if(a.ad)return M(b);var c=L("layout");An(a,b).then(function(){Pm(a,b.Ta).then(function(b){var e=b,f=!0;a.A=[];uf(function(c){for(;b;){var k=!0;zn(a,b,f).then(function(h){f=!1;b=h;0<a.g.f.b.length?P(c):a.u?P(c):b&&b.e?tn(a,b,e).then(function(a){b=a;P(c)}):k?k=!1:wf(c)});if(k){k=!1;return}}P(c)}).then(function(){var e=a.l;e&&(a.d.appendChild(e.d),a.b?a.e=this.Ga-this.bb:a.e=e.top+xi(e)+e.e+yi(e));if(b)if(0<a.g.f.b.length)O(c,null);else{a.ad=!0;e=new si(ri(b));if(a.f){for(var f=
[],h=0;h<a.f.length;h++){var l=a.f[h].b;l&&f.push(l)}e.b=f.length?f:null}O(c,e)}else O(c,null)})})});return N(c)}function fn(a){for(var b=a.ab,c=a.d.lastChild;c!=a.$c;){var d=c.previousSibling;a.d===c.parentNode&&dm(c)||a.d.removeChild(c);c=d}Wm(a);dn(a);var e=L("redoLayout"),f=0,g=null;uf(function(c){if(f<b.length){var d=b[f++];gn(a,d).then(function(a){a?(g=a,P(c)):wf(c)})}else P(c)}).then(function(){O(e,g)});return N(e)};function Bn(a,b){this.e(a,"end",b)}function Cn(a,b){this.e(a,"start",b)}function Dn(a,b,c){c||(c=this.g.now());var d=this.f[a];d||(d=this.f[a]=[]);var e;for(a=d.length-1;0<=a&&(!(e=d[a])||e[b]);a--)e=null;e||(e={},d.push(e));e[b]=c}function En(){}function Fn(a){this.g=a;this.f={};this.registerEndTiming=this.d=this.registerStartTiming=this.b=this.e=En}
Fn.prototype.h=function(){var a=this.f,b="";Object.keys(a).forEach(function(c){for(var d=a[c],e=d.length,f=0;f<e;f++){var g=d[f];b+=c;1<e&&(b+="("+f+")");b+=" => start: "+g.start+", end: "+g.end+", duration: "+(g.end-g.start)+"\n"}});v.e(b)};Fn.prototype.j=function(){this.registerEndTiming=this.d=this.registerStartTiming=this.b=this.e=En};Fn.prototype.k=function(){this.e=Dn;this.registerStartTiming=this.b=Cn;this.registerEndTiming=this.d=Bn};
var Gn={now:Date.now},Hn,In=Hn=new Fn(window&&window.performance||Gn);Dn.call(In,"load_vivliostyle","start",void 0);ca("vivliostyle.profile.profiler",In);Fn.prototype.printTimings=Fn.prototype.h;Fn.prototype.disable=Fn.prototype.j;Fn.prototype.enable=Fn.prototype.k;function Jn(a,b,c){function d(c){return a.b.getComputedStyle(b,null).getPropertyValue(c)}function e(){w(b,"display","block");w(b,"position","static");return d(W)}function f(){w(b,"display","inline-block");w(r,W,"99999999px");var a=d(W);w(r,W,"");return a}function g(){w(b,"display","inline-block");w(r,W,"0");var a=d(W);w(r,W,"");return a}function k(){var a=e(),b=g(),c=parseFloat(a);if(c<=parseFloat(b))return b;b=f();return c<=parseFloat(b)?a:b}function h(){throw Error("Getting fill-available block size is not implemented");
}var l=b.style.display,m=b.style.position,p=b.style.width,q=b.style.height,u=b.parentNode,r=b.ownerDocument.createElement("div");w(r,"position",m);u.insertBefore(r,b);r.appendChild(b);w(b,"width","auto");w(b,"height","auto");var y=d(Pa["writing-mode"])||d("writing-mode"),J="vertical-rl"===y||"tb-rl"===y||"vertical-lr"===y||"tb-lr"===y,W=J?"height":"width",ma=J?"width":"height",X={};c.forEach(function(a){var c;switch(a){case "fill-available inline size":c=e();break;case "max-content inline size":c=
f();break;case "min-content inline size":c=g();break;case "fit-content inline size":c=k();break;case "fill-available block size":c=h();break;case "max-content block size":case "min-content block size":case "fit-content block size":c=d(ma);break;case "fill-available width":c=J?h():e();break;case "fill-available height":c=J?e():h();break;case "max-content width":c=J?d(ma):f();break;case "max-content height":c=J?f():d(ma);break;case "min-content width":c=J?d(ma):g();break;case "min-content height":c=
J?g():d(ma);break;case "fit-content width":c=J?d(ma):k();break;case "fit-content height":c=J?k():d(ma)}X[a]=parseFloat(c);w(b,"position",m);w(b,"display",l)});w(b,"width",p);w(b,"height",q);u.insertBefore(b,r);u.removeChild(r);return X};function Kn(a){var b=a["writing-mode"],b=b&&b.value;a=(a=a.direction)&&a.value;return b===le||b!==me&&a!==he?"ltr":"rtl"}
var Ln={a5:{width:new I(148,"mm"),height:new I(210,"mm")},a4:{width:new I(210,"mm"),height:new I(297,"mm")},a3:{width:new I(297,"mm"),height:new I(420,"mm")},b5:{width:new I(176,"mm"),height:new I(250,"mm")},b4:{width:new I(250,"mm"),height:new I(353,"mm")},"jis-b5":{width:new I(182,"mm"),height:new I(257,"mm")},"jis-b4":{width:new I(257,"mm"),height:new I(364,"mm")},letter:{width:new I(8.5,"in"),height:new I(11,"in")},legal:{width:new I(8.5,"in"),height:new I(14,"in")},ledger:{width:new I(11,"in"),
height:new I(17,"in")}},Mn=new I(.24,"pt"),Nn=new I(3,"mm"),On=new I(10,"mm"),Pn=new I(13,"mm");
function Qn(a){var b={width:qe,height:re,Bb:se,ub:se},c=a.size;if(c&&c.value!==Dd){var d=c.value;d.Oc()?(c=d.values[0],d=d.values[1]):(c=d,d=null);if(c.Sb())b.width=c,b.height=d||c;else if(c=Ln[c.name.toLowerCase()])d&&d===Vd?(b.width=c.height,b.height=c.width):(b.width=c.width,b.height=c.height)}(c=a.marks)&&c.value!==Zd&&(b.ub=Pn);a=a.bleed;a&&a.value!==Dd?a.value&&a.value.Sb()&&(b.Bb=a.value):c&&(a=!1,c.value.Oc()?a=c.value.values.some(function(a){return a===Jd}):a=c.value===Jd,a&&(b.Bb=new I(6,
"pt")));return b}function Rn(a,b){var c={},d=a.Bb.B*yc(b,a.Bb.fa,!1),e=a.ub.B*yc(b,a.ub.fa,!1),f=d+e,g=a.width;c.lb=g===qe?(b.R.Wa?Math.floor(b.sa/2)-b.R.Fb:b.sa)-2*f:g.B*yc(b,g.fa,!1);g=a.height;c.kb=g===re?b.Qa-2*f:g.B*yc(b,g.fa,!1);c.Bb=d;c.ub=e;c.Fc=f;return c}function Sn(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg","svg");a.setAttribute("width",b);a.setAttribute("height",c);a.style.position="absolute";return a}
function Tn(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg",c||"polyline");a.setAttribute("stroke","black");a.setAttribute("stroke-width",b);a.setAttribute("fill","none");return a}var Un={he:"top left",ie:"top right",Zd:"bottom left",$d:"bottom right"};
function Vn(a,b,c,d,e,f){var g=d;g<=e+2*uc.mm&&(g=e+d/2);var k=Math.max(d,g),h=e+k+c/2,l=Sn(a,h,h),g=[[0,e+d],[d,e+d],[d,e+d-g]];d=g.map(function(a){return[a[1],a[0]]});if("top right"===b||"bottom right"===b)g=g.map(function(a){return[e+k-a[0],a[1]]}),d=d.map(function(a){return[e+k-a[0],a[1]]});if("bottom left"===b||"bottom right"===b)g=g.map(function(a){return[a[0],e+k-a[1]]}),d=d.map(function(a){return[a[0],e+k-a[1]]});h=Tn(a,c);h.setAttribute("points",g.map(function(a){return a.join(",")}).join(" "));
l.appendChild(h);a=Tn(a,c);a.setAttribute("points",d.map(function(a){return a.join(",")}).join(" "));l.appendChild(a);b.split(" ").forEach(function(a){l.style[a]=f+"px"});return l}var Wn={ge:"top",Yd:"bottom",Dd:"left",Ed:"right"};
function Xn(a,b,c,d,e){var f=2*d,g;"top"===b||"bottom"===b?(g=f,f=d):g=d;var k=Sn(a,g,f),h=Tn(a,c);h.setAttribute("points","0,"+f/2+" "+g+","+f/2);k.appendChild(h);h=Tn(a,c);h.setAttribute("points",g/2+",0 "+g/2+","+f);k.appendChild(h);a=Tn(a,c,"circle");a.setAttribute("cx",g/2);a.setAttribute("cy",f/2);a.setAttribute("r",d/4);k.appendChild(a);var l;switch(b){case "top":l="bottom";break;case "bottom":l="top";break;case "left":l="right";break;case "right":l="left"}Object.keys(Wn).forEach(function(a){a=
Wn[a];a===b?k.style[a]=e+"px":a!==l&&(k.style[a]="0",k.style["margin-"+a]="auto")});return k}function Yn(a,b,c,d){var e=!1,f=!1;if(a=a.marks)a=a.value,a.Oc()?a.values.forEach(function(a){a===Jd?e=!0:a===Kd&&(f=!0)}):a===Jd?e=!0:a===Kd&&(f=!0);if(e||f){var g=c.M,k=g.ownerDocument,h=b.Bb,l=zd(Mn,d),m=zd(Nn,d),p=zd(On,d);e&&Object.keys(Un).forEach(function(a){a=Vn(k,Un[a],l,p,h,m);g.appendChild(a)});f&&Object.keys(Wn).forEach(function(a){a=Xn(k,Wn[a],l,p,m);g.appendChild(a)})}}
var Zn=function(){var a={width:!0,height:!0,"block-size":!0,"inline-size":!0,margin:!0,padding:!0,border:!0,outline:!0,"outline-width":!0,"outline-style":!0,"outline-color":!0};"left right top bottom before after start end block-start block-end inline-start inline-end".split(" ").forEach(function(b){a["margin-"+b]=!0;a["padding-"+b]=!0;a["border-"+b+"-width"]=!0;a["border-"+b+"-style"]=!0;a["border-"+b+"-color"]=!0});return a}(),$n={"top-left-corner":{O:1,wa:!0,ta:!1,ua:!0,va:!0,ja:null},"top-left":{O:2,
wa:!0,ta:!1,ua:!1,va:!1,ja:"start"},"top-center":{O:3,wa:!0,ta:!1,ua:!1,va:!1,ja:"center"},"top-right":{O:4,wa:!0,ta:!1,ua:!1,va:!1,ja:"end"},"top-right-corner":{O:5,wa:!0,ta:!1,ua:!1,va:!0,ja:null},"right-top":{O:6,wa:!1,ta:!1,ua:!1,va:!0,ja:"start"},"right-middle":{O:7,wa:!1,ta:!1,ua:!1,va:!0,ja:"center"},"right-bottom":{O:8,wa:!1,ta:!1,ua:!1,va:!0,ja:"end"},"bottom-right-corner":{O:9,wa:!1,ta:!0,ua:!1,va:!0,ja:null},"bottom-right":{O:10,wa:!1,ta:!0,ua:!1,va:!1,ja:"end"},"bottom-center":{O:11,wa:!1,
ta:!0,ua:!1,va:!1,ja:"center"},"bottom-left":{O:12,wa:!1,ta:!0,ua:!1,va:!1,ja:"start"},"bottom-left-corner":{O:13,wa:!1,ta:!0,ua:!0,va:!1,ja:null},"left-bottom":{O:14,wa:!1,ta:!1,ua:!0,va:!1,ja:"end"},"left-middle":{O:15,wa:!1,ta:!1,ua:!0,va:!1,ja:"center"},"left-top":{O:16,wa:!1,ta:!1,ua:!0,va:!1,ja:"start"}},ao=Object.keys($n).sort(function(a,b){return $n[a].O-$n[b].O});
function bo(a,b,c){jl.call(this,a,null,"vivliostyle-page-rule-master",[],b,null,0);a=Qn(c);new co(this.d,this,c,a);this.l={};eo(this,c);this.b.position=new T(de,0);this.b.width=new T(a.width,0);this.b.height=new T(a.height,0);for(var d in c)Zn[d]||"background-clip"===d||(this.b[d]=c[d])}t(bo,jl);function eo(a,b){var c=b._marginBoxes;c&&ao.forEach(function(d){c[d]&&(a.l[d]=new fo(a.d,a,d,b))})}bo.prototype.f=function(a){return new go(a,this)};
function co(a,b,c,d){nl.call(this,a,null,null,[],b);this.u=d;this.b["z-index"]=new T(new vd(0),0);this.b["flow-from"]=new T(H("body"),0);this.b.position=new T(Ad,0);this.b.overflow=new T(ne,0);for(var e in Zn)Zn.hasOwnProperty(e)&&(this.b[e]=c[e])}t(co,nl);co.prototype.f=function(a){return new ho(a,this)};
function fo(a,b,c,d){nl.call(this,a,null,null,[],b);this.k=c;a=d._marginBoxes[this.k];for(var e in d)if(b=d[e],c=a[e],Ri[e]||c&&c.value===Rd)this.b[e]=b;for(e in a)Object.prototype.hasOwnProperty.call(a,e)&&(b=a[e])&&b.value!==Rd&&(this.b[e]=b)}t(fo,nl);fo.prototype.f=function(a){return new io(a,this)};function go(a,b){kl.call(this,a,b);this.j=null;this.pa={}}t(go,kl);
go.prototype.h=function(a,b){var c=this.D,d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d))switch(d){case "writing-mode":case "direction":c[d]=b[d]}kl.prototype.h.call(this,a,b)};go.prototype.Lc=function(){var a=this.style;a.left=se;a["margin-left"]=se;a["border-left-width"]=se;a["padding-left"]=se;a["padding-right"]=se;a["border-right-width"]=se;a["margin-right"]=se;a.right=se};
go.prototype.Mc=function(){var a=this.style;a.top=se;a["margin-top"]=se;a["border-top-width"]=se;a["padding-top"]=se;a["padding-bottom"]=se;a["border-bottom-width"]=se;a["margin-bottom"]=se;a.bottom=se};go.prototype.Z=function(a,b,c){b=b.u;var d={start:this.j.marginLeft,end:this.j.marginRight,$:this.j.Db},e={start:this.j.marginTop,end:this.j.marginBottom,$:this.j.Cb};jo(this,b.top,!0,d,a,c);jo(this,b.bottom,!0,d,a,c);jo(this,b.left,!1,e,a,c);jo(this,b.right,!1,e,a,c)};
function ko(a,b,c,d,e){this.M=a;this.l=e;this.g=c;this.k=!Y(d,b[c?"width":"height"],new Zc(d,0,"px"));this.h=null}ko.prototype.b=function(){return this.k};function lo(a){a.h||(a.h=Jn(a.l,a.M.d,a.g?["max-content width","min-content width"]:["max-content height","min-content height"]));return a.h}ko.prototype.e=function(){var a=lo(this);return this.g?zi(this.M)+a["max-content width"]+Ai(this.M):xi(this.M)+a["max-content height"]+yi(this.M)};
ko.prototype.f=function(){var a=lo(this);return this.g?zi(this.M)+a["min-content width"]+Ai(this.M):xi(this.M)+a["min-content height"]+yi(this.M)};ko.prototype.d=function(){return this.g?zi(this.M)+this.M.width+Ai(this.M):xi(this.M)+this.M.height+yi(this.M)};function mo(a){this.g=a}mo.prototype.b=function(){return this.g.some(function(a){return a.b()})};mo.prototype.e=function(){var a=this.g.map(function(a){return a.e()});return Math.max.apply(null,a)*a.length};
mo.prototype.f=function(){var a=this.g.map(function(a){return a.f()});return Math.max.apply(null,a)*a.length};mo.prototype.d=function(){var a=this.g.map(function(a){return a.d()});return Math.max.apply(null,a)*a.length};function no(a,b,c,d,e,f){ko.call(this,a,b,c,d,e);this.j=f}t(no,ko);no.prototype.b=function(){return!1};no.prototype.e=function(){return this.d()};no.prototype.f=function(){return this.d()};no.prototype.d=function(){return this.g?zi(this.M)+this.j+Ai(this.M):xi(this.M)+this.j+yi(this.M)};
function jo(a,b,c,d,e,f){var g=a.d.d,k={},h={},l={},m;for(m in b){var p=$n[m];if(p){var q=b[m],u=a.pa[m],r=new ko(q,u.style,c,g,f);k[p.ja]=q;h[p.ja]=u;l[p.ja]=r}}a=d.start.evaluate(e);d.end.evaluate(e);b=d.$.evaluate(e);var y=oo(l,b),J=!1,W={};Object.keys(k).forEach(function(a){var b=Y(g,h[a].style[c?"max-width":"max-height"],d.$);b&&(b=b.evaluate(e),y[a]>b&&(b=l[a]=new no(k[a],h[a].style,c,g,f,b),W[a]=b.d(),J=!0))});J&&(y=oo(l,b),J=!1,["start","center","end"].forEach(function(a){y[a]=W[a]||y[a]}));
var ma={};Object.keys(k).forEach(function(a){var b=Y(g,h[a].style[c?"min-width":"min-height"],d.$);b&&(b=b.evaluate(e),y[a]<b&&(b=l[a]=new no(k[a],h[a].style,c,g,f,b),ma[a]=b.d(),J=!0))});J&&(y=oo(l,b),["start","center","end"].forEach(function(a){y[a]=ma[a]||y[a]}));var X=a+b,F=a+(a+b);["start","center","end"].forEach(function(a){var b=y[a];if(b){var d=k[a],e=0;switch(a){case "start":e=c?d.left:d.top;break;case "center":e=(F-b)/2;break;case "end":e=X-b}c?Di(d,e,b-zi(d)-Ai(d)):Ci(d,e,b-xi(d)-yi(d))}})}
function oo(a,b){var c=a.start,d=a.center,e=a.end,f={};if(d){var g=[c,e].filter(function(a){return a}),g=po(d,g.length?new mo(g):null,b);g.Pa&&(f.center=g.Pa);d=g.Pa||d.d();d=(b-d)/2;c&&c.b()&&(f.start=d);e&&e.b()&&(f.end=d)}else c=po(c,e,b),c.Pa&&(f.start=c.Pa),c.dc&&(f.end=c.dc);return f}
function po(a,b,c){var d={Pa:null,dc:null};if(a&&b)if(a.b()&&b.b()){var e=a.e(),f=b.e();0<e&&0<f?(f=e+f,f<c?d.Pa=c*e/f:(a=a.f(),b=b.f(),b=a+b,b<c?d.Pa=a+(c-b)*(e-a)/(f-b):0<b&&(d.Pa=c*a/b)),0<d.Pa&&(d.dc=c-d.Pa)):0<e?d.Pa=c:0<f&&(d.dc=c)}else a.b()?d.Pa=Math.max(c-b.d(),0):b.b()&&(d.dc=Math.max(c-a.d(),0));else a?a.b()&&(d.Pa=c):b&&b.b()&&(d.dc=c);return d}go.prototype.mb=function(a,b,c,d){go.Cd.mb.call(this,a,b,c,d);b.d.setAttribute("data-vivliostyle-page-box",!0)};
function ho(a,b){ol.call(this,a,b);this.marginLeft=this.marginBottom=this.marginRight=this.marginTop=this.Cb=this.Db=null}t(ho,ol);
ho.prototype.h=function(a,b){var c=this.D,d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(d.match(/^column.*$/)||d.match(/^background-/))&&(c[d]=b[d]);ol.prototype.h.call(this,a,b);d=this.e;c={Db:this.Db,Cb:this.Cb,marginTop:this.marginTop,marginRight:this.marginRight,marginBottom:this.marginBottom,marginLeft:this.marginLeft};d.j=c;d=d.style;d.width=new K(c.Db);d.height=new K(c.Cb);d["padding-left"]=new K(c.marginLeft);d["padding-right"]=new K(c.marginRight);d["padding-top"]=new K(c.marginTop);
d["padding-bottom"]=new K(c.marginBottom)};ho.prototype.Lc=function(){var a=qo(this,{start:"left",end:"right",$:"width"});this.Db=a.sd;this.marginLeft=a.Ad;this.marginRight=a.zd};ho.prototype.Mc=function(){var a=qo(this,{start:"top",end:"bottom",$:"height"});this.Cb=a.sd;this.marginTop=a.Ad;this.marginBottom=a.zd};
function qo(a,b){var c=a.style,d=a.d.d,e=b.start,f=b.end,g=b.$,k=a.d.u[g].ia(d,null),h=Y(d,c[g],k),l=Y(d,c["margin-"+e],k),m=Y(d,c["margin-"+f],k),p=pl(d,c["padding-"+e],k),q=pl(d,c["padding-"+f],k),u=rl(d,c["border-"+e+"-width"],c["border-"+e+"-style"],k),r=rl(d,c["border-"+f+"-width"],c["border-"+f+"-style"],k),y=E(d,k,D(d,D(d,u,p),D(d,r,q)));h?(y=E(d,y,h),l||m?l?m=E(d,y,l):l=E(d,y,m):m=l=gd(d,y,new pc(d,.5))):(l||(l=d.b),m||(m=d.b),h=E(d,y,D(d,l,m)));c[e]=new K(l);c[f]=new K(m);c["margin-"+e]=
se;c["margin-"+f]=se;c["padding-"+e]=new K(p);c["padding-"+f]=new K(q);c["border-"+e+"-width"]=new K(u);c["border-"+f+"-width"]=new K(r);c[g]=new K(h);c["max-"+g]=new K(h);return{sd:E(d,k,D(d,l,m)),Ad:l,zd:m}}ho.prototype.mb=function(a,b,c,d){ol.prototype.mb.call(this,a,b,c,d);c.w=b.d};function io(a,b){ol.call(this,a,b);var c=b.k;this.j=$n[c];a.pa[c]=this;this.sa=!0}t(io,ol);n=io.prototype;
n.mb=function(a,b,c,d){var e=b.d;w(e,"display","flex");var f=Bl(this,a,"vertical-align"),g=null;f===H("middle")?g="center":f===H("top")?g="flex-start":f===H("bottom")&&(g="flex-end");g&&(w(e,"flex-flow",this.b?"row":"column"),w(e,"justify-content",g));ol.prototype.mb.call(this,a,b,c,d)};
n.ja=function(a,b){var c=this.style,d=this.d.d,e=a.start,f=a.end,g="left"===e,k=g?b.Db:b.Cb,h=Y(d,c[a.$],k),g=g?b.marginLeft:b.marginTop;if("start"===this.j.ja)c[e]=new K(g);else if(h){var l=pl(d,c["margin-"+e],k),m=pl(d,c["margin-"+f],k),p=pl(d,c["padding-"+e],k),q=pl(d,c["padding-"+f],k),u=rl(d,c["border-"+e+"-width"],c["border-"+e+"-style"],k),f=rl(d,c["border-"+f+"-width"],c["border-"+f+"-style"],k),h=D(d,h,D(d,D(d,p,q),D(d,D(d,u,f),D(d,l,m))));switch(this.j.ja){case "center":c[e]=new K(D(d,g,
hd(d,E(d,k,h),new pc(d,2))));break;case "end":c[e]=new K(E(d,D(d,g,k),h))}}};
function ro(a,b,c){function d(a){if(y)return y;y={$:r?r.evaluate(a):null,Ia:h?h.evaluate(a):null,Ja:l?l.evaluate(a):null};var b=k.evaluate(a),c=0;[q,m,p,u].forEach(function(b){b&&(c+=b.evaluate(a))});(null===y.Ia||null===y.Ja)&&c+y.$+y.Ia+y.Ja>b&&(null===y.Ia&&(y.Ia=0),null===y.Ja&&(y.ne=0));null!==y.$&&null!==y.Ia&&null!==y.Ja&&(y.Ja=null);null===y.$&&null!==y.Ia&&null!==y.Ja?y.$=b-c-y.Ia-y.Ja:null!==y.$&&null===y.Ia&&null!==y.Ja?y.Ia=b-c-y.$-y.Ja:null!==y.$&&null!==y.Ia&&null===y.Ja?y.Ja=b-c-y.$-
y.Ia:null===y.$?(y.Ia=y.Ja=0,y.$=b-c):y.Ia=y.Ja=(b-c-y.$)/2;return y}var e=a.style;a=a.d.d;var f=b.Nc,g=b.Rc;b=b.$;var k=c["margin"+g.charAt(0).toUpperCase()+g.substring(1)],h=ql(a,e["margin-"+f],k),l=ql(a,e["margin-"+g],k),m=pl(a,e["padding-"+f],k),p=pl(a,e["padding-"+g],k),q=rl(a,e["border-"+f+"-width"],e["border-"+f+"-style"],k),u=rl(a,e["border-"+g+"-width"],e["border-"+g+"-style"],k),r=Y(a,e[b],k),y=null;e[b]=new K(new rc(a,function(){var a=d(this).$;return null===a?0:a},b));e["margin-"+f]=new K(new rc(a,
function(){var a=d(this).Ia;return null===a?0:a},"margin-"+f));e["margin-"+g]=new K(new rc(a,function(){var a=d(this).Ja;return null===a?0:a},"margin-"+g));"left"===f?e.left=new K(D(a,c.marginLeft,c.Db)):"top"===f&&(e.top=new K(D(a,c.marginTop,c.Cb)))}n.Lc=function(){var a=this.e.j;this.j.ua?ro(this,{Nc:"right",Rc:"left",$:"width"},a):this.j.va?ro(this,{Nc:"left",Rc:"right",$:"width"},a):this.ja({start:"left",end:"right",$:"width"},a)};
n.Mc=function(){var a=this.e.j;this.j.wa?ro(this,{Nc:"bottom",Rc:"top",$:"height"},a):this.j.ta?ro(this,{Nc:"top",Rc:"bottom",$:"height"},a):this.ja({start:"top",end:"bottom",$:"height"},a)};n.ic=function(a,b,c,d,e,f,g){ol.prototype.ic.call(this,a,b,c,d,e,f,g);a=c.u;c=this.d.k;d=this.j;d.ua||d.va?d.wa||d.ta||(d.ua?a.left[c]=b:d.va&&(a.right[c]=b)):d.wa?a.top[c]=b:d.ta&&(a.bottom[c]=b)};
function so(a,b,c,d,e){this.b=a;this.h=b;this.f=c;this.d=d;this.e=e;this.g={};a=this.h;b=new $c(a,"page-number");b=new Sc(a,new Yc(a,b,new pc(a,2)),a.b);c=new Ic(a,b);a.values["recto-page"]=c;a.values["verso-page"]=b;"ltr"===Kn(this.e)?(a.values["left-page"]=b,b=new Ic(a,b),a.values["right-page"]=b):(c=new Ic(a,b),a.values["left-page"]=c,a.values["right-page"]=b)}function to(a){var b={};nk(a.b,[],"",b);a.b.pop();return b}
function uo(a,b){var c=[],d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d)){var e=b[d],f;f=e instanceof T?e.value+"":uo(a,e);c.push(d+f+(e.Ea||""))}return c.sort().join("^")}function vo(a){this.b=null;this.f=a}t(vo,U);vo.prototype.apply=function(a){a.N===this.f&&this.b.apply(a)};vo.prototype.d=function(){return 3};vo.prototype.e=function(a){this.b&&qj(a.Ub,this.f,this.b);return!0};function wo(a){this.b=null;this.f=a}t(wo,U);
wo.prototype.apply=function(a){1===(new $c(this.f,"page-number")).evaluate(a.g)&&this.b.apply(a)};wo.prototype.d=function(){return 2};function xo(a){this.b=null;this.f=a}t(xo,U);xo.prototype.apply=function(a){(new $c(this.f,"left-page")).evaluate(a.g)&&this.b.apply(a)};xo.prototype.d=function(){return 1};function yo(a){this.b=null;this.f=a}t(yo,U);yo.prototype.apply=function(a){(new $c(this.f,"right-page")).evaluate(a.g)&&this.b.apply(a)};yo.prototype.d=function(){return 1};
function zo(a){this.b=null;this.f=a}t(zo,U);zo.prototype.apply=function(a){(new $c(this.f,"recto-page")).evaluate(a.g)&&this.b.apply(a)};zo.prototype.d=function(){return 1};function Ao(a){this.b=null;this.f=a}t(Ao,U);Ao.prototype.apply=function(a){(new $c(this.f,"verso-page")).evaluate(a.g)&&this.b.apply(a)};Ao.prototype.d=function(){return 1};function Bo(a,b){oj.call(this,a,b,null,null)}t(Bo,oj);
Bo.prototype.apply=function(a){var b=a.g,c=a.w,d=this.style;a=this.S;ij(b,c,d,a,null,null);if(d=d._marginBoxes){var c=gj(c,"_marginBoxes"),e;for(e in d)if(d.hasOwnProperty(e)){var f=c[e];f||(f={},c[e]=f);ij(b,f,d[e],a,null,null)}}};function Co(a,b,c,d,e){vk.call(this,a,b,null,c,null,d,!1);this.H=e;this.w=[];this.e="";this.u=[]}t(Co,vk);n=Co.prototype;n.Hb=function(){this.eb()};n.fb=function(a,b){if(this.e=b)this.b.push(new vo(b)),this.S+=65536};
n.Vb=function(a,b){b&&Of(this,"E_INVALID_PAGE_SELECTOR :"+a+"("+b.join("")+")");this.u.push(":"+a);switch(a.toLowerCase()){case "first":this.b.push(new wo(this.d));this.S+=256;break;case "left":this.b.push(new xo(this.d));this.S+=1;break;case "right":this.b.push(new yo(this.d));this.S+=1;break;case "recto":this.b.push(new zo(this.d));this.S+=1;break;case "verso":this.b.push(new Ao(this.d));this.S+=1;break;default:Of(this,"E_INVALID_PAGE_SELECTOR :"+a)}};
function Do(a){var b;a.e||a.u.length?b=[a.e].concat(a.u.sort()):b=null;a.w.push({ld:b,S:a.S});a.e="";a.u=[]}n.Tb=function(){Do(this);vk.prototype.Tb.call(this)};n.na=function(){Do(this);vk.prototype.na.call(this)};
n.Za=function(a,b,c){if("bleed"!==a&&"marks"!==a||this.w.some(function(a){return null===a.ld})){vk.prototype.Za.call(this,a,b,c);var d=this.h[a],e=this.H;if("bleed"===a||"marks"===a)e[""]||(e[""]={}),Object.keys(e).forEach(function(b){fj(e[b],a,d)});else if("size"===a){var f=e[""];this.w.forEach(function(b){var c=new T(d.value,d.Ea+b.S);b=b.ld?b.ld.join(""):"";var h=e[b];h?(c=(b=h[a])?cj(null,c,b):c,fj(h,a,c)):(h=e[b]={},fj(h,a,c),f&&["bleed","marks"].forEach(function(a){f[a]&&fj(h,a,f[a])},this))},
this)}}};n.wd=function(a){qj(this.g.Ub,"*",a)};n.yd=function(a){return new Bo(this.h,a)};n.Wc=function(a){var b=gj(this.h,"_marginBoxes"),c=b[a];c||(c={},b[a]=c);Kf(this.aa,new Eo(this.d,this.aa,this.l,c))};function Eo(a,b,c,d){Lf.call(this,a,b,!1);this.e=c;this.b=d}t(Eo,Mf);Eo.prototype.Ya=function(a,b,c){kh(this.e,a,b,c,this)};Eo.prototype.Rb=function(a,b){Nf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};Eo.prototype.wc=function(a,b){Nf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
Eo.prototype.Za=function(a,b,c){fj(this.b,a,new T(b,c?Hf(this):If(this)))};function Fo(a){this.d=a;this.b={};this.b.page=[0]}function Go(a,b){Object.keys(b.b).forEach(function(a){this.b[a]=Array.b(b.b[a])},a)}function ek(a,b,c){return new rc(a.d,function(){var d=a.b[b];return c(d&&d.length?d[d.length-1]:null)},"page-counter-"+b)}function gk(a,b,c){return new rc(a.d,function(){return c(a.b[b]||[])},"page-counters-"+b)}
function Ho(a,b,c){var d,e=b["counter-reset"];e&&(e=e.evaluate(c))&&(d=wg(e,!0));if(d)for(var f in d){var e=a,g=f,k=d[f];e.b[g]?e.b[g].push(k):e.b[g]=[k]}var h;(b=b["counter-increment"])&&(c=b.evaluate(c))&&(h=wg(c,!1));h?"page"in h||(h.page=1):h={page:1};for(var l in h)a.b[l]||(c=a,b=l,c.b[b]?c.b[b].push(0):c.b[b]=[0]),c=a.b[l],c[c.length-1]+=h[l]};function Io(a,b,c,d,e,f,g,k,h,l){this.h=a;this.g=b;this.b=c;this.d=d;this.A=e;this.f=f;this.l=a.F;this.u=g;this.e=k;this.k=h;this.w=l;this.j=a.f;tc(this.b,function(a){return(a=this.b.b[a])?0<a.b.length&&a.b[0].b.b<=this.j:!1});sc(this.b,new rc(this.b,function(){return this.pa+this.b.d},"page-number"))}
function Jo(a,b,c,d){if(a.k.length){var e=new wc(0,b,c,d);a=a.k;for(var f={},g=0;g<a.length;g++)ij(e,f,a[g],0,null,null);g=f.width;a=f.height;var f=f["text-zoom"],k=1;if(g&&a||f){var h=uc.em;(f?f.evaluate(e,"text-zoom"):null)===fe&&(k=h/d,d=h,b*=k,c*=k);if(g&&a&&(g=zd(g.evaluate(e,"width"),e),e=zd(a.evaluate(e,"height"),e),0<g&&0<e))return{width:g,height:e,fontSize:d}}}return{width:b,height:c,fontSize:d}}
function Ko(a,b,c,d,e,f,g,k,h){wc.call(this,0,d.width,d.height,d.fontSize);this.style=a;this.ba=b;this.lang=b.lang||c;this.viewport=d;this.e={body:!0};this.g=e;this.b=this.w=this.d=this.l=null;this.j=0;this.La=f;this.f=new sh(this.style.l);this.oa={};this.H=null;this.k=new Fo(a.b);this.F={};this.ea=null;this.Fa=g;this.Ka=k;this.pa=h;for(var l in a.e)(b=a.e[l]["flow-consume"])&&(b.evaluate(this,"flow-consume")==Bd?this.e[l]=!0:delete this.e[l]);this.N={}}t(Ko,wc);
function Lo(a){var b=L("StyleInstance.init");a.d=new Ok(a.ba,a.style.d,a.style.g,a,a.e,a.style.j,a.k);al(a.d,a);a.w={};a.w[a.ba.url]=a.d;var c=Vk(a.d);a.ea=Kn(c);a.l=new Ql(a.style.A);var d=new kk(a.style.d,a,a.k);a.l.h(d,c);Pl(a.l,a);a.H=new so(d,a.style.b,a.l,a,c);c=[];for(d=0;d<a.style.f.length;d++){var e=a.style.f[d];if(!e.L||e.L.evaluate(a))e=ph(e.wb,a),e=new qh(e),c.push(e)}yh(a.La,c,a.f).ra(b);var f=a.style.w;Object.keys(f).forEach(function(a){var b=Rn(Qn(f[a]),this);this.N[a]={width:b.lb+
2*b.Fc,height:b.kb+2*b.Fc}},a);return N(b)}function bl(a,b){var c=a.b;if(c){var d=c.b[b.f];d||(d=new ui,c.b[b.f]=d);d.b.push(new ti(new si({ka:[{ha:b.g,Na:0,da:null,xa:null,qa:null}],ca:0,K:!1}),b))}}
function Mo(a,b){if(!b)return 0;var c=Number.POSITIVE_INFINITY,d;for(d in a.e){var e=b.b[d];if((!e||0==e.b.length)&&a.b){var f=a.d;f.l=d;for(e=0;null!=f.l&&(e+=5E3,Wk(f,e,0)!=Number.POSITIVE_INFINITY););e=a.b.b[d];b!=a.b&&e&&(e=e.clone(),b.b[d]=e)}if(e){for(var f=a,g=Number.POSITIVE_INFINITY,k=0;k<e.b.length;k++){for(var h=e.b[k].d.Ta,l=h.ka[0].ha,m=h.ca,p=h.K,q=0;l.ownerDocument!=f.ba.b;)q++,l=h.ka[q].ha,p=!1,m=0;h=Dh(f.ba,l,m,p);h<g&&(g=h)}f=g;f<c&&(c=f)}}return c}
function No(a,b){var c=Mo(a,a.b);if(c==Number.POSITIVE_INFINITY)return null;for(var d=a.l.children,e,f=0;f<d.length;f++)if(e=d[f],"vivliostyle-page-rule-master"!==e.d.nb){var g=1,k=Bl(e,a,"utilization");k&&k.hd()&&(g=k.B);var k=yc(a,"em",!1),h=a.lb()*a.kb();a.j=Wk(a.d,c,Math.ceil(g*h/(k*k)));g=a;k=g.b.d;h=void 0;for(h in g.b.b)for(var l=g.b.b[h],m=l.b.length-1;0<=m;m--){var p=l.b[m];0>p.b.e&&p.b.b<g.j&&(p.b.e=k)}xc(a,a.style.b);g=Bl(e,a,"enabled");if(!g||g===oe){d=a;v.debug("Location - page",d.b.d);
v.debug("  current:",c);v.debug("  lookup:",d.j);c=void 0;for(c in d.b.b)for(f=d.b.b[c],g=0;g<f.b.length;g++)v.debug("  Chunk",c+":",f.b[g].b.b);c=a.H;f=b;g=e.d;if(0===Object.keys(f).length)g.d.e=g;else{e=g;d=uo(c,f);e=e.g+"^"+d;d=c.g[e];if(!d){if("background-host"===g.nb)d=c,f=(new bo(d.h,d.f.d,f)).f(d.f),f.h(d.b,d.e),Pl(f,d.d),d=f;else{d=c;k=f;f=g.clone({nb:"vivliostyle-page-rule-master"});if(g=k.size)k=Qn(k),g=g.Ea,f.b.width=cj(d.d,f.b.width,new T(k.width,g)),f.b.height=cj(d.d,f.b.height,new T(k.height,
g));f=f.f(d.f);f.h(d.b,d.e);Pl(f,d.d);d=f}c.g[e]=d}e=d.d;e.d.e=e;e=d}return e}}throw Error("No enabled page masters");}
function Oo(a,b,c){var d=a.b.b[c];if(!d)return M(!0);dn(b);a.e[c]&&0<b.Qa.length&&(b.qd=!1);var e=L("layoutColumn"),f=[],g=[];uf(function(c){for(;0<d.b.length-g.length;){for(var e=0;0<=g.indexOf(e);)e++;var l=d.b[e];if(l.b.b>a.j)break;for(var m=1;m<d.b.length;m++)if(!(0<=g.indexOf(m))){var p=d.b[m];if(p.b.b>a.j)break;hi(p.b,l.b)&&(l=p,e=m)}var q=l.b,u=!0;gn(b,l.d).then(function(a){l.b.Rd&&(null===a||q.d)&&f.push(e);q.d?(g.push(e),P(c)):a?(l.d=a,P(c)):(g.push(e),u?u=!1:wf(c))});if(u){u=!1;return}}P(c)}).then(function(){d.b=
d.b.filter(function(a,b){return 0<=f.indexOf(b)||0>g.indexOf(b)});O(e,!0)});return N(e)}
function Po(a,b,c,d,e,f,g,k){ul(c);var h=Bl(c,a,"enabled");if(h&&h!==oe)return M(!0);var l=L("layoutContainer"),m=Bl(c,a,"wrap-flow")===Dd,p=c.b?c.g&&c.F:c.f&&c.H,h=Bl(c,a,"flow-from"),q=a.viewport.b.createElement("div"),u=Bl(c,a,"position");w(q,"position",u?u.name:"absolute");d.insertBefore(q,d.firstChild);var r=new wi(q);r.b=c.b;c.mb(a,r,b,a.f);r.D=e;r.F=f;e+=r.left+r.marginLeft+r.Z;f+=r.top+r.marginTop+r.ea;if(h&&h.xd())if(a.F[h.toString()])c.ic(a,r,b,null,1,a.g,a.f),h=M(!0);else{var y=L("layoutContainer.inner"),
J=h.toString(),W=Z(c,a,"column-count"),ma=Z(c,a,"column-gap"),X=1<W?Z(c,a,"column-width"):r.width,h=Al(c,a),F=0,u=Bl(c,a,"shape-inside"),ta=ug(u,0,0,r.width,r.height,a),Xk=new fm(J,a,a.viewport,a.d,h,a.ba,a.f,a.style.u,a,b,a.Fa,a.Ka,k),Gh=0,aa=null;uf(function(b){for(;Gh<W;){var c=Gh++;if(1<W){var d=a.viewport.b.createElement("div");w(d,"position","absolute");q.appendChild(d);aa=new Lm(d,Xk,a.g);aa.b=r.b;aa.Ka=r.Ka;aa.tb=r.tb;r.b?(w(d,"margin-left",r.j+"px"),w(d,"margin-right",r.H+"px"),c=c*(X+ma)+
r.k,Di(aa,0,r.width),Ci(aa,c,X)):(w(d,"margin-top",r.k+"px"),w(d,"margin-bottom",r.w+"px"),c=c*(X+ma)+r.j,Ci(aa,0,r.height),Di(aa,c,X));aa.D=e+r.j;aa.F=f+r.k}else aa=new Lm(q,Xk,a.g),Bi(aa,r),r=aa;aa.N=p?[]:g;aa.rb=ta;if(0<=aa.width){var h=L("inner");Oo(a,aa,J).then(function(){aa.u&&"column"!=aa.u&&(Gh=W,"region"!=aa.u&&(a.F[J]=!0));O(h,!0)});c=N(h)}else c=M(!0);if(c.Aa()){c.then(function(){0<k.b.length?P(b):(F=Math.max(F,aa.e),wf(b))});return}0<k.b.length||(F=Math.max(F,aa.e))}P(b)}).then(function(){r.e=
F;c.ic(a,r,b,aa,W,a.g,a.f);O(y,!0)});h=N(y)}else{h=Bl(c,a,"content");u=!1;if(h&&Fi(h)){var Zk=a.viewport.b.createElement("span");h.T(new Ei(Zk,a));q.appendChild(Zk);Ol(c,a,r,a.f)}else c.sa&&(d.removeChild(q),u=!0);u||c.ic(a,r,b,null,1,a.g,a.f);h=M(!0)}h.then(function(){if(!c.f||0<Math.floor(r.e)){if(!m){var h=r.D+r.left,p=r.F+r.top,u=zi(r)+r.width+Ai(r),y=xi(r)+r.height+yi(r),F=Bl(c,a,"shape-outside"),h=ug(F,h,p,u,y,a);ib(a.viewport.root)&&g.push(De(h,0,-1.25*yc(a,"em",!1)));g.push(h)}}else if(0==
c.children.length){d.removeChild(q);O(l,!0);return}var J=c.children.length-1;tf(function(){for(;0<=J;){var d=c.children[J--],d=Po(a,b,d,q,e,f,g,k);if(d.Aa())return d}return M(!1)}).then(function(){O(l,!0)})});return N(l)}
function Qo(a,b,c){a.F={};c?(a.b=c.clone(),Rk(a.d,c.e)):(a.b=new vi,Rk(a.d,-1));a.lang&&b.b.setAttribute("lang",a.lang);c=a.b;c.d++;xc(a,a.style.b);var d=to(a.H),e=No(a,d);if(!e)return M(null);e.d.b.width.value===qe&&ci(b);e.d.b.height.value===re&&di(b);Ho(a.k,d,a);var f=Rn(Qn(d),a);Ro(a,f,b);Yn(d,f,b,a);var d=Bl(e,a,"writing-mode")||Qd,f=Bl(e,a,"direction")||Yd,g=new Ii(b.A.bind(b),d,f),k=c.clone(),h=[],l=L("layoutNextPage");uf(function(d){Po(a,b,e,b.b,0,0,h.concat(),g).then(function(){if(0<g.b.length){h=
h.concat(Ni(g));g.b.splice(0,g.b.length);c=a.b=k.clone();for(var e;e=b.b.lastChild;)b.b.removeChild(e);wf(d)}else P(d)})}).then(function(){e.Z(a,b,a.g);var d=new $c(e.d.d,"left-page");b.g=d.evaluate(a)?"left":"right";var d=a.b.d,f;for(f in a.b.b)for(var g=a.b.b[f],h=g.b.length-1;0<=h;h--){var k=g.b[h];0<=k.b.e&&k.b.e+k.b.j-1<=d&&g.b.splice(h,1)}a.b=null;c.e=a.d.b;f=a.style.h.D[a.ba.url];d=b.M.getBoundingClientRect();b.d.width=d.width;b.d.height=d.height;g=b.h;for(d=0;d<g.length;d++)h=g[d],w(h.target,
h.name,h.value.toString());for(d=0;d<f.length;d++)if(g=f[d],k=b.j[g.Xb],h=b.j[g.Od],k&&h&&(k=ai(k,g.action)))for(var y=0;y<h.length;y++)h[y].addEventListener(g.event,k,!1);var J;a:{for(J in a.e)if((f=c.b[J])&&0<f.b.length){J=!1;break a}J=!0}J&&(c=null);O(l,c)});return N(l)}
function Ro(a,b,c){a.D=b.lb;a.A=b.kb;c.M.style.width=b.lb+2*b.Fc+"px";c.M.style.height=b.kb+2*b.Fc+"px";c.b.style.left=b.ub+"px";c.b.style.right=b.ub+"px";c.b.style.top=b.ub+"px";c.b.style.bottom=b.ub+"px";c.b.style.padding=b.Bb+"px"}function So(a,b,c,d){vk.call(this,a.g,a,b,c,d,a.f,!c);this.e=a;this.u=!1}t(So,vk);n=So.prototype;n.sc=function(){};n.rc=function(a,b,c){a=new jl(this.e.j,a,b,c,this.e.w,this.L,If(this.aa));Kf(this.e,new Vl(a.d,this.e,a,this.l))};
n.xb=function(a){a=a.d;null!=this.L&&(a=fd(this.d,this.L,a));Kf(this.e,new So(this.e,a,this,this.A))};n.nc=function(){Kf(this.e,new Ak(this.d,this.aa))};n.qc=function(){var a={};this.e.k.push({wb:a,L:this.L});Kf(this.e,new Bk(this.d,this.aa,null,a,this.e.f))};n.oc=function(a){var b=this.e.h[a];b||(b={},this.e.h[a]=b);Kf(this.e,new Bk(this.d,this.aa,null,b,this.e.f))};n.uc=function(){var a={};this.e.A.push(a);Kf(this.e,new Bk(this.d,this.aa,this.L,a,this.e.f))};
n.Yb=function(a){var b=this.e.l;if(a){var c=gj(b,"_pseudos"),b=c[a];b||(b={},c[a]=b)}Kf(this.e,new Bk(this.d,this.aa,null,b,this.e.f))};n.tc=function(){this.u=!0;this.eb()};n.Hb=function(){var a=new Co(this.e.j,this.e,this,this.l,this.e.u);Kf(this.e,a);a.Hb()};n.na=function(){vk.prototype.na.call(this);if(this.u){this.u=!1;var a="R"+this.e.F++,b=H(a),c;this.L?c=new bj(b,0,this.L):c=new T(b,0);hj(this.h,"region-id").push(c);this.ib();a=new So(this.e,this.L,this,a);Kf(this.e,a);a.na()}};
function To(a){var b=a.getAttribute("content");if(!b)return"";a={};for(var c;null!=(c=b.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/));)b=b.substr(c[0].length),a[c[1]]=c[2];b=a.width-0;a=a.height-0;return b&&a?"@-epubx-viewport{width:"+b+"px;height:"+a+"px;}":""}function Uo(a){Jf.call(this);this.f=a;this.g=new oc(null);this.j=new oc(this.g);this.w=new gl(this.g);this.D=new So(this,null,null,null);this.F=0;this.k=[];this.l={};this.h={};this.A=[];this.u={};this.b=this.D}
t(Uo,Jf);Uo.prototype.error=function(a){v.b("CSS parser:",a)};function Vo(a,b){return Wo(b,a)}function Xo(a){Af.call(this,Vo,"document");this.F=a;this.A={};this.h={};this.b={};this.D={};this.f=null;this.j=[]}t(Xo,Af);function Yo(a){var b=va("user-agent.xml",ua),c=L("OPSDocStore.init");Bf(lh).then(function(d){a.f=d;Bf(Dk).then(function(){a.load(b).then(function(){O(c,!0)})})});return N(c)}function Zo(a,b){a.j.push({url:b.url,text:b.text,Xa:"User",za:null,media:null})}
function Wo(a,b){var c=L("OPSDocStore.load"),d=b.url;Mh(b,a).then(function(b){if(b){for(var f=[],g=b.b.getElementsByTagNameNS("http://www.idpf.org/2007/ops","trigger"),k=0;k<g.length;k++){var h=g[k],l=h.getAttributeNS("http://www.w3.org/2001/xml-events","observer"),m=h.getAttributeNS("http://www.w3.org/2001/xml-events","event"),p=h.getAttribute("action"),h=h.getAttribute("ref");l&&m&&p&&h&&f.push({Od:l,event:m,action:p,Xb:h})}a.D[d]=f;var q=[],f=va("user-agent-page.css",ua);q.push({url:f,text:null,
Xa:"UA",za:null,media:null});for(k=0;k<a.j.length;k++)q.push(a.j[k]);if(f=b.h)for(f=f.firstChild;f;f=f.nextSibling)if(1==f.nodeType)if(g=f,k=g.namespaceURI,l=g.localName,"http://www.w3.org/1999/xhtml"==k)if("style"==l)q.push({url:d,text:g.textContent,Xa:"Author",za:null,media:null});else if("link"==l){if(m=g.getAttribute("rel"),k=g.getAttribute("class"),l=g.getAttribute("media"),"stylesheet"==m||"alternate stylesheet"==m&&k)g=g.getAttribute("href"),g=va(g,d),q.push({url:g,text:null,za:k,media:l,Xa:"Author"})}else"meta"==
l&&"viewport"==g.getAttribute("name")&&q.push({url:d,text:To(g),Xa:"Author",L:null,media:null});else"http://www.gribuser.ru/xml/fictionbook/2.0"==k?"stylesheet"==l&&"text/css"==g.getAttribute("type")&&q.push({url:d,text:g.textContent,Xa:"Author",za:null,media:null}):"http://example.com/sse"==k&&"property"===l&&(k=g.getElementsByTagName("name")[0])&&"stylesheet"===k.textContent&&(g=g.getElementsByTagName("value")[0])&&(g=va(g.textContent,d),q.push({url:g,text:null,za:null,media:null,Xa:"Author"}));
for(var u="",k=0;k<q.length;k++)u+=q[k].url,u+="^",q[k].text&&(u+=q[k].text),u+="^";var r=a.A[u];r?(a.b[d]=r,O(c,b)):(f=a.h[u],f||(f=new Df(function(){var b=L("fetchStylesheet"),c=0,d=new Uo(a.f);tf(function(){if(c<q.length){var a=q[c++];d.Ib(a.Xa);return null!==a.text?mg(a.text,d,a.url,a.za,a.media).Xc(!0):lg(a.url,d,a.za,a.media)}return M(!1)}).then(function(){r=new Io(a,d.g,d.j,d.D.g,d.w,d.k,d.l,d.h,d.A,d.u);a.A[u]=r;delete a.h[u];O(b,r)});return N(b)},"FetchStylesheet "+d),a.h[u]=f,f.start()),
Bf(f).then(function(f){a.b[d]=f;O(c,b)}))}else O(c,null)});return N(c)};function $o(a,b,c,d,e,f,g,k){this.d=a;this.url=b;this.lang=c;this.e=d;this.g=e;this.R=gc(f);this.h=g;this.f=k;this.Da=this.b=null}function ap(a,b,c){if(0!=c--)for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType){var d=b;"auto"!=Qa(d,"height","auto")&&(w(d,"height","auto"),ap(a,d,c));"absolute"==Qa(d,"position","static")&&(w(d,"position","relative"),ap(a,d,c))}}
function bp(a){var b=a.target,c="\u25b8"==b.textContent;b.textContent=c?"\u25be":"\u25b8";for(b=b.parentNode.firstChild;b;)if(1!=b.nodeType)b=b.nextSibling;else{var d=b;"toc-container"==d.getAttribute("data-adapt-class")?b=d.firstChild:("toc-node"==d.getAttribute("data-adapt-class")&&(d.style.height=c?"auto":"0px"),b=b.nextSibling)}a.stopPropagation()}
$o.prototype.Pc=function(a){var b=this.h.Pc(a);return function(a,d,e){var f=e.behavior;if(!f||"toc-node"!=f.toString()&&"toc-container"!=f.toString())return b(a,d,e);a=d.getAttribute("data-adapt-class");"toc-node"==a&&(e=d.firstChild,"\u25b8"!=e.textContent&&(e.textContent="\u25b8",w(e,"cursor","pointer"),e.addEventListener("click",bp,!1)));var g=d.ownerDocument.createElement("div");g.setAttribute("data-adapt-process-children","true");"toc-node"==f.toString()?(e=d.ownerDocument.createElement("div"),
e.textContent="\u25b9",w(e,"margin-left","-1em"),w(e,"display","inline-block"),w(e,"width","1em"),w(e,"text-align","left"),w(e,"cursor","default"),w(e,"font-family","Menlo,sans-serif"),g.appendChild(e),w(g,"overflow","hidden"),g.setAttribute("data-adapt-class","toc-node"),"toc-node"!=a&&"toc-container"!=a||w(g,"height","0px")):"toc-node"==a&&g.setAttribute("data-adapt-class","toc-container");return M(g)}};
$o.prototype.mc=function(a,b,c,d,e){if(this.b)return M(this.b);var f=this,g=L("showTOC"),k=new bi(a,a);this.b=k;this.d.load(this.url).then(function(d){var l=f.d.b[d.url],m=Jo(l,c,1E5,e);b=new Am(b.f,m.fontSize,b.root,m.width,m.height);var p=new Ko(l,d,f.lang,b,f.e,f.g,f.Pc(d),f.f,0);f.Da=p;p.R=f.R;Lo(p).then(function(){Qo(p,k,null).then(function(){ap(f,a,2);O(g,k)})})});return N(g)};
$o.prototype.jc=function(){if(this.b){var a=this.b;this.Da=this.b=null;w(a.M,"visibility","none");var b=a.M.parentNode;b&&b.removeChild(a.M)}};$o.prototype.jd=function(){return!!this.b};function cp(){Xo.call(this,dp(this));this.d=new Af(Mh,"document");this.u=new Af(Ef,"text");this.w={};this.N={};this.k={};this.l={}}t(cp,Xo);function dp(a){return function(b){return a.k[b]}}
function ep(a,b,c){var d=L("loadEPUBDoc");"/"!==b.substring(b.length-1)&&(b+="/");c&&a.u.hc(b+"?r=list");a.d.hc(b+"META-INF/encryption.xml");var e=b+"META-INF/container.xml";a.d.load(e,!0,"Failed to fetch EPUB container.xml from "+e).then(function(f){if(f){f=Wh(Ah(Ah(Ah(new Bh([f.b]),"container"),"rootfiles"),"rootfile"),"full-path");for(var g=0;g<f.length;g++){var k=f[g];if(k){fp(a,b,k,c).ra(d);return}}O(d,null)}else v.error("Received an empty response for EPUB container.xml "+e+". This may be caused by the server not allowing cross origin requests.")});
return N(d)}function fp(a,b,c,d){var e=b+c,f=a.w[e];if(f)return M(f);var g=L("loadOPF");a.d.load(e,void 0,void 0).then(function(c){c?a.d.load(b+"META-INF/encryption.xml",void 0,void 0).then(function(h){(d?a.u.load(b+"?r=list"):M(null)).then(function(d){f=new gp(a,b);hp(f,c,h,d,b+"?r=manifest").then(function(){a.w[e]=f;a.N[b]=f;O(g,f)})})}):v.error("Received an empty response for EPUB OPF "+e+". This may be caused by the server not allowing cross origin requests.")});return N(g)}
function ip(a,b,c){var d=L("EPUBDocStore.load");b=sa(b);(a.l[b]=Wo(a,{status:200,url:b,contentType:c.contentType,responseText:null,responseXML:c,lc:null})).ra(d);return N(d)}
cp.prototype.load=function(a){var b=sa(a);if(a=this.l[b])return a.Aa()?a:M(a.fc());var c=L("EPUBDocStore.load");a=cp.Cd.load.call(this,b,!0,"Failed to fetch a source document from "+b);a.then(function(a){a?O(c,a):v.error("Received an empty response for "+b+". This may be caused by the server not allowing cross origin requests.")});return N(c)};function jp(){this.id=null;this.src="";this.f=this.d=null;this.G=-1;this.h=0;this.j=null;this.b=this.e=0;this.g=bb}function kp(a){return a.id}
function lp(a){var b=We(a);return function(a){var d=L("deobfuscator"),e,f;a.slice?(e=a.slice(0,1040),f=a.slice(1040,a.size)):(e=a.webkitSlice(0,1040),f=a.webkitSlice(1040,a.size-1040));zf(e).then(function(a){a=new DataView(a);for(var c=0;c<a.byteLength;c++){var e=a.getUint8(c),e=e^b[c%20];a.setUint8(c,e)}O(d,yf([a,f]))});return N(d)}}
var mp={dcterms:"http://purl.org/dc/terms/",marc:"http://id.loc.gov/vocabulary/",media:"http://www.idpf.org/epub/vocab/overlays/#",onix:"http://www.editeur.org/ONIX/book/codelists/current.html#",xsd:"http://www.w3.org/2001/XMLSchema#"},np=mp.dcterms+"language",op=mp.dcterms+"title";
function pp(a,b){var c={};return function(d,e){var f,g,k=d.r||c,h=e.r||c;if(a==op&&(f="main"==k["http://idpf.org/epub/vocab/package/#title-type"],g="main"==h["http://idpf.org/epub/vocab/package/#title-type"],f!=g))return f?-1:1;f=parseInt(k["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(f)&&(f=Number.MAX_VALUE);g=parseInt(h["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(g)&&(g=Number.MAX_VALUE);return f!=g?f-g:a!=np&&b&&(f=(k[np]||k["http://idpf.org/epub/vocab/package/#alternate-script"])==
b,g=(h[np]||h["http://idpf.org/epub/vocab/package/#alternate-script"])==b,f!=g)?f?-1:1:d.o-e.o}}
function qp(a,b){function c(a){for(var b in a){var d=a[b];d.sort(pp(b,l));for(var e=0;e<d.length;e++){var f=d[e].r;f&&c(f)}}}function d(a){return eb(a,function(a){return db(a,function(a){var b={v:a.value,o:a.O};a.oe&&(b.s=a.scheme);if(a.id||a.lang){var c=h[a.id];if(c||a.lang)a.lang&&(a={name:np,value:a.lang,lang:null,id:null,Uc:a.id,scheme:null,O:a.O},c?c.push(a):c=[a]),c=cb(c,function(a){return a.name}),b.r=d(c)}return b})})}function e(a){if(a&&(a=a.match(/^\s*(([^:]*):)?(\S+)\s*$/))){var b=a[1]?
f[a[1]]:"http://idpf.org/epub/vocab/package/#";if(b)return b+a[3]}return null}var f;if(b){f={};for(var g in mp)f[g]=mp[g];for(;null!=(g=b.match(/(^\s*[A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/));)b=b.substr(g[0].length),f[g[1]]=g[2]}else f=mp;var k=1;g=Uh(Vh(a),function(a){if("meta"==a.localName){var b=e(a.getAttribute("property"));if(b)return{name:b,value:a.textContent,id:a.getAttribute("id"),O:k++,Uc:a.getAttribute("refines"),lang:null,scheme:e(a.getAttribute("scheme"))}}else if("http://purl.org/dc/elements/1.1/"==
a.namespaceURI)return{name:mp.dcterms+a.localName,O:k++,lang:a.getAttribute("xml:lang"),value:a.textContent,id:a.getAttribute("id"),Uc:null,scheme:null};return null});var h=cb(g,function(a){return a.Uc});g=d(cb(g,function(a){return a.Uc?null:a.name}));var l=null;g[np]&&(l=g[np][0].v);c(g);return g}function rp(){var a=window.MathJax;return a?a.Hub:null}var sp={"appliaction/xhtml+xml":!0,"image/jpeg":!0,"image/png":!0,"image/svg+xml":!0,"image/gif":!0,"audio/mp3":!0};
function gp(a,b){this.e=a;this.h=this.d=this.b=this.g=this.f=null;this.k=b;this.j=null;this.F={};this.lang=null;this.u=0;this.l={};this.H=this.D=this.N=null;this.w={};this.A=null;rp()&&(Si["http://www.w3.org/1998/Math/MathML"]=!0)}function tp(a,b){return a.k?b.substr(0,a.k.length)==a.k?decodeURI(b.substr(a.k.length)):null:b}
function hp(a,b,c,d,e){a.f=b;var f=Ah(new Bh([b.b]),"package"),g=Wh(f,"unique-identifier")[0];g&&(g=Ih(b,b.url+"#"+g))&&(a.j=g.textContent.replace(/[ \n\r\t]/g,""));var k={};a.g=db(Sh(Ah(Ah(f,"manifest"),"item")),function(c){var d=new jp,e=b.url;d.id=c.getAttribute("id");d.src=va(c.getAttribute("href"),e);d.d=c.getAttribute("media-type");if(e=c.getAttribute("properties")){for(var e=e.split(/\s+/),f={},g=0;g<e.length;g++)f[e[g]]=!0;d.g=f}(c=c.getAttribute("fallback"))&&!sp[d.d]&&(k[d.src]=c);!a.D&&
d.g.nav&&(a.D=d);!a.H&&d.g["cover-image"]&&(a.H=d);return d});a.d=ab(a.g,kp);a.h=ab(a.g,function(b){return tp(a,b.src)});for(var h in k)for(g=h;;){g=a.d[k[g]];if(!g)break;if(sp[g.d]){a.w[h]=g.src;break}g=g.src}a.b=db(Sh(Ah(Ah(f,"spine"),"itemref")),function(b,c){var d=b.getAttribute("idref");if(d=a.d[d])d.f=b,d.G=c;return d});if(h=Wh(Ah(f,"spine"),"toc")[0])a.N=a.d[h];if(h=Wh(Ah(f,"spine"),"page-progression-direction")[0]){a:switch(h){case "ltr":h="ltr";break a;case "rtl":h="rtl";break a;default:throw Error("unknown PageProgression: "+
h);}a.A=h}var g=c?Wh(Ah(Ah(Rh(Ah(Ah(new Bh([c.b]),"encryption"),"EncryptedData"),Qh()),"CipherData"),"CipherReference"),"URI"):[],l=Sh(Ah(Ah(f,"bindings"),"mediaType"));for(c=0;c<l.length;c++){var m=l[c].getAttribute("handler");(h=l[c].getAttribute("media-type"))&&m&&a.d[m]&&(a.F[h]=a.d[m].src)}a.l=qp(Ah(f,"metadata"),Wh(f,"prefix")[0]);a.l[np]&&(a.lang=a.l[np][0].v);if(!d){if(0<g.length&&a.j)for(d=lp(a.j),c=0;c<g.length;c++)a.e.k[a.k+g[c]]=d;return M(!0)}f=new Ra;l={};if(0<g.length&&a.j)for(h="1040:"+
Xe(a.j),c=0;c<g.length;c++)l[g[c]]=h;for(c=0;c<d.length;c++){var p=d[c];if(m=p.n){var q=decodeURI(m),g=a.h[q];h=null;g&&(g.j=0!=p.m,g.h=p.c,g.d&&(h=g.d.replace(/\s+/g,"")));g=l[q];if(h||g)f.append(m),f.append(" "),f.append(h||"application/octet-stream"),g&&(f.append(" "),f.append(g)),f.append("\n")}}up(a);return xf(e,"","POST",f.toString(),"text/plain")}function up(a){for(var b=0,c=0;c<a.b.length;c++){var d=a.b[c],e=Math.ceil(d.h/1024);d.e=b;d.b=e;b+=e}a.u=b}
function vp(a,b,c){a.d={};a.h={};a.g=[];a.b=a.g;var d=a.f=new zh(null,"",(new DOMParser).parseFromString("<spine></spine>","text/xml"));b.forEach(function(a,b){var c=new jp;c.G=b;c.id="item"+(b+1);c.src=a;var k=d.b.createElement("itemref");k.setAttribute("idref",c.id);d.root.appendChild(k);c.f=k;this.d[c.id]=c;this.h[a]=c;this.g.push(c)},a);return c?ip(a.e,b[0],c):M(null)}
function wp(a,b,c){var d=a.b[b],e=L("getCFI");a.e.load(d.src).then(function(a){var b=Fh(a,c),k=null;b&&(a=Dh(a,b,0,!1),k=new sb,vb(k,b,c-a),d.f&&vb(k,d.f,0),k=k.toString());O(e,k)});return N(e)}
function xp(a,b){return cf("resolveFragment",function(c){if(b){var d=new sb;tb(d,b);var e;if(a.f){var f=ub(d,a.f.b);if(1!=f.ha.nodeType||f.K||!f.Xb){O(c,null);return}var g=f.ha,k=g.getAttribute("idref");if("itemref"!=g.localName||!k||!a.d[k]){O(c,null);return}e=a.d[k];d=f.Xb}else e=a.b[0];a.e.load(e.src).then(function(a){var b=ub(d,a.b);a=Dh(a,b.ha,b.offset,b.K);O(c,{G:e.G,ma:a,Q:-1})})}else O(c,null)},function(a,d){v.b(d,"Cannot resolve fragment:",b);O(a,null)})}
function yp(a,b){return cf("resolveEPage",function(c){if(0>=b)O(c,{G:0,ma:0,Q:-1});else{var d=Za(a.b.length,function(c){c=a.b[c];return c.e+c.b>b}),e=a.b[d];a.e.load(e.src).then(function(a){b-=e.e;b>e.b&&(b=e.b);var g=0;0<b&&(a=Eh(a),g=Math.round(a*b/e.b),g==a&&g--);O(c,{G:d,ma:g,Q:-1})})}},function(a,d){v.b(d,"Cannot resolve epage:",b);O(a,null)})}
function zp(a,b){var c=a.b[b.G];if(0>=b.ma)return M(c.e);var d=L("getEPage");a.e.load(c.src).then(function(a){a=Eh(a);var f=Math.min(a,b.ma);O(d,c.e+f*c.b/a)});return N(d)}function Ap(a,b,c,d,e){this.b=a;this.viewport=b;this.f=c;this.g=e;this.Gb=[];this.ma=this.Q=this.G=0;this.R=gc(d);this.e=new ym(b.f)}function Bp(a){var b=a.Gb[a.G];return b?b.cb[a.Q]:null}n=Ap.prototype;n.jb=function(){if(this.b.A)return this.b.A;var a=this.Gb[this.G];return a?a.Da.ea:null};
function Cp(a){var b=L("renderPage");Dp(a).then(function(c){if(c){var d=-1;if(0>a.Q){var d=a.ma,e=Za(c.Ha.length,function(a){return Mo(c.Da,c.Ha[a])>d});a.Q=e==c.Ha.length?Number.POSITIVE_INFINITY:e-1}var f=c.cb[a.Q];f?(a.ma=f.offset,O(b,f)):uf(function(b){if(a.Q<c.Ha.length)P(b);else if(c.complete)a.Q=c.Ha.length-1,P(b);else{var e=c.Ha[c.Ha.length-1],h=Ep(a,c,e);Qo(c.Da,h,e).then(function(l){h.M.style.display="none";h.M.style.visibility="visible";h.M.setAttribute("data-vivliostyle-page-side",h.g);
l=(e=l)?e.d-1:c.Ha.length-1;a.g(c.Da.N,c.item.G,l);e?(c.cb[l]=h,c.Ha.push(e),0<=d&&Mo(c.Da,e)>d?(f=h,a.Q=c.Ha.length-2,P(b)):(h.k=0==c.item.G&&0==l,wf(b))):(c.cb.push(h),f=h,a.Q=l,0>d&&(a.ma=h.offset),c.complete=!0,h.k=0==c.item.G&&0==l,h.l=c.item.G==a.b.b.length-1,P(b))})}}).then(function(){f=f||c.cb[a.Q];var e=c.Ha[a.Q];0>d&&(a.ma=Mo(c.Da,e));if(f)O(b,f);else{var k=Ep(a,c,e);Qo(c.Da,k,e).then(function(d){k.M.style.display="none";k.M.style.visibility="visible";k.M.setAttribute("data-vivliostyle-page-side",
k.g);d=(e=d)?e.d-1:c.Ha.length-1;a.g(c.Da.N,c.item.G,d);e?(c.cb[d]=k,c.Ha[a.Q+1]=e):(c.cb.push(k),c.complete=!0,k.l=c.item.G==a.b.b.length-1);k.k=0==c.item.G&&0==d;O(b,k)})}})}else O(b,null)});return N(b)}n.Vc=function(){return Fp(this,this.b.b.length-1,Number.POSITIVE_INFINITY)};function Fp(a,b,c){var d=L("renderAllPages"),e=a.G,f=a.Q;a.G=0;uf(function(d){a.Q=a.G==b?c:Number.POSITIVE_INFINITY;Cp(a).then(function(){++a.G>b?P(d):wf(d)})}).then(function(){a.G=e;a.Q=f;Cp(a).ra(d)});return N(d)}
n.Hd=function(){this.Q=this.G=0;return Cp(this)};n.Id=function(){this.G=this.b.b.length-1;this.Q=Number.POSITIVE_INFINITY;return Cp(this)};n.nextPage=function(){var a=this,b=L("nextPage");Dp(a).then(function(c){if(c){if(c.complete&&a.Q==c.Ha.length-1){if(a.G>=a.b.b.length-1){O(b,null);return}a.G++;a.Q=0}else a.Q++;Cp(a).ra(b)}else O(b,null)});return N(b)};n.Tc=function(){if(0==this.Q){if(0==this.G)return M(null);this.G--;this.Q=Number.POSITIVE_INFINITY}else this.Q--;return Cp(this)};
function Gp(a,b){var c="left"===b.g,d="ltr"===a.jb();return!c&&d||c&&!d}function Hp(a){var b=L("getCurrentSpread"),c=Bp(a);if(!c)return M({left:null,right:null});var d=a.G,e=a.Q,f="left"===c.g;(Gp(a,c)?a.Tc():a.nextPage()).then(function(g){a.G=d;a.Q=e;Cp(a).then(function(){f?O(b,{left:c,right:g}):O(b,{left:g,right:c})})});return N(b)}n.Nd=function(){var a=Bp(this);if(!a)return M(null);var a=Gp(this,a),b=this.nextPage();if(a)return b;var c=this;return b.vc(function(){return c.nextPage()})};
n.Qd=function(){var a=Bp(this);if(!a)return M(null);var a=Gp(this,a),b=this.Tc();if(a){var c=this;return b.vc(function(){return c.Tc()})}return b};function Ip(a,b){var c=L("navigateToEPage");yp(a.b,b).then(function(b){b&&(a.G=b.G,a.Q=b.Q,a.ma=b.ma);Cp(a).ra(c)});return N(c)}function Jp(a,b){var c=L("navigateToCFI");xp(a.b,b).then(function(b){b&&(a.G=b.G,a.Q=b.Q,a.ma=b.ma);Cp(a).ra(c)});return N(c)}
function Kp(a,b){v.debug("Navigate to",b);var c=tp(a.b,sa(b));if(null==c&&(a.b.f&&b.match(/^#epubcfi\(/)&&(c=tp(a.b,a.b.f.url)),null==c))return M(null);var d=a.b.h[c];if(!d)return a.b.f&&c==tp(a.b,a.b.f.url)&&(c=b.indexOf("#"),0<=c)?Jp(a,b.substr(c+1)):M(null);d.G!=a.G&&(a.G=d.G,a.Q=0);var e=L("navigateTo");Dp(a).then(function(c){var d=Ih(c.ba,b);d&&(a.ma=Ch(c.ba,d),a.Q=-1);Cp(a).ra(e)});return N(e)}
function Ep(a,b,c){var d=b.Da.viewport,e=d.b.createElement("div");e.setAttribute("data-vivliostyle-page-container",!0);ja||(e.style.visibility="hidden");d.d.appendChild(e);var f=d.b.createElement("div");f.setAttribute("data-vivliostyle-bleed-box",!0);e.appendChild(f);f=new bi(e,f);f.G=b.item.G;f.position=c;f.offset=Mo(b.Da,c);d!==a.viewport&&(a=jc(a.viewport.width,a.viewport.height,d.width,d.height),a=ng(null,new cc(a,null)),f.h.push(new Zh(e,"transform",a)));return f}
function Lp(a,b){var c=rp();if(c){var d=b.ownerDocument,e=d.createElement("span");b.appendChild(e);d=d.importNode(a,!0);e.appendChild(d);d=c.queue;d.Push(["Typeset",c,e]);var c=L("navigateToEPage"),f=nf(c);d.Push(function(){f.Ua(e)});return N(c)}return M(null)}
n.Pc=function(a){var b=this;return function(c,d){var e;if("object"==c.localName&&"http://www.w3.org/1999/xhtml"==c.namespaceURI){var f=c.getAttribute("data");e=null;if(f){var f=va(f,a.url),g=c.getAttribute("media-type");if(!g){var k=tp(b.b,f);k&&(k=b.b.h[k])&&(g=k.d)}if(g&&(k=b.b.F[g])){e=b.viewport.b.createElement("iframe");e.style.border="none";var f=Va(f),h=Va(g),g=new Ra;g.append(k);g.append("?src=");g.append(f);g.append("&type=");g.append(h);for(k=c.firstChild;k;k=k.nextSibling)1==k.nodeType&&
(h=k,"param"==h.localName&&"http://www.w3.org/1999/xhtml"==h.namespaceURI&&(f=h.getAttribute("name"),h=h.getAttribute("value"),f&&h&&(g.append("&"),g.append(encodeURIComponent(f)),g.append("="),g.append(encodeURIComponent(h)))));e.setAttribute("src",g.toString());(g=c.getAttribute("width"))&&e.setAttribute("width",g);(g=c.getAttribute("height"))&&e.setAttribute("height",g)}}e||(e=b.viewport.b.createElement("span"),e.setAttribute("data-adapt-process-children","true"));e=M(e)}else if("http://www.w3.org/1998/Math/MathML"==
c.namespaceURI)e=Lp(c,d);else if("http://example.com/sse"==c.namespaceURI){e=d?d.ownerDocument:b.viewport.b;g=c.localName;switch(g){case "t":case "tab":case "ec":case "nt":case "fraction":case "comment":case "mark":g="span";break;case "ruby":case "rp":case "rt":break;default:g="div"}e=e.createElement(g);e.setAttribute("data-adapt-process-children","true");e=M(e)}else e=M(null);return e}};
function Dp(a){if(a.G>=a.b.b.length)return M(null);var b=a.Gb[a.G];if(b)return M(b);var c=a.b.b[a.G],d=a.b.e,e=L("getPageViewItem");d.load(c.src).then(function(f){0==c.b&&1==a.b.b.length&&(c.b=Math.ceil(Eh(f)/2700),a.b.u=c.b);var g=d.b[f.url],k=a.Pc(f),h=a.viewport,l=Jo(g,h.width,h.height,h.fontSize);if(l.width!=h.width||l.height!=h.height||l.fontSize!=h.fontSize)h=new Am(h.f,l.fontSize,h.root,l.width,l.height);var l=a.Gb[a.G-1],m=new Ko(g,f,a.b.lang,h,a.e,a.f,k,a.b.w,l?l.Da.pa+l.cb.length:0);l&&
Go(m.k,l.Da.k);m.R=a.R;Lo(m).then(function(){b={item:c,ba:f,Da:m,Ha:[null],cb:[],complete:!1};a.Gb[a.G]=b;O(e,b)})});return N(e)}function Mp(a){return{G:a.G,Q:a.Q,ma:a.ma}}function Np(a,b){b?(a.G=b.G,a.Q=-1,a.ma=b.ma):(a.G=0,a.Q=0,a.ma=0);return Fp(a,a.G,a.Q)}
n.mc=function(){var a=this.b,b=a.D||a.N;if(!b)return M(null);var c=L("showTOC");this.d||(this.d=new $o(a.e,b.src,a.lang,this.e,this.f,this.R,this,a.w));var a=this.viewport,b=Math.min(350,Math.round(.67*a.width)-16),d=a.height-6,e=a.b.createElement("div");a.root.appendChild(e);e.style.position="absolute";e.style.visibility="hidden";e.style.left="3px";e.style.top="3px";e.style.width=b+10+"px";e.style.maxHeight=d+"px";e.style.overflow="scroll";e.style.overflowX="hidden";e.style.background="#EEE";e.style.border=
"1px outset #999";e.style.borderRadius="2px";e.style.boxShadow=" 5px 5px rgba(128,128,128,0.3)";this.d.mc(e,a,b,d,this.viewport.fontSize).then(function(a){e.style.visibility="visible";O(c,a)});return N(c)};n.jc=function(){this.d&&this.d.jc()};n.jd=function(){return this.d&&this.d.jd()};function Op(a,b,c,d){var e=this;this.h=a;this.gb=b;b.setAttribute("data-vivliostyle-viewer-viewport",!0);b.setAttribute("data-vivliostyle-viewer-status","loading");this.Qa=c;this.La=d;a=a.document;this.pa=new uh(a.head,b);this.H=[];this.g=null;this.F=this.d=!1;this.f=this.j=this.e=this.l=null;this.fontSize=16;this.zoom=1;this.ea=!1;this.Vc=!0;this.R=fc();this.D=function(){};this.k=function(){};this.Z=function(){e.d=!0;e.D()};this.u=function(){};this.w=a.getElementById("vivliostyle-page-rules");this.N=
!1;this.oa={loadEPUB:this.sa,loadXML:this.Fa,configure:this.A,moveTo:this.Ka,toc:this.mc};Pp(this)}function Pp(a){ra(1,function(a){Qp(this,{t:"debug",content:a})}.bind(a));ra(2,function(a){Qp(this,{t:"info",content:a})}.bind(a));ra(3,function(a){Qp(this,{t:"warn",content:a})}.bind(a));ra(4,function(a){Qp(this,{t:"error",content:a})}.bind(a))}function Qp(a,b){b.i=a.Qa;a.La(b)}
Op.prototype.sa=function(a){Hn.b("loadEPUB");Hn.b("loadFirstPage");this.gb.setAttribute("data-vivliostyle-viewer-status","loading");var b=a.url,c=a.fragment,d=!!a.zipmeta,e=a.userStyleSheet;this.viewport=null;var f=L("loadEPUB"),g=this;g.A(a).then(function(){var a=new cp;if(e)for(var h=0;h<e.length;h++)Zo(a,e[h]);Yo(a).then(function(){var e=va(b,g.h.location.href);g.H=[e];ep(a,e,d).then(function(a){g.g=a;xp(g.g,c).then(function(a){g.f=a;Rp(g).then(function(){g.gb.setAttribute("data-vivliostyle-viewer-status",
"complete");Hn.d("loadEPUB");Qp(g,{t:"loaded",metadata:g.g.l});O(f,!0)})})})})});return N(f)};
Op.prototype.Fa=function(a){Hn.b("loadXML");Hn.b("loadFirstPage");this.gb.setAttribute("data-vivliostyle-viewer-status","loading");var b;"string"===typeof a.url?b=[a.url]:b=a.url;var c=a.document,d=a.fragment,e=a.userStyleSheet;this.viewport=null;var f=L("loadXML"),g=this;g.A(a).then(function(){var a=new cp;if(e)for(var h=0;h<e.length;h++)Zo(a,e[h]);Yo(a).then(function(){var e=b.map(function(a){return va(a,g.h.location.href)});g.H=e;g.g=new gp(a,"");vp(g.g,e,c).then(function(){xp(g.g,d).then(function(a){g.f=
a;Rp(g).then(function(){g.gb.setAttribute("data-vivliostyle-viewer-status","complete");Hn.d("loadXML");Qp(g,{t:"loaded"});O(f,!0)})})})})});return N(f)};function Sp(a,b){var c=parseFloat(b),d=/[a-z]+$/,e;if("string"===typeof b&&(e=b.match(d))){d=e[0];if("em"===d||"rem"===d)return c*a.fontSize;if("ex"===d||"rex"===d)return c*uc.ex*a.fontSize/uc.em;if(d=uc[d])return c*d}return c}
Op.prototype.A=function(a){"boolean"==typeof a.autoresize&&(a.autoresize?(this.l=null,this.h.addEventListener("resize",this.Z,!1),this.d=!0):this.h.removeEventListener("resize",this.Z,!1));if("number"==typeof a.fontSize){var b=a.fontSize;5<=b&&72>=b&&this.fontSize!=b&&(this.fontSize=b,this.d=!0)}"object"==typeof a.viewport&&a.viewport&&(b=a.viewport,b={marginLeft:Sp(this,b["margin-left"])||0,marginRight:Sp(this,b["margin-right"])||0,marginTop:Sp(this,b["margin-top"])||0,marginBottom:Sp(this,b["margin-bottom"])||
0,width:Sp(this,b.width)||0,height:Sp(this,b.height)||0},200<=b.width||200<=b.height)&&(this.h.removeEventListener("resize",this.Z,!1),this.l=b,this.d=!0);"boolean"==typeof a.hyphenate&&(this.R.Jc=a.hyphenate,this.d=!0);"boolean"==typeof a.horizontal&&(this.R.Ic=a.horizontal,this.d=!0);"boolean"==typeof a.nightMode&&(this.R.Qc=a.nightMode,this.d=!0);"number"==typeof a.lineHeight&&(this.R.lineHeight=a.lineHeight,this.d=!0);"number"==typeof a.columnWidth&&(this.R.Ec=a.columnWidth,this.d=!0);"string"==
typeof a.fontFamily&&(this.R.fontFamily=a.fontFamily,this.d=!0);"boolean"==typeof a.load&&(this.ea=a.load);"boolean"==typeof a.renderAllPages&&(this.Vc=a.renderAllPages);"string"==typeof a.userAgentRootURL&&(ua=a.userAgentRootURL);"boolean"==typeof a.spreadView&&a.spreadView!==this.R.Wa&&(this.viewport=null,this.R.Wa=a.spreadView,this.d=!0);"number"==typeof a.pageBorder&&a.pageBorder!==this.R.Fb&&(this.viewport=null,this.R.Fb=a.pageBorder,this.d=!0);"number"==typeof a.zoom&&a.zoom!==this.zoom&&(this.zoom=
a.zoom,this.F=!0);return M(!0)};function Tp(a){var b=[];a.e&&(b.push(a.e),a.e=null);a.j&&(b.push(a.j.left),b.push(a.j.right),a.j=null);b.forEach(function(a){a&&(w(a.M,"display","none"),a.removeEventListener("hyperlink",this.u,!1))},a)}function Up(a,b){b.addEventListener("hyperlink",a.u,!1);w(b.M,"visibility","visible");w(b.M,"display","block")}function Vp(a,b){Tp(a);a.e=b;Up(a,b)}
function Wp(a){var b=L("reportPosition");a.f||(a.f=Mp(a.b));wp(a.g,a.f.G,a.f.ma).then(function(c){var d=a.e;(a.ea&&0<d.f.length?yg(d.f):M(!0)).then(function(){Xp(a,d,c).ra(b)})});return N(b)}function Yp(a){var b=a.gb;if(a.l){var c=a.l;b.style.marginLeft=c.marginLeft+"px";b.style.marginRight=c.marginRight+"px";b.style.marginTop=c.marginTop+"px";b.style.marginBottom=c.marginBottom+"px";return new Am(a.h,a.fontSize,b,c.width,c.height)}return new Am(a.h,a.fontSize,b)}
function Zp(a){if(a.l||!a.viewport||a.viewport.fontSize!=a.fontSize)return!1;var b=Yp(a);if(!(b=b.width==a.viewport.width&&b.height==a.viewport.height)&&(b=a.b)){a:{a=a.b.Gb;for(b=0;b<a.length;b++){var c=a[b];if(c)for(var c=c.cb,d=0;d<c.length;d++){var e=c[d];if(e.H&&e.F){a=!0;break a}}}a=!1}b=!a}return b}
Op.prototype.ab=function(a,b,c){if(!this.N&&this.w&&0===b&&0===c){var d="";Object.keys(a).forEach(function(b){d+="@page "+b+"{size:";b=a[b];d+=b.width+"px "+b.height+"px;}"});this.w.textContent=d;this.N=!0}};
function $p(a){if(a.b){a.b.jc();for(var b=a.b.Gb,c=0;c<b.length;c++){var d=b[c];if(d)for(var d=d.cb,e;e=d.shift();)e=e.M,e.parentNode.removeChild(e)}}a.w&&(a.w.textContent="",a.N=!1);a.viewport=Yp(a);b=a.viewport;w(b.e,"width","");w(b.e,"height","");w(b.d,"width","");w(b.d,"height","");w(b.d,"transform","");a.b=new Ap(a.g,a.viewport,a.pa,a.R,a.ab.bind(a))}
function aq(a,b){a.F=!1;if(a.R.Wa)return Hp(a.b).vc(function(c){Tp(a);a.j=c;c.left&&(Up(a,c.left),c.right||c.left.M.setAttribute("data-vivliostyle-unpaired-page",!0));c.right&&(Up(a,c.right),c.left||c.right.M.setAttribute("data-vivliostyle-unpaired-page",!0));c=bq(a,c);a.viewport.zoom(c.width,c.height,a.zoom);a.e=b;return M(null)});Vp(a,b);a.viewport.zoom(b.d.width,b.d.height,a.zoom);a.e=b;return M(null)}
function bq(a,b){var c=0,d=0;b.left&&(c+=b.left.d.width,d=b.left.d.height);b.right&&(c+=b.right.d.width,d=Math.max(d,b.right.d.height));b.left&&b.right&&(c+=2*a.R.Fb);return{width:c,height:d}}var cq={ae:"fit inside viewport"};
function Rp(a){a.d=!1;if(Zp(a))return M(!0);"complete"===a.gb.getAttribute("data-vivliostyle-viewer-status")&&a.gb.setAttribute("data-vivliostyle-viewer-status","resizing");Qp(a,{t:"resizestart"});var b=L("resize");a.b&&!a.f&&(a.f=Mp(a.b));$p(a);Np(a.b,a.f).then(function(c){aq(a,c).then(function(){Wp(a).then(function(c){Hn.d("loadFirstPage");(a.Vc?a.b.Vc():M(null)).then(function(){a.gb.setAttribute("data-vivliostyle-viewer-status","complete");Qp(a,{t:"resizeend"});O(b,c)})})})});return N(b)}
function Xp(a,b,c){var d=L("sendLocationNotification"),e={t:"nav",first:b.k,last:b.l};zp(a.g,a.f).then(function(b){e.epage=b;e.epageCount=a.g.u;c&&(e.cfi=c);Qp(a,e);O(d,!0)});return N(d)}Op.prototype.jb=function(){return this.b?this.b.jb():null};
Op.prototype.Ka=function(a){var b=this;if("string"==typeof a.where)switch(a.where){case "next":a=this.R.Wa?this.b.Nd:this.b.nextPage;break;case "previous":a=this.R.Wa?this.b.Qd:this.b.Tc;break;case "last":a=this.b.Id;break;case "first":a=this.b.Hd;break;default:return M(!0)}else if("number"==typeof a.epage){var c=a.epage;a=function(){return Ip(b.b,c)}}else if("string"==typeof a.url){var d=a.url;a=function(){return Kp(b.b,d)}}else return M(!0);var e=L("nextPage");a.call(b.b).then(function(a){a?(b.f=
null,aq(b,a).then(function(){Wp(b).ra(e)})):O(e,!0)});return N(e)};Op.prototype.mc=function(a){var b=!!a.autohide;a=a.v;var c=this.b.jd();if(c){if("show"==a)return M(!0)}else if("hide"==a)return M(!0);if(c)return this.b.jc(),M(!0);var d=this,e=L("showTOC");this.b.mc(b).then(function(a){if(a){if(b){var c=function(){d.b.jc()};a.addEventListener("hyperlink",c,!1);a.M.addEventListener("click",c,!1)}a.addEventListener("hyperlink",d.u,!1)}O(e,!0)});return N(e)};
function dq(a,b){var c=b.a||"";return cf("runCommand",function(d){var e=a.oa[c];e?e.call(a,b).then(function(){Qp(a,{t:"done",a:c});O(d,!0)}):(v.error("No such action:",c),O(d,!0))},function(a,b){v.error(b,"Error during action:",c);O(a,!0)})}function eq(a){return"string"==typeof a?JSON.parse(a):a}
function fq(a,b){var c=eq(b),d=null;ef(function(){var b=L("commandLoop"),f=Ye.d;a.u=function(b){var c=a.H.some(function(a){return b.href.substr(0,a.length)==a}),d={t:"hyperlink",href:b.href,internal:c};ff(f,function(){Qp(a,d);return M(!0)})};uf(function(b){if(a.d)Rp(a).then(function(){wf(b)});else if(a.F)a.e&&aq(a,a.e).then(function(){wf(b)});else if(c){var e=c;c=null;dq(a,e).then(function(){wf(b)})}else e=L("waitForCommand"),d=nf(e,self),N(e).then(function(){wf(b)})}).ra(b);return N(b)});a.D=function(){var a=
d;a&&(d=null,a.Ua())};a.k=function(b){if(c)return!1;c=eq(b);a.D();return!0};a.h.adapt_command=a.k};Array.b||(Array.b=function(a,b,c){b&&c&&(b=b.bind(c));c=[];for(var d=a.length,e=0;e<d;e++)c[e]=b?b(a[e]):a[e];return c});Object.Pb||(Object.Pb=function(a,b){Object.keys(b).forEach(function(c){a[c]=b[c]});return a});function gq(a){var b={};Object.keys(a).forEach(function(c){var d=a[c];switch(c){case "autoResize":b.autoresize=d;break;case "pageBorderWidth":b.pageBorder=d;break;default:b[c]=d}});return b}function hq(a,b){ja=a.debug;this.f=a;this.b=new Op(a.window||window,a.viewportElement,"main",this.Gd.bind(this));this.e={autoResize:!0,fontSize:16,pageBorderWidth:1,renderAllPages:!0,spreadView:!1,zoom:1};b&&this.Bd(b);this.d=new fb}n=hq.prototype;
n.Bd=function(a){var b=Object.Pb({a:"configure"},gq(a));this.b.k(b);Object.Pb(this.e,a)};n.Gd=function(a){var b={type:a.t};Object.keys(a).forEach(function(c){"t"!==c&&(b[c]=a[c])});gb(this.d,b)};n.Sd=function(a,b){this.d.addEventListener(a,b,!1)};n.Vd=function(a,b){this.d.removeEventListener(a,b,!1)};n.Jd=function(a,b,c){a||gb(this.d,{type:"error",content:"No URL specified"});iq(this,a,null,b,c)};n.Td=function(a,b,c){a||gb(this.d,{type:"error",content:"No URL specified"});iq(this,null,a,b,c)};
function iq(a,b,c,d,e){d=d||{};var f,g=d.userStyleSheet;g&&(f=g.map(function(a){return{url:a.url||null,text:a.text||null}}));e&&Object.Pb(a.e,e);b=Object.Pb({a:b?"loadXML":"loadEPUB",userAgentRootURL:a.f.userAgentRootURL,url:b||c,document:d.documentObject,fragment:d.fragment,userStyleSheet:f},gq(a.e));fq(a.b,b)}n.jb=function(){return this.b.jb()};
n.Ld=function(a){a:switch(a){case "left":a="ltr"===this.jb()?"previous":"next";break a;case "right":a="ltr"===this.jb()?"next":"previous";break a}this.b.k({a:"moveTo",where:a})};n.Kd=function(a){this.b.k({a:"moveTo",url:a})};n.Ud=function(a){var b;a:{b=this.b;if(!b.e)throw Error("no page exists.");switch(a){case "fit inside viewport":a=b.R.Wa?bq(b,b.j):b.e.d;b=Math.min(b.viewport.width/a.width,b.viewport.height/a.height);break a;default:throw Error("unknown zoom type: "+a);}}return b};
ca("vivliostyle.viewer.Viewer",hq);hq.prototype.setOptions=hq.prototype.Bd;hq.prototype.addListener=hq.prototype.Sd;hq.prototype.removeListener=hq.prototype.Vd;hq.prototype.loadDocument=hq.prototype.Jd;hq.prototype.loadEPUB=hq.prototype.Td;hq.prototype.getCurrentPageProgression=hq.prototype.jb;hq.prototype.navigateToPage=hq.prototype.Ld;hq.prototype.navigateToInternalUrl=hq.prototype.Kd;hq.prototype.queryZoomFactor=hq.prototype.Ud;ca("vivliostyle.viewer.ZoomType",cq);cq.FIT_INSIDE_VIEWPORT="fit inside viewport";
Dn.call(Hn,"load_vivliostyle","end",void 0);var jq=16,kq="ltr";function lq(a){window.adapt_command(a)}function mq(){lq({a:"moveTo",where:"ltr"===kq?"previous":"next"})}function nq(){lq({a:"moveTo",where:"ltr"===kq?"next":"previous"})}
function oq(a){var b=a.key,c=a.keyIdentifier,d=a.location;if("End"===b||"End"===c)lq({a:"moveTo",where:"last"}),a.preventDefault();else if("Home"===b||"Home"===c)lq({a:"moveTo",where:"first"}),a.preventDefault();else if("ArrowUp"===b||"Up"===b||"Up"===c)lq({a:"moveTo",where:"previous"}),a.preventDefault();else if("ArrowDown"===b||"Down"===b||"Down"===c)lq({a:"moveTo",where:"next"}),a.preventDefault();else if("ArrowRight"===b||"Right"===b||"Right"===c)nq(),a.preventDefault();else if("ArrowLeft"===
b||"Left"===b||"Left"===c)mq(),a.preventDefault();else if("0"===b||"U+0030"===c)lq({a:"configure",fontSize:Math.round(jq)}),a.preventDefault();else if("t"===b||"U+0054"===c)lq({a:"toc",v:"toggle",autohide:!0}),a.preventDefault();else if("+"===b||"Add"===b||"U+002B"===c||"U+00BB"===c||"U+004B"===c&&d===KeyboardEvent.b)jq*=1.2,lq({a:"configure",fontSize:Math.round(jq)}),a.preventDefault();else if("-"===b||"Subtract"===b||"U+002D"===c||"U+00BD"===c||"U+004D"===c&&d===KeyboardEvent.b)jq/=1.2,lq({a:"configure",
fontSize:Math.round(jq)}),a.preventDefault()}
function pq(a){switch(a.t){case "loaded":a=a.viewer;var b=kq=a.jb();a.gb.setAttribute("data-vivliostyle-page-progression",b);a.gb.setAttribute("data-vivliostyle-spread-view",a.R.Wa);window.addEventListener("keydown",oq,!1);document.body.setAttribute("data-vivliostyle-viewer-status","complete");a=document.getElementById("vivliostyle-page-navigation-left");a.addEventListener("click",mq,!1);b=document.getElementById("vivliostyle-page-navigation-right");b.addEventListener("click",nq,!1);[a,b].forEach(function(a){a.setAttribute("data-vivliostyle-ui-state",
"attention");window.setTimeout(function(){a.removeAttribute("data-vivliostyle-ui-state")},1E3)});break;case "nav":(a=a.cfi)&&location.replace(ya(location.href,Va(a||"")));break;case "hyperlink":a.internal&&lq({a:"moveTo",url:a.href})}}
ca("vivliostyle.viewerapp.main",function(a){var b=a&&a.fragment||wa("f"),c=a&&a.epubURL||wa("b"),d=a&&a.xmlURL||wa("x"),e=a&&a.defaultPageWidth||wa("w"),f=a&&a.defaultPageHeight||wa("h"),g=a&&a.defaultPageSize||wa("size"),k=a&&a.orientation||wa("orientation"),h=wa("spread"),h=a&&a.spreadView||!!h&&"false"!=h,l=a&&a.viewportElement||document.body;a={a:c?"loadEPUB":"loadXML",url:c||d,autoresize:!0,fragment:b,renderAllPages:!0,userAgentRootURL:a&&a.uaRoot||null,document:a&&a.document||null,userStyleSheet:a&&
a.userStyleSheet||null,spreadView:h,pageBorder:1};var m;if(e&&f)m=e+" "+f;else{switch(g){case "A5":e="148mm";f="210mm";break;case "A4":e="210mm";f="297mm";break;case "A3":e="297mm";f="420mm";break;case "B5":e="176mm";f="250mm";break;case "B4":e="250mm";f="353mm";break;case "letter":e="8.5in";f="11in";break;case "legal":e="8.5in";f="14in";break;case "ledger":e="11in",f="17in"}e&&f&&(m=g,"landscape"===k&&(m=m?m+" landscape":null,g=e,e=f,f=g))}e&&f&&(a.viewport={width:e,height:f},g=document.createElement("style"),
g.textContent="@page { size: "+m+"; margin: 0; }",document.head.appendChild(g));fq(new Op(window,l,"main",pq),a)});
    return enclosingObject.vivliostyle;
}.bind(window));

},{}],3:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var supportTouchEvents = ("ontouchstart" in window);

_knockout2["default"].bindingHandlers.menuButton = {
    init: function init(element, valueAccessor) {
        if (_knockout2["default"].unwrap(valueAccessor())) {
            if (supportTouchEvents) {
                element.addEventListener("touchstart", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "hover active", true);
                });
                element.addEventListener("touchend", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "hover active", false);
                });
            } else {
                element.addEventListener("mouseover", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "hover", true);
                });
                element.addEventListener("mousedown", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "active", true);
                });
                element.addEventListener("mouseup", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "active", false);
                });
                element.addEventListener("mouseout", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "hover", false);
                });
            }
        }
    }
};

},{"knockout":1}],4:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _modelsMessageQueue = require("../models/message-queue");

var _modelsMessageQueue2 = _interopRequireDefault(_modelsMessageQueue);

var LogLevel = {
    DEBUG: "debug",
    INFO: "info",
    WARN: "warn",
    ERROR: "error"
};

function Logger() {
    this.logLevel = LogLevel.ERROR;
}

Logger.LogLevel = LogLevel;

Logger.prototype.setLogLevel = function (logLevel) {
    this.logLevel = logLevel;
};

Logger.prototype.debug = function (content) {
    if (this.logLevel === LogLevel.DEBUG) {
        _modelsMessageQueue2["default"].push({
            type: "debug",
            content: content
        });
    }
};

Logger.prototype.info = function (content) {
    if (this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.INFO) {
        _modelsMessageQueue2["default"].push({
            type: "info",
            content: content
        });
    }
};

Logger.prototype.warn = function (content) {
    if (this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.WARN) {
        _modelsMessageQueue2["default"].push({
            type: "warn",
            content: content
        });
    }
};

Logger.prototype.error = function (content) {
    if (this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.WARN || this.logLevel === LogLevel.ERROR) {
        _modelsMessageQueue2["default"].push({
            type: "error",
            content: content
        });
    }
};

var instance = new Logger();

Logger.getLogger = function () {
    return instance;
};

exports["default"] = Logger;
module.exports = exports["default"];

},{"../models/message-queue":7}],5:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _vivliostyle = require("vivliostyle");

var _vivliostyle2 = _interopRequireDefault(_vivliostyle);

var _modelsVivliostyle = require("./models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var _vivliostyleViewer = require("./vivliostyle-viewer");

var _vivliostyleViewer2 = _interopRequireDefault(_vivliostyleViewer);

_modelsVivliostyle2["default"].setInstance(_vivliostyle2["default"]);
_vivliostyleViewer2["default"].start();

},{"./models/vivliostyle":10,"./vivliostyle-viewer":20,"vivliostyle":2}],6:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _storesUrlParameters = require("../stores/url-parameters");

var _storesUrlParameters2 = _interopRequireDefault(_storesUrlParameters);

var _pageSize = require("./page-size");

var _pageSize2 = _interopRequireDefault(_pageSize);

function getDocumentOptionsFromURL() {
    var epubUrl = _storesUrlParameters2["default"].getParameter("b");
    var url = _storesUrlParameters2["default"].getParameter("x");
    var fragment = _storesUrlParameters2["default"].getParameter("f");
    return {
        epubUrl: epubUrl[0] || null,
        url: url.length ? url : null,
        fragment: fragment[0] || null
    };
}

function DocumentOptions() {
    var urlOptions = getDocumentOptionsFromURL();
    this.epubUrl = _knockout2["default"].observable(urlOptions.epubUrl || "");
    this.url = _knockout2["default"].observable(urlOptions.url || null);
    this.fragment = _knockout2["default"].observable(urlOptions.fragment || "");
    this.pageSize = new _pageSize2["default"]();

    // write fragment back to URL when updated
    this.fragment.subscribe(function (fragment) {
        var encoded = fragment.replace(/[\s+&?=#\u007F-\uFFFF]+/g, encodeURIComponent);
        _storesUrlParameters2["default"].setParameter("f", encoded);
    });
}

DocumentOptions.prototype.toObject = function () {
    // Do not include url
    // (url is a required argument to Viewer.loadDocument, separated from other options)
    return {
        fragment: this.fragment(),
        userStyleSheet: [{
            text: "@page {" + this.pageSize.toCSSDeclarationString() + "}"
        }]
    };
};

exports["default"] = DocumentOptions;
module.exports = exports["default"];

},{"../stores/url-parameters":11,"./page-size":8,"knockout":1}],7:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

function MessageQueue() {
  return _knockout2["default"].observableArray();
}

exports["default"] = new MessageQueue();
module.exports = exports["default"];

},{"knockout":1}],8:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var Mode = {
    AUTO: "auto",
    PRESET: "preset",
    CUSTOM: "custom"
};

var PresetSize = [{ name: "A5", description: "A5" }, { name: "A4", description: "A4" }, { name: "A3", description: "A3" }, { name: "B5", description: "B5 (ISO)" }, { name: "B4", description: "B4 (ISO)" }, { name: "JIS-B5", description: "B5 (JIS)" }, { name: "JIS-B4", description: "B4 (JIS)" }, { name: "letter", description: "letter" }, { name: "legal", description: "legal" }, { name: "ledger", description: "ledger" }];

function PageSize(pageSize) {
    this.mode = _knockout2["default"].observable(Mode.AUTO);
    this.presetSize = _knockout2["default"].observable(PresetSize[0]);
    this.isLandscape = _knockout2["default"].observable(false);
    this.customWidth = _knockout2["default"].observable("210mm");
    this.customHeight = _knockout2["default"].observable("297mm");
    this.isImportant = _knockout2["default"].observable(false);
    if (pageSize) {
        this.copyFrom(pageSize);
    }
}

PageSize.Mode = Mode;
PageSize.PresetSize = PageSize.prototype.PresetSize = PresetSize;

PageSize.prototype.copyFrom = function (other) {
    this.mode(other.mode());
    this.presetSize(other.presetSize());
    this.isLandscape(other.isLandscape());
    this.customWidth(other.customWidth());
    this.customHeight(other.customHeight());
    this.isImportant(other.isImportant());
};

PageSize.prototype.equivalentTo = function (other) {
    if (this.isImportant() !== other.isImportant()) {
        return false;
    }
    var mode = this.mode();
    if (other.mode() === mode) {
        switch (mode) {
            case Mode.AUTO:
                return true;
            case Mode.PRESET:
                return this.presetSize() === other.presetSize() && this.isLandscape() === other.isLandscape();
            case Mode.CUSTOM:
                return this.customWidth() === other.customWidth() && this.customHeight() === other.customHeight();
            default:
                throw new Error("Unknown mode " + mode);
        }
    } else {
        return false;
    }
};

PageSize.prototype.toCSSDeclarationString = function () {
    var declaration = "size: ";
    switch (this.mode()) {
        case Mode.AUTO:
            declaration += "auto";
            break;
        case Mode.PRESET:
            declaration += this.presetSize().name;
            if (this.isLandscape()) {
                declaration += " landscape";
            }
            break;
        case Mode.CUSTOM:
            declaration += this.customWidth() + " " + this.customHeight();
            break;
        default:
            throw new Error("Unknown mode " + this.mode());
    }

    if (this.isImportant()) {
        declaration += " !important";
    }

    return declaration + ";";
};

exports["default"] = PageSize;
module.exports = exports["default"];

},{"knockout":1}],9:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _storesUrlParameters = require("../stores/url-parameters");

var _storesUrlParameters2 = _interopRequireDefault(_storesUrlParameters);

function getViewerOptionsFromURL() {
    return {
        profile: _storesUrlParameters2["default"].getParameter("profile")[0] === "true",
        spreadView: _storesUrlParameters2["default"].getParameter("spread")[0] === "true"
    };
}

function getDefaultValues() {
    return {
        fontSize: 16,
        profile: false,
        spreadView: false,
        zoom: 1
    };
}

function ViewerOptions(options) {
    this.fontSize = _knockout2["default"].observable();
    this.profile = _knockout2["default"].observable();
    this.spreadView = _knockout2["default"].observable();
    this.zoom = _knockout2["default"].observable();
    if (options) {
        this.copyFrom(options);
    } else {
        var defaultValues = getDefaultValues();
        var urlOptions = getViewerOptionsFromURL();
        this.fontSize(defaultValues.fontSize);
        this.profile(urlOptions.profile || defaultValues.profile);
        this.spreadView(urlOptions.spreadView || defaultValues.spreadView);
        this.zoom(defaultValues.zoom);
    }
}

ViewerOptions.prototype.copyFrom = function (other) {
    this.fontSize(other.fontSize());
    this.profile(other.profile());
    this.spreadView(other.spreadView());
    this.zoom(other.zoom());
};

ViewerOptions.prototype.toObject = function () {
    return {
        fontSize: this.fontSize(),
        spreadView: this.spreadView(),
        zoom: this.zoom()
    };
};

ViewerOptions.getDefaultValues = getDefaultValues;

exports["default"] = ViewerOptions;
module.exports = exports["default"];

},{"../stores/url-parameters":11,"knockout":1}],10:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
function Vivliostyle() {
    this.viewer = null;
    this.constants = null;
    this.profile = null;
}

Vivliostyle.prototype.setInstance = function (vivliostyle) {
    this.viewer = vivliostyle.viewer;
    this.constants = vivliostyle.constants;
    this.profile = vivliostyle.profile;
};

exports["default"] = new Vivliostyle();
module.exports = exports["default"];

},{}],11:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _utilsStringUtil = require("../utils/string-util");

var _utilsStringUtil2 = _interopRequireDefault(_utilsStringUtil);

function getRegExpForParameter(name) {
    return new RegExp("[#&]" + _utilsStringUtil2["default"].escapeUnicodeString(name) + "=([^&]*)", "g");
}

function URLParameterStore() {
    this.history = window ? window.history : {};
    this.location = window ? window.location : { url: "" };
}

URLParameterStore.prototype.getParameter = function (name) {
    var url = this.location.href;
    var regexp = getRegExpForParameter(name);
    var results = [];
    var r;
    while (r = regexp.exec(url)) {
        results.push(r[1]);
    }
    return results;
};

URLParameterStore.prototype.setParameter = function (name, value) {
    var url = this.location.href;
    var updated;
    var regexp = getRegExpForParameter(name);
    var r = regexp.exec(url);
    if (r) {
        var l = r[1].length;
        var start = r.index + r[0].length - l;
        updated = url.substring(0, start) + value + url.substring(start + l);
    } else {
        updated = url + (url.match(/#/) ? "&" : "#") + name + "=" + value;
    }
    if (this.history.replaceState) {
        this.history.replaceState(null, "", updated);
    } else {
        this.location.href = updated;
    }
};

exports["default"] = new URLParameterStore();
module.exports = exports["default"];

},{"../utils/string-util":14}],12:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

// cf. http://www.w3.org/TR/DOM-Level-3-Events-key/
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var Keys = {
    Unidentified: "Unidentified",
    ArrowDown: "ArrowDown",
    ArrowLeft: "ArrowLeft",
    ArrowRight: "ArrowRight",
    ArrowUp: "ArrowUp",
    Home: "Home",
    End: "End",
    PageDown: "PageDown",
    PageUp: "PageUp",
    Escape: "Escape"
};

// CAUTION: This function covers only part of common keys on a keyboard. Keys not covered by the implementation are identified as KeyboardEvent.key, KeyboardEvent.keyIdentifier, or "Unidentified".
function identifyKeyFromEvent(event) {
    var key = event.key;
    var keyIdentifier = event.keyIdentifier;
    var location = event.location;
    if (key === Keys.ArrowDown || key === "Down" || keyIdentifier === "Down") {
        return Keys.ArrowDown;
    } else if (key === Keys.ArrowLeft || key === "Left" || keyIdentifier === "Left") {
        return Keys.ArrowLeft;
    } else if (key === Keys.ArrowRight || key === "Right" || keyIdentifier === "Right") {
        return Keys.ArrowRight;
    } else if (key === Keys.ArrowUp || key === "Up" || keyIdentifier === "Up") {
        return Keys.ArrowUp;
    } else if (key === Keys.Escape || key === "Esc" || keyIdentifier === "U+001B") {
        return Keys.Escape;
    } else if (key === "0" || keyIdentifier === "U+0030") {
        return "0";
    } else if (key === "+" || key === "Add" || keyIdentifier === "U+002B" || keyIdentifier === "U+00BB" || keyIdentifier === "U+004B" && location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD /* workaround for Chrome for Windows */) {
            return "+";
        } else if (key === "-" || key === "Subtract" || keyIdentifier === "U+002D" || keyIdentifier === "U+00BD" || keyIdentifier === "U+004D" && location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD /* workaround for Chrome for Windows */) {
            return "-";
        } else {
        return key || keyIdentifier || Keys.Unidentified;
    }
}

exports["default"] = {
    Keys: Keys,
    identifyKeyFromEvent: identifyKeyFromEvent
};
module.exports = exports["default"];

},{}],13:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var util = {
    readonlyObservable: function readonlyObservable(value) {
        var obs = _knockout2["default"].observable(value);
        return {
            getter: _knockout2["default"].pureComputed(function () {
                return obs();
            }),
            value: obs
        };
    }
};

exports["default"] = util;
module.exports = exports["default"];

},{"knockout":1}],14:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports['default'] = {
    escapeUnicodeChar: function escapeUnicodeChar(ch) {
        return '\\u' + (0x10000 | ch.charCodeAt(0)).toString(16).substring(1);
    },
    escapeUnicodeString: function escapeUnicodeString(str) {
        return str.replace(/[^-a-zA-Z0-9_]/g, this.escapeUnicodeChar);
    }
};
module.exports = exports['default'];

},{}],15:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

function MessageDialog(queue) {
    this.list = queue;
    this.visible = _knockout2["default"].pureComputed(function () {
        return queue().length > 0;
    });
}

MessageDialog.prototype.getDisplayMessage = function (errorInfo) {
    var e = errorInfo.error;
    var msg = e && (e.toString() || e.frameTrace || e.stack);
    if (msg) {
        msg = msg.split("\n", 1)[0];
    }
    if (!msg) {
        msg = errorInfo.messages.join("\n");
    }
    return msg;
};

exports["default"] = MessageDialog;
module.exports = exports["default"];

},{"knockout":1}],16:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var _modelsViewerOptions = require("../models/viewer-options");

var _modelsViewerOptions2 = _interopRequireDefault(_modelsViewerOptions);

var _utilsKeyUtil = require("../utils/key-util");

function Navigation(viewerOptions, viewer, settingsPanel) {
    this.viewerOptions_ = viewerOptions;
    this.viewer_ = viewer;
    this.settingsPanel_ = settingsPanel;

    this.isDisabled = _knockout2["default"].pureComputed(function () {
        return this.settingsPanel_.opened() || !this.viewer_.state.navigatable();
    }, this);
    this.isNavigateToPreviousDisabled = this.isDisabled;
    this.isNavigateToNextDisabled = this.isDisabled;
    this.isNavigateToLeftDisabled = this.isDisabled;
    this.isNavigateToRightDisabled = this.isDisabled;
    this.isNavigateToFirstDisabled = this.isDisabled;
    this.isNavigateToLastDisabled = this.isDisabled;
    this.isZoomOutDisabled = this.isDisabled;
    this.isZoomInDisabled = this.isDisabled;
    this.isZoomDefaultDisabled = this.isDisabled;
    this.isIncreaseFontSizeDisabled = this.isDisabled;
    this.isDecreaseFontSizeDisabled = this.isDisabled;
    this.isDefaultFontSizeDisabled = this.isDisabled;

    ["navigateToPrevious", "navigateToNext", "navigateToLeft", "navigateToRight", "navigateToFirst", "navigateToLast", "zoomIn", "zoomOut", "zoomDefault", "increaseFontSize", "decreaseFontSize", "defaultFontSize", "handleKey"].forEach(function (methodName) {
        this[methodName] = this[methodName].bind(this);
    }, this);
}

Navigation.prototype.navigateToPrevious = function () {
    if (!this.isNavigateToPreviousDisabled()) {
        this.viewer_.navigateToPrevious();
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.navigateToNext = function () {
    if (!this.isNavigateToNextDisabled()) {
        this.viewer_.navigateToNext();
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.navigateToLeft = function () {
    if (!this.isNavigateToLeftDisabled()) {
        this.viewer_.navigateToLeft();
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.navigateToRight = function () {
    if (!this.isNavigateToRightDisabled()) {
        this.viewer_.navigateToRight();
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.navigateToFirst = function () {
    if (!this.isNavigateToFirstDisabled()) {
        this.viewer_.navigateToFirst();
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.navigateToLast = function () {
    if (!this.isNavigateToLastDisabled()) {
        this.viewer_.navigateToLast();
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.zoomIn = function () {
    if (!this.isZoomInDisabled()) {
        var zoom = this.viewerOptions_.zoom();
        this.viewerOptions_.zoom(zoom * 1.25);
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.zoomOut = function () {
    if (!this.isZoomOutDisabled()) {
        var zoom = this.viewerOptions_.zoom();
        this.viewerOptions_.zoom(zoom * 0.8);
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.zoomDefault = function (force) {
    if (force === true || !this.isZoomDefaultDisabled()) {
        var zoom = this.viewer_.queryZoomFactor(_modelsVivliostyle2["default"].viewer.ZoomType.FIT_INSIDE_VIEWPORT);
        this.viewerOptions_.zoom(zoom);
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.increaseFontSize = function () {
    if (!this.isIncreaseFontSizeDisabled()) {
        var fontSize = this.viewerOptions_.fontSize();
        this.viewerOptions_.fontSize(fontSize * 1.25);
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.decreaseFontSize = function () {
    if (!this.isDecreaseFontSizeDisabled()) {
        var fontSize = this.viewerOptions_.fontSize();
        this.viewerOptions_.fontSize(fontSize * 0.8);
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.defaultFontSize = function () {
    if (!this.isDefaultFontSizeDisabled()) {
        var fontSize = _modelsViewerOptions2["default"].getDefaultValues().fontSize;
        this.viewerOptions_.fontSize(fontSize);
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.handleKey = function (key) {
    switch (key) {
        case _utilsKeyUtil.Keys.ArrowDown:
        case _utilsKeyUtil.Keys.PageDown:
            return !this.navigateToNext();
        case _utilsKeyUtil.Keys.ArrowLeft:
            return !this.navigateToLeft();
        case _utilsKeyUtil.Keys.ArrowRight:
            return !this.navigateToRight();
        case _utilsKeyUtil.Keys.ArrowUp:
        case _utilsKeyUtil.Keys.PageUp:
            return !this.navigateToPrevious();
        case _utilsKeyUtil.Keys.Home:
            return !this.navigateToFirst();
        case _utilsKeyUtil.Keys.End:
            return !this.navigateToLast();
        case "+":
            return !this.increaseFontSize();
        case "-":
            return !this.decreaseFontSize();
        case "0":
            return !this.defaultFontSize();
        default:
            return true;
    }
};

exports["default"] = Navigation;
module.exports = exports["default"];

},{"../models/viewer-options":9,"../models/vivliostyle":10,"../utils/key-util":12,"knockout":1}],17:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _modelsViewerOptions = require("../models/viewer-options");

var _modelsViewerOptions2 = _interopRequireDefault(_modelsViewerOptions);

var _modelsPageSize = require("../models/page-size");

var _modelsPageSize2 = _interopRequireDefault(_modelsPageSize);

var _utilsKeyUtil = require("../utils/key-util");

function SettingsPanel(viewerOptions, documentOptions, viewer, messageDialog) {
    this.viewerOptions_ = viewerOptions;
    this.documentOptions_ = documentOptions;
    this.viewer_ = viewer;

    this.opened = _knockout2["default"].observable(false);
    this.state = {
        viewerOptions: new _modelsViewerOptions2["default"](viewerOptions),
        pageSize: new _modelsPageSize2["default"](documentOptions.pageSize)
    };

    ["close", "toggle", "apply", "reset"].forEach(function (methodName) {
        this[methodName] = this[methodName].bind(this);
    }, this);

    messageDialog.visible.subscribe(function (visible) {
        if (visible) this.close();
    }, this);
}

SettingsPanel.prototype.close = function () {
    this.opened(false);
};

SettingsPanel.prototype.toggle = function () {
    this.opened(!this.opened());
};

SettingsPanel.prototype.apply = function () {
    if (this.state.pageSize.equivalentTo(this.documentOptions_.pageSize)) {
        this.viewerOptions_.copyFrom(this.state.viewerOptions);
    } else {
        this.documentOptions_.pageSize.copyFrom(this.state.pageSize);
        this.viewer_.loadDocument(this.documentOptions_, this.state.viewerOptions);
    }
};

SettingsPanel.prototype.reset = function () {
    this.state.viewerOptions.copyFrom(this.viewerOptions_);
    this.state.pageSize.copyFrom(this.documentOptions_.pageSize);
};

SettingsPanel.prototype.handleKey = function (key) {
    switch (key) {
        case _utilsKeyUtil.Keys.Escape:
            this.close();
            return true;
        default:
            return true;
    }
};

exports["default"] = SettingsPanel;
module.exports = exports["default"];

},{"../models/page-size":8,"../models/viewer-options":9,"../utils/key-util":12,"knockout":1}],18:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var _modelsDocumentOptions = require("../models/document-options");

var _modelsDocumentOptions2 = _interopRequireDefault(_modelsDocumentOptions);

var _modelsViewerOptions = require("../models/viewer-options");

var _modelsViewerOptions2 = _interopRequireDefault(_modelsViewerOptions);

var _modelsMessageQueue = require("../models/message-queue");

var _modelsMessageQueue2 = _interopRequireDefault(_modelsMessageQueue);

var _viewer = require("./viewer");

var _viewer2 = _interopRequireDefault(_viewer);

var _navigation = require("./navigation");

var _navigation2 = _interopRequireDefault(_navigation);

var _settingsPanel = require("./settings-panel");

var _settingsPanel2 = _interopRequireDefault(_settingsPanel);

var _messageDialog = require("./message-dialog");

var _messageDialog2 = _interopRequireDefault(_messageDialog);

var _utilsKeyUtil = require("../utils/key-util");

var _utilsKeyUtil2 = _interopRequireDefault(_utilsKeyUtil);

var _storesUrlParameters = require("../stores/url-parameters");

var _storesUrlParameters2 = _interopRequireDefault(_storesUrlParameters);

function ViewerApp() {
    this.documentOptions = new _modelsDocumentOptions2["default"]();
    this.viewerOptions = new _modelsViewerOptions2["default"]();
    if (this.viewerOptions.profile()) {
        _modelsVivliostyle2["default"].profile.profiler.enable();
    }
    this.viewerSettings = {
        userAgentRootURL: "resources/",
        viewportElement: document.getElementById("vivliostyle-viewer-viewport"),
        debug: _storesUrlParameters2["default"].getParameter("debug")[0] === "true"
    };
    this.viewer = new _viewer2["default"](this.viewerSettings, this.viewerOptions);
    this.messageDialog = new _messageDialog2["default"](_modelsMessageQueue2["default"]);
    this.settingsPanel = new _settingsPanel2["default"](this.viewerOptions, this.documentOptions, this.viewer, this.messageDialog);
    this.navigation = new _navigation2["default"](this.viewerOptions, this.viewer, this.settingsPanel);

    this.handleKey = (function (data, event) {
        var key = _utilsKeyUtil2["default"].identifyKeyFromEvent(event);
        var ret = this.settingsPanel.handleKey(key);
        if (ret) {
            ret = this.navigation.handleKey(key);
        }
        return ret;
    }).bind(this);

    this.setDefaultView();

    this.viewer.loadDocument(this.documentOptions);
}

ViewerApp.prototype.setDefaultView = function () {
    var status = this.viewer.state.status();
    this.viewer.state.status.subscribe(function (newStatus) {
        var finished = false;
        var oldStatus = status;
        status = newStatus;
        if (oldStatus === "loading" && newStatus === "complete") {
            // After document loaded, zoom to the default size
            finished = this.navigation.zoomDefault(true);
        } else if (newStatus === "loading") {
            finished = false;
        }
    }, this);
};

exports["default"] = ViewerApp;
module.exports = exports["default"];

},{"../models/document-options":6,"../models/message-queue":7,"../models/viewer-options":9,"../models/vivliostyle":10,"../stores/url-parameters":11,"../utils/key-util":12,"./message-dialog":15,"./navigation":16,"./settings-panel":17,"./viewer":19,"knockout":1}],19:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _utilsObservableUtil = require("../utils/observable-util");

var _utilsObservableUtil2 = _interopRequireDefault(_utilsObservableUtil);

var _loggingLogger = require("../logging/logger");

var _loggingLogger2 = _interopRequireDefault(_loggingLogger);

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

function Viewer(viewerSettings, viewerOptions) {
    this.viewerOptions_ = viewerOptions;
    this.documentOptions_ = null;
    this.viewer_ = new _modelsVivliostyle2["default"].viewer.Viewer(viewerSettings, viewerOptions.toObject());
    var state_ = this.state_ = {
        status: _utilsObservableUtil2["default"].readonlyObservable("loading"),
        pageProgression: _utilsObservableUtil2["default"].readonlyObservable(_modelsVivliostyle2["default"].constants.LTR)
    };
    this.state = {
        status: state_.status.getter,
        navigatable: _knockout2["default"].pureComputed(function () {
            return state_.status.value() === "complete";
        }),
        pageProgression: state_.pageProgression.getter
    };

    this.setupViewerEventHandler();
    this.setupViewerOptionSubscriptions();
}

Viewer.prototype.setupViewerEventHandler = function () {
    var logger = _loggingLogger2["default"].getLogger();
    this.viewer_.addListener("debug", function (payload) {
        logger.debug(payload.content);
    });
    this.viewer_.addListener("info", function (payload) {
        logger.info(payload.content);
    });
    this.viewer_.addListener("warn", function (payload) {
        logger.warn(payload.content);
    });
    this.viewer_.addListener("error", function (payload) {
        logger.error(payload.content);
    });
    this.viewer_.addListener("resizestart", (function () {
        var status = this.state.status();
        if (status === "complete") {
            this.state_.status.value("resizing");
        }
    }).bind(this));
    this.viewer_.addListener("resizeend", (function () {
        this.state_.status.value("complete");
    }).bind(this));
    this.viewer_.addListener("loaded", (function () {
        this.state_.pageProgression.value(this.viewer_.getCurrentPageProgression());
        this.state_.status.value("complete");
        if (this.viewerOptions_.profile()) {
            _modelsVivliostyle2["default"].profile.profiler.printTimings();
        }
    }).bind(this));
    this.viewer_.addListener("nav", (function (payload) {
        var cfi = payload.cfi;
        if (cfi) {
            this.documentOptions_.fragment(cfi);
        }
    }).bind(this));
    this.viewer_.addListener("hyperlink", (function (payload) {
        if (payload.internal) {
            this.viewer_.navigateToInternalUrl(payload.href);
        } else {
            window.location.href = payload.href;
        }
    }).bind(this));
};

Viewer.prototype.setupViewerOptionSubscriptions = function () {
    _knockout2["default"].computed(function () {
        var viewerOptions = this.viewerOptions_.toObject();
        if (this.state.status.peek() === "complete") {
            this.viewer_.setOptions(viewerOptions);
        }
    }, this).extend({ rateLimit: 0 });
};

Viewer.prototype.loadDocument = function (documentOptions, viewerOptions) {
    this.state_.status.value("loading");
    if (viewerOptions) {
        this.viewerOptions_.copyFrom(viewerOptions);
    }
    this.documentOptions_ = documentOptions;
    if (documentOptions.url()) {
        this.viewer_.loadDocument(documentOptions.url(), documentOptions.toObject(), this.viewerOptions_.toObject());
    } else if (documentOptions.epubUrl()) {
        this.viewer_.loadEPUB(documentOptions.epubUrl(), documentOptions.toObject(), this.viewerOptions_.toObject());
    }
};

Viewer.prototype.navigateToPrevious = function () {
    this.viewer_.navigateToPage("previous");
};

Viewer.prototype.navigateToNext = function () {
    this.viewer_.navigateToPage("next");
};

Viewer.prototype.navigateToLeft = function () {
    this.viewer_.navigateToPage("left");
};

Viewer.prototype.navigateToRight = function () {
    this.viewer_.navigateToPage("right");
};

Viewer.prototype.navigateToFirst = function () {
    this.viewer_.navigateToPage("first");
};

Viewer.prototype.navigateToLast = function () {
    this.viewer_.navigateToPage("last");
};

Viewer.prototype.queryZoomFactor = function (type) {
    return this.viewer_.queryZoomFactor(type);
};

exports["default"] = Viewer;
module.exports = exports["default"];

},{"../logging/logger":4,"../models/vivliostyle":10,"../utils/observable-util":13,"knockout":1}],20:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _bindingsMenuButtonJs = require("./bindings/menuButton.js");

var _bindingsMenuButtonJs2 = _interopRequireDefault(_bindingsMenuButtonJs);

var _viewmodelsViewerApp = require("./viewmodels/viewer-app");

var _viewmodelsViewerApp2 = _interopRequireDefault(_viewmodelsViewerApp);

exports["default"] = {
    start: function start() {
        function startViewer() {
            _knockout2["default"].applyBindings(new _viewmodelsViewerApp2["default"]());
        }

        if (window["__loaded"]) startViewer();else window.onload = startViewer;
    }
};
module.exports = exports["default"];

},{"./bindings/menuButton.js":3,"./viewmodels/viewer-app":18,"knockout":1}]},{},[5]);
