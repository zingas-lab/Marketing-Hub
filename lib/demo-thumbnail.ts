import "server-only";
import { logoSvg } from "./logo";
import type { Asset } from "./types";

// Placeholder artwork for demo mode, drawn in the brand palette.

function hash(text: string) {
  let h = 0;
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

const SCENES = [
  ["#f9a870", "#faeee4", "#2F5D5B"],
  ["#3f5563", "#a2abb9", "#0a1621"],
  ["#798998", "#faeee4", "#2F5D5B"],
  ["#0a1621", "#B08D57", "#3f5563"],
];

function photo(asset: Asset) {
  const h = hash(asset.name);
  const [sky, glow, ground] = SCENES[h % SCENES.length];
  const slats = Array.from({ length: 9 }, (_, i) => {
    const x = -200 + i * 120 + (h % 40);
    return `<polygon points="${x},0 ${x + 46},0 ${x + 290},800 ${x + 244},800" fill="#0a1621" opacity="0.16"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky}"/><stop offset="0.62" stop-color="${glow}"/></linearGradient></defs>
    <rect width="1200" height="800" fill="url(#g)"/>
    <rect y="520" width="1200" height="280" fill="${ground}"/>
    <rect x="${180 + (h % 300)}" y="300" width="560" height="22" fill="#0a1621" opacity="0.85"/>
    <rect x="${200 + (h % 300)}" y="322" width="18" height="260" fill="#0a1621" opacity="0.85"/>
    <rect x="${702 + (h % 300)}" y="322" width="18" height="260" fill="#0a1621" opacity="0.85"/>
    ${slats}
  </svg>`;
}

function logo(asset: Asset) {
  const white = /white/i.test(asset.name);
  const gold = /gold/i.test(asset.name);
  const color = white ? "#fdf9fd" : gold ? "#B08D57" : "#0a1621";
  const inner = logoSvg(white ? "#fdf9fd" : "#B08D57", color, 'x="150" y="250" width="900" height="225"');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">${white ? '<rect width="1200" height="800" fill="#0a1621"/>' : ""}${inner}</svg>`;
}

function page(asset: Asset) {
  const tint = asset.kind === "design" ? "#2F5D5B" : asset.kind === "pdf" ? "#B08D57" : "#3f5563";
  const lines = Array.from({ length: 7 }, (_, i) => `<rect x="380" y="${380 + i * 34}" width="${440 - (i % 3) * 90}" height="12" rx="2" fill="#a2abb9" opacity="0.6"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
    <rect x="340" y="80" width="520" height="680" fill="#fdf9fd" stroke="#a2abb9" stroke-width="2"/>
    <rect x="340" y="80" width="520" height="220" fill="${tint}"/>
    <rect x="380" y="200" width="260" height="22" fill="#fdf9fd" opacity="0.9"/>
    ${lines}
  </svg>`;
}

export function demoThumbnail(asset: Asset): string {
  if (/logo|signature/i.test(asset.name) && asset.kind === "image") return logo(asset);
  if (asset.kind === "image" && /jpe?g/.test(asset.ext)) return photo(asset);
  if (asset.kind === "video") return photo(asset);
  if (asset.kind === "image") return photo(asset);
  return page(asset);
}
