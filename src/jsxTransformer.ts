import { LogDebug, readFileToString } from "./utils.ts";

type GenericJsTransform = (
  code: string,
  // deno-lint-ignore no-explicit-any
  options: any,
) => Promise<{ code: string }>;

let _fallbackTransform: GenericJsTransform;

const getTscJsTransform = async (): Promise<GenericJsTransform> => {
  if (_fallbackTransform) return _fallbackTransform;
  const { transpileModule } = await import("typescript");
  const retVal: GenericJsTransform = (code, options) => {
    const res = transpileModule(code, {
      compilerOptions: {
        jsxImportSource: "preact",
        jsx: "react-jsx",
        jsxFactory: "h",
        jsxFragmentFactory: "Fragment",
        target: "es6",
        module: "esnext",
      },
      ...options,
    });
    // @NOTE there exist other fields returned by `typescript::transpileModule`
    return Promise.resolve({ code: res.outputText });
  };
  return _fallbackTransform = retVal;
};

let _transformFileFn: GenericJsTransform;
let _transformFn: GenericJsTransform;
let _minifyFn: GenericJsTransform;

/**
 * retrieve (and cache) the JS transpiling functions by asynchronously
 * importing the native binding functions, with fallback
 * results if/when a native binding function fails to load;
 * e.g: https://github.com/denoland/deploy_feedback/issues/802#issuecomment-2661089887
 */
export const getJsTransformFns: () => Promise<{
  transformFile: GenericJsTransform;
  transform: GenericJsTransform;
  minify: GenericJsTransform;
}> = async () => {
  if (_transformFileFn && _transformFn && _minifyFn) {
    return {
      transformFile: _transformFileFn,
      transform: _transformFn,
      minify: _minifyFn,
    };
  }

  try {
    const swcCore = await import("@swc/core");
    _transformFileFn = swcCore.transformFile;
    _transformFn = swcCore.transform;
    _minifyFn = swcCore.minify;
  } catch (e) {
    LogDebug("unable to load @swc/core", (e as Error).stack, "falling back...");

    _transformFn = async (code: string, opts: unknown) => {
      const tscTx = await getTscJsTransform();
      return tscTx(code, opts);
    };

    _transformFileFn = async (filePath, opts) =>
      _transformFn(
        await readFileToString(filePath),
        opts,
      );

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
    transform: _transformFn,
    minify: _minifyFn,
  };
};
