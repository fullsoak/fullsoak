import { join } from "@std/path";
import { transformScss } from "./scssTransformer.ts";
import { assertSnapshot } from "@std/testing/snapshot";
import { ssr } from "./ssr.ts";
import { StandardComponent } from "@mocks/components/StandardComponent/index.tsx";
import { setGlobalComponentsDir } from "./metastore.ts";

// this is called in `useFullsoak`, but we call it here to make unit tests simpler
setGlobalComponentsDir("./mocks/components");

Deno.test("transformScss", async (t) => {
  const out = await transformScss(
    join(
      import.meta.dirname || "",
      "../mocks/components/StandardComponent/styles.scss",
    ),
  );
  await assertSnapshot(t, out);
});

Deno.test("StandardComponent", async (t) => {
  const output = await ssr(StandardComponent);
  // console.log(output);
  await assertSnapshot(t, output);
});
