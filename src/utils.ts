import { ConsoleHandler, getLogger, type LevelName, setup } from "@std/log";
import { getGlobalComponentsDir } from "./metastore.ts";

function logger() {
  return getLogger("@fullsoak/fullsoak");
}

export const IS_DEBUG = Deno.env.get("DEBUG")
  ? Deno.env.get("DEBUG") !== "false"
  : false;

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
    return await Deno.readTextFile(
      `${getGlobalComponentsDir()}/${componentName}/styles.css`,
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
