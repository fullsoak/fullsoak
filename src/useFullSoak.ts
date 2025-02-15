import {
  getGlobalComponentsParentDir,
  setAppListenObj,
  setGlobalComponentsDir,
} from "./metastore.ts";
import {
  Application,
  type Context,
  type MiddlewareOrMiddlewareObject,
} from "@oak/oak";
import { useOakServer, useOas } from "@dklab/oak-routing-ctrl";
import { CsrController } from "./CsrController.ts";
import { CWD, LogDebug, LogInfo } from "./utils.ts";
import { getComponentJs } from "./getComponentJs.ts";

const process = !globalThis.Deno ? await import("node:process") : undefined;

// deno-lint-ignore no-explicit-any
type Abort = (reason?: any) => void;

/**
 * standard middleware compatible with the oak server
 */
export type FullSoakMiddleware = MiddlewareOrMiddlewareObject<
  // deno-lint-ignore no-explicit-any
  Record<string, any>,
  // deno-lint-ignore no-explicit-any
  Context<Record<string, any>>
>;

/**
 * @ignore
 */
// deno-lint-ignore no-explicit-any
export type OakRoutingControllerClass = new () => any;

/**
 * the options to configure the framework upon initialization
 */
export type UseFullSoakOptions = {
  port: number;
  middlewares?: FullSoakMiddleware[];
  controllers: OakRoutingControllerClass[];
  componentsDir?: string; // abs path to `components` directory
};

type UseFetchModeOptions = Omit<UseFullSoakOptions, "port">;

function setupApp({
  middlewares = [],
  controllers = [],
  componentsDir,
}: UseFetchModeOptions): Application {
  // memorize the user-provided path to the `components` directory,
  // falling back to a default framework-appointed "magic" location
  setGlobalComponentsDir(componentsDir || CWD + "/src/components");

  const app = new Application();

  /**
   * serving tsx / jsx components as client-side ESM
   */
  middlewares.unshift(async (ctx, next) => {
    const p = ctx.request.url.pathname;
    LogDebug("wildcard middleware attempting to handle path", p);
    if (p.endsWith(".tsx") || p.endsWith(".jsx")) {
      ctx.response.headers.set("content-type", "text/javascript");
      ctx.response.body = await getComponentJs(
        `${getGlobalComponentsParentDir()}${p}`,
      );
      return next();
    }
    return next();
  });

  for (const mw of middlewares) {
    app.use(mw);
  }
  useOakServer(app, [CsrController, ...controllers]);
  useOas(app);

  // @TODO handle 'uncaught application error' nicely

  return app;
}

/**
 * if/when using the "fetch mode" (for compatibility with e.g. Cloudflare Workers)
 * this is set to true, so we cannot accidentally start the app in "normal" mode
 */
let fetchMode = false;

/**
 * initialize the FullSoak framework for use with environments such as Cloudflare Workers
 * @example
 * ```ts
 * const app = _unstable_useFetchMode({})
 * export default { fetch: app.fetch }
 * ```
 * @NOTE this feature is experimental, can be unstable, and might not even work at all
 */
export function _unstable_useFetchMode(opts: UseFetchModeOptions): Application {
  fetchMode = true;
  return setupApp(opts);
}

/**
 * the "entry function" to initialize the FullSoak framework and start it up
 *
 * example usage: https://github.com/fullsoak/deno-examples/blob/v0.2.0/src/main.ts#L33-L37
 */
export function useFullSoak({
  port, // @TODO add support for unix socket path
  middlewares = [],
  controllers = [],
  componentsDir,
}: UseFullSoakOptions): Abort {
  if (fetchMode) {
    throw new Error("FullSoak app already initialized for fetch mode");
  }

  const app = setupApp({ middlewares, controllers, componentsDir });
  const abrtCtl = new AbortController();

  app.addEventListener(
    "listen",
    (l) => {
      LogInfo(`FullSoak server listening on ${l.port}`);
      setAppListenObj(l);
    },
  );
  app.listen({ port, signal: abrtCtl.signal });

  if (process) {
    process.addListener("SIGTERM", () => abrtCtl.abort("SIGTERM"));
  } else {
    globalThis.Deno.addSignalListener(
      "SIGTERM",
      () => abrtCtl.abort("SIGTERM"),
    );
  }

  return abrtCtl.abort;
}
