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
 * takes a standard Preact component and wrap it around an <html> element
 * and render it out as a string
 */
export const ssr = async (component: FunctionComponent): Promise<string> => {
  const componentName = component.name;
  const componentVNode = html`<${component} />`;
  let componentCss;
  try {
    // @TODO use a framework smart fn that attempts to read all .css files in the `componentName` dir?
    // @TODO also consider the possibility to combine a general 'main.css' and a component-specific css
    componentCss = await Deno.readTextFile(
      `${getGlobalComponentsDir()}/${componentName}/styles.css`,
    );
  } catch (e) {
    console.warn(
      `unable to load css for component ${componentName}: ${
        (e as Error).message
      }`,
    );
  }
  return byoHtml(withHtmlShell({
    component: componentVNode,
    css: cleanCss(componentCss),
  }));
};
