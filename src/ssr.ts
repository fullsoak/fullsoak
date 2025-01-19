import type { FunctionComponent, VNode } from "preact";
import { render } from "preact-render-to-string";
import { type CP, withHtmlShell } from "./HtmlShell.tsx";
import { cleanCss } from "./minifyCss.ts";
import { html } from "htm/preact";
import { getGlobalComponentsDir } from "./metastore.ts";

/**
 * takes a component that starts from the 'root' <html> element
 * and render it out as a string
 */
export const byoHtml = (component: VNode): string =>
  "<!doctype html>" + render(component);

/**
 * takes a standard Preact function component and render it out as a string
 * @param component - a standard Preact function component
 * @returns - the rendered component as a string
 * @deprecated use `ssr` instead
 */
const _ssrTsxComponentWithHtm = async (
  component: FunctionComponent,
): Promise<string> => {
  const componentName = component.name;
  const componentVNode = html`<${component} />`;
  const componentCss = await getComponentCss(componentName);

  return byoHtml(withHtmlShell({
    componentName,
    componentProps: component.defaultProps || null,
    component: componentVNode,
    css: cleanCss(componentCss),
  }));
};

const ssrVNode = async (
  node: VNode,
): Promise<string> => {
  const componentName = typeof node.type === "string"
    ? node.type
    : node.type.name;
  const componentCss = await getComponentCss(componentName);
  return byoHtml(withHtmlShell({
    componentName,
    componentProps: node.props,
    component: node,
    css: cleanCss(componentCss),
  }));
};

const ssrTsxComponent = async <P extends CP>(
  component: FunctionComponent<P>,
  props: P | null = null,
): Promise<string> => {
  const componentName = component.name;

  // this is the only way to render a TSX component where the
  // deepest DOM element is rendered (which is the whole point of SSR)
  const componentVNode = html`<${component} ...${props} />`;

  const componentCss = await getComponentCss(componentName);
  return byoHtml(withHtmlShell({
    componentName,
    componentProps: props,
    // while using `h` also works, it doesn't render the deepest DOM element
    // component: h<CP>(componentName, props),
    component: componentVNode,
    css: cleanCss(componentCss),
  }));
};

/**
 * takes a Preact `VNode` or a TSX component and wrap it around an <html> element
 * and render it out as a string
 * @param renderTarget - a Preact VNode or a TSX component
 * @param componentProps - the props to pass to the component (only applicable when passing a TSX component as `renderTarget`)
 * @returns - the rendered HTML as a string
 * @TODO update the README example
 */
export const ssr = <P extends CP>(
  renderTarget: FunctionComponent<P> | VNode,
  componentProps: P | null = null,
): Promise<string> => {
  // @TODO see if there's a better way to check if it's a VNode
  const isVNode = typeof renderTarget === "object" && "type" in renderTarget;
  if (isVNode) return ssrVNode(renderTarget);
  return ssrTsxComponent(renderTarget, componentProps);
};

async function getComponentCss(componentName: string): Promise<string> {
  try {
    // @TODO use a framework smart fn that attempts to read all .css files in the `componentName` dir?
    // @TODO also consider the possibility to combine a general 'main.css' and a component-specific css
    return await Deno.readTextFile(
      `${getGlobalComponentsDir()}/${componentName}/styles.css`,
    );
  } catch (e) {
    console.warn(
      `unable to load css for component \`${componentName}\`: ${
        (e as Error).message
      } - if you need it, make sure the styles.css file exists in the component's dir and is readable`,
    );
  }

  return "";
}
