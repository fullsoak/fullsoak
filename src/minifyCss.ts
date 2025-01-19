import { default as CleanCss } from "clean-css";
const cssCleaner = new CleanCss({});

export const cleanCss = (css?: string): string => {
  let retVal = "";
  const output = cssCleaner.minify(css) || {};
  retVal = output.styles || "";
  if (output.errors?.length) {
    console.warn("error while minifying css", output.errors);
  }
  // @TODO log both errors and warnings, potentially depending on
  // user-specified log level
  return retVal;
};
