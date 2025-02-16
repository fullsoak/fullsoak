import type { Output } from "@swc/core";
import { IS_DEBUG, LogDebug, LogError } from "./utils.ts";
import { getJsTransformFns } from "./jsxTransformer.ts";

/**
 * given a file path (ideally absolute path) to a component file (e.g. `.tsx`),
 * return its browser-compatible JavaScript content (transformed via e.g. `swc`)
 * @param filePath path to the file
 * @returns corresponding transformed JavaScript
 */
export async function getComponentJs(filePath: string): Promise<string> {
  LogDebug("transforming component", filePath);

  let transformedComp: Output;

  try {
    const { transformFile } = await getJsTransformFns();
    transformedComp = await transformFile(filePath, {
      env: {
        debug: IS_DEBUG && true,
      },
      minify: true, // @TODO disable for dev
      jsc: {
        parser: {
          // @TODO consider supporting .jsx
          syntax: "typescript",
          tsx: true,
        },
        transform: {
          react: {
            runtime: "automatic",
            pragma: "h",
            pragmaFrag: "Fragment",
            refresh: true, // @TODO disable for prod
          },
          // "optimizer": {
          //   "globals": {
          //     "vars": {
          //       "__DEBUG__": "true",
          //     },
          //   },
          // },
        },
        minify: {
          compress: true,
          mangle: true,
        },
      },
    });
  } catch (e) {
    LogError(
      "error transforming component",
      filePath,
      (e as Error).stack,
    );
    return `console.error("error loading component at '${filePath}'");`;
  }

  // @TODO consider what to do with source map
  return transformedComp.code;
}
