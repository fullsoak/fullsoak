/** @jsxRuntime automatic */
/** @jsxImportSource npm:preact@10.25.4 */
import type { FunctionComponent, VNode } from "preact";

type Props = {
  /**
   * name of the TSX component that's going to be rendered as the `{children}` within the shell
   */
  componentName: string;
  componentProps?: Record<string, unknown>;
  pageTitle?: string;
  js?: string;
  css?: string;
};

// @TODO find a way to auto-sync preact version declared below AND that in deno.jsonc
const importMapJs = `
{
  "imports": {
    "preact": "https://esm.sh/preact@10.25.4",
    "preact/hooks": "https://esm.sh/preact@10.25.4/hooks",
    "htm/preact": "https://esm.sh/htm@3.1.1/preact?external=preact"
  }
}
`;

export const HtmlShell: FunctionComponent<Props> = ({
  componentName,
  componentProps,
  children,
  pageTitle,
  js,
  css,
}) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <meta
        name="viewport"
        content="width=device-width,initial-scale=1.0,maximum-scale=1.0"
      />
      <title>{pageTitle}</title>
      <script
        type="importmap"
        dangerouslySetInnerHTML={{ __html: importMapJs }}
      />
      <script
        type="text/javascript"
        dangerouslySetInnerHTML={{ __html: js || "" }}
      />
      <style dangerouslySetInnerHTML={{ __html: css || "" }} />
    </head>
    <body>
      <main id="main">
        {children}
      </main>
      <script
        type="text/javascript"
        dangerouslySetInnerHTML={{
          __html: `window.preloadedProps = ${JSON.stringify(componentProps)}`,
        }}
      />
      <script type="module" src={`/js/${componentName}/mount.js`}></script>
    </body>
  </html>
);

type WithHtmlShellProps = {
  componentName: string;
  component: FunctionComponent | VNode;
  componentProps?: Record<string, unknown>;
  js?: string;
  css?: string;
};

export const withHtmlShell = ({
  componentName,
  component,
  componentProps,
  js,
  css,
}: WithHtmlShellProps): VNode => (
  <HtmlShell
    componentName={componentName}
    componentProps={componentProps}
    js={js}
    css={css}
  >
    {component}
  </HtmlShell>
);
