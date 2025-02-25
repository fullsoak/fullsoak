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
import { getJsTransformFns } from "./jsxTransformer.ts";

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
  /**
   * abs path to `components` directory
   * no-op when using with Cloudflare Workers
   */
  componentsDir?: string;
};

type AppSetupOptions = Omit<UseFullSoakOptions, "port">;

type UseCloudflareWorkersModeOptions = AppSetupOptions & {
  /**
   * on Cloudflare Workers where reading from file system isn't
   * supported, setting this value will allow loading from
   * Cloudflare Workers Static Assets:
   * https://developers.cloudflare.com/workers/static-assets
   */
  cloudflareStaticAssetsBinding?: string;
};

function setupApp({
  middlewares = [],
  controllers = [],
  componentsDir,
}: AppSetupOptions): Application {
  // memorize the user-provided path to the `components` directory,
  // falling back to a default framework-appointed "magic" location
  setGlobalComponentsDir(componentsDir || CWD + "/src/components");

  const app = new Application();

  /**
   * serving tsx/jsx components and ts/js files as client-side ESM
   */
  middlewares.unshift(async (ctx, next) => {
    const p = ctx.request.url.pathname;
    LogDebug("wildcard middleware attempting to handle path", p);
    if (/\.(?:t|j)sx?$/.test(p)) {
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
 * const app = _unstable_useCloudflareWorkersMode({
 *   controllers: [],
 *   cloudflareStaticAssetsBinding: 'ASSETS',
 * });
 * // `app` can now be used in Cloudflare Workers e.g. `export default { fetch: app.fetch }`
 * ```
 * @NOTE this feature is experimental, can be unstable, and might not even work at all
 */
export function _unstable_useCloudflareWorkersMode(
  opts: UseCloudflareWorkersModeOptions,
): Application {
  fetchMode = true;
  const app = setupApp(opts);
  const { cloudflareStaticAssetsBinding } = opts;

  if (!cloudflareStaticAssetsBinding) return app;

  // we don't need __filename and __dirname when on Cloudflare Workers
  // but the fallback JSX transformer might need these to be defined, so
  // we mock some values
  if (!globalThis.__filename) globalThis.__filename = "";
  if (!globalThis.__dirname) globalThis.__dirname = "";

  const defaultFetch = app.fetch;
  Object.defineProperty(app, "fetch", {
    // deno-lint-ignore no-explicit-any
    value: async (request: Request, env: Record<string, any>, ctx: any) => {
      const url = new URL(request.url);

      // if serving tsx files, fetch the raw content with Cloudflare Workers Static Assets
      // serving, then return the transformed javascript
      if (/\.(t|j)sx/.test(url.pathname)) {
        let res = await env[cloudflareStaticAssetsBinding].fetch(request);
        if (res.status === 304) return res; // short-circuit => browser cache is used
        const { transform } = await getJsTransformFns();
        const rawContent = await res.text();
        const transformedJsx = await transform(rawContent, {});
        res = new Response(transformedJsx.code, res);
        res.headers.set("Content-Type", "text/javascript");
        return res;
      }

      // if serving css files, fetch & return the raw content with Cloudflare Workers Static Assets serving
      // @TODO support minification the same way FullSoak does internally
      if (/\.css/.test(url.pathname)) {
        return env[cloudflareStaticAssetsBinding].fetch(request);
      }

      // for anything else, relay to FullSoak app route handling logic
      return defaultFetch(request, env, ctx);
    },
  });
  return app;
}

/**
 * the _entry function_ to initialize the FullSoak framework and start it up
 *
 * @example
 * ```ts
 * class MyController {}
 *
 * useFullSoak({
 *   port: 3991,
 *   controllers: [MyController],
 *   componentsDir: Deno.cwd() + "/src/components",
 * });
 * ```
 */
export function useFullSoak({
  port, // @TODO add support for unix socket path
  middlewares = [],
  controllers = [],
  componentsDir,
}: UseFullSoakOptions): [Application, Abort] {
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

  return [app, abrtCtl.abort];
}
