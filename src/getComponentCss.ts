import { SEPARATOR } from "@std/path";
import {
  getGlobalComponentsDirName,
  getGlobalComponentsParentDir,
} from "./metastore.ts";
import { LogWarn, readFileToString } from "./utils.ts";

const tryReadingComponentCss = async (
  componentName: string,
): Promise<string> => {
  let filePath =
    `${getGlobalComponentsParentDir()}${SEPARATOR}${getGlobalComponentsDirName()}${SEPARATOR}${componentName}${SEPARATOR}styles.css`;
  try {
    return await readFileToString(filePath);
  } catch (e) {
    filePath =
      `${getGlobalComponentsParentDir()}${SEPARATOR}${getGlobalComponentsDirName()}${SEPARATOR}${componentName}.css`;
    LogWarn(
      `unable to load css for component ${componentName} - ${
        (e as Error).message
      } - retrying with a best-effort fallback path`,
    );
    return await readFileToString(filePath);
  }
};

export async function getComponentCss(componentName: string): Promise<string> {
  try {
    // @TODO use a framework smart fn that attempts to read all .css files in the `componentName` dir?
    // @TODO also consider the possibility to combine a general 'main.css' and a component-specific css
    return await tryReadingComponentCss(componentName);
  } catch (e) {
    LogWarn(
      `unable to load css for component \`${componentName}\`: ${
        (e as Error).message
      } - if you need it, make sure the styles.css file exists in the component's dir and is readable`,
    );
  }

  return "";
}
