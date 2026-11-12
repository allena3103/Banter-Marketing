import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { extname, resolve } from "node:path";
import type { Slide } from "../src/schema.ts";

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
  return `<div class="bg" style="background:${GRADIENTS[bg.variant]}"></div>`;
}

function page(css: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss()}${css}</style></head><body>${body}</body></html>`;
}

// Bigger text for short lines, smaller for long ones.
function fitSize(text: string, max: number, min: number, longAt: number): number {
  const t = Math.min(1, Math.max(0, (text.length - 20) / (longAt - 20)));
  return Math.round(max - (max - min) * t);
}

function hook(slide: Extract<Slide, { role: "hook" }>): string {
  let text = esc(slide.text);
  if (slide.highlight && slide.text.includes(slide.highlight)) {
    text = text.replace(esc(slide.highlight), `<span class="hl">${esc(slide.highlight)}</span>`);
  }
  const size = fitSize(slide.text, 116, 84, 90);
  const css = `
  .safe{justify-content:center}
  h1{font-weight:800;font-size:${size}px;line-height:1.12;letter-spacing:-1px;text-align:center;
     text-shadow:0 4px 24px rgba(0,0,0,.45)}
  .hl{background:${C.sky};color:${C.white};padding:0 16px;border-radius:18px;
      box-decoration-break:clone;-webkit-box-decoration-break:clone;text-shadow:none}
  .swipe{position:absolute;bottom:440px;left:0;right:60px;text-align:center;font-weight:600;font-size:40px;opacity:.85}
  `;
  return page(
    css,
    `${background(slide, "linear-gradient(180deg,rgba(8,20,50,.55) 0%,rgba(8,20,50,.35) 45%,rgba(8,20,50,.7) 100%)")}
     <div class="safe"><h1>${text}</h1></div>
     <div class="swipe">swipe →</div>`,
  );
}

function body(slide: Extract<Slide, { role: "body" }>): string {
  const size = fitSize(slide.text, 88, 62, 110);
  const css = `
  .safe{justify-content:center;gap:40px}
  .num{width:140px;height:140px;border-radius:70px;background:${C.sky};display:flex;align-items:center;
       justify-content:center;font-weight:800;font-size:76px;box-shadow:0 8px 30px rgba(0,0,0,.3);align-self:center}
  .card{background:${C.white};color:${C.navy};border-radius:36px;padding:56px 52px;
        box-shadow:0 18px 50px rgba(0,0,0,.35);text-align:center}
  .card p{font-weight:800;font-size:${size}px;line-height:1.15;letter-spacing:-.5px}
  .sub{text-align:center;font-weight:600;font-size:48px;text-shadow:0 3px 16px rgba(0,0,0,.5)}
  .vs{display:flex;gap:24px;justify-content:center}
  .vs span{font-weight:800;font-size:40px;padding:20px 44px;border-radius:40px;letter-spacing:1px}
  .agree{background:${C.slate}}
  .disagree{background:${C.sky}}
  `;
  const sub = slide.subtext
    ? `<div class="sub">${esc(slide.subtext)}</div><div class="vs"><span class="agree">AGREE</span><span class="disagree">DISAGREE</span></div>`
    : "";
  return page(
    css,
    `${background(slide, "linear-gradient(180deg,rgba(8,20,50,.35) 0%,rgba(8,20,50,.55) 100%)")}
     <div class="safe">
       ${slide.number ? `<div class="num">${slide.number}</div>` : ""}
       <div class="card"><p>${esc(slide.text)}</p></div>
       ${sub}
     </div>`,
  );
}

function cta(slide: Extract<Slide, { role: "cta" }>): string {
  const css = `
  .safe{align-items:center;gap:44px}
  h2{font-weight:800;font-size:${fitSize(slide.text, 88, 66, 80)}px;line-height:1.12;text-align:center;
     letter-spacing:-.5px;text-shadow:0 4px 20px rgba(0,0,0,.35)}
  .phone{position:relative;width:600px;flex:1;min-height:0;border-radius:56px;padding:14px;background:${C.navy};
         box-shadow:0 30px 80px rgba(0,0,0,.45),0 0 0 4px rgba(255,255,255,.18)}
  .phone div{width:100%;height:100%;border-radius:44px;background-size:cover;background-position:center top}
  .mascot{position:absolute;left:20px;bottom:300px;width:430px;filter:drop-shadow(0 12px 30px rgba(0,0,0,.4))}
  `;
  return page(
    css,
    `${background(slide, "rgba(8,20,50,.5)")}
     <div class="safe">
       <h2>${esc(slide.text)}</h2>
       <div class="phone"><div style="background-image:url(${repoFile(slide.screenshot)})"></div></div>
     </div>
     ${slide.mascot ? `<img class="mascot" src="${repoFile("brand/assets/mascot-waitlist.png")}">` : ""}`,
  );
}

export function slideHtml(slide: Slide): string {
  switch (slide.role) {
    case "hook":
      return hook(slide);
    case "body":
      return body(slide);
    case "cta":
      return cta(slide);
  }
}
