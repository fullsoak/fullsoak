import { dirname, join, SEPARATOR } from "@std/path";
import { readFileToString } from "./utils.ts";

// deno-lint-ignore no-explicit-any
export const importJsonc = async (): Promise<Record<string, any>> => {
  const filePath = join(
    import.meta.dirname || dirname(import.meta.url),
    `${SEPARATOR}..${SEPARATOR}deno.jsonc`,
  );
  let lines = "";
  try {
    const rawLines = (await readFileToString(filePath)).split("\n");
    for (const l of rawLines) {
      lines += l.split("//")[0];
    }
    return JSON.parse(lines);
  } catch (e) {
    console.warn("failed to read file", filePath, (e as Error).stack);
  }
  return {};
};
