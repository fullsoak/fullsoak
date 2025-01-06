import { Controller, ControllerMethodArgs, Get } from "@dklab/oak-routing-ctrl";
import type { Context } from "@oak/oak/context";
import { getClientSideJsForRoute } from "./getClientSideJsForRoute.ts";
import * as Uglify from "uglify-js";
import { getGlobalComponentsDir } from "./metastore.ts";

@Controller()
export class CsrController {
  @Get("/js/fullsoak.js")
  serveClientJsEntryPoint(ctx: Context): string {
    ctx.response.headers.set("content-type", "text/javascript");

    // @TODO check if it's 100% safe to trust the 'system' on the caching mechanism here
    // ctx.response.headers.set("cache-control", "no-cache");

    // which page is requesting `js/client.js` e.g. my.domain/my-page
    const refererUrl = new URL(ctx.request.headers.get("referer") || "");

    return Uglify.minify(
      getClientSideJsForRoute(refererUrl.pathname),
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

    let rawComp;
    try {
      rawComp = await Deno.readTextFile(
        `${globalComponentsDir}/${compName}/index.tsx`,
      );
    } catch (e) {
      console.warn(
        `unable to read raw component ${compName}: ${(e as Error).message}`,
      );
    }

    const esm = await import(`${globalComponentsDir}/${compName}/index.tsx`);
    const Comp = esm[compName] || esm; // prioritize named export, falling back to default export

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
