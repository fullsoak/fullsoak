import { Application, type Context, type MiddlewareOrMiddlewareObject } from "@oak/oak";
import { useOakServer, useOas } from "@dklab/oak-routing-ctrl";
import { CsrController } from "./CsrController.ts";

// deno-lint-ignore no-explicit-any
type Abort = (reason?: any) => void;
// deno-lint-ignore no-explicit-any
export type FullSoakMiddleware = MiddlewareOrMiddlewareObject<Record<string, any>, Context<Record<string, any>>>;
// deno-lint-ignore no-explicit-any
export type OakController = new () => any;
export type UseFullSoakOptions = {
  port: number;
  middlewares: FullSoakMiddleware[];
  controllers: OakController[];
  componentsDir?: string; // abs path to `components` directory
}

declare global {
  // deno-lint-ignore no-var
  var FULLSOAK_APP_COMPONENTS_DIR: string;
}

export function useFullSoak ({
  port,
  middlewares,
  controllers,
  componentsDir,
}: UseFullSoakOptions): Abort {

  globalThis.FULLSOAK_APP_COMPONENTS_DIR = componentsDir ||
    Deno.cwd() + "/src/components"; // assuming a default framework-specific "magic" location

  const app = new Application();

  const abrtCtl = new AbortController();

  for (const mw of middlewares) {
    app.use(mw);
  }
  useOakServer(app, [CsrController, ...controllers]);
  useOas(app);
  app.addEventListener(
    "listen",
    (l) => console.log(`FullSoak server listening on ${l.port}`),
  );
  app.listen({ port, signal: abrtCtl.signal });

  // @TODO handle 'uncaught application error' nicely

  Deno.addSignalListener('SIGTERM', () => abrtCtl.abort('SIGTERM'));

  return abrtCtl.abort;
}
