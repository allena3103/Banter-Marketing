// Render one or more slideshow specs to 1080x1920 PNGs.
//
//   npm run render -- <spec.json> [more specs...]
//
// Output: channels/tiktok-slideshows/output/<spec id>/slide_01.png ...
//         plus caption.txt and a copy of spec.json.

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { loadSpec } from "./load.ts";
import { HEIGHT, WIDTH, slideHtml } from "../templates/slides.ts";

const OUTPUT = resolve(import.meta.dirname, "../output");

async function main(paths: string[]) {
  if (paths.length === 0) {
    console.error("Usage: npm run render -- <spec.json> [more specs...]");
    process.exit(1);
  }
  const specs = paths.map(loadSpec);
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
    }
  } finally {
    await browser.close();
  }
}

main(process.argv.slice(2)).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
