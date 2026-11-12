# TikTok / Instagram slideshows

Pipeline: **spec → images → render → check → package**. A spec (JSON) describes one post; see `src/schema.ts`.

From the repo root:
```bash
npm run validate -- channels/tiktok-slideshows/examples/*.json   # schema check only
npm run render   -- channels/tiktok-slideshows/examples/*.json   # → output/<id>/slide_XX.png, caption.txt, spec.json
```

## Spec rules
- First slide `hook`, last slide `cta`, everything between is `body`. 3–12 slides.
- `layout`: one per slide type, so a post looks consistent. A slide can override it with its own `layout`.
  - hook: `center` (big centered headline) or `caption` (outlined text near the top, for photo backgrounds)
  - body: `card` (white card), `vote` (card + AGREE/DISAGREE pills, for agree-or-disagree posts), `caption` (outlined text, for photo backgrounds), `bubble` (chat bubbles in the podium colors; add a `reply` to show a take and a comeback on one slide)
  - Mix layouts across posts. Use `vote` only when the post asks people to pick a side.
- `background`: `{ "type": "image", "path": "library/images/..." }` or `{ "type": "gradient", "variant": "royal|navy|sky" }`.
- `image` (optional) asks for a picture: prompt, tags and source (`library`, `muse`, `screenshot`, `none`). `images.ts` (step 5) resolves it into `background`. Until then, slides render with the gradient.

## Files
- `templates/slides.ts`: hook, body and CTA layouts (HTML/CSS rendered to PNG by Playwright).
- `hooks.md`, `topics.md`: hook angles and the debate prompt bank.
- `inspiration/`: viral posts to model (links and notes).
- `examples/`: hand-written specs.

## Status
- [x] Schema, renderer, 3 templates, examples
- [ ] `generate.ts`: Claude writes specs from a topic and hook angle
- [ ] `library.ts` + `images.ts`: reuse library images, fall back to Muse Image
- [ ] `check.ts`: vision QA, regenerate failures
- [ ] `batch.ts` + `tracker.csv`
