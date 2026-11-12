import { readFileSync } from "node:fs";
import { Spec } from "./schema.ts";

export function loadSpec(path: string): Spec {
  const parsed = Spec.safeParse(JSON.parse(readFileSync(path, "utf8")));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".") || "(spec)"}: ${i.message}`);
    throw new Error(`Invalid spec ${path}:\n${issues.join("\n")}`);
  }
  return parsed.data;
}
