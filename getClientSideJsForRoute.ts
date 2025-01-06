export const getClientSideJsForRoute = (path: string, compName?: string) => {
  if (!compName) {
    // path is guaranteed to start with `/` since we get it from `referrerUrl.pathname`
    const componentPart = path.split("/")[1];
    const firstChar = componentPart.charAt(0).toUpperCase();
    compName = "Page" + firstChar + componentPart.substring(1); // e.g. `PageFoo`
  }
  const importByRoute = `
  import { ${compName} as View } from "/components/${compName}/index.tsx";
  `;

  return `
  import { hydrate } from "preact";
  import { html } from "htm/preact";
  ${importByRoute}
  hydrate(html\`<\${View} />\`, document.getElementById("main"));
  `;
};
