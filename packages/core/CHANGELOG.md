# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.10.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.9.1...v2.10.0) (2021-09-17)

### Bug Fixes

- Default body margin should be 0 in paged media ([874a518](https://github.com/vivliostyle/vivliostyle.js/commit/874a51828e85034aed6533f0659860f1a39edca6)), closes [#776](https://github.com/vivliostyle/vivliostyle.js/issues/776)
- Footnote counter should be predefined and available by default ([16096b2](https://github.com/vivliostyle/vivliostyle.js/commit/16096b2dc619f6e0cf702084f0dc3a09edce21f3)), closes [#723](https://github.com/vivliostyle/vivliostyle.js/issues/723)
- Named page at the first page is not applied when HTML head part is big ([0f696dc](https://github.com/vivliostyle/vivliostyle.js/commit/0f696dce748c3a9680187da10115d8e13dc0606b)), closes [#770](https://github.com/vivliostyle/vivliostyle.js/issues/770)
- Named page not properly changed when target-counter refers the page ([c303c2b](https://github.com/vivliostyle/vivliostyle.js/commit/c303c2bf3c1234dc0a333931eadb224bde505a35)), closes [#771](https://github.com/vivliostyle/vivliostyle.js/issues/771)
- Percentage font-size on :root causes wrong font-size in table with page/column breaks ([6f0e6c3](https://github.com/vivliostyle/vivliostyle.js/commit/6f0e6c3e6b4d04971e4541f905d3b3f20118760a)), closes [#549](https://github.com/vivliostyle/vivliostyle.js/issues/549)
- prevent useless warning "Property not supported by the browser: behavior" ([1462a89](https://github.com/vivliostyle/vivliostyle.js/commit/1462a892f1e87018c45a96105939f26c087a00bf))
- Remove -ms- prefixed properties for no-longer supported browsers ([7e7bf1b](https://github.com/vivliostyle/vivliostyle.js/commit/7e7bf1b10e626257fae5653091c138b5a4b9bd26))
- Root element styles should be inherited to the page context ([1a41185](https://github.com/vivliostyle/vivliostyle.js/commit/1a4118538f6b7cfb80a9174fc1ee4300a9b69501)), closes [#568](https://github.com/vivliostyle/vivliostyle.js/issues/568)
- text-combine-upright with text-indent does not work properly ([1cabb91](https://github.com/vivliostyle/vivliostyle.js/commit/1cabb91fae7ff4abc0c56ff907173e6770ef578c))
- The :not() selector not working when the argument has ID selector ([60a127f](https://github.com/vivliostyle/vivliostyle.js/commit/60a127f11cfaa5071f58eb211b91431c3ab78eec)), closes [#769](https://github.com/vivliostyle/vivliostyle.js/issues/769)

### Features

- Add support for `line-break: anywhere` ([ba60007](https://github.com/vivliostyle/vivliostyle.js/commit/ba60007f189a401a5c5508c3ac0147799d075793))
- Add support for `overflow-wrap: anywhere` ([96564af](https://github.com/vivliostyle/vivliostyle.js/commit/96564af3739b25d37954c755e1eba625eaf34a1e))
- Add support for `white-space: break-spaces` ([f563b61](https://github.com/vivliostyle/vivliostyle.js/commit/f563b61f6fe70f2e0df75df59e1e46fe9ffa1484))
- Add support for the font-variant-\* properties ([504896b](https://github.com/vivliostyle/vivliostyle.js/commit/504896bc9a388c22a7f02ac4704778063472f741)), closes [#592](https://github.com/vivliostyle/vivliostyle.js/issues/592)
- Support the min-content, max-content, and fit-content values for width and height ([9ce72b0](https://github.com/vivliostyle/vivliostyle.js/commit/9ce72b0bd0b65380516bc1e40d25561c87f86e4d)), closes [#605](https://github.com/vivliostyle/vivliostyle.js/issues/605)
- Support unicode-range descriptor ([a3f488f](https://github.com/vivliostyle/vivliostyle.js/commit/a3f488f86fe264e3dd1a895de9f0495a2c489aa1)), closes [#598](https://github.com/vivliostyle/vivliostyle.js/issues/598)

## [2.9.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.9.0...v2.9.1) (2021-09-08)

### Bug Fixes

- Page at-rule in conditional rule is applied even if condition is false ([b114396](https://github.com/vivliostyle/vivliostyle.js/commit/b11439676d49eb075174b288f4c7a5838f21c7db))

# [2.9.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.8.1...v2.9.0) (2021-09-03)

### Bug Fixes

- "TypeError: Cannot read property '1' of null" occurred in getTOC() ([d4539f7](https://github.com/vivliostyle/vivliostyle.js/commit/d4539f7d934ac0a856a9fb45befd205632a29d96))
- Vivliostyle Viewer stops working when window resizing on renderAllPages=false mode ([5ae9298](https://github.com/vivliostyle/vivliostyle.js/commit/5ae92980051fa4d816b47ed0ba8e7227670ba5da)), closes [#752](https://github.com/vivliostyle/vivliostyle.js/issues/752)

### Features

- Support the `@supports` CSS at-rule ([08efaef](https://github.com/vivliostyle/vivliostyle.js/commit/08efaef17b7c430ef0e3e30029480d3bb0953655)), closes [#730](https://github.com/vivliostyle/vivliostyle.js/issues/730)

## [2.8.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.8.0...v2.8.1) (2021-07-14)

### Bug Fixes

- inherited text-indent ignored after page/column break ([32aba92](https://github.com/vivliostyle/vivliostyle.js/commit/32aba928339134d26a43103a007e1c52e2dd3aac)), closes [#737](https://github.com/vivliostyle/vivliostyle.js/issues/737)
- Problem on navigation to document URL without fragment from TOC ([a948394](https://github.com/vivliostyle/vivliostyle.js/commit/a948394535ef2a43d92be26aa479910219a700f2)), closes [#736](https://github.com/vivliostyle/vivliostyle.js/issues/736)
- Text disappears at page break when footnote or page float is given on before pseudo element ([d78a168](https://github.com/vivliostyle/vivliostyle.js/commit/d78a168a0b46091c05a85f02db3d8248e76c2e9e)), closes [#740](https://github.com/vivliostyle/vivliostyle.js/issues/740)
- typescript error TS2612: Property 'xxx' will overwrite the base property ([e8c52ea](https://github.com/vivliostyle/vivliostyle.js/commit/e8c52eaefbeb56e6d7333bdb573376d580f272de))
- Unnecessary reformatting when resizing window ([51e2f99](https://github.com/vivliostyle/vivliostyle.js/commit/51e2f995336343993adbdeda27a42a827b687fa4)), closes [#743](https://github.com/vivliostyle/vivliostyle.js/issues/743)

# [2.8.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.7.0...v2.8.0) (2021-04-16)

### Bug Fixes

- Failed to fetch documents when pub-manifest file has no file name extension ([7fd2e15](https://github.com/vivliostyle/vivliostyle.js/commit/7fd2e157af034c50f120658c182510ca66374949))
- InvalidNodeTypeError: Failed to execute 'setStartBefore' on 'Range': the given Node has no parent ([836b64c](https://github.com/vivliostyle/vivliostyle.js/commit/836b64cd82e56dc391b3fa814ada256a2dadde2e)), closes [#715](https://github.com/vivliostyle/vivliostyle.js/issues/715)
- Stops with error when CSS property value calc() has invalid expression ([61001a2](https://github.com/vivliostyle/vivliostyle.js/commit/61001a24abd7e327c34d1c52a834edf09b65f015)), closes [#717](https://github.com/vivliostyle/vivliostyle.js/issues/717)
- Stops with InvalidCharacterError: Failed to execute 'setAttribute' on 'Element' ([f0253fa](https://github.com/vivliostyle/vivliostyle.js/commit/f0253fa8744af1111b84dc1766cf15e5db7c95af)), closes [#718](https://github.com/vivliostyle/vivliostyle.js/issues/718)
- target-counter and forced page break caused layout problems ([377eaf9](https://github.com/vivliostyle/vivliostyle.js/commit/377eaf9da2d55c85ceee0814d553c3b3ee3ed83f)), closes [#722](https://github.com/vivliostyle/vivliostyle.js/issues/722)
- The ::first-letter pseudo-element not applied when a newline is preceding the first letter ([546ed74](https://github.com/vivliostyle/vivliostyle.js/commit/546ed7449c4c5e3fd187b07de6efbab54f5123e9)), closes [#716](https://github.com/vivliostyle/vivliostyle.js/issues/716)
- TOC panel should not have a whole document in web publication ([d95043b](https://github.com/vivliostyle/vivliostyle.js/commit/d95043b23f3a349875c520b53e957e8730f781d3)), closes [#720](https://github.com/vivliostyle/vivliostyle.js/issues/720)

### Features

- support :blank page selector ([7145f76](https://github.com/vivliostyle/vivliostyle.js/commit/7145f7631b58f9677c016b36cd57c8d2a268a469)), closes [#428](https://github.com/vivliostyle/vivliostyle.js/issues/428)

# [2.7.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.6.2...v2.7.0) (2021-04-07)

### Features

- add paper sizes ([245e39a](https://github.com/vivliostyle/vivliostyle.js/commit/245e39a32c801701e1d30decb574407c99a8347c))
- support named pages ([9fba2eb](https://github.com/vivliostyle/vivliostyle.js/commit/9fba2ebb0c20fd926dc422165b139985621e4934)), closes [#425](https://github.com/vivliostyle/vivliostyle.js/issues/425)

## [2.6.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.6.1...v2.6.2) (2021-03-25)

### Bug Fixes

- Failed to load documents from URL that contains "%26" or "%3F" etc. ([c7da706](https://github.com/vivliostyle/vivliostyle.js/commit/c7da706c7bdaeaf9848472284ff9303defe9e1d8)), closes [#711](https://github.com/vivliostyle/vivliostyle.js/issues/711)
- TypeError: Cannot read property 'anchorSlot' of undefined ([1625c81](https://github.com/vivliostyle/vivliostyle.js/commit/1625c810625999bedc28f53514c1fa11d2b539d1)), closes [#712](https://github.com/vivliostyle/vivliostyle.js/issues/712)

## [2.6.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.6.0...v2.6.1) (2021-03-23)

### Bug Fixes

- Minimum font size setting in Chrome causes ruby font size problem ([5e52c6f](https://github.com/vivliostyle/vivliostyle.js/commit/5e52c6fb8a581405d96ba5ff1165e9e01823308b)), closes [#673](https://github.com/vivliostyle/vivliostyle.js/issues/673)

# [2.6.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.5.2...v2.6.0) (2021-03-14)

### Bug Fixes

- **core:** Footnotes may cause "TypeError: Cannot read property 'styler' of null" ([fbce3c7](https://github.com/vivliostyle/vivliostyle.js/commit/fbce3c709b9b76a1833af54a9dd68a620ae1b9f3)), closes [#707](https://github.com/vivliostyle/vivliostyle.js/issues/707)
- **core:** Stops with "TypeError: Cannot read property 'toLowerCase' of undefined" ([38548ab](https://github.com/vivliostyle/vivliostyle.js/commit/38548abd013914c1bdf78d5dbcccb68ed9c043ee)), closes [#706](https://github.com/vivliostyle/vivliostyle.js/issues/706)

## [2.5.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.5.1...v2.5.2) (2021-03-05)

### Bug Fixes

- **core:** Hang-up with footnote or page float on pseudo elements ([cf324d4](https://github.com/vivliostyle/vivliostyle.js/commit/cf324d404922b01f19e5fd675874fb4aad7ef593)), closes [#703](https://github.com/vivliostyle/vivliostyle.js/issues/703)

## [2.5.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.5.0...v2.5.1) (2021-02-28)

### Bug Fixes

- **core:** Wrong page counter value when page counter is reset in the previous doc ([a4d9e18](https://github.com/vivliostyle/vivliostyle.js/commit/a4d9e185aae96407be217d3505706216582dd0d8)), closes [#701](https://github.com/vivliostyle/vivliostyle.js/issues/701)

# [2.5.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.5.0-pre.0...v2.5.0) (2021-02-26)

### Features

- **core:** Support the :nth() page selector ([ad6f3e9](https://github.com/vivliostyle/vivliostyle.js/commit/ad6f3e9c788425097c7be3443b2032733c32cdb4)), closes [#667](https://github.com/vivliostyle/vivliostyle.js/issues/667)

## [2.5.0-pre.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.4.2...v2.5.0-pre.0) (2021-02-23)

### Bug Fixes

- **core:** Missing source map ([f8add2b](https://github.com/vivliostyle/vivliostyle.js/commit/f8add2bc50b4a333c1d62806675adfa05eb3b61e)), closes [#695](https://github.com/vivliostyle/vivliostyle.js/issues/695)
- **core:** spread break at beginning of a document does not work properly ([f1208bf](https://github.com/vivliostyle/vivliostyle.js/commit/f1208bf8d4a542970fdca64a0ff99679064715a7)), closes [#666](https://github.com/vivliostyle/vivliostyle.js/issues/666)

## [2.4.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.4.1...v2.4.2) (2021-01-25)

### Bug Fixes

- top margin at forced break was ignored when target-counter is used ([c8485ad](https://github.com/vivliostyle/vivliostyle.js/commit/c8485ad668fd462fca15c960660c154388214bc9)), closes [#690](https://github.com/vivliostyle/vivliostyle.js/issues/690)

## [2.4.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.4.0...v2.4.1) (2021-01-12)

### Bug Fixes

- Page float displayed unexpectedly in earlier page when target-counter is used ([34952e9](https://github.com/vivliostyle/vivliostyle.js/commit/34952e97636236b71f520f9feccc747b65aca85c)), closes [#681](https://github.com/vivliostyle/vivliostyle.js/issues/681)

# [2.4.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.3.0...v2.4.0) (2020-12-28)

### Features

- Support named strings for running headers and footers ([e02a06c](https://github.com/vivliostyle/vivliostyle.js/commit/e02a06c2bb7400e61e5c956aef90b31004ad2685)), closes [#545](https://github.com/vivliostyle/vivliostyle.js/issues/545)

# [2.3.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.2.3...v2.3.0) (2020-12-07)

### Bug Fixes

- break-before:left/right is ignored when the previous block has break-after:page, etc. ([01092f1](https://github.com/vivliostyle/vivliostyle.js/commit/01092f1113b37a3bcdfc0c59f3e194dc46be5704)), closes [#676](https://github.com/vivliostyle/vivliostyle.js/issues/676)
- CSS 'hyphens' property specified on the root element is ignored ([dfb9f87](https://github.com/vivliostyle/vivliostyle.js/commit/dfb9f876cdbe86c81474d14e427fd384f8fbda9c)), closes [#674](https://github.com/vivliostyle/vivliostyle.js/issues/674)

### Features

- Support EPUB spine properties page-spread-left and -right ([38b0774](https://github.com/vivliostyle/vivliostyle.js/commit/38b0774e8e2159f17335d57b95c22bcfb29913f9)), closes [#671](https://github.com/vivliostyle/vivliostyle.js/issues/671)

## [2.2.3](https://github.com/vivliostyle/vivliostyle.js/compare/v2.2.2...v2.2.3) (2020-11-28)

**Note:** Version bump only for package @vivliostyle/core

## [2.1.4](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.3...v2.1.4) (2020-10-30)

### Bug Fixes

- negative z-index on `[@page](https://github.com/page) {...}` causes page (margin-box) content to disappear ([000eed6](https://github.com/vivliostyle/vivliostyle.js/commit/000eed65c2527216f0be85433e6ccbfa7f4a07a9)), closes [#665](https://github.com/vivliostyle/vivliostyle.js/issues/665)

## [2.1.3](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.2...v2.1.3) (2020-09-30)

### Bug Fixes

- Internal links and TOC links not working when the document URL has %-encoded characters ([bdabb71](https://github.com/vivliostyle/vivliostyle.js/commit/bdabb71a28ed2e5f65087142cbb220220fe56aee)), closes [#662](https://github.com/vivliostyle/vivliostyle.js/issues/662)
- page display shakes horizontally when all pages finish loading ([18ab3c9](https://github.com/vivliostyle/vivliostyle.js/commit/18ab3c9c03592f7339392460409a1994db42f2af)), closes [#663](https://github.com/vivliostyle/vivliostyle.js/issues/663)
- SyntaxError: Invalid regular expression: invalid group specifier name, on Safari ([3a70707](https://github.com/vivliostyle/vivliostyle.js/commit/3a70707899194a8b63a8461fa323d929120aabd5)), closes [#664](https://github.com/vivliostyle/vivliostyle.js/issues/664)

## [2.1.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.2-pre.5...v2.1.2) (2020-09-28)

**Note:** Version bump only for package @vivliostyle/core

## [2.1.2-pre.5](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.2-pre.4...v2.1.2-pre.5) (2020-09-28)

### Bug Fixes

- Relative URLs in pub-manifest are not resolved properly when the pub-manifest is linked from HTML elsewhere ([b6fe7c1](https://github.com/vivliostyle/vivliostyle.js/commit/b6fe7c11e84094a2abc12db6950862e205760e6c)), closes [#661](https://github.com/vivliostyle/vivliostyle.js/issues/661)
- TOC is not enabled when TOC exists in HTML but is not specified in the manifest ([ea280a1](https://github.com/vivliostyle/vivliostyle.js/commit/ea280a1a4b0d8e2868b4eca260f45695f9302511)), closes [#659](https://github.com/vivliostyle/vivliostyle.js/issues/659)

## [2.1.2-pre.4](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.2-pre.3...v2.1.2-pre.4) (2020-09-27)

### Bug Fixes

- "404 Not Found" error message does not appear when bookMode=true ([43b137c](https://github.com/vivliostyle/vivliostyle.js/commit/43b137cc8d7a40f602ca74fef50fb5698f436bbd)), closes [#660](https://github.com/vivliostyle/vivliostyle.js/issues/660)

## [2.1.2-pre.3](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.2-pre.2...v2.1.2-pre.3) (2020-09-25)

**Note:** Version bump only for package @vivliostyle/core

## [2.1.2-pre.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.2-pre.1...v2.1.2-pre.2) (2020-09-25)

### Bug Fixes

- improve error messages when failed to load, wrongly mentioning CORS problem ([55843cf](https://github.com/vivliostyle/vivliostyle.js/commit/55843cf0ee6dff9ccda79255ed402693354d06ca)), closes [#638](https://github.com/vivliostyle/vivliostyle.js/issues/638)

## [2.1.2-pre.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.2-pre.0...v2.1.2-pre.1) (2020-09-24)

### Bug Fixes

- 'start' and 'value' attributes on OL and LI elements are ignored ([0aea654](https://github.com/vivliostyle/vivliostyle.js/commit/0aea654032e532d0613da777731a1c0482f4387b)), closes [#654](https://github.com/vivliostyle/vivliostyle.js/issues/654)
- Error occurs by links to external site in TOC ([fd4af3e](https://github.com/vivliostyle/vivliostyle.js/commit/fd4af3e830b736d0387479d562e746c3e0603078)), closes [#657](https://github.com/vivliostyle/vivliostyle.js/issues/657)
- HTML 'hidden' attribute is ignored ([bf51734](https://github.com/vivliostyle/vivliostyle.js/commit/bf5173495959a8b34376566bfeaca8cd234ed35a)), closes [#653](https://github.com/vivliostyle/vivliostyle.js/issues/653)
- Style elements in the body element should not be ignored ([d8603c3](https://github.com/vivliostyle/vivliostyle.js/commit/d8603c319ab065786fd3afeb0c7da0f1beb4c5e9)), closes [#655](https://github.com/vivliostyle/vivliostyle.js/issues/655)
- TOC element with 'hidden' attribute should be hidden in the page but visible in TOC panel ([19d8f62](https://github.com/vivliostyle/vivliostyle.js/commit/19d8f62a4c689c955e374db39b76f2b956457431))

## [2.1.2-pre.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.1...v2.1.2-pre.0) (2020-09-18)

### Bug Fixes

- EPUBCFI with %-encoded characters not working ([309ab42](https://github.com/vivliostyle/vivliostyle.js/commit/309ab4282f163b3239c03aaf4013bf20b4684463)), closes [#650](https://github.com/vivliostyle/vivliostyle.js/issues/650)
- Internal links not working when the URL fragment has %-encoded characters ([f12e9c5](https://github.com/vivliostyle/vivliostyle.js/commit/f12e9c51a5f19356d24d258b7142cee497d61bb3)), closes [#649](https://github.com/vivliostyle/vivliostyle.js/issues/649)
- Reloading causes unexpected move to the previous page ([8f872e1](https://github.com/vivliostyle/vivliostyle.js/commit/8f872e1d0ae1dc7421a2d7a70d0dad96854b00d4)), closes [#651](https://github.com/vivliostyle/vivliostyle.js/issues/651)

## [2.1.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.0...v2.1.1) (2020-06-30)

### Bug Fixes

- only generate commonjs ([08f6410](https://github.com/vivliostyle/vivliostyle.js/commit/08f64109a9a7ef485b0b8d783f2c0f3f969a1151))

## [2.1.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.0-pre.3...v2.1.0) (2020-06-30)

**Note:** Version bump only for package @vivliostyle/core

## [2.1.0-pre.3](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.0-pre.2...v2.1.0-pre.3) (2020-06-30)

### Bug Fixes

- change epage type to number ([a059d11](https://github.com/vivliostyle/vivliostyle.js/commit/a059d1156d2bd10fc3dbc902ee1c128620c46e2b))

## [2.1.0-pre.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.0-pre.1...v2.1.0-pre.2) (2020-06-30)

**Note:** Version bump only for package @vivliostyle/core

## [2.1.0-pre.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.0-pre.0...v2.1.0-pre.1) (2020-06-30)

### Bug Fixes

- simplify build dep graph ([8b5467d](https://github.com/vivliostyle/vivliostyle.js/commit/8b5467df34c784b399f051e04f796917a13e91d7))
- **core:** main prop ([234879a](https://github.com/vivliostyle/vivliostyle.js/commit/234879aa2dab028db37af0b124d07170a8020d1d))
- **core:** move resources ([1ad7bef](https://github.com/vivliostyle/vivliostyle.js/commit/1ad7beff99bb339ff2635792c232f99a9117e723))

## [2.1.0-pre.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0...v2.1.0-pre.0) (2020-05-13)

### Bug Fixes

- epub metadata sorts and uses "scheme" correctly ([301e5b4](https://github.com/vivliostyle/vivliostyle.js/commit/301e5b43d4b3349975085d26e096df73d7cf5258))
- improve type safety of epub metadata parsing ([b4dc5e2](https://github.com/vivliostyle/vivliostyle.js/commit/b4dc5e2319834f67a600afe2cd2780c573e1303c))

### Features

- add core viewer method to export the toc ([f080aa5](https://github.com/vivliostyle/vivliostyle.js/commit/f080aa54b70b8cf06a52bdd98f4e7fa29414fe83))
- add core viewer methods to export metadata ([d4f700c](https://github.com/vivliostyle/vivliostyle.js/commit/d4f700c33e2421a8032f5454aab6adb252e29f34))
- support reading role properties from epub metadata ([955d01d](https://github.com/vivliostyle/vivliostyle.js/commit/955d01d99db974f44f9d8c00d6e1b5e55b9cc3f8))

## [2.0.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.13...v2.0.0) (2020-04-03)

**Note:** Version bump only for package @vivliostyle/core

## [2.0.0-pre.13](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.12...v2.0.0-pre.13) (2020-04-02)

**Note:** Version bump only for package @vivliostyle/core

## [2.0.0-pre.12](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.11...v2.0.0-pre.12) (2020-04-02)

**Note:** Version bump only for package @vivliostyle/core

## [2.0.0-pre.11](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.10...v2.0.0-pre.11) (2020-04-01)

**Note:** Version bump only for package @vivliostyle/core

## [2.0.0-pre.10](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.9...v2.0.0-pre.10) (2020-03-26)

**Note:** Version bump only for package @vivliostyle/core

## [2.0.0-pre.9](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.8...v2.0.0-pre.9) (2020-03-20)

**Note:** Version bump only for package @vivliostyle/core

## [2.0.0-pre.8](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.7...v2.0.0-pre.8) (2020-03-16)

### Features

- update Vivliostyle logo images ([cea5822](https://github.com/vivliostyle/vivliostyle.js/commit/cea58226c97e2cc4a84d6af57d566fbdf722579b))

## [2.0.0-pre.7](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.6...v2.0.0-pre.7) (2020-01-03)

### Bug Fixes

- "Received an empty response" error on web servers that don't know XHTML MIME type ([6e7c6ba](https://github.com/vivliostyle/vivliostyle.js/commit/6e7c6ba5cd871d98d0177bdcdf29b2fa14788315))
- **core:** TypeError: Cannot read property 'cell' of undefined ([0598e6c](https://github.com/vivliostyle/vivliostyle.js/commit/0598e6c2cc4ae11f8612346e95098bbe3f531d52)), closes [#623](https://github.com/vivliostyle/vivliostyle.js/issues/623)

## [2.0.0-pre.6](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.5...v2.0.0-pre.6) (2019-12-23)

**Note:** Version bump only for package @vivliostyle/core

## [2.0.0-pre.5](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.4...v2.0.0-pre.5) (2019-12-23)

### Bug Fixes

- document links ([ce486d9](https://github.com/vivliostyle/vivliostyle.js/commit/ce486d94da6dd6816a169c3765c6b2ae7e4106b5))
- export PrintConfig ([f6d21b3](https://github.com/vivliostyle/vivliostyle.js/commit/f6d21b360fc9a1625f534a3a298fcdaf7d621b4b))

## [2.0.0-pre.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.0...v2.0.0-pre.1) (2019-12-15)

**Note:** Version bump only for package @vivliostyle/core
