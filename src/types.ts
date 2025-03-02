import type { ComponentProps, ComponentType } from "preact";
import type { VNode } from "preact";

export type SsrAdditionalOptions = {
  /**
   * the content of all tags found in the html <head> element
   * such as `<meta>`, `<title>`, and so on
   */
  headContent?: VNode;
};

/**
 * @ignore
 */
export type CP = ComponentProps<ComponentType>;

export type { LevelName as LogLevel } from "@std/log";
