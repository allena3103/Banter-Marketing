# Banter Marketing

Marketing automation for **Banter**, a live video debate app. Several agents work here over time (TikTok/Instagram slideshows, Meta ads, competitor research). Each channel lives in `channels/<name>/`; shared material lives at the root.

## Read before making any content
- `context/marketing-context.md`: what Banter is, audience, features, **brand voice**.
- `context/slideshow-playbook.md`: hook → body → CTA structure and posting strategy.
- `brand/visual.md`: colors, fonts, logo and screenshot rules.

## Content rules (all channels)
- Follow the brand voice: bold, playful, confident. No rage-bait, no attacking groups of people, never frame Banter as a place for hate or harassment.
- Never invent prices, user counts, stats or quotes. Prices and store links come from the owner only.
- Banter is 18+. Don't target or depict minors.
- Debate prompts are one-sided statements users agree or disagree with (e.g. "College is not worth the debt").
- Banter is **pre-launch**: every CTA points to the waitlist ("Join the waitlist", "link in bio"). Don't say "download" or "available now".
- Only use app screenshots from `brand/screenshots/`. The owner has consent for the people in the current ones. Don't add screenshots showing other real users unless the owner confirms consent.

## Layout
```
context/              product and strategy docs (source of truth)
brand/                logo, mascot, colors, app screenshots
library/              reusable approved images + index.json (shared by all channels)
channels/
  tiktok-slideshows/  spec → render pipeline (see its README)
orchestrations/       briefs for multi-agent runs
```

## Engineering
- TypeScript on Node 24, run with `tsx`. `npm run typecheck` must pass.
- Secrets go in `.env` (see `.env.example`). Never commit keys.
- Generated output (`channels/*/output/`) is git-ignored.
- Don't post, publish, or run paid APIs in bulk without the owner's go-ahead.
