import { assertSnapshot } from "@std/testing/snapshot";
import { _internal } from "./jsxTransformer.ts";

const { getTscJsTransform } = _internal;

const sampleJsx = `
  import { Foo } from "./Foo/index.tsx";
  import {Bar}from"../Bar.tsx";import { Chaz}  from   "Chaz.tsx"
  import * as Daz from"./Daz/file.ts";
  import * as Daz1 from     "./Daz1/file.ts";
  export const Eas = () => {
    return <>{Daz.getSomething()}
    <Foo />
      <Bar foo="bar" chaz={<Chaz onClick={() => console.log("Chaz clicked")}/>}></Bar>
      <Daz1 />
    </>;
  }
`;

Deno.test("tsc transformation", async (t) => {
  const tx = await getTscJsTransform();
  const { code } = await tx(sampleJsx, {});
  await assertSnapshot(t, code);
});
