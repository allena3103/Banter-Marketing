// Check specs against the schema without rendering.
//   npm run validate -- <spec.json> [more specs...]

import { loadSpec } from "./load.ts";

let failed = 0;
for (const path of process.argv.slice(2)) {
  try {
    const spec = loadSpec(path);
    console.log(`✓ ${spec.id}`);
  } catch (err) {
    failed++;
    console.error(err instanceof Error ? err.message : err);
  }
}
process.exit(failed ? 1 : 0);
