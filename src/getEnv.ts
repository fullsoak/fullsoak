import { process } from "./getProcess.ts";

/**
 * returns the value for a givem ENV VAR
 *
 * @NOTE this function should be runtime-agnostic
 */
export const getEnv = (env: string): string | undefined => {
  return globalThis.Deno?.env.get(env) || process?.env[env];
};

const DEBUG = getEnv("DEBUG");
export const IS_DEBUG = DEBUG ? DEBUG !== "false" : false;

// a bit shameless for Deno use cases, but UX is above all
export const NODE_ENV = getEnv("NODE_ENV");
export const IS_PROD = NODE_ENV === "production";
export const IS_DEV = NODE_ENV !== "production";
