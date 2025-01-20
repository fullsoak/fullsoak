# FullSoak

FullS(tack)oak (FullSoak for short) is a modern (born 2025), no-build TypeScript
fullstack framework for building fast web applications with a shallow learning
curve. At its core is the [Oak](https://oakserver.org) http server framework
which is inspired by Koa (one of the popular Node.js http frameworks).

## Key Differentiators

1. FullSoak is **no-build**. Zero, zip, zilch, nada. That means: no `tsc`, no
   `webpack` (or any such equivalence). All files are served from where they
   are. No surprises. Still, optimizations such as minification and mangling are
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
