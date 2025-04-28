import { SEPARATOR } from "@std/path";
import {
  getGlobalComponentsDirName,
  getGlobalComponentsParentDir,
} from "./metastore.ts";
import { LogWarn, readFileToString } from "./utils.ts";
import { transformScss } from "./scssTransformer.ts";

type CssModuleExt = "css" | "scss";

const doTransformCssForExt = (
  filePath: string,
  ext: CssModuleExt,
): Promise<string> => {
  switch (ext) {
    case "css":
      return readFileToString(filePath);
    case "scss":
      return transformScss(filePath);
  }
};

const tryReadingComponentCss = (
  componentName: string,
  extension: "css" | "scss",
): Promise<string> => {
  let filePath =
    `${getGlobalComponentsParentDir()}${SEPARATOR}${getGlobalComponentsDirName()}${SEPARATOR}${componentName}${SEPARATOR}styles.${extension}`;
  try {
    return doTransformCssForExt(filePath, extension);
  } catch (e) {
    filePath =
      `${getGlobalComponentsParentDir()}${SEPARATOR}${getGlobalComponentsDirName()}${SEPARATOR}${componentName}.${extension}`;
    LogWarn(
      `unable to load ${extension} for component ${componentName} - ${
        (e as Error).message
      } - retrying with a best-effort fallback path`,
    );
    return doTransformCssForExt(filePath, extension);
  }
};

export async function getComponentCss(
  componentName: string,
  extension: CssModuleExt,
): Promise<string> {
  try {
    // @TODO use a framework smart fn that attempts to read all .css files in the `componentName` dir?
    // @TODO also consider the possibility to combine a general 'main.css' and a component-specific css
    return await tryReadingComponentCss(componentName, extension);
  } catch (e) {
    LogWarn(
      `unable to load ${extension} for component \`${componentName}\`: ${
        (e as Error).message
      }\n\t- if you need it, make sure styles.${extension} exists in the component's dir and is readable` +
        `\n\t- if you don't need it, feel free to ignore this warning`,
    );
  }

  return "";
}
