import { Controller, ControllerMethodArgs, Get } from "@dklab/oak-routing-ctrl";
import type { Context } from "@oak/oak/context";
import { getClientSideJsForRoute } from "./getClientSideJsForRoute.ts";
import * as Uglify from "uglify-js";
import { getGlobalComponentsDir } from "./metastore.ts";
import { transformFile } from "@swc/core";

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

  // @Get("/css/main.css")
  // async serveMainCss(ctx: Context) {
  //   ctx.response.headers.set("content-type", "text/css");

  //   const mainCss = await Deno.readTextFile(`${globalThis.FULLSOAK_APP_COMPONENTS_DIR}/main.css`);

  //   return CleanCss.minify(mainCss).styles;
  // }

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

    const compFile = `${globalComponentsDir}/${compName}/index.tsx`;

    const transformedComp = await transformFile(compFile, {
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
            refresh: true,
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

    return transformedComp.code;
  }
}
