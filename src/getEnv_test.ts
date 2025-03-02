import { assertEquals } from "@std/assert";
import { stub } from "@std/testing/mock";
import { getEnv } from "./getEnv.ts";

Deno.test("getEnv - Deno runtime", () => {
  const stubbed = stub(Deno.env, "get", () => "bar");
  const res = getEnv("NODE_ENV");
  assertEquals(res, "bar");
  stubbed.restore();
});

Deno.test("getEnv - should not crash on non-Deno runtimes", () => {
  const defDeno = globalThis.Deno;
  Object.defineProperty(globalThis, "Deno", { value: undefined });
  getEnv("NODE_ENV");
  Object.defineProperty(globalThis, "Deno", { value: defDeno });
});
