import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { extname, resolve } from "node:path";
import type { BodyLayout, HookLayout, Slide, Spec } from "../src/schema.ts";

// Slide templates. Each slide becomes one self-contained HTML page
// (fonts and images inlined) rendered at 1080x1920.
//
// TikTok covers parts of the screen with its own UI, so all text stays inside
// the safe zone: about 200px clear at the top, 420px at the bottom and
// 140px on the right (the like/comment/share buttons).

export const WIDTH = 1080;
export const HEIGHT = 1920;

const require = createRequire(import.meta.url);
const ROOT = resolve(import.meta.dirname, "../../..");

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function dataUri(absPath: string): string {
  const mime = MIME[extname(absPath).toLowerCase()];
  if (!mime) throw new Error(`Unsupported file type: ${absPath}`);
  return `data:${mime};base64,${readFileSync(absPath).toString("base64")}`;
}

export const repoFile = (rel: string) => dataUri(resolve(ROOT, rel));

const font = (weight: number) =>
  dataUri(require.resolve(`@fontsource/poppins/files/poppins-latin-${weight}-normal.woff2`));

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Brand colors, taken from the mascot. Keep in sync with brand/visual.md.
const C = {
  royal: "#1F4FB0",
  royalDeep: "#163A8A",
  sky: "#4DA6EE",
  slate: "#6E9A9B",
  navy: "#0C1D45",
  white: "#FFFFFF",
};

const GRADIENTS = {
  royal: `radial-gradient(circle at 30% 20%, #3A72D6 0%, transparent 55%), linear-gradient(160deg, ${C.royal} 0%, ${C.royalDeep} 100%)`,
  navy: `radial-gradient(circle at 70% 25%, #23407F 0%, transparent 60%), linear-gradient(170deg, #12285A 0%, ${C.navy} 100%)`,
  sky: `radial-gradient(circle at 25% 15%, #8CC8F5 0%, transparent 55%), linear-gradient(160deg, ${C.sky} 0%, ${C.royal} 100%)`,
};

// Faint doodle pattern (speech bubble, mic, lightning, quote marks) tiled over
// gradient backgrounds so plain slides don't feel empty.
const PATTERN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="540" height="540" viewBox="0 0 540 540" fill="none"
  stroke="#fff" stroke-opacity=".09" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <path d="M60 80h120a20 20 0 0 1 20 20v60a20 20 0 0 1-20 20h-70l-30 28v-28h-20a20 20 0 0 1-20-20v-60a20 20 0 0 1 20-20z"/>
  <g transform="rotate(-20 420 150)"><rect x="395" y="70" width="50" height="95" rx="25"/><path d="M372 135a48 48 0 0 0 96 0M420 183v35M395 218h50"/></g>
  <path d="M140 300l-40 80h40l-25 75 72-100h-44l34-55z"/>
  <path d="M345 390a22 22 0 1 1 22 22q0 30-25 45M415 390a22 22 0 1 1 22 22q0 30-25 45"/>
  <circle cx="270" cy="250" r="9"/><circle cx="480" cy="480" r="9"/><circle cx="40" cy="500" r="9"/>
</svg>`;
const PATTERN = `url(data:image/svg+xml;base64,${Buffer.from(PATTERN_SVG).toString("base64")})`;

let fontCss: string | undefined;
function baseCss(): string {
  fontCss ??= [400, 600, 800]
    .map((w) => `@font-face{font-family:Poppins;font-weight:${w};src:url(${font(w)}) format("woff2");}`)
    .join("");
  return `${fontCss}
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden}
  body{font-family:Poppins,sans-serif;color:${C.white};position:relative;background:${C.navy}}
  .bg{position:absolute;inset:0;background-size:cover;background-position:center}
  .shade{position:absolute;inset:0}
  .safe{position:absolute;top:200px;bottom:420px;left:80px;right:140px;display:flex;flex-direction:column}
  `;
}

function background(slide: Slide, shade: string): string {
  const bg = slide.background;
  if (bg.type === "image") {
    return `<div class="bg" style="background-image:url(${repoFile(bg.path)})"></div><div class="shade" style="background:${shade}"></div>`;
  }
  return `<div class="bg" style="background:${PATTERN} 0 0/540px 540px repeat,${GRADIENTS[bg.variant]}"></div>`;
}

function page(css: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss()}${css}</style></head><body>${body}</body></html>`;
}

// Bigger text for short lines, smaller for long ones.
function fitSize(text: string, max: number, min: number, longAt: number): number {
  const t = Math.min(1, Math.max(0, (text.length - 20) / (longAt - 20)));
  return Math.round(max - (max - min) * t);
}

// TikTok-native caption text: white with a dark outline, no box.
const CAPTION_TEXT = `color:${C.white};-webkit-text-stroke:10px ${C.navy};paint-order:stroke fill;
  text-shadow:0 6px 24px rgba(0,0,0,.35)`;

function highlighted(text: string, highlight?: string): string {
  const safe = esc(text);
  if (!highlight || !text.includes(highlight)) return safe;
  return safe.replace(esc(highlight), `<span class="hl">${esc(highlight)}</span>`);
}

// --- Hook layouts -----------------------------------------------------------

function hook(slide: Extract<Slide, { role: "hook" }>, layout: HookLayout): string {
  const text = highlighted(slide.text, slide.highlight);
  const swipe = `<div class="swipe">swipe →</div>`;
  const swipeCss = `.swipe{position:absolute;bottom:440px;left:0;right:60px;text-align:center;font-weight:600;font-size:40px;opacity:.85}`;

  if (layout === "caption") {
    // Text near the top over the picture, like a creator's own slideshow.
    const css = `
    .safe{justify-content:flex-start;padding-top:60px}
    h1{font-weight:800;font-size:${fitSize(slide.text, 96, 72, 90)}px;line-height:1.15;text-align:center;${CAPTION_TEXT}}
    .hl{color:${C.sky}}
    ${swipeCss}`;
    return page(
      css,
      `${background(slide, "linear-gradient(180deg,rgba(8,20,50,.45) 0%,rgba(8,20,50,0) 45%)")}
       <div class="safe"><h1>${text}</h1></div>${swipe}`,
    );
  }

  // "center": big centered headline with a highlight pill.
  const css = `
  .safe{justify-content:center}
  h1{font-weight:800;font-size:${fitSize(slide.text, 116, 84, 90)}px;line-height:1.12;letter-spacing:-1px;text-align:center;
     text-shadow:0 4px 24px rgba(0,0,0,.45)}
  .hl{background:${C.sky};color:${C.white};padding:0 16px;border-radius:18px;
      box-decoration-break:clone;-webkit-box-decoration-break:clone;text-shadow:none}
  ${swipeCss}`;
  return page(
    css,
    `${background(slide, "linear-gradient(180deg,rgba(8,20,50,.55) 0%,rgba(8,20,50,.35) 45%,rgba(8,20,50,.7) 100%)")}
     <div class="safe"><h1>${text}</h1></div>${swipe}`,
  );
}

// --- Body layouts -----------------------------------------------------------

function body(slide: Extract<Slide, { role: "body" }>, layout: BodyLayout, index: number): string {
  const size = fitSize(slide.text, 88, 62, 110);
  const sub = slide.subtext ? `<div class="sub">${esc(slide.subtext)}</div>` : "";
  const shared = `
  .sub{text-align:center;font-weight:600;font-size:48px;text-shadow:0 3px 16px rgba(0,0,0,.5)}
  .num{width:140px;height:140px;border-radius:70px;background:${C.sky};display:flex;align-items:center;
       justify-content:center;font-weight:800;font-size:76px;box-shadow:0 8px 30px rgba(0,0,0,.3);align-self:center}`;
  const num = slide.number ? `<div class="num">${slide.number}</div>` : "";
  const shade = "linear-gradient(180deg,rgba(8,20,50,.35) 0%,rgba(8,20,50,.55) 100%)";

  if (layout === "caption") {
    // Numbered point in outlined text near the top; lets the picture carry the slide.
    const css = `${shared}
    .safe{justify-content:flex-start;padding-top:60px;gap:32px}
    p{font-weight:800;font-size:${size}px;line-height:1.15;text-align:center;${CAPTION_TEXT}}
    .n{color:${C.sky}}`;
    const n = slide.number ? `<span class="n">${slide.number}.</span> ` : "";
    return page(
      css,
      `${background(slide, "linear-gradient(180deg,rgba(8,20,50,.45) 0%,rgba(8,20,50,0) 50%)")}
       <div class="safe"><p>${n}${esc(slide.text)}</p>${sub}</div>`,
    );
  }

  if (layout === "bubble") {
    // Chat bubbles in the two podium colors, like two sides of a debate.
    // With a `reply`, the slide shows a take and a comeback. Without one,
    // single bubbles alternate sides from slide to slide.
    const bubbleCss = (cls: string, color: string, left: boolean) => `
    .${cls}{position:relative;background:${color};border-radius:48px;padding:52px 52px;
            box-shadow:0 18px 50px rgba(0,0,0,.35);max-width:86%;align-self:${left ? "flex-start" : "flex-end"}}
    .${cls}:after{content:"";position:absolute;bottom:-38px;${left ? "left:70px" : "right:70px"};
            border-left:40px solid transparent;border-right:40px solid transparent;border-top:44px solid ${color}}`;
    const tag = (label: string, left: boolean) =>
      `<div class="tag" style="align-self:${left ? "flex-start" : "flex-end"}">${label}</div>`;
    const pSize = slide.reply ? fitSize(slide.text, 72, 54, 110) : size;
    const rSize = slide.reply ? fitSize(slide.reply, 72, 54, 110) : size;
    const css = `${shared}
    .safe{justify-content:center;gap:28px}
    .tag{font-weight:800;font-size:30px;letter-spacing:2px;opacity:.85;padding:0 24px}
    .a p{font-weight:800;font-size:${pSize}px;line-height:1.15;letter-spacing:-.5px}
    .b p{font-weight:800;font-size:${rSize}px;line-height:1.15;letter-spacing:-.5px}
    ${slide.reply ? bubbleCss("a", C.sky, true) + bubbleCss("b", C.slate, false) : ""}`;
    if (slide.reply) {
      return page(
        css,
        `${background(slide, shade)}
         <div class="safe">${num}
           ${tag("AGREE", true)}<div class="a"><p>${esc(slide.text)}</p></div>
           <div style="height:40px"></div>
           ${tag("DISAGREE", false)}<div class="b"><p>${esc(slide.reply)}</p></div>${sub}
         </div>`,
      );
    }
    const left = index % 2 === 1; // first body slide on the left, then alternate
    return page(
      `${css}${bubbleCss("a", left ? C.sky : C.slate, left)}`,
      `${background(slide, shade)}
       <div class="safe">${num}<div class="a"><p>${esc(slide.text)}</p></div>${sub}</div>`,
    );
  }

  // "card" (white card) and "vote" (card plus AGREE / DISAGREE pills).
  const vote =
    layout === "vote"
      ? `<div class="vs"><span class="agree">AGREE</span><span class="disagree">DISAGREE</span></div>`
      : "";
  const css = `${shared}
  .safe{justify-content:center;gap:40px}
  .card{background:${C.white};color:${C.navy};border-radius:36px;padding:56px 52px;
        box-shadow:0 18px 50px rgba(0,0,0,.35);text-align:center}
  .card p{font-weight:800;font-size:${size}px;line-height:1.15;letter-spacing:-.5px}
  .vs{display:flex;gap:24px;justify-content:center}
  .vs span{font-weight:800;font-size:40px;padding:20px 44px;border-radius:40px;letter-spacing:1px}
  .agree{background:${C.slate}}
  .disagree{background:${C.sky}}`;
  return page(
    css,
    `${background(slide, shade)}
     <div class="safe">${num}<div class="card"><p>${esc(slide.text)}</p></div>${sub}${vote}</div>`,
  );
}

// --- CTA --------------------------------------------------------------------

function cta(slide: Extract<Slide, { role: "cta" }>): string {
  const css = `
  .safe{align-items:center;gap:40px}
  .row{flex:1;min-height:0;width:100%;display:flex;align-items:flex-end;justify-content:center;gap:12px}
  h2{font-weight:800;font-size:${fitSize(slide.text, 88, 66, 80)}px;line-height:1.12;text-align:center;
     letter-spacing:-.5px;text-shadow:0 4px 20px rgba(0,0,0,.35)}
  .phone{position:relative;width:480px;height:100%;flex-shrink:0;border-radius:56px;padding:14px;background:${C.navy};
         box-shadow:0 30px 80px rgba(0,0,0,.45),0 0 0 4px rgba(255,255,255,.18)}
  .phone div{width:100%;height:100%;border-radius:44px;background-size:cover;background-position:center top}
  .mascot{width:340px;flex-shrink:0;margin-left:-40px;filter:drop-shadow(0 12px 30px rgba(0,0,0,.4))}
  `;
  return page(
    css,
    `${background(slide, "rgba(8,20,50,.5)")}
     <div class="safe">
       <h2>${esc(slide.text)}</h2>
       <div class="row">
         ${slide.mascot ? `<img class="mascot" src="${repoFile("brand/assets/mascot-waitlist.png")}">` : ""}
         <div class="phone"><div style="background-image:url(${repoFile(slide.screenshot)})"></div></div>
       </div>
     </div>`,
  );
}

// The spec sets one layout per slide type so a post looks consistent;
// a slide can override it.
export function slideHtml(slide: Slide, layouts: Spec["layout"], index: number): string {
  switch (slide.role) {
    case "hook":
      return hook(slide, slide.layout ?? layouts.hook);
    case "body":
      return body(slide, slide.layout ?? layouts.body, index);
    case "cta":
      return cta(slide);
  }
}
