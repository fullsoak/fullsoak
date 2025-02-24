import { Controller, ControllerMethodArgs, Get } from "@dklab/oak-routing-ctrl";
import type { Context } from "@oak/oak/context";
import { getClientSideJsForRoute } from "./getClientSideJsForRoute.ts";
import { cleanCss } from "./minifyCss.ts";
import type { Output } from "@swc/core";
import { DENO_DIR, LogError } from "./utils.ts";
import { getJsTransformFns } from "./jsxTransformer.ts";
import { getComponentCss } from "./getComponentCss.ts";

@Controller()
export class CsrController {
  @Get("/fullsoak")
  async serveFullsoak(ctx: Context): Promise<string> {
    ctx.response.headers.set("content-type", "text/javascript");
    // @NOTE we can export other things as well; this is super helpful
    // for isomorphic code imported via the same handler on both
    // server and client sides, each requiring different a implementation
    const { minify } = await getJsTransformFns();
    const res = await minify(
      `
      export const getOrigin = () => window.location.origin;
      export const locationStub = () => {};
      `,
      { module: true },
    );
    return res.code;
  }

  /**
   * @deprecated in favour of letting the client import from https://esm.sh/preact-iso?external=preact
   */
  @Get("/preact-iso")
  async servePreactIso(ctx: Context): Promise<string> {
    ctx.response.headers.set("content-type", "text/javascript");

    const NPM_DIR = `${DENO_DIR}/deno/npm/registry.npmjs.org`;

    // @TODO take care of preact-iso versioning below
    const preactIso = `${NPM_DIR}/preact-iso/2.9.0/src/index.js`;

    let output: Record<string, Output> = {};
    try {
      const bundle = (await import("@swc/core")).bundle;
      output = await bundle({
        entry: preactIso,
        target: "browser",
        externalModules: ["preact", "preact/hooks"],
        // deno-lint-ignore no-explicit-any
      } as any);
    } catch (e) {
      LogError(
        "failed to bundle preact-iso",
        JSON.stringify((e as Error).stack),
      );
    }
    return output["index.js"]?.code ||
      "throw new Error('failed to serve preact-iso')";
  }

  /**
   * serving the 'entry file' per isomorphic component;
   * the javascript content returned by this endpoint is
   * to be loaded directly into the raw (SSR'ed) HTML content
   * of the same isomorphic component, so that hydration can
   * then take place on the client side
   */
  @Get("/components/:compName/mount")
  @ControllerMethodArgs("param")
  async serveClientJsEntryPoint(
    param: { compName: string },
    ctx: Context,
  ): Promise<string> {
    ctx.response.headers.set("content-type", "text/javascript");

    let retVal = "";
    try {
      const { minify } = await getJsTransformFns();
      retVal = (await minify(
        getClientSideJsForRoute(param.compName),
        { module: true },
      )).code;
    } catch (e) {
      LogError(
        "failed to serve entry js mount-point for component",
        param.compName,
        (e as Error).stack,
      );
    }
    return retVal;
  }

  @Get("/components/:compName/styles.css")
  @ControllerMethodArgs("param")
  async serveComponentCss(
    { compName }: { compName: string },
    ctx: Context,
  ): Promise<string> {
    ctx.response.headers.set("content-type", "text/css");
    const css = await getComponentCss(compName);
    return cleanCss(css);
  }
}
