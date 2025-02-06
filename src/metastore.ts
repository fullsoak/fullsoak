import type { ApplicationListenEvent } from "@oak/oak/application";
import { LogDebug } from "./utils.ts";

const store = new Map();

const FULLSOAK_APP_COMPONENTS_DIR = "FULLSOAK_APP_COMPONENTS_DIR";
const APP_LISTEN_OBJ = "APP_LISTEN_OBJ";
export const setGlobalComponentsDir = (dir: string) => {
  store.set(FULLSOAK_APP_COMPONENTS_DIR, dir);
  LogDebug("set global components dir", dir);
};

export const getGlobalComponentsDir = (): string =>
  store.get(FULLSOAK_APP_COMPONENTS_DIR);

export const setAppListenObj = (obj: ApplicationListenEvent) =>
  store.set(APP_LISTEN_OBJ, obj);

const getAppListenObj = (): ApplicationListenEvent => store.get(APP_LISTEN_OBJ);

/**
 * a helper function to retrieve the `location.origin` value
 * relative to the server process itself; for example if you
 * start the framework on port 3000, this function may return
 * the value `localhost:3000`
 *
 * @NOTE mostly for use in SSR contexts
 */
export const getOrigin = (): string => {
  const obj = getAppListenObj();
  const scheme = obj.secure ? "https" : "http";
  const localOrigin = obj.port != null
    ? `${scheme}://${obj.hostname}:${obj.port}`
    : obj.hostname;
  return localOrigin;
};
