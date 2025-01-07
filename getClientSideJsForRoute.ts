export const getClientSideJsForRoute = (compName: string) => {
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
