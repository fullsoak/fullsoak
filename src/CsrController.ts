import { Controller, ControllerMethodArgs, Get } from "@dklab/oak-routing-ctrl";
import type { Context } from "@oak/oak/context";
import { getClientSideJsForRoute } from "./getClientSideJsForRoute.ts";
import * as Uglify from "uglify-js";
import { cleanCss } from "./minifyCss.ts";
import { getGlobalComponentsDir } from "./metastore.ts";
import { bundle, type Output, transform } from "@swc/core";
import {
  DENO_DIR,
  getComponentCss,
  getComponentJs,
  LogError,
} from "./utils.ts";

@Controller()
export class CsrController {
  @Get("/fullsoak")
  async serveFullsoak(ctx: Context): Promise<string> {
    ctx.response.headers.set("content-type", "text/javascript");
    // @NOTE we can export other things as well; this is super helpful
    // for isomorphic code imported via the same handler on both
    // server and client sides, each requiring different a implementation
    const res = await transform(
      `export const getOrigin = () => window.location.origin;`,
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

  @Get("/js/:compName/mount.js")
  @ControllerMethodArgs("param")
  serveClientJsEntryPoint(
    param: { compName: string },
    ctx: Context,
  ): string {
    ctx.response.headers.set("content-type", "text/javascript");

    return Uglify.minify(
      getClientSideJsForRoute(param.compName),
    ).code;
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

  /**
   * serving our own component TSX as client-side esm, woo hoo!
   */
  @Get("/components/:compName/index.tsx")
  @ControllerMethodArgs("param")
  async serveComponentTsx(
    { compName }: { compName: string },
    ctx: Context,
  ): Promise<string> {
    const globalComponentsDir = getGlobalComponentsDir();
    ctx.response.headers.set("content-type", "text/javascript");

    const compFile = `${compName}/index.tsx`;
    const fullCompFile = `${globalComponentsDir}/${compFile}`;

    return await getComponentJs(fullCompFile);
  }
}
