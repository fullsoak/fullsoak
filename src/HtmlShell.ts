import type { FunctionComponent, VNode } from "preact";
import { html } from "htm/preact";
import type { CP, SsrAdditionalOptions } from "./types.ts";
import { FULLSOAK_HTMLSHELL_MAINID } from "./constants.ts";
import { importJsonc } from "./importJsonc.ts";
import { getGlobalComponentsDirName } from "./metastore.ts";

let importMapJs: string = "";

// @TODO add user configuration option to allow declaring additional
// import map entries
const buildImportMapJs = async (): Promise<string> => {
  if (importMapJs) return importMapJs;

  let denoJson = null;
  let preactVersion = "";
  let preactIsoVersion = "";
  try {
    denoJson = await importJsonc();
    const preactImportComps = denoJson.imports.preact.split("@");
    const preactIsoImportComps = denoJson.imports["preact-iso"].split("@");
    preactVersion = preactImportComps[preactImportComps.length - 1];
    preactIsoVersion = preactIsoImportComps[preactIsoImportComps.length - 1];
    if (preactVersion) preactVersion = `@${preactVersion}`;
    if (preactIsoVersion) preactIsoVersion = `@${preactIsoVersion}`;
  } catch (e) {
    console.warn(
      "failed to parse FullSoak framework deno.jsonc, using default values for importmap content (which might be outdated)...",
      (e as Error).stack,
    );
  }

  // @NOTE consider auto-sync verion values for other isomorphic candidates as well?
  return importMapJs = `{
    "imports": {
      "preact": "https://esm.sh/preact${preactVersion}",
      "preact/hooks": "https://esm.sh/preact${preactVersion}/hooks",
      "preact/debug": "https://esm.sh/preact${preactVersion}/debug",
      "preact/devtools": "https://esm.sh/preact${preactVersion}/devtools",
      "react": "https://esm.sh/preact${preactVersion}",
      "react/jsx-runtime": "https://esm.sh/preact${preactVersion}/jsx-runtime",
      "preact/jsx-runtime": "https://esm.sh/preact${preactVersion}/jsx-runtime",
      "react-dom": "https://esm.sh/preact${preactVersion}/compat/",
      "react-dom/*": "https://esm.sh/preact${preactVersion}/compat/*",
      "htm/preact": "https://esm.sh/htm@3.1.1/preact?external=preact",
      "preact-iso": "https://esm.sh/preact-iso${preactIsoVersion}?external=preact",
      "preact-iso/prerender": "/fullsoak",
      "@preact/signals": "https://esm.sh/@preact/signals",
      "fullsoak/preact-iso": "https://esm.sh/preact-iso${preactIsoVersion}?external=preact",
      "@fullsoak/fullsoak/preact-iso": "https://esm.sh/preact-iso${preactIsoVersion}?external=preact",
      "fullsoak": "/fullsoak",
      "@fullsoak/fullsoak": "/fullsoak"
    }
  }`;
};

type HtmlShellProps<P> = {
  /**
   * name of the TSX component that's going to be rendered as the `{children}` within the shell
   */
  componentName: string;
  componentProps?: P | null;
  js?: string;
  css?: string;
  opts?: SsrAdditionalOptions;
};

/**
 * a battery-included component that should be used together with
 * {@link byoHtml} so that the final output can be returned to (and
 * rendered by) any standard web browser
 *
 * @NOTE the developer is responsible for injecting their own
 * desirable vanilla javascript and css - so this is either a basic
 * or advanced use case, depending on which perspective we look at it
 *
 * @example
 * ```tsx
 * import { byoHtml, HtmlShell } from "@fullsoak/fullsoak/batteries";
 * byoHtml(
 *   <HtmlShell
 *     componentName="MyApp"
 *     js="some vanilla javascript"
 *     css="some raw css"
 *   />
 * );
 * ```
 */
export const HtmlShell: FunctionComponent<HtmlShellProps<CP>> = ({
  componentName,
  componentProps = null,
  children,
  js = "",
  css = "",
  opts = {},
}) => {
  const { headContent } = opts;
  const componentDirName = getGlobalComponentsDirName(); // defaults to `components`
  const jsMountPointSrc = `/${componentDirName}/${componentName}/mount`;
  const jsMainCompSrc = `/${componentDirName}/${componentName}/index.tsx`;
  const preloadedProps = `window.preloadedProps = ${
    JSON.stringify(componentProps || {})
  }`;
  return html`
  <html>
    <head>
      <meta charSet="utf-8" />
      <meta
        name="viewport"
        content="width=device-width,initial-scale=1.0,maximum-scale=1.0"
      />
      ${headContent}
      <script
        type="importmap"
        dangerouslySetInnerHTML=${{ __html: buildImportMapJs() }}
      />
      <link rel="modulepreload" href=${jsMountPointSrc} as="script" type="text/javascript" />
      <link rel="modulepreload" href=${jsMainCompSrc} as="script" type="text/javascript" />
      <script
        type="text/javascript"
        dangerouslySetInnerHTML=${{ __html: js }}
      />
      <style
        dangerouslySetInnerHTML=${{ __html: css }}
      />
    </head>
    <body>
      <main id=${FULLSOAK_HTMLSHELL_MAINID}>
        ${children}
      </main>
      <script
        type="text/javascript"
        dangerouslySetInnerHTML=${{ __html: preloadedProps }}
      />
      <script defer type="module" src=${jsMountPointSrc}></script>
    </body>
  </html>`;
};

type WithHtmlShellProps<CP> = {
  componentName: string;
  component: ReturnType<typeof html>;
  componentProps: CP | null;
  js?: string;
  css?: string;
  opts: SsrAdditionalOptions;
};

export const withHtmlShell = <P extends CP>({
  componentName,
  component,
  componentProps = null,
  js,
  css,
  opts = {},
}: WithHtmlShellProps<P>): VNode =>
  html`
<${HtmlShell}
  componentName=${componentName}
  componentProps=${componentProps}
  js=${js}
  css=${css}
  opts=${opts}
>
  ${component}
<//>`;
