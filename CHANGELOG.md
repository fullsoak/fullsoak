## [0.14.0] - 2025-02-27

### Added

- support for Node.js runtime (with [tsx](https://tsx.is/))
- generic support for `fetch` mode (similar to support for Cloudflare Workers)
  via `import { useFetchMode } from "jsr:@fullsoak/fullsoak"`
- `useFullOak()` accepts a new (optional) init parameter: `hostname`
- wider support for different file/folder structures:
  - before: only `/components/ComponentName/index.tsx` is supported
  - now: `/components/ComponentName.tsx` is also supported
- best-effort (untested) support for Windows systems

### Changed

- shipped import map now has `preact` and `preact-iso` version always pinned to
  their corresponding values in `deno.jsonc`

## [0.13.1] - 2025-02-25

### Added

- we can now `import { useFullSoak } from "jsr:@fullsoak/fullsoak/testing"` as
  an alias for `import { useFullSoak } from "jsr:@fullsoak/fullsoak/manual"`

### Removed

- unintended export(s) from `v0.13.0` now removed

## [0.13.0] - 2025-02-25

### Added

- we can now `import { useFullSoak } from "jsr:@fullsoak/fullsoak/manual"` for
  e.g. writing tests

### Fixed

- `abort` (returned by `useFullSoak()`) should now be callable without "Illegal
  invocation" error

## [0.12.1] - 2025-02-25

### Changed

- `useFullSoak()` now returns a tuple of [`Promise<Application>`, `Abort`]
- `port` argument is now optional during framework init (defaulting to `0`
  underneath)

## [0.12.0] - 2025-02-25

### Changed

- `useFullSoak()` now returns a tuple of [`Application`, `Abort`]
- `_unstable_useFetchMode()` renamed to `_unstable_useCloudflareWorkersMode()`

## [0.11.0] - 2025-02-24

### Fixed

- importing `.ts` and `.js` files in tsx components is now supported

## [0.10.1] - 2025-02-23

### Changed

- upgraded dependencies: `jsr:oak-routing-ctrl@^0.14.1`
- updated README example for SSR and Isomorphic Components

## [0.10.0] - 2025-02-21

### Added

- the path `/fullsoak` now also exports the function `locationStub` so that we
  can use it in isomorphic React Components. On client-side it's a no-op, on
  server-side it's the util function provided by `preact-iso`:
  https://github.com/preactjs/preact-iso/pull/28

### Changed

- dep upgrades: `npm:@swc/core@^1.10.18`, `npm:preact@10.26.2`

## [0.9.0] - 2025-02-16

### Changed

- experimental support for Cloudflare Workers is improved, utilizing Cloudflare
  Workers Static Assets serving

## [0.8.2] - 2025-02-16

### Changed

- fallback mechanism for `@swc/core` (introduced in v0.8.0) is changed to
  `typescript` so that it works in environments that don't support native
  bindings (such as Deno Deploy); this results in potentially longer transpiling
  (and so, loading) time for the TSX components, but it's acceptable as a
  fallback

## [0.8.1] - 2025-02-15

### Added

- `HtmlShell` is now exported to be used together with `byoHtml` for an
  unconventional use case (intentionally undocumented)

### Changed

- for the battery-included HTML document template, the top-level `main` element
  has its `id` attribute changed from `main` to `fullsoak-htmlshell-main` in
  order to reduce risks of clashing with other HTML elements in "userland"

## [0.8.0] - 2025-02-15

### Added

- `_unstable_useFetchMode()` is provided as an experimental support for using
  FullSoak in environments such as Cloudflare Workers
- fallback mechanism when `@swc/core` fails to load in unsupported environments

### Changed

- dep upgrades: `npm:@swc/core@^1.10.16`, `jsr:@std/log@^0.224.14`
- reusing SWC's `minify` in favour of `ugligy-js`

### Removed

- `getComponentJs()` is removed from the module export list

## [0.7.1] - 2025-02-12

### Changed

- `@jsxImportSource` pragma is removed from `HtmlShell.tsx` file, resulting in
  compatibility with Bun runtime

## [0.7.0] - 2025-02-10

### Changed

- the framework now supports serving `.tsx` files out of the box, without
  declaring a dedicated GET endpoint
- component (text/javascript) content is served minified
- dep upgrades: `npm:preact-render-to-string@^6.5.13`, `npm:@swc/core@^1.10.15`

### Removed

- removed unused exports from `mod.ts`

## [0.6.2] - 2025-02-06

### Added

- JSR docs

### Fixed

- errors while minifying css are stringified in the log output

## [0.6.1] - 2025-02-06

### Fixed

- avoided APIs that only work on Deno runtime
- error message re. failure while loading a component file should be correctly
  parsed

## [0.6.0] - 2025-02-05

### Added

- experimental support for `preact-iso` via module import
  `@fullsoak/fullsoak/preact-iso` and via client-side import map
- client-side support for using `@fullsoak/fullsoak` in import map
- exposed utility function `getComponentJs`

### Changed

- dependency upgrades: `jsr:@oak/oak@17.1.4`,
  `jsr:@dklab/oak-routing-ctrl@^0.14.0`

## [0.5.0] - 2025-01-20

### Added

- debug mode (enabled via `DEBUG=*` env var)
- support for `@std/log` - see 'custom logger' in
  [docs](https://jsr.io/@std/log#examples)
- handler for `/components/:compName/styles.css` that is simply a WYSIWYG
  file-based serving mechanism

## [0.4.0] - 2025-01-19

### Added

- "native" support for JSX syntax (`htm` support remains the same)

## [0.3.0] - 2025-01-13

### Changed

- using `@swc/core` as a workaround for dynamic import which doesn't work in the
  context of local Deno project using a framework from jsr.io:
  https://github.com/denoland/deno/discussions/26266

## [0.2.1] - 2025-01-07

### Fixed

- ssr component import issue (file vs jsr.io)
- typox fix for example setup in README

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
