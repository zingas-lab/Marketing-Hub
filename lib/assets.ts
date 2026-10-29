import type { Asset, AssetKind } from "./types";

const DESIGN_EXTS = new Set(["ai", "eps", "indd", "idml", "psd", "sketch", "fig", "afdesign", "xd", "cdr"]);
const FONT_EXTS = new Set(["otf", "ttf", "woff", "woff2"]);
const DOC_EXTS = new Set(["doc", "docx", "ppt", "pptx", "xls", "xlsx", "key", "pages", "txt", "csv", "md"]);
const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "heic", "tif", "tiff", "bmp"]);
const VIDEO_EXTS = new Set(["mp4", "mov", "m4v", "avi", "webm", "mkv"]);

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export function kindOf(mimeType: string, ext: string): AssetKind {
  if (mimeType.startsWith("application/vnd.google-apps.")) return "document";
  if (DESIGN_EXTS.has(ext) || mimeType === "application/illustrator" || mimeType === "application/postscript") return "design";
  if (FONT_EXTS.has(ext) || mimeType.startsWith("font/")) return "font";
  if (mimeType.startsWith("image/") || IMAGE_EXTS.has(ext)) return "image";
  if (mimeType.startsWith("video/") || VIDEO_EXTS.has(ext)) return "video";
  if (mimeType === "application/pdf" || ext === "pdf") return "pdf";
  if (DOC_EXTS.has(ext)) return "document";
  return "other";
}

export const KIND_LABELS: Record<AssetKind, string> = {
  image: "Image",
  video: "Video",
  pdf: "PDF",
  design: "Design file",
  document: "Document",
  font: "Font",
  other: "File",
};

export const KIND_FILTERS: { kind: AssetKind; label: string }[] = [
  { kind: "image", label: "Images" },
  { kind: "video", label: "Videos" },
  { kind: "pdf", label: "PDFs" },
  { kind: "design", label: "Design files" },
  { kind: "document", label: "Documents" },
];

/** Photos fill their tile; logos, graphics and documents sit inside it so nothing gets cropped. */
export function isPhotographic(asset: Pick<Asset, "kind" | "ext">): boolean {
  return asset.kind === "video" || (asset.kind === "image" && ["jpg", "jpeg", "heic", "webp", "tif", "tiff"].includes(asset.ext));
}

export function formatBytes(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

export function formatDuration(ms?: number): string {
  if (!ms) return "";
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Display name without the extension, for tidier tiles. */
export function displayName(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

export function downloadName(asset: Pick<Asset, "name" | "googleNative">): string {
  return asset.googleNative ? `${asset.name}.pdf` : asset.name;
}
