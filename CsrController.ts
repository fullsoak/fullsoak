import { Controller, ControllerMethodArgs, Get } from "@dklab/oak-routing-ctrl";
import type { Context } from "@oak/oak/context";
import { getClientSideJsForRoute } from "./getClientSideJsForRoute.ts";
import * as Uglify from "uglify-js";
import { getGlobalComponentsDir } from "./metastore.ts";
import Module from "node:module";

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

    // @TODO benchmark the performance of this 'createRequire' approach
    const rawComp = await readRawTextFile(compFile);
    const require = Module.createRequire(compFile);

    const CompMod = require(compFile);
    // prioritize named export, falling back to default export
    const Comp = CompMod[compName] || CompMod;

    const rawCompImports = rawComp
      ?.split("\n")
      .filter((line) => line.startsWith("import ") && !line.includes("type "))
      // .map(line => line.replace('../', '/components/'))
      .join("\n");

    const reconstructedTsx = `
    ${rawCompImports}
    export const ${compName} = ${String(Comp)};
    `;

    const minifiedRetVal = Uglify.minify(reconstructedTsx);
    if (minifiedRetVal.error) {
      console.error(
        `encounted an error while minifying for ${compName}: ${minifiedRetVal.error}`,
      );
    }

    return minifiedRetVal.code;
  }
}

async function readRawTextFile(path: string): Promise<string> {
  try {
    return await Deno.readTextFile(path);
  } catch (e) {
    console.warn(
      `unable to read file ${path}: ${(e as Error).message}`,
    );
  }
  return "";
}
