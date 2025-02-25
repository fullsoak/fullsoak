if (!globalThis.window) {
  // for compatibility with superoak & Deno 2
  // deno-lint-ignore no-explicit-any
  (globalThis.window = globalThis as any)[Symbol("SHAM_SYMBOL")] = {};
}

export { useFullSoak } from "./mod-manual.ts";
