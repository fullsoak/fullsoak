# fullsoak

fulls(tack)oak (fullsoak for short) is a modern (born 2025), no-build TypeScript
fullstack framework for building fast web applications with a shallow learning
curve. At its core is the [Oak http server framework](https://oakserver.org)
which is inspired by Koa (one of the popular http Node.js frameworks).

Here are where fullsoak differentiates itself from the other equivalances:

1. fullsoak is no-build. Zero, zip, zilch, nada. That means: no `babel`, no
   `tsc`, no `webpack` (or any such equivalence).

2. fullsoak is HTM (Hyperscript Tagged Markup) which boasts
   [several enhancements over JSX](https://www.npmjs.com/package/htm#improvements-over-jsx) -
   but most importantly: it requires no build (back to point 1).

3. fullsoak is [Preact](https://preactjs.com/). So: the familiarity of React,
   but as lean as we need it to be.

4. fullsoak is SSR-first & SSR-optimized. See Deno's explanation on
   [JSX precompile](https://docs.deno.com/runtime/reference/jsx/#jsx-precompile-transform)
   for more details.

5. fullsoak is (mostly) WYSIWYG. Compared to sophisticated frameworks such as
   Next.js or Remix, fullsoak is actually very "stupid looking": 1) you start
   with a "Controller" file (as in good old "MVC") which 2) renders your TSX
   component as `text/html` content (i.e. a plain string), and 3) the content
   hydrates itself on the client side.
