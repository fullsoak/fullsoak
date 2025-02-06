import { default as CleanCss } from "clean-css";
import { LogWarn } from "./utils.ts";
const cssCleaner = new CleanCss({
  inline: ["local", "remote"], // @TODO make `remote` configurable
});

/**
 * utility function, takes in the raw css string and outputs a minified version of it
 */
export const cleanCss = (css?: string): string => {
  let retVal = "";
  const output = cssCleaner.minify(css) || {};
  retVal = output.styles || "";
  if (output.errors?.length) {
    LogWarn("error while minifying css", JSON.stringify(output.errors));
  }
  // @TODO log both errors and warnings, potentially depending on
  // user-specified log level
  return retVal;
};
