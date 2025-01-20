import { Controller, ControllerMethodArgs, Get } from "@dklab/oak-routing-ctrl";
import type { Context } from "@oak/oak/context";
import { getClientSideJsForRoute } from "./getClientSideJsForRoute.ts";
import * as Uglify from "uglify-js";
import { cleanCss } from "./minifyCss.ts";
import { getGlobalComponentsDir } from "./metastore.ts";
import { type Output, transformFile } from "@swc/core";
import { getComponentCss, IS_DEBUG, LogDebug, LogError } from "./utils.ts";

@Controller()
export class CsrController {
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
    LogDebug("transforming component", fullCompFile);

    let transformedComp: Output;

    try {
      transformedComp = await transformFile(fullCompFile, {
        env: {
          debug: IS_DEBUG && true,
        },
        jsc: {
          parser: {
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
        },
      });
    } catch (e) {
      LogError("error transforming component", {
        path: fullCompFile,
        error: e,
      });
      return `console.error("error loading component" '${compFile}');`;
    }

    // @TODO consider what to do with source map
    return transformedComp.code;
  }
}
