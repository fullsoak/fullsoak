import type { FunctionComponent, VNode } from "preact";
import type { CP, SsrAdditionalOptions } from "./types.ts";
import { renderToStringAsync } from "preact-render-to-string";
import { withHtmlShell } from "./HtmlShell.ts";
import { cleanCss } from "./minifyCss.ts";
import { html } from "htm/preact";
import { getComponentCss } from "./getComponentCss.ts";

/**
 * takes a component that starts from the root `<html>` element
 * and renders it out as a string; the input component is usually
 * constructed by using the {@link HtmlShell} tsx component (included battery)
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
export const byoHtml = async (component: VNode): Promise<string> => {
  globalThis.location = {} as Location;
  return "<!doctype html>" + (await renderToStringAsync(component));
};

const ssrVNode = async (
  node: VNode,
  opts: SsrAdditionalOptions = {},
): Promise<string> => {
  const componentName = typeof node.type === "string"
    ? node.type
    : node.type.name;
  const componentCss = await getComponentCss(componentName, "css");
  const componentScss = await getComponentCss(componentName, "scss");
  return byoHtml(withHtmlShell({
    componentName,
    componentProps: node.props,
    component: node,
    css: cleanCss(componentCss + "\n" + componentScss),
    opts,
  }));
};

const ssrTsxComponent = async <P extends CP>(
  component: FunctionComponent<P>,
  props: P | null = null,
  opts: SsrAdditionalOptions = {},
): Promise<string> => {
  const componentName = component.name;

  // this is the only way to render a TSX component where the
  // deepest DOM element is rendered (which is the whole point of SSR)
  const componentVNode = html`<${component} ...${props} />`;

  // @TODO possibility to build a collection of css files for the whole component tree
  // below `componentName` (related issue: https://github.com/fullsoak/fullsoak/issues/17)
  const componentCss = await getComponentCss(componentName, "css");
  const componentScss = await getComponentCss(componentName, "scss");

  return byoHtml(withHtmlShell({
    componentName,
    componentProps: props,
    // while using `h` also works, it doesn't render the deepest DOM element
    // component: h<CP>(componentName, props),
    component: componentVNode,
    css: cleanCss(componentCss + "\n" + componentScss),
    opts,
  }));
};

/**
 * takes a Preact `VNode` or a TSX component and wraps it around an `<html>` element
 * then renders everything out as a string
 * @param renderTarget - a Preact VNode or a TSX component
 * @param componentProps - the props to pass to the component (only applicable when passing a TSX component as `renderTarget`)
 * @param opts additional options (e.g. the meta tags useful for SEO purposes)
 * @returns - the rendered HTML as a string
 * @TODO update the README example
 */
export const ssr = <P extends CP>(
  renderTarget: FunctionComponent<P> | VNode,
  componentProps: P | null = null,
  opts: SsrAdditionalOptions = {},
): Promise<string> => {
  // @TODO see if there's a better way to check if it's a VNode
  const isVNode = typeof renderTarget === "object" && "type" in renderTarget;
  if (isVNode) return ssrVNode(renderTarget, opts);
  return ssrTsxComponent(renderTarget, componentProps, opts);
};
