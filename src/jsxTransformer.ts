import { LogDebug, readFileToString } from "./utils.ts";

// deno-lint-ignore no-explicit-any
type GenericJsTransform = (code: string, options: any) => any;

// deno-lint-ignore no-explicit-any
type GenericJsMinify = (code: string, options: any) => any;

let _fallbackTransform: GenericJsTransform;

const getFallbackJsTransform = async (): Promise<GenericJsTransform> => {
  if (_fallbackTransform) return _fallbackTransform;
  const transformFn = (await import("typescript")).transpileModule;
  const retVal: GenericJsTransform = (code, options) =>
    transformFn(code, options);
  return _fallbackTransform = retVal;
};

let _transformFileFn: typeof import("@swc/core").transformFile;
let _minifyFn: typeof import("@swc/core").minify;

/**
 * retrieve (and cache) the JS transpiling functions by asynchronously
 * importing the native binding functions, with fallback
 * results if/when a native binding function fails to load;
 * e.g: https://github.com/denoland/deploy_feedback/issues/802#issuecomment-2661089887
 */
export const getJsTransformFns: () => Promise<{
  transformFile: GenericJsTransform;
  minify: GenericJsMinify;
}> = async () => {
  if (_transformFileFn && _minifyFn) {
    return {
      transformFile: _transformFileFn,
      minify: _minifyFn,
    };
  }

  try {
    const swcCore = await import("@swc/core");
    _transformFileFn = swcCore.transformFile;
    _minifyFn = swcCore.minify;
  } catch (e) {
    LogDebug("unable to load @swc/core", (e as Error).stack, "falling back...");

    _transformFileFn = async (filePath) => {
      const jsTransform = await getFallbackJsTransform();
      const retVal = jsTransform(await readFileToString(filePath), {
        compilerOptions: {
          jsxImportSource: "preact",
          jsx: "react-jsx",
          jsxFactory: "h",
          jsxFragmentFactory: "Fragment",
          target: "es6",
          module: "esnext",
        },
      });
      return { code: retVal.outputText };
    };

    let _doMinify = (x: string) => ({ code: x }); // @TODO find a better fallback
    try {
      _doMinify = (await import("uglify-js")).minify || _doMinify;
    } catch (_) {
      // ignored
    }
    _minifyFn = (src) => Promise.resolve(_doMinify(src));

    LogDebug("successfully registered fallback tools for @swc/core");
  }

  return {
    transformFile: _transformFileFn,
    minify: _minifyFn,
  };
};
