// Render one or more slideshow specs to 1080x1920 PNGs.
//
//   npm run render -- <spec.json> [more specs...]
//
// Output: channels/tiktok-slideshows/output/<spec id>/slide_01.png ...
//         plus caption.txt and a copy of spec.json.

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { loadSpec } from "./load.ts";
import type { Spec } from "./schema.ts";
import { HEIGHT, WIDTH, slideHtml } from "../templates/slides.ts";

export const OUTPUT = resolve(import.meta.dirname, "../output");

/** Render specs to output/<id>/. Returns the output folder of each spec. */
export async function renderSpecs(specs: Spec[]): Promise<string[]> {
  const dirs: string[] = [];
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
    for (const spec of specs) {
      const dir = resolve(OUTPUT, spec.id);
      mkdirSync(dir, { recursive: true });
      for (const [i, slide] of spec.slides.entries()) {
        await page.setContent(slideHtml(slide, spec.layout, i), { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        const file = resolve(dir, `slide_${String(i + 1).padStart(2, "0")}.png`);
        await page.screenshot({ path: file });
      }
      writeFileSync(resolve(dir, "caption.txt"), `${spec.caption}\n\n${spec.hashtags.join(" ")}\n`);
      writeFileSync(resolve(dir, "spec.json"), JSON.stringify(spec, null, 2));
      console.log(`✓ ${spec.id}: ${spec.slides.length} slides → ${dir}`);
      dirs.push(dir);
    }
  } finally {
    await browser.close();
  }
  return dirs;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const paths = process.argv.slice(2);
  if (paths.length === 0) {
    console.error("Usage: npm run render -- <spec.json> [more specs...]");
    process.exit(1);
  }
  renderSpecs(paths.map(loadSpec)).catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
