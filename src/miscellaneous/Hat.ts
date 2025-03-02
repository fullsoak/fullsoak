import type { FunctionComponent } from "preact";
import { html } from "htm/preact";

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
 * ```ts
 * import { ssr } from "@fullsoak/fullsoak";
 * import { byoHat } from "@fullsoak/fullsoak/batteries";
 *
 * const MyComponent = () => <>my content</>;
 *
 * ssr(MyComponents, { foo: "bar" }, { headContent: byoHat() });
 * ```
 */
export const byoHat = (props: HatProps) => html`<${Hat} ...${props} />`;
