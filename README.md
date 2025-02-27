# FullSoak

[![JSR](https://jsr.io/badges/@fullsoak/fullsoak)](https://jsr.io/@fullsoak/fullsoak)
[![JSR Score](https://jsr.io/badges/@fullsoak/fullsoak/score)](https://jsr.io/@fullsoak/fullsoak)
[![Built with the Deno Standard Library](https://raw.githubusercontent.com/denoland/deno_std/main/badge.svg)](https://jsr.io/@std)
[![codecov](https://codecov.io/gh/fullsoak/fullsoak/graph/badge.svg?token=P84VP42BYB)](https://codecov.io/gh/fullsoak/fullsoak)
![Discord](https://img.shields.io/discord/1341201350108905566?style=flat)

FullS(tack)oak (FullSoak for short) is a modern (born 2025), no-build TypeScript
fullstack framework for building fast web applications with a shallow learning
curve. At its core is the [Oak](https://oakserver.org) http server framework
which is inspired by Koa (one of the popular Node.js http frameworks).

## Key Differentiators

1. FullSoak is **no-build** [[1]](#nobundle). Zero, zip, zilch, nada. That
   means: no `tsc` nor `webpack`. All files are served from where they are. No
   surprises. Still, optimizations such as minification and mangling are
   supported.

2. FullSoak supports both JSX and HTM (Hyperscript Tagged Markup) which boasts
   [several enhancements over JSX](https://www.npmjs.com/package/htm#improvements-over-jsx) -
   but most importantly: both require no separate build step (back to point 1).
   JSX transformation is automatically applied on a per-file basis.

3. FullSoak is [Preact](https://preactjs.com/). So: the familiarity of React,
   but as lean as we need it to be.

4. FullSoak is SSR-first & SSR-optimized. See Deno's explanation on
   [JSX precompile](https://docs.deno.com/runtime/reference/jsx/#jsx-precompile-transform)
   for more details.

5. FullSoak is (mostly) WYSIWYG. Compared to sophisticated frameworks such as
   Next.js, or Remix, or Deno's Fresh, FullSoak is intended to be quite
   "feature-poor": 1) you start with a "Controller" file (as in good old "MVC")
   which 2) renders your TSX component as `text/html` content (i.e. a plain
   string), and then 3) the content hydrates itself on the client side. For
   isomorphic use cases, there're no "special-purpose functions" to remember:
   where & how to write data fetching logic is left entirely at the disposal of
   the developer.

## Example usage

As with most frameworks, fullsoak recommends a certain directory structure.
Here's a bare-minimum example for Deno runtime:

Prerequisite:
[Deno](https://docs.deno.com/runtime/getting_started/installation/#download-and-install)

```
fullsoak-example
|_ src
|  |_ components
|  |  |_ Shared
|  |  |  |_ styles.css
|  |  |_ MyComponent
|  |     |_ index.tsx
|  |     |_ styles.css
|  |_ main.ts
|_ deno.jsonc
```

```jsonc
// deno.jsonc
{
  "imports": {
    "fullsoak": "jsr:@fullsoak/fullsoak@0.14.0",
    "preact": "npm:preact@10.26.2"
  },
  "nodeModulesDir": "auto",
  "compilerOptions": {
    // see https://docs.deno.com/runtime/reference/jsx/#jsx-precompile-transform
    "jsx": "precompile",
    "jsxImportSource": "preact",
    "jsxPrecompileSkipElements": ["a", "link"]
  }
}
```

```ts
// src/main.ts
import { Controller, Get, ssr, useFullSoak } from "fullsoak";
import { MyComponent } from "./components/MyComponent/index.tsx";

@Controller()
class MyController {
  @Get("/")
  index() {
    return ssr(MyComponent);
  }
}

const port = 3991;

useFullSoak({ port, controllers: [MyController] });
```

```ts
// src/components/MyComponent/index.tsx
import type { FunctionComponent } from "preact";
export const MyComponent: FunctionComponent = () => <div>hello, world</div>;
```

```css
/* src/components/MyComponent/styles.css */
@import "/components/Shared/styles.css";
```

Then the app can be started up for local development:

```bash
deno -A --watch src/main.ts
```

or simply served directly on production and/or inside a Docker container:

```bash
# please supply the Deno security permissions flags to your desire
# https://docs.deno.com/runtime/fundamentals/security/#permissions
deno src/main.ts
```

## Isomorphic Components

Rendering isomorphic components is supported via `preact-iso`. See examples:

- [SSR](https://github.com/fullsoak/deno-examples/blob/v0.3.0/src/main.ts#L23-L29)
- [Isomorphic components](https://github.com/fullsoak/deno-examples/blob/v0.3.0/src/components/MyRouteAwareComponent/index.tsx#L24-L47)

## Live Demo / Projects using FullSoak

- https://fullsoak-examples.deno.dev (example on Deno runtime)
- https://fullsoak.onrender.com (example on Bun runtime)
- https://fullsoak-cloudflare-workers-examples.dklab.workers.dev/ (example on
  Cloudflare Workers)
- wanna list yours? please feel free to open a PR

## Trade-offs

**Build step**, while imposing additional cognitive loads & occasionally
hindering a good Developer Experience, has its own benefits. Without build
(bundling) step, the optimizations (e.g. resource loaders in build-time or
run-time) have to be provisioned in other manners. The high-level wish is to use
as much standard web specs as possible (think
[preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload),
[prefetch](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/prefetch),
etc.) to make up for what's sacrified by dropping the build step.

Besides, more benchmarks are needed on small & large scale codebases across
different use cases (e.g. MPA blog site vs rich-interactive SPA vs even large
E-Commerce site) to get an understanding of how feasible / scalable this
approach is, and for which scenarios.

## Further Reading

- Project Wiki: https://github.com/fullsoak/fullsoak/wiki
- Code examples with Deno runtime: https://github.com/fullsoak/deno-examples
- Code examples with Node.js runtime:
  https://github.com/fullsoak/nodejs-examples
- Code examples with Bun runtime: https://github.com/fullsoak/bun-examples
- Code examples with Cloudflare Workers:
  https://github.com/fullsoak/cloudflare-workers-examples
- Preact's take on
  [No-build Workflows](https://preactjs.com/guide/v10/no-build-workflows/)

---

<a name="nobundle">[1]</a>
[no bundle](https://github.com/fullsoak/fullsoak/wiki/Concepts-&-Example-Deployment#no-build)
