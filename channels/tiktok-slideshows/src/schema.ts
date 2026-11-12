import { z } from "zod";

// A background is either a file (from the library, a Muse image, a screenshot)
// or a brand gradient used as a placeholder or as a deliberate text-only look.
export const Background = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("image"),
    path: z.string(), // repo-relative, e.g. library/images/img_0001.webp
  }),
  z.object({
    type: z.literal("gradient"),
    variant: z.enum(["royal", "navy", "sky"]).default("royal"),
  }),
]);

// How the image for a slide should be found. The generator writes this;
// images.ts (step 5) resolves it into `background`.
export const ImageRequest = z.object({
  prompt: z.string(), // what the picture should show, no text in it
  tags: z.array(z.string()).default([]),
  source: z.enum(["library", "muse", "screenshot", "none"]).default("library"),
});

const Base = z.object({
  background: Background.default({ type: "gradient", variant: "royal" }),
  image: ImageRequest.optional(),
});

// Layouts. A spec picks one per slide type (see `layout` below);
// a slide can override it.
//   hook: center = big centered headline · caption = outlined text near the top over the picture
//   body: card = white card · vote = card + AGREE/DISAGREE pills ·
//         caption = outlined text over the picture · bubble = chat bubble in the podium colors
export const HookLayout = z.enum(["center", "caption"]);
export const BodyLayout = z.enum(["card", "vote", "caption", "bubble"]);
export type HookLayout = z.infer<typeof HookLayout>;
export type BodyLayout = z.infer<typeof BodyLayout>;

export const HookSlide = Base.extend({
  role: z.literal("hook"),
  layout: HookLayout.optional(),
  text: z.string().max(90),
  highlight: z.string().optional(), // a word or phrase in `text` to color
});

export const BodySlide = Base.extend({
  role: z.literal("body"),
  layout: BodyLayout.optional(),
  number: z.number().int().positive().optional(),
  text: z.string().max(110),
  subtext: z.string().max(80).optional(), // small line under the main text
  reply: z.string().max(110).optional(), // bubble layout: the other side's comeback
});

export const CtaSlide = z.object({
  role: z.literal("cta"),
  text: z.string().max(80),
  screenshot: z.string(), // repo-relative, e.g. brand/screenshots/vs-debate.png
  mascot: z.boolean().default(true),
  background: Background.default({ type: "gradient", variant: "royal" }),
});

export const Slide = z.discriminatedUnion("role", [HookSlide, BodySlide, CtaSlide]);

export const HOOK_ANGLES = ["controversial", "surprise", "insider", "challenge", "value"] as const;

export const Spec = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    account: z.string(),
    hook_angle: z.enum(HOOK_ANGLES),
    style: z.string(), // visual style name, e.g. "cinematic-dark"
    layout: z
      .object({ hook: HookLayout.default("center"), body: BodyLayout.default("card") })
      .default({}),
    referral_code: z.string().optional(),
    slides: z.array(Slide).min(3).max(12),
    caption: z.string().max(2200),
    hashtags: z.array(z.string().regex(/^#\w+$/)).max(10),
  })
  .superRefine((spec, ctx) => {
    const roles = spec.slides.map((s) => s.role);
    if (roles[0] !== "hook") ctx.addIssue({ code: "custom", message: "first slide must be the hook" });
    if (roles.at(-1) !== "cta") ctx.addIssue({ code: "custom", message: "last slide must be the CTA" });
    if (roles.slice(1, -1).some((r) => r !== "body"))
      ctx.addIssue({ code: "custom", message: "slides between hook and CTA must all be body slides" });
  });

export type Spec = z.infer<typeof Spec>;
export type Slide = z.infer<typeof Slide>;
