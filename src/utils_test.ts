import { assert } from "@std/assert/assert";
import { getFrameworkVersion } from "./utils.ts";

Deno.test("getFrameworkVersion", async () => {
  const v = await getFrameworkVersion();
  assert(v === "0.18.1");
});
