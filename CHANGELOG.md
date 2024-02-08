# Changelog

## [2.1.2](https://github.com/recap-utr/arguemapper/compare/v2.1.1...v2.1.2) (2024-02-08)


### Bug Fixes

* improve layout and fitView ([33933fd](https://github.com/recap-utr/arguemapper/commit/33933fde8a126f4c408a63c6951f99f7efef2304))

## [2.1.1](https://github.com/recap-utr/arguemapper/compare/v2.1.0...v2.1.1) (2024-02-08)


### Bug Fixes

* use layered layout by default ([c626862](https://github.com/recap-utr/arguemapper/commit/c6268629f1f3c67104f2ed8e6a4b9581ceef9017))

## [2.1.0](https://github.com/recap-utr/arguemapper/compare/v2.0.0...v2.1.0) (2024-02-05)


### Features

* show additional resource fields ([918e7cd](https://github.com/recap-utr/arguemapper/commit/918e7cd33052728c6be7d131507dff7f9dadfa24))


### Bug Fixes

* make sidebars bigger, adjust mobile breakpoint ([ff90097](https://github.com/recap-utr/arguemapper/commit/ff900970a872c096db03494be155fdc1552b58d7))

## [2.0.0](https://github.com/recap-utr/arguemapper/compare/v1.2.0...v2.0.0) (2024-02-03)


### ⚠ BREAKING CHANGES

* The application has been converted from commonjs to
esm.
* The state handling code has been largely rebuilt.
This will reset the cached state in the browser the first time the new
version is launched.

### Features

* convert to esm ([d51a1a7](https://github.com/recap-utr/arguemapper/commit/d51a1a7f144404c4fd35587fb77cddce561b97e1))
* enable hotkeys for undo/redo/save ([396abb9](https://github.com/recap-utr/arguemapper/commit/396abb96e66896abf59a6868e11f1f13cc462bfa))
* enable multi-arch docker builds ([d9ea46d](https://github.com/recap-utr/arguemapper/commit/d9ea46d4ae589fc27855119c0311635b38c13db1))
* use arguebuf library instead of custom model ([11647f0](https://github.com/recap-utr/arguemapper/commit/11647f09c65e596e851c721b9120033e309631aa))


### Bug Fixes

* aif export did not start download ([7fd0ef5](https://github.com/recap-utr/arguemapper/commit/7fd0ef507acc6705a306a6d80bacda78d5fbe791))
* capitalize scheme names ([b36f611](https://github.com/recap-utr/arguemapper/commit/b36f611a0f48eaca0ab915ec23a79c0ee2389172))
* clone elements before modifying them ([66a1828](https://github.com/recap-utr/arguemapper/commit/66a18285bd1f689565ed2f83544684a8e12adc23))
* correctly compare past/current state in zundo ([74e31c9](https://github.com/recap-utr/arguemapper/commit/74e31c94b401c1cd9dbf28218a9e73c215c90602))
* delete connected edges when deleting nodes ([30da2fd](https://github.com/recap-utr/arguemapper/commit/30da2fd0c6be08b41707c734fcb72ebf9bceb1fa))
* **deps:** bump arguebuf to fix copy bug ([3e3b0a2](https://github.com/recap-utr/arguemapper/commit/3e3b0a2bb4ae85438e5f23c66611fe1eb3024d3a))
* improve performance of snackbar ([df05cf4](https://github.com/recap-utr/arguemapper/commit/df05cf4b4d95c87c91ac85f8fd5c9aa37af7d5de))
* improve serialization process ([3cf9344](https://github.com/recap-utr/arguemapper/commit/3cf9344c093e96407331250ca5ab2973e497c1a5))
* improve state handling ([ae8a6f7](https://github.com/recap-utr/arguemapper/commit/ae8a6f7d88c093c1b0821304309822c930f79a2c))
* migrate custom equality function ([d465f9e](https://github.com/recap-utr/arguemapper/commit/d465f9e4d2a5f8d2fbfb2e246f8935dd3b4dd89e))
* migrate inspector fields to arguebuf library ([83db122](https://github.com/recap-utr/arguemapper/commit/83db122bdc73ac0f4111d671fb4a9231a2ce24c2))
* optimize temporal store usage ([013e31a](https://github.com/recap-utr/arguemapper/commit/013e31afcb9f06b23f390f3ea0663ddc6be5f908))
* properly serialize analyst ([5c3e43f](https://github.com/recap-utr/arguemapper/commit/5c3e43f8225e04073adf3aa0f4e46547d4df7cd3))
* properly set graph data ([1b88bb8](https://github.com/recap-utr/arguemapper/commit/1b88bb8fc1bf2ed1a1acb78b25a38a94411041ac))
* re-enable analyst verification ([773a283](https://github.com/recap-utr/arguemapper/commit/773a283d412271c07d0c627ec07324086ccd415f))
* re-enable setting argument schemes ([1c4e71b](https://github.com/recap-utr/arguemapper/commit/1c4e71bcc577ba99b75f248b56384ef7026a4a15))
* remove analyst before adding during export ([c554fd7](https://github.com/recap-utr/arguemapper/commit/c554fd729a2ffb4d1fe3d4e0888ed1ba4ad295b1))
* remove unneeded loader component ([1ce7cac](https://github.com/recap-utr/arguemapper/commit/1ce7cac88c30379d5563a68bc82b03b7631e56ed))
* resolve errors when adding edges ([7bcad32](https://github.com/recap-utr/arguemapper/commit/7bcad325022bd200c390d3ffea59bf0ba361db31))
* temporarily disable analyst verification ([0cf2425](https://github.com/recap-utr/arguemapper/commit/0cf2425c46549f4fe690261af1a059f2bb18a1b7))
* update grpc template ([a4d760b](https://github.com/recap-utr/arguemapper/commit/a4d760bd5eed102892d53f62918eedc1757451ae))
* update store version to invalidate caches ([78fd010](https://github.com/recap-utr/arguemapper/commit/78fd010df82c0685891e8af462a6bed09ee51466))
* use correct date formatting ([41c215c](https://github.com/recap-utr/arguemapper/commit/41c215c715e15cd9308f694f2630c739b539fe46))
* use temporal store via hook ([55916ef](https://github.com/recap-utr/arguemapper/commit/55916ef3788f23d4049543f10e1e60a251c50c83))
* zundo type error ([93fcf6a](https://github.com/recap-utr/arguemapper/commit/93fcf6aeca9c8bffb7f9c9ec77a86815e3d9f723))


### Miscellaneous Chores

* add changes ([13ea36c](https://github.com/recap-utr/arguemapper/commit/13ea36ccc38597bd8c7042771fe71bd2f21d3260))
* add changes ([c683350](https://github.com/recap-utr/arguemapper/commit/c6833508e086632271e2e14ffc7480c06d762d61))

## [1.2.0](https://github.com/recap-utr/arguemapper/compare/v1.1.12...v1.2.0) (2022-12-22)


### Features

* show correct version in inspector ([9a03279](https://github.com/recap-utr/arguemapper/commit/9a032792d08981be89d1169f13ee069a9dc441a4))

## [1.1.12](https://github.com/recap-utr/arguemapper/compare/v1.1.11...v1.1.12) (2022-12-22)


### Bug Fixes

* show version in inspector ([4a93933](https://github.com/recap-utr/arguemapper/commit/4a939330619199c8e0109b4e5f6c39d3dbeb89ab))

## [1.1.11](https://github.com/recap-utr/arguemapper/compare/v1.1.10...v1.1.11) (2022-12-22)


### Bug Fixes

* delete connected edges when deleting nodes ([f5fe3cb](https://github.com/recap-utr/arguemapper/commit/f5fe3cb46827dbbfd6ee02098522cf930df9736e))
* update deps ([4eed2ab](https://github.com/recap-utr/arguemapper/commit/4eed2ab541f2ad51412cb2c50b8b3b64d8052750))

## [1.1.10](https://github.com/recap-utr/arguemapper/compare/v1.1.9...v1.1.10) (2022-12-19)


### Bug Fixes

* **deps:** update dependency arg-services to v1 ([#14](https://github.com/recap-utr/arguemapper/issues/14)) ([5815244](https://github.com/recap-utr/arguemapper/commit/5815244726c6358dbdb7c65a6edbfa8308fb0f7e))

## [1.1.9](https://github.com/recap-utr/arguemapper/compare/v1.1.8...v1.1.9) (2022-12-18)


### Bug Fixes

* bump version ([dc6575d](https://github.com/recap-utr/arguemapper/commit/dc6575d707eaa3f51b8b593b37a1b6742eff4ee6))

## [1.1.8](https://github.com/recap-utr/arguemapper/compare/v1.1.7...v1.1.8) (2022-12-18)


### Bug Fixes

* bump version ([8543724](https://github.com/recap-utr/arguemapper/commit/854372413725ad80b81904e9b6abd13d9611119f))

## [1.1.7](https://github.com/recap-utr/arguemapper/compare/v1.1.6...v1.1.7) (2022-12-18)


### Bug Fixes

* correct docker release condition ([29d1cbb](https://github.com/recap-utr/arguemapper/commit/29d1cbb404c824b659637682cee6face5110935d))

## [1.1.6](https://github.com/recap-utr/arguemapper/compare/v1.1.5...v1.1.6) (2022-12-18)


### Bug Fixes

* bump version ([b5733b4](https://github.com/recap-utr/arguemapper/commit/b5733b4c459ecb4465030675d8d581294e7a3ff7))

## [1.1.5](https://github.com/recap-utr/arguemapper/compare/v1.1.4...v1.1.5) (2022-12-18)


### Bug Fixes

* update dependenices ([5d6ab3a](https://github.com/recap-utr/arguemapper/commit/5d6ab3a44108e4ac3df736705051151486ba1c71))
