import { setAppListenObj, setGlobalComponentsDir } from "./metastore.ts";
import {
  Application,
  type Context,
  type MiddlewareOrMiddlewareObject,
} from "@oak/oak";
import { useOakServer, useOas } from "@dklab/oak-routing-ctrl";
import { CsrController } from "./CsrController.ts";
import { CWD, LogInfo } from "./utils.ts";

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
export type OakController = new () => any;

/**
 * the options to configure the framework upon initialization
 */
export type UseFullSoakOptions = {
  port: number;
  middlewares?: FullSoakMiddleware[];
  controllers: OakController[];
  componentsDir?: string; // abs path to `components` directory
};

/**
 * the "entry function" to initialize the FullSoak framework
 *
 * example usage: https://github.com/fullsoak/examples/blob/v0.1.0/src/main.ts#L48-L52
 */
export function useFullSoak({
  port,
  middlewares = [],
  controllers = [],
  componentsDir,
}: UseFullSoakOptions): Abort {
  // memorize the user-provided path to the `components` directory,
  // falling back to a default framework-appointed "magic" location
  setGlobalComponentsDir(componentsDir || CWD + "/src/components");

  const app = new Application();

  const abrtCtl = new AbortController();

  for (const mw of middlewares) {
    app.use(mw);
  }
  useOakServer(app, [CsrController, ...controllers]);
  useOas(app);
  app.addEventListener(
    "listen",
    (l) => {
      LogInfo(`FullSoak server listening on ${l.port}`);
      setAppListenObj(l);
    },
  );
  app.listen({ port, signal: abrtCtl.signal });

  // @TODO handle 'uncaught application error' nicely

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
