import { ssr } from "./ssr.ts";
import { html } from "htm/preact";
import { SimpleTsxComponent } from "@mocks/components/SimpleTsxComponent.tsx";
import { SimpleTsxComponentWithProps } from "@mocks/components/SimpleTsxComponentWithProps.tsx";
import { StandardComponent } from "@mocks/components/StandardComponent/index.tsx";
import { assertSnapshot } from "@std/testing/snapshot";
import { setGlobalComponentsDir } from "./metastore.ts";

// this is called in `useFullsoak`, but we call it here to make unit tests simpler
setGlobalComponentsDir("./mocks/components");

Deno.test("ssr a TSX component", async (t) => {
  const output = await ssr(SimpleTsxComponent);
  await assertSnapshot(t, output);
});

Deno.test("ssr a TSX component with props", async (t) => {
  const output = await ssr(SimpleTsxComponentWithProps, { name: "Alice" });
  await assertSnapshot(t, output);
});

Deno.test("ssr a VNode using HTM", async (t) => {
  const props = { name: "Bob" };
  const output = await ssr(
    html`<${SimpleTsxComponentWithProps} ...${props} />`,
  );
  await assertSnapshot(t, output);
});

Deno.test("ssr a StandardComponent", async (t) => {
  const output = await ssr(StandardComponent, { name: "Charlie" });
  await assertSnapshot(t, output);
});
