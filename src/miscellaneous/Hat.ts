import type { FunctionComponent } from "preact";
import { html } from "htm/preact";
import type { VNode } from "preact";

enum HtmlMetaKey {
  name = "name",
  content = "content",
  property = "property",
}

type HtmlMeta = {
  [key in HtmlMetaKey]: string;
};

export type HatProps = {
  title?: string;
  meta?: HtmlMeta[];
};

/**
 * similar to react-helmet, but much, much lighter
 */
export const Hat: FunctionComponent<HatProps> = ({ title, meta }) => {
  return html`
    ${
    title && html`<title dangerouslySetInnerHTML=${{ __html: title }}></title>`
  }
    ${meta?.map((m) => html`<meta ...${m} />`)}
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
