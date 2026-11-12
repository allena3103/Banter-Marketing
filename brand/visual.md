# Banter visual identity

## Colors (taken from the mascot)
| Name | Hex | Use |
|---|---|---|
| Royal blue | `#1F4FB0` | Main background, brand color |
| Royal deep | `#163A8A` | Gradient end |
| Sky blue | `#4DA6EE` | Highlights, "Disagree", number badges |
| Slate teal | `#6E9A9B` | "Agree", secondary accent |
| Navy | `#0C1D45` | Dark backgrounds, text on white cards |
| White | `#FFFFFF` | Headline text, cards |

The two podium halves (slate teal vs sky blue) stand for the two sides of a debate. Use slate for "agree" and sky for "disagree". The template code keeps its own copy of these values in `channels/tiktok-slideshows/templates/slides.ts`; update both together.

## Type
Poppins (bundled via `@fontsource/poppins`). ExtraBold 800 for headlines, SemiBold 600 for small labels.

## Assets
- `assets/logo.png`: podium mascot on royal blue (app icon style).
- `assets/mascot-waitlist.png`: mascot with a "Waitlist in bio" bubble, transparent background. Used on CTA slides.
- `screenshots/vs-debate.png`: VS mode, a live 1:1 debate. Used on CTA slides.

## Slide rules
- 1080×1920. Keep text inside the TikTok safe zone: 200px clear at the top, 420px at the bottom, 140px on the right.
- Every background image must match the slide's point. No text baked into images.
- Hook: one big line with one highlighted phrase. Body: one idea per slide. CTA: app screenshot plus a clear action.
