import { LogDebug, readFileToString } from "./utils.ts";

type EsBuildTransform = typeof import("esbuild").transform;
let esbuildTransform: EsBuildTransform;

const getEsBuild = async (): Promise<EsBuildTransform> => {
  if (esbuildTransform) return esbuildTransform;
  return esbuildTransform = (await import("esbuild")).transform;
};

let transformFile: typeof import("@swc/core").transformFile;
let minify: typeof import("@swc/core").minify;
try {
  const swcCore = await import("@swc/core");
  transformFile = swcCore.transformFile;
  minify = swcCore.minify;
} catch (e) {
  LogDebug("unable to load @swc/core", (e as Error).stack, "falling back...");
  transformFile = async (filePath) => {
    const esbuild = await getEsBuild();
    const retVal = await esbuild(await readFileToString(filePath));
    return retVal;
  };
  let _minify = (x: string) => ({ code: x }); // @TODO find a better fallback
  try {
    _minify = (await import("uglify-js")).minify || _minify;
  } catch (_) {
    // ignored
  }
  minify = (src) => Promise.resolve(_minify(src));
}

export { minify, transformFile };
