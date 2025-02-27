import { ConsoleHandler, getLogger, type LevelName, setup } from "@std/log";

export const process = !globalThis.Deno
  ? (await import("node:process")).default
  : undefined;

const getEnv = (env: string): string | undefined => {
  return globalThis.Deno?.env.get(env) || process?.env[env];
};

function logger() {
  return getLogger("@fullsoak/fullsoak");
}

const DEBUG = getEnv("DEBUG");
export const IS_DEBUG = DEBUG ? DEBUG !== "false" : false;

export const LogDebug = (msg: string, ...args: unknown[]) =>
  logger().debug(msg, ...args);

export const LogInfo = (msg: string, ...args: unknown[]) =>
  logger().info(msg, ...args);

export const LogError = (msg: string, ...args: unknown[]) =>
  logger().error(msg, ...args);

export const LogWarn = (msg: string, ...args: unknown[]) =>
  logger().warn(msg, ...args);

export const CWD = globalThis.Deno?.cwd() || process?.cwd();

const OS = globalThis.Deno
  ? globalThis.Deno.build.os
  : (await import("node:os")).platform;

const HOME = getEnv("HOME");

let DENO_DIR = getEnv("DENO_DIR");

if (!DENO_DIR) {
  DENO_DIR = OS === "darwin"
    ? `${HOME}/Library/Caches`
    : OS === "windows"
    ? `${HOME}\\AppData\\Local`
    : `${HOME}/.cache`; // @TODO consider adding support for other systems?
}

export { DENO_DIR };

/**
 * read a file to string, supporting both file system path and network path
 */
export const readFileToString = async (path: string): Promise<string> => {
  if (path.startsWith("http")) {
    const resp = await fetch(path);
    return await resp.text();
  }
  if (globalThis.Deno) return globalThis.Deno.readTextFile(path);
  const fs: typeof import("node:fs") = await import("node:fs");
  const prom = new Promise<string>((resolve, reject) => {
    fs.readFile(path, "utf8", (err, data) => {
      if (err) return reject(err);
      return resolve(data);
    });
  });
  return prom;
};

/**
 * Setup the default logger for the fullsoak library.
 * This should be called in the main entry point of the application.
 * @NOTE you don't have to use this, instead you can set up your own logger
 * following the [docs](https://jsr.io/@std/log#examples)
 */
export const setupDefaultFullsoakLogger = (
  logLevelForFullsoak: LevelName = "NOTSET",
): void => {
  setup({
    handlers: {
      consoleDbg: new ConsoleHandler("DEBUG", {
        formatter: (logRecord) => {
          return `${logRecord.levelName} ${logRecord.msg} ${logRecord.args.join()}`;
        },
      }),
    },
    loggers: {
      "@fullsoak/fullsoak": {
        level: logLevelForFullsoak,
        handlers: ["consoleDbg"],
      },
    },
  });
};
