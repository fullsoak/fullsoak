import type { FunctionComponent, VNode } from "preact";
import { render } from "preact-render-to-string";
import { withHtmlShell } from "./HtmlShell.tsx";
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
 * takes a standard Preact VNode and wrap it around an <html> element
 * and render it out as a string
 * @param node - a standard Preact VNode
 * @returns - the rendered component as a string
 */
export const ssr = async (
  node: VNode,
  componentName?: string, // it's preferable to figure out componentName from the vnode
): Promise<string> => {
  componentName = componentName ||
    (node.type as unknown as { name: string }).name;
  const componentCss = await getComponentCss(componentName);
  return byoHtml(withHtmlShell({
    componentName,
    componentProps: node.props,
    component: node,
    css: cleanCss(componentCss),
  }));
};

/**
 * takes a standard Preact component and render it out as a string
 * @param component - a standard Preact component
 * @returns - the rendered component as a string
 * @NOTE this approach is not yet tested even in lab environment
 */
export const ssrTsxComponent = async (
  component: FunctionComponent,
): Promise<string> => {
  const componentName = component.name;
  const componentVNode = html`<${component} />`;
  const componentCss = await getComponentCss(componentName);

  return byoHtml(withHtmlShell({
    componentName,
    componentProps: component.defaultProps,
    component: componentVNode,
    css: cleanCss(componentCss),
  }));
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
      `unable to load css for component ${componentName}: ${
        (e as Error).message
      }`,
    );
  }

  return "";
}
