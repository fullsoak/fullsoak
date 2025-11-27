import { IS_DEBUG, IS_DENO_DEPLOY } from "./getEnv.ts";

let sassEmbedded: typeof import("sass-embedded");

const getScssTransformer = async () => {
  return sassEmbedded || (sassEmbedded = await import("sass-embedded"));
};

export const transformScss = async (path: string): Promise<string> => {
  if (IS_DENO_DEPLOY) {
    return "/* Deno Deploy may not support SCSS in SSR yet */";
  }
  try {
    const res = await (await getScssTransformer()).compileAsync(path);
    // @NOTE there are other fields under `res`
    return res.css;
  } catch (e) {
    if (IS_DEBUG) console.error(e);
    const err = e as { sassMessage: string; stack: string; message: string };
    const normalizedErr = new Error(err.message || err.sassMessage);
    normalizedErr.stack = err.stack;
    throw normalizedErr;
  }
};
