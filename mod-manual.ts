/** @module manual */

import { useFullSoakManual } from "./src/useFullSoak.ts";

/**
 * _entry function_ to initialize FullSoak framework in manual mode (e.g. for customized use-cases).
 * In this mode, the app instance won't be auto-started, so it's up to the developer to call
 * `app.listen()` and pass in `AbortController` (if needed)
 *
 * @example
 * ```ts
 * import { useFullSoak } from "jsr:@fullsoak/fullsoak/manual";
 *
 * class MyController {}
 *
 * const app = await useFullSoak({ controllers: [MyController] });
 * const abrtCtrl = new AbortController();
 * app.listen({ port: 3991, signal: abrtCtrl.signal })
 * ```
 */
export const useFullSoak = useFullSoakManual;
