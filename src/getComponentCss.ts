import { SEPARATOR } from "@std/path";
import {
  getGlobalComponentsDirName,
  getGlobalComponentsParentDir,
} from "./metastore.ts";
import { LogWarn, readFileToString } from "./utils.ts";

export async function getComponentCss(componentName: string): Promise<string> {
  try {
    // @TODO use a framework smart fn that attempts to read all .css files in the `componentName` dir?
    // @TODO also consider the possibility to combine a general 'main.css' and a component-specific css
    return await readFileToString(
      `${getGlobalComponentsParentDir()}${SEPARATOR}${getGlobalComponentsDirName()}${SEPARATOR}${componentName}${SEPARATOR}styles.css`,
    );
  } catch (e) {
    LogWarn(
      `unable to load css for component \`${componentName}\`: ${
        (e as Error).message
      } - if you need it, make sure the styles.css file exists in the component's dir and is readable`,
    );
  }

  return "";
}
