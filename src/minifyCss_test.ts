import { assertSnapshot } from "@std/testing/snapshot";
import { cleanCss } from "./minifyCss.ts";

Deno.test("minifyCss", async (t) => {
  const css = `html, body {
    padding: 0;
    margin: 0;
  }`;
  const cleanedCss = cleanCss(css);
  await assertSnapshot(t, cleanedCss);
});
