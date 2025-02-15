import { basename, join } from "@std/path";
import type { ApplicationListenEvent } from "@oak/oak/application";
import { LogDebug } from "./utils.ts";

const store = new Map();

const KEY_FULLSOAK_APP_COMPONENTS_PARENT_DIR_ABS_PATH =
  "KEY_FULLSOAK_APP_COMPONENTS_PARENT_DIR_ABS_PATH";

const KEY_FULLSOAK_APP_COMPONENTS_DIR_NAME =
  "KEY_FULLSOAK_APP_COMPONENTS_DIR_NAME";

const APP_LISTEN_OBJ = "APP_LISTEN_OBJ";

/**
 * record the absolute path to the parent directory of the `components` dir
 * and the standalone name of the `components` dir itself
 */
export const setGlobalComponentsDir = (pathToComponentsDir: string) => {
  const compDirName = basename(pathToComponentsDir);
  const componentsParentDirAbsPath = join(pathToComponentsDir, "..");
  store.set(
    KEY_FULLSOAK_APP_COMPONENTS_DIR_NAME,
    compDirName,
  );
  store.set(
    KEY_FULLSOAK_APP_COMPONENTS_PARENT_DIR_ABS_PATH,
    componentsParentDirAbsPath,
  );
  LogDebug("set component dirname to", compDirName);
  LogDebug(
    "set global components parent dir abs path to",
    componentsParentDirAbsPath,
  );
};

/**
 * retrieve the absolute path to the parent directory of the `components` dir
 */
export const getGlobalComponentsParentDir = (): string =>
  store.get(KEY_FULLSOAK_APP_COMPONENTS_PARENT_DIR_ABS_PATH);

/**
 * retrieve the standalone name of the `components` dir,
 * which is `components` by convention, but is otherwise
 * configurable using {@link setGlobalComponentsDir}
 */
export const getGlobalComponentsDirName = (): string =>
  store.get(KEY_FULLSOAK_APP_COMPONENTS_DIR_NAME);

export const setAppListenObj = (obj: ApplicationListenEvent) =>
  store.set(APP_LISTEN_OBJ, obj);

const getAppListenObj = (): ApplicationListenEvent => store.get(APP_LISTEN_OBJ);

/**
 * a helper function to retrieve the `location.origin` value
 * relative to the server process itself; for example if you
 * start the framework on port 3000, this function may return
 * the value `localhost:3000`
 *
 * @NOTE mainly for use in Server-side contexts
 */
export const getOrigin = (): string => {
  const obj = getAppListenObj();
  const scheme = obj.secure ? "https" : "http";
  const localOrigin = obj.port != null
    ? `${scheme}://${obj.hostname}:${obj.port}`
    : obj.hostname;
  return localOrigin;
};
