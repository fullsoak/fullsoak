export const getClientSideJsForRoute = (compName: string) => {
  const importByRoute = `
  import { ${compName} as View } from "/components/${compName}/index.tsx";
  `;

  return `
  import { hydrate } from "preact";
  import { html } from "htm/preact";
  ${importByRoute}
  const componentProps = window.preloadedProps;
  hydrate(html\`<\${View} ...\${componentProps} />\`, document.getElementById("main"));
  `;
};
