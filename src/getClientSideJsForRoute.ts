import { FULLSOAK_HTMLSHELL_MAINID } from "./constants.ts";
import { getGlobalComponentsDirName } from "./metastore.ts";
import { IS_DEBUG, IS_DEV } from "./getEnv.ts";

/**
 * retrieve the initial javascript to be loaded into the html document generated with
 * {@link HtmlShell} via the "static" path `/components/:compName/mount`; if this javascript
 * content fails to load (for any reason), the SSR document should still be enough for
 * human or bot users (we'll lose any interactivity that's `hydrated` by this javascript though)
 */
export const getClientSideJsForRoute = (compName: string): string => {
  // @NOTE importing from `${compName}.tsx` is also supported as a fallback mechanism
  const importByRoute = `
  import { ${compName} as View } from "/${getGlobalComponentsDirName()}/${compName}/index.tsx";
  `;

  return `
  ${IS_DEBUG ? `import "preact/debug";` : IS_DEV && `import "preact/devtools";`}
  import { hydrate } from "preact";
  import { html } from "htm/preact";
  ${importByRoute}
  const componentProps = window.preloadedProps;
  hydrate(html\`<\${View} ...\${componentProps} />\`, document.getElementById("${FULLSOAK_HTMLSHELL_MAINID}"));
  `;
};
