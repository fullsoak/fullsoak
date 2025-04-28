// this doesn't work yet as deno lint doesn't seem to
// pick up `--allow-env` properly
// import { dirname, join, SEPARATOR } from "@std/path";
// import { importJsonc } from "../src/importJsonc.ts";
// const denoJsonPath = join(
//   import.meta.dirname || dirname(import.meta.url),
//   `${SEPARATOR}..${SEPARATOR}deno.jsonc`,
// );

// const denoJson = await importJsonc(denoJsonPath);

const plugin: Deno.lint.Plugin = {
  // The name of your plugin. Will be shown in error output
  name: "fullsoak-linter",
  // Object with rules. The property name is the rule name and
  // will be shown in the error output as well.
  rules: {
    "no-css-module-yet": {
      create(context) {
        return {
          Identifier(node) {
            // console.log(`linting ${context.filename}, node=${node.range}`);
            if (
              node.name.match(/\.(s)css/)
            ) {
              context.report({
                node,
                message: `css / scss import not yet supported`,
              });
            }
          },
        };
      },
    },
    /**
     * BEWARE!!! ------------------------------------------------
     * THIS RULE DOES NOT WORK YET:
     * deno lint doesn't support markdown files
     */
    "pkg-version-in-readme": {
      // Inside the `create(context)` method is where you'll put your logic.
      // It's called when a file is being linted.
      create(context) {
        const denoJson = { version: "not-supported-yet" };
        // Return an AST visitor object
        return {
          // Here in this example we forbid any identifiers being named `_a`
          Identifier(node) {
            // console.log(`linting ${context.filename}, node=${node.name}`);
            if (
              context.filename === "README.md" &&
              node.name.match(/\d+\.\d+\.\d+/) && node.name !== denoJson.version
            ) {
              // Report a lint error with a custom message
              context.report({
                node,
                message: `version should be ${denoJson.version}`,
                // Optional: Provide a fix, which can be applied when
                // the user runs `deno lint --fix`
                fix(fixer) {
                  return fixer.replaceText(node, denoJson.version);
                },
              });
            }
          },
        };
      },
    },
  },
};

export default plugin;
