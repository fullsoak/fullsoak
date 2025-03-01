/**
 * returns `node:process` module on compatible runtimes
 * or `undefined` otherwise
 */
export const process = !globalThis.Deno
  ? (await import("node:process")).default
  : undefined;
