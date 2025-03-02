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
import { CWD, LogDebug, LogInfo, OS } from "./utils.ts";
import { getComponentJs } from "./getComponentJs.ts";
import { getJsTransformFns } from "./jsxTransformer.ts";
import { process } from "./getProcess.ts";
import { SEPARATOR } from "@std/path";

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
  hostname?: string;
  port?: number;
  middlewares?: FullSoakMiddleware[];
  controllers: OakRoutingControllerClass[];
  /**
   * abs path to `components` directory;
   *
   * @NOTE when on Cloudflare Workers, use this
   * in combination with ASSETS binding to perform
   * path rewriting on resources, so that we don't
   * serve more files than we want to
   */
  componentsDir?: string;
};

type UseFullSoakOptionsInternal = UseFullSoakOptions & {
  /**
   * defaults to `true`, but if explicitly set to `false`
   * then the user will have to call `app.listen()` themselves
   * and assign their own abort signal (if they need it)
   * @NOTE setting this to `false` only makes sense when
   * writing test with e.g. [superoak](https://deno.land/x/superoak@4.8.1),
   * or in customized use cases. It's generally okay to just leave
   * this `undefined` or set to `true` as per default
   */
  autoStart?: boolean;
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
  setGlobalComponentsDir(
    componentsDir || CWD + `${SEPARATOR}src${SEPARATOR}components`,
  );

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
 *
 * // `app` can now be used in Cloudflare Workers
 * // e.g. `export default { fetch: app.fetch }`
 * ```
 * @experimental this feature is experimental, can be unstable, and might not even work at all
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

  const compDir = opts.componentsDir || "";
  const parts = compDir.split(SEPARATOR);
  const compDirLastPart = SEPARATOR + (parts.findLast((p) => p != null) || ""); // e.g. /components

  // prevent serving files outside the designated dir
  const getResourceSafeUrl = (url: URL): URL | null => {
    if (!url.pathname.startsWith(compDirLastPart)) return null;

    const retVal = new URL(url); // e.g. /components/foo
    const safePath = retVal.pathname.slice(compDirLastPart.length); // e.g. /foo
    retVal.pathname = safePath;
    return retVal;
  };

  const defaultFetch = app.fetch;
  Object.defineProperty(app, "fetch", {
    // deno-lint-ignore no-explicit-any
    value: async (request: Request, env: Record<string, any>, ctx: any) => {
      const url = new URL(request.url);

      // if serving js files for CSR (e.g. tsx components), fetch the raw content
      // with Cloudflare Workers Static Assets serving, then return the transformed javascript
      if (/\.(t|j)sx?/.test(url.pathname)) {
        const safeUrl = getResourceSafeUrl(url);
        if (!safeUrl) return new Response(null, { status: 403 });

        let res = await env[cloudflareStaticAssetsBinding].fetch(
          new Request(safeUrl, request),
        );
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
        const safeUrl = getResourceSafeUrl(url);
        if (!safeUrl) return new Response(null, { status: 403 });
        return env[cloudflareStaticAssetsBinding].fetch(
          new Request(safeUrl, request),
        );
      }

      // for anything else, relay to FullSoak app route handling logic
      return defaultFetch(request, env, ctx);
    },
  });
  return app;
}

function useFullSoakInternal({
  // @TODO consider adding support for unix socket path
  hostname,
  port,
  middlewares = [],
  controllers = [],
  componentsDir,
  autoStart = true,
}: UseFullSoakOptionsInternal): Abort | Application {
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

  if (autoStart) {
    const STOP_SIGNAL = OS === "windows" ? "SIGINT" : "SIGTERM";
    if (globalThis.Deno) {
      globalThis.Deno.addSignalListener(
        STOP_SIGNAL,
        () => abrtCtl.abort(STOP_SIGNAL),
      );
    } else {
      process?.on(STOP_SIGNAL, () => abrtCtl.abort(STOP_SIGNAL));
    }

    app.listen({ hostname, port, signal: abrtCtl.signal });
  }

  return autoStart ? abrtCtl.abort.bind(abrtCtl) : app;
}

/**
 * _entry function_ to initialize FullSoak framework and start it up
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
export const useFullSoak: (opts: UseFullSoakOptions) => Abort = (opts) =>
  useFullSoakInternal({
    ...opts,
    autoStart: true,
  }) as Abort;

/**
 * _entry function_ to initialize FullSoak framework in manual mode (for writing tests or customized use-cases).
 * For example when writing tests: the app instance won't be auto-started so that it can be handled by a test
 * framework such as `superoak`: https://deno.land/x/superoak@4.8.1
 *
 * @example
 * ```ts
 * import { superoak } from "https://deno.land/x/superoak@4.8.1/mod.ts";
 * import { useFullSoak } from "jsr:@fullsoak/fullsoak/testing";
 *
 * class TestTargetController {} // in real code, import from your controller file
 *
 * Deno.test("it should serve [POST] /api/login", async () => {
 *   const app = useFullSoak({ controllers: [TestTargetController] });
 *
 *   const req1 = await superoak(app);
 *   await req1.post("/api/login")
 *     .send(JSON.stringify({username: "foo", password: "bar"}))
 *     .expect(401);
 * });
 * ```
 */
export const useFullSoakManual: (opts: UseFullSoakOptions) => Application = (
  opts,
) =>
  useFullSoakInternal({
    ...opts,
    autoStart: false,
  }) as Application;

/**
 * _entry function_ to initialize FullSoak framework in "fetch" mode
 * (similar to [Cloudflare Workers fetch](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/))
 *
 * @example
 * ```ts
 * import { useFetchMode } from "jsr:@fullsoak/fullsoak";
 *
 * const fetch = useFetchMode({ controllers: [] });
 *
 * // then we can use it like so: `export default { fetch }`
 * ```
 */
export const useFetchMode: (
  opts: Pick<
    UseFullSoakOptions,
    "middlewares" | "controllers" | "componentsDir"
  >,
  // deno-lint-ignore no-explicit-any
) => (req: Request, ...args: any[]) => Promise<Response> = (
  opts,
) => {
  const { middlewares, controllers, componentsDir } = opts;
  const app = setupApp({ middlewares, controllers, componentsDir });
  return app.fetch;
};
