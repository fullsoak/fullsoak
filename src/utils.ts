import { ConsoleHandler, getLogger, type LevelName, setup } from "@std/log";
import {
  getGlobalComponentsDirName,
  getGlobalComponentsParentDir,
} from "./metastore.ts";
import { type Output, transformFile } from "@swc/core";

const process = !globalThis.Deno ? await import("node:process") : undefined;

const getEnv = (env: string): string | undefined => {
  return process?.env[env] || globalThis.Deno?.env.get(env);
};

export const CWD = process?.cwd() || globalThis.Deno.cwd();

const OS = globalThis.Deno
  ? globalThis.Deno.build.os
  : (await import("node:os")).platform;

const HOME = getEnv("HOME");

let DENO_DIR = getEnv("DENO_DIR");

if (!DENO_DIR) {
  DENO_DIR = OS === "darwin" ? `${HOME}/Library/Caches` : `${HOME}/.cache`; // @TODO add support for other systems?
}

const readFileToString = async (path: string): Promise<string> => {
  if (globalThis.Deno) return globalThis.Deno.readTextFile(path);
  const fs = await import("node:fs");
  const prom = new Promise<string>((resolve, reject) => {
    fs.readFile(path, "utf8", (err, data) => {
      if (err) return reject(err);
      return resolve(data);
    });
  });
  return prom;
};

export { DENO_DIR };

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

export async function getComponentCss(componentName: string): Promise<string> {
  try {
    // @TODO use a framework smart fn that attempts to read all .css files in the `componentName` dir?
    // @TODO also consider the possibility to combine a general 'main.css' and a component-specific css
    return await readFileToString(
      `${getGlobalComponentsParentDir()}/${getGlobalComponentsDirName()}/${componentName}/styles.css`,
    );
  } catch (e) {
    LogWarn(
      `unable to load css for component \`${componentName}\`: ${
        (e as Error).message
      } - if you need it, make sure the styles.css file exists in the component's dir and is readable`,
    );
  }

  return "";
}

/**
 * given a file path (ideally absolute path) to a component file (e.g. `.tsx`),
 * return its browser-compatible JavaScript content (transformed via `swc`)
 * @param filePath path to the file
 * @returns corresponding transformed JavaScript
 */
export async function getComponentJs(filePath: string): Promise<string> {
  LogDebug("transforming component", filePath);

  let transformedComp: Output;

  try {
    transformedComp = await transformFile(filePath, {
      env: {
        debug: IS_DEBUG && true,
      },
      minify: true, // @TODO disable for dev
      jsc: {
        parser: {
          // @TODO consider supporting .jsx
          syntax: "typescript",
          tsx: true,
        },
        transform: {
          react: {
            runtime: "automatic",
            pragma: "h",
            pragmaFrag: "Fragment",
            refresh: true, // @TODO disable for prod
          },
          // "optimizer": {
          //   "globals": {
          //     "vars": {
          //       "__DEBUG__": "true",
          //     },
          //   },
          // },
        },
        minify: {
          compress: true,
          mangle: true,
          format: {
            comments: false,
          },
        },
      },
    });
  } catch (e) {
    LogError(
      "error transforming component",
      filePath,
      JSON.stringify(e),
    );
    return `console.error("error loading component at '${filePath}'");`;
  }

  // @TODO consider what to do with source map
  return transformedComp.code;
}
