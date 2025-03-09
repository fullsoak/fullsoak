import type { FunctionComponent } from "preact";
import { html } from "htm/preact";
import type { VNode } from "preact";

enum HtmlMetaKey {
  name = "name",
  content = "content",
  property = "property",
}

type HtmlMeta = {
  [key in HtmlMetaKey]?: string;
};

enum HtmlLinkKey {
  rel = "rel",
  href = "href",
}

type HtmlLink = {
  [key in HtmlLinkKey]: string;
};

enum HtmlScriptKey {
  type = "type",
  src = "src",
  defer = "defer",
}

type HtmlScript = {
  [key in HtmlScriptKey]?: string;
};

export type HatProps = {
  title?: string;
  meta?: HtmlMeta[];
  links?: HtmlLink[];
  scripts?: HtmlScript[];
};

/**
 * similar to react-helmet, but much, much lighter
 */
export const Hat: FunctionComponent<HatProps> = (
  { title, meta, links, scripts },
) => {
  return html`
    ${
    title && html`<title dangerouslySetInnerHTML=${{ __html: title }}></title>`
  }
    ${meta?.map((m) => html`<meta ...${m} />`)}
    ${links?.map((l) => html`<link ...${l} />`)}
    ${scripts?.map((s) => html`<script ...${s} />`)}
  `;
};

/**
 * use this inside {@link ssr} to add optional contents to the `<head>` element
 * of the output HTML
 * @example
 * ```tsx
 * import { ssr } from "@fullsoak/fullsoak";
 * import { makeHat } from "@fullsoak/fullsoak/batteries";
 *
 * const MyComponent = () => <>my content</>;
 *
 * ssr(MyComponent, { foo: "bar" }, { headContent: makeHat({}) });
 * ```
 */
export const makeHat: (props: HatProps) => VNode = (props) =>
  html`<${Hat} ...${props} />`;
