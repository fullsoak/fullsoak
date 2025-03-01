/** @module testing */

if (!globalThis.window) {
  // for compatibility with superoak & Deno 2
  // deno-lint-ignore no-explicit-any
  (globalThis.window = globalThis as any)[Symbol("SHAM_SYMBOL")] = {};
}

import { useFullSoakManual } from "./src/useFullSoak.ts";

/**
 * _entry function_ to initialize FullSoak framework for writing tests.
 * The app instance won't be auto-started so that it can be handled by a test
 * framework such as `superoak`: https://deno.land/x/superoak@4.8.1
 *
 * @example
 * ```ts
 * import { superoak } from "https://deno.land/x/superoak@4.8.1/mod.ts";
 * import { useFullSoak } from "jsr:@fullsoak/fullsoak/testing";
 *
 * // in real code, import from your controller file
 * class TestTargetController {}
 *
 * Deno.test("it should serve [POST] /api/login", async () => {
 *   const app = useFullSoak({ controllers: [TestTargetController] });
 *
 *   const req1 = await superoak(app);
 *   await req1.post("/api/login")
 *     .send(JSON.stringify({username: "foo", password: "bar"}))
 *     .expect(401);
 * });
 * ```
 */
export const useFullSoak = useFullSoakManual;
