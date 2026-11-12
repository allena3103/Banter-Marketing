// Runner: take a batch of drafted specs, check each one, and for every post
// that passes: save the spec, render it, copy it into muse-posts/post N/,
// log it and commit. Rejected drafts are logged with the reason and dropped.
//
//   npm run muse -- <batch.json>     (batch.json = an array of specs)
//
// Log: muse-posts/progress.tsv

import { appendFileSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { checkSpec, POSTS_DIR, usedLines } from "./check.ts";
import { renderSpecs } from "./render.ts";
import { Spec } from "./schema.ts";

const ROOT = resolve(import.meta.dirname, "../../..");
const MUSE = resolve(ROOT, "muse-posts");
const LOG = resolve(MUSE, "progress.tsv");

function nextPostNumber(): number {
  const nums = readdirSync(MUSE)
    .map((d) => d.match(/^post (\d+)$/i)?.[1])
    .filter(Boolean)
    .map(Number);
  return nums.length ? Math.max(...nums) + 1 : 1;
}

function log(cols: (string | number)[]) {
  if (!existsSync(LOG)) writeFileSync(LOG, "time\tpost\tid\tangle\thook_layout\tbody_layout\tresult\tnotes\n");
  appendFileSync(LOG, cols.map((c) => String(c).replace(/[\t\n]/g, " ")).join("\t") + "\n");
}

async function main(batchPath: string) {
  const drafts = JSON.parse(readFileSync(batchPath, "utf8")) as unknown[];
  let accepted = 0;
  for (const raw of drafts) {
    const r = raw as Record<string, any>;
    const time = new Date().toISOString();
    const problems = checkSpec(raw, usedLines(r.id));
    const layout = r.layout ?? {};
    if (problems.length) {
      log([time, "-", r.id, r.hook_angle, layout.hook, layout.body, "REJECT", problems.join("; ")]);
      console.log(`✗ ${r.id}\n  - ${problems.join("\n  - ")}`);
      continue;
    }
    const spec = Spec.parse(raw);
    const specFile = resolve(POSTS_DIR, `${spec.id}.json`);
    writeFileSync(specFile, JSON.stringify(raw, null, 2) + "\n");
    const [out] = await renderSpecs([spec]);

    const n = nextPostNumber();
    const dest = resolve(MUSE, `post ${n}`);
    mkdirSync(dest, { recursive: true });
    for (const f of readdirSync(out).filter((f) => /^slide_\d+\.png$|^caption\.txt$/.test(f)))
      copyFileSync(resolve(out, f), resolve(dest, f));

    log([time, n, spec.id, spec.hook_angle, spec.layout.hook, spec.layout.body, "ACCEPT", `${spec.slides.length} slides`]);
    execFileSync("git", ["add", specFile, dest, LOG], { cwd: ROOT });
    execFileSync("git", ["commit", "-q", "-m", `Add post ${n}: ${spec.id}`], { cwd: ROOT });
    console.log(`→ post ${n} committed`);
    accepted++;
  }
  console.log(`${accepted}/${drafts.length} accepted`);
}

main(process.argv[2]).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
