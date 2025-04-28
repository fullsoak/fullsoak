import { dirname, join, SEPARATOR } from "@std/path";
import { readFileToString } from "./utils.ts";

export const importJsoncFromDesignatedPath = (): ReturnType<
  typeof importJsonc
> => {
  const filePath = join(
    import.meta.dirname || dirname(import.meta.url),
    `${SEPARATOR}..${SEPARATOR}deno.jsonc`,
  );
  return importJsonc(filePath);
};

export const importJsonc = async (
  filePath: string,
  // deno-lint-ignore no-explicit-any
): Promise<Record<string, any>> => {
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
