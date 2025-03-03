import type { Output } from "@swc/core";
import { LogDebug, LogError, LogWarn, OS } from "./utils.ts";
import { getJsTransformFns } from "./jsxTransformer.ts";
import { IS_DEBUG, IS_PROD } from "./getEnv.ts";

const componentFilePathMatcher = OS === "windows"
  ? (path: string) => path.match(/\\index(\.(?:t|j)sx)$/)
  : (path: string) => path.match(/\/index(\.(?:t|j)sx)$/);

/**
 * given a file path (ideally absolute path) to a component file (e.g. `.tsx`),
 * return its browser-compatible JavaScript content (transformed via e.g. `swc`)
 * @param filePath path to the file
 * @returns corresponding transformed JavaScript
 */
export async function getComponentJs(
  filePath: string,
  mode: "compName/index.tsx" | "compName.tsx" = "compName/index.tsx",
): Promise<string> {
  LogDebug("transforming component", filePath);

  let transformedComp: Output;

  try {
    const { transformFile } = await getJsTransformFns();
    transformedComp = await transformFile(filePath, {
      env: {
        debug: IS_DEBUG && true,
      },
      // @TODO enable **only for PROD** after we find a way
      // to cover the transform for `from"./` BEFORE any
      // transformation happens
      minify: true,
      jsc: {
        parser: {
          // @TODO confirm that .jsx is also supported
          syntax: "typescript",
          tsx: true,
        },
        transform: {
          react: {
            runtime: "automatic",
            pragma: "h",
            pragmaFrag: "Fragment",
            refresh: !IS_PROD,
          },
          // "optimizer": {
          //   "globals": {
          //     "vars": {
          //       "__DEBUG__": "true",
          //     },
          //   },
          // },
        },
        minify: {
          compress: true,
          mangle: true,
        },
      },
    });
  } catch (e) {
    // experimental best-effort logic to load the file at a different path
    // e.g. `${compName}/index.tsx` -> `${compName}.tsx`;
    // if it still fails after this, we give up
    // @NOTE totally different approaches would be 1) to let user define the
    // exact path to the file, or 2) use file-based routing, each with their
    // own trade-offs
    const matches = componentFilePathMatcher(filePath);
    if (matches?.length === 2) {
      const triedPath = filePath;
      filePath = filePath.replace(matches[0], "");
      filePath += matches[1];
      LogWarn(
        `error transforming component ${triedPath}, trying ${filePath}`,
        (e as Error).stack,
      );
      try {
        return getComponentJs(filePath, "compName.tsx");
      } catch (_) {
        return `console.error("error loading component at '${filePath}'");`;
      }
    }

    LogError(`error transforming component ${filePath}`, (e as Error).stack);
    return `console.error("error loading component at '${filePath}' or its '/index.tsx' equivalence");`;
  }

  let retVal = transformedComp.code;
  if (mode === "compName.tsx") {
    // consider cases like the following folder structure:
    //
    // components
    // |_ Foo.tsx
    // |_ Nav
    //   |_ index.tsx
    //
    // ```
    // where _inside_ `Foo.tsx`, sth from `./Nav/index.tsx` is `import`ed;
    // for SSR, the file system can deal with `./` just fine
    // but for CSR, the import url would be e.g. `/components/Foo/Nav.tsx`
    // which makes no sense, and should be translated into `/components/Nav.tsx`;
    // hence, this edgy hack
    retVal = retVal.replaceAll(`from"./`, `from"../`);
  }

  // @TODO consider what to do with source map
  return retVal;
}
