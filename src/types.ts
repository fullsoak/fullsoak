import type { ComponentProps, ComponentType } from "preact";
import type { VNode } from "preact";

export type SsrAdditionalOptions = {
  /**
   * the content of all tags found in the html <head> element
   * such as `<meta>`, `<title>`, and so on
   */
  headContent?: VNode;
  /**
   * standard import-map content to include in the final output HTML.
   *
   * See more at https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap
   */
  customImportMap?: Record<string, string>;
};

/**
 * @ignore
 */
export type CP = ComponentProps<ComponentType>;

export type { LevelName as LogLevel } from "@std/log";

// deno-lint-ignore no-explicit-any
export type ReqHandler = (req: Request, ...args: any[]) => Promise<Response>;
