# FullSoak

[![JSR](https://jsr.io/badges/@fullsoak/fullsoak)](https://jsr.io/@fullsoak/fullsoak)
[![JSR Score](https://jsr.io/badges/@fullsoak/fullsoak/score)](https://jsr.io/@fullsoak/fullsoak)
[![Built with the Deno Standard Library](https://raw.githubusercontent.com/denoland/deno_std/main/badge.svg)](https://jsr.io/@std)
[![codecov](https://codecov.io/gh/fullsoak/fullsoak/graph/badge.svg?token=P84VP42BYB)](https://codecov.io/gh/fullsoak/fullsoak)

FullS(tack)oak (FullSoak for short) is a modern (born 2025), no-build TypeScript
fullstack framework for building fast web applications with a shallow learning
curve. At its core is the [Oak](https://oakserver.org) http server framework
which is inspired by Koa (one of the popular Node.js http frameworks).

## Key Differentiators

1. FullSoak is **no-build** [[1]](#nobundle). Zero, zip, zilch, nada. That
   means: no `tsc`, no `webpack` (or any such equivalence). All files are served
   from where they are. No surprises. Still, optimizations such as minification
   and mangling are supported.

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
   Next.js or Remix, FullSoak is actually very "stupid looking": 1) you start
   with a "Controller" file (as in good old "MVC") which 2) renders your TSX
   component as `text/html` content (i.e. a plain string), and then 3) the
   content hydrates itself on the client side.

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
    "fullsoak": "jsr:@fullsoak/fullsoak@x.x.x",
    "preact": "npm:preact@10.25.4"
  },
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

## SSR examples

Server-side rendering is supported via `preact-iso`. See examples:

- [SSR](https://github.com/fullsoak/deno-examples/blob/v0.2.0/src/main.ts#L23-L28)
- [Isomorphic FE component](https://github.com/fullsoak/deno-examples/blob/v0.2.0/src/components/MyRouteAwareComponent/index.tsx#L23-L39)

## Live Demo / Projects using FullSoak

- https://fullsoak.onrender.com

## Further Reading

- Project Wiki: https://github.com/fullsoak/fullsoak/wiki
- <a name="nobundle">[1]</a>
  [no bundle](https://github.com/fullsoak/fullsoak/wiki/Concepts-&-Example-Deployment#no-build)
