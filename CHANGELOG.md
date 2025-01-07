## [Unreleased]

### Fixing

- ssr component import issue (file vs jsr)

## [0.2.0] - 2025-01-07

### Changed

- components now requests for their own named client-side js files, e.g.
  `/js/PageFoo/mount.js`, this also solves the potential "cache invalidation"
  question by nature

## [0.1.2] - 2025-01-07

### Fixed

- bug: `styles.css` should be optional (the app must not crash if there's no css
  file for any component)
- README Markdown typo fix

## [0.1.1] - 2025-01-07

### Added

- example for Deno-based setup added to README

### Changed

- library naming convention is `FullSoak`

### Fixed

- bug: getGlobalComponentsDir is not a function

## [0.1.0] - 2025-01-06

### Added

- initial release
