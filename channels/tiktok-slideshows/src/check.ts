// Content checker. Read-only: it judges a spec, it never changes one.
// Used by muse.ts before a post is accepted. Rules come from CLAUDE.md
// and the slideshow playbook.

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Spec } from "./schema.ts";

export const POSTS_DIR = resolve(import.meta.dirname, "../posts");

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

/** Every hook and body line already used by an accepted post. */
export function usedLines(excludeId?: string): Set<string> {
  const used = new Set<string>();
  for (const f of readdirSync(POSTS_DIR).filter((f) => f.endsWith(".json"))) {
    const spec = JSON.parse(readFileSync(resolve(POSTS_DIR, f), "utf8"));
    if (spec.id === excludeId) continue;
    for (const s of spec.slides) if (s.role !== "cta") used.add(norm(s.text));
  }
  return used;
}

const BANNED = [/\bdownload\b/i, /available now/i, /app store/i, /google play/i, /%/];

/** Returns a list of problems; empty means the post passes. */
export function checkSpec(raw: unknown, used: Set<string>): string[] {
  const parsed = Spec.safeParse(raw);
  if (!parsed.success) return parsed.error.issues.map((i) => `schema: ${i.path.join(".")}: ${i.message}`);
  const spec = parsed.data;
  const problems: string[] = [];
  const bodies = spec.slides.filter((s) => s.role === "body");
  const hook = spec.slides[0];
  const cta = spec.slides.at(-1)!;

  if (bodies.length < 3 || bodies.length > 8) problems.push(`needs 3-8 body slides, has ${bodies.length}`);

  const n = hook.text.match(/\b(\d{1,2})\b/);
  if (n && Number(n[1]) !== bodies.length) problems.push(`hook promises ${n[1]} but has ${bodies.length} body slides`);

  if (!/waitlist/i.test(cta.text)) problems.push("CTA must point to the waitlist");
  if (!/waitlist/i.test(spec.caption)) problems.push("caption must mention the waitlist");
  if (!spec.hashtags.includes("#banter")) problems.push("hashtags must include #banter");

  const all = [spec.caption, ...spec.slides.map((s) => s.text)].join("\n");
  for (const re of BANNED) if (re.test(all)) problems.push(`banned wording: ${re}`);

  const seen = new Set<string>();
  for (const s of spec.slides) {
    if (s.role === "cta") continue;
    const k = norm(s.text);
    if (used.has(k)) problems.push(`already used in another post: "${s.text}"`);
    if (seen.has(k)) problems.push(`repeated within post: "${s.text}"`);
    seen.add(k);
  }
  if (hook.role === "hook" && hook.highlight && !hook.text.includes(hook.highlight))
    problems.push("hook highlight not found in hook text");

  return problems;
}
