// Sample content for running the hub without Google credentials (HUB_DEMO=1).
// The folders mirror the real "Marketing Hub" folder in Drive; the files are made up.
import { extensionOf, kindOf } from "./assets";
import type { Asset, Folder, HubIndex, HubSettings } from "./types";

type Tree = { name: string; description?: string; files?: string[]; folders?: Tree[] };

const tree: Tree = {
  name: "Marketing Hub",
  description: "Every approved logo, photo, video, print file and template. Everything here is cleared for use in your territory.",
  folders: [
    {
      name: "Logos & Brand",
      description: "Approved logo lockups in every format. PNG for screens and documents, SVG for websites, EPS or AI for printers, sign shops and embroidery.",
      files: [
        "Zingas Logo Horizontal Lockup-Black.png",
        "Zingas Logo Horizontal Lockup-White.png",
        "Zingas Logo Horizontal Lockup-Black.svg",
        "Zingas Logo Horizontal Lockup-White.svg",
        "Zingas Logo Horizontal Lockup.eps",
        "Zingas Logo Horizontal Lockup.ai",
        "Zingas Logo Vertical Lockup-Black.png",
        "Zingas Logo Vertical Lockup-White.png",
        "Zingas Logo Vertical Lockup.eps",
        "Zingas Logo Vertical Lockup.ai",
      ],
      folders: [{ name: "Fonts" }],
    },
    {
      name: "Photos",
      description: "Finished installs by product line. Use these on social, your Google Business Profile, your website and print.",
      folders: [
        { name: "Louvered Pergolas", files: ["Vero Beach louvered pergola - dusk.jpg", "Azenco R-Blade poolside.jpg", "ZLouver kit backyard - morning.jpg"] },
        { name: "Pergolas with Screens", files: ["Pergola with screens half down.jpg", "Screened pergola at sunset.jpg"] },
        { name: "Motorized Screens", files: ["Lanai screens half down.jpg", "Patio screen detail.jpg", "Restaurant patio enclosure.jpg"] },
        { name: "Retractable Awnings", files: ["Awning extended over deck.jpg", "Second-story awning.jpg"] },
        { name: "Outdoor Kitchens", files: ["Covered outdoor kitchen.jpg", "Kitchen under louvered roof.jpg"] },
        { name: "Window Treatments", files: ["Living room roller shades.jpg", "Plantation shutters - bedroom.jpg", "Motorized drapes - great room.jpg"] },
      ],
    },
    {
      name: "Video",
      description: "Finished videos and b-roll by product line, for social, your website and presentations.",
      folders: [
        { name: "Louvered Pergolas", files: ["Pergola louvers opening - 15s.mp4", "Pergola time-lapse.mp4"] },
        { name: "Pergolas with Screens", files: ["Screens lowering at dusk.mov"] },
        { name: "Motorized Screens", files: ["Motorized screens demo - 15s.mp4"] },
        { name: "Retractable Awnings", files: ["Awning extending - 10s.mp4"] },
        { name: "Outdoor Kitchens", files: ["Outdoor kitchen walkthrough.mp4"] },
      ],
    },
    {
      name: "Print",
      description: "Print-ready files. Order these through the Zinga's print store, or send them to your local printer or sign shop.",
      folders: [
        { name: "Door Hangers", files: ["Door Hanger - Outdoor.pdf", "Door Hanger - Indoor.pdf"] },
        { name: "Yard Signs", files: ["Yard Sign 18x24 - Installed by Zingas.pdf"] },
        { name: "Business Cards", files: ["Business Card.pdf"] },
        { name: "Brochures & Catalogs", files: ["Zingas Outdoor Catalog 2026.pdf"] },
        { name: "Vehicle Wraps", files: ["Transit Van Wrap - Proof.pdf", "Transit Van Wrap.ai"] },
        { name: "Home Shows & Events", files: ["Home Show Banner 8ft.pdf", "Home Show Table Throw.pdf"] },
      ],
    },
    {
      name: "Social Media",
      description: "Ready-to-post graphics and captions, organized by month.",
      folders: [{ name: "November 2026", files: ["Nov - Patio season extended.png", "Nov captions.gdoc"] }],
    },
    {
      name: "Templates",
      description: "Editable templates for print, social posts, emails and presentations. Add your territory details and keep everything else as designed.",
      folders: [
        { name: "Print Templates", files: ["Door Hanger - Outdoor.indd", "Business Card Template.ai"] },
        { name: "Social Media Templates", files: ["Before and after post.png", "Review spotlight post.png"] },
        { name: "Email Templates", files: ["Post-consultation follow up.gdoc", "Review request.gdoc"] },
        { name: "Presentations" },
      ],
    },
  ],
};

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  mp4: "video/mp4",
  mov: "video/quicktime",
  eps: "application/postscript",
  ai: "application/illustrator",
  indd: "application/octet-stream",
  otf: "font/otf",
  gdoc: "application/vnd.google-apps.document",
};

function build(): HubIndex {
  const folders: Record<string, Folder> = {};
  const assets: Record<string, Asset> = {};
  let n = 0;
  const base = Date.parse("2026-10-28T15:00:00Z");

  const walk = (node: Tree, parentId: string | null): string => {
    const id = parentId ? `demo-folder-${++n}` : "demo-root";
    const folder: Folder = { id, name: node.name, description: node.description, parentId, folderIds: [], assetIds: [], totalAssets: 0 };
    folders[id] = folder;
    for (const file of node.files ?? []) {
      const assetId = `demo-file-${++n}`;
      const rawExt = extensionOf(file);
      const name = rawExt === "gdoc" ? file.slice(0, -5) : file;
      const ext = extensionOf(name);
      const mimeType = MIME[rawExt] ?? "application/octet-stream";
      const kind = kindOf(mimeType, ext);
      // Spread dates around so "Recently added" shows a mix of folders.
      const created = new Date(base - ((n * 37) % 61) * 26 * 3600 * 1000).toISOString();
      assets[assetId] = {
        id: assetId,
        name,
        kind,
        mimeType,
        ext,
        size: kind === "video" ? 48_000_000 + n * 1_300_000 : kind === "image" ? 2_400_000 + n * 91_000 : 380_000 + n * 23_000,
        createdTime: created,
        modifiedTime: created,
        folderId: id,
        width: kind === "image" || kind === "video" ? 3840 : undefined,
        height: kind === "image" || kind === "video" ? 2560 : undefined,
        durationMs: kind === "video" ? 15_000 + (n % 4) * 15_000 : undefined,
        thumbnailLink: kind === "font" ? undefined : "demo",
        googleNative: rawExt === "gdoc",
      };
      folder.assetIds.push(assetId);
    }
    for (const child of node.folders ?? []) folder.folderIds.push(walk(child, id));
    folder.totalAssets = folder.assetIds.length + folder.folderIds.reduce((s, f) => s + folders[f].totalAssets, 0);
    return id;
  };

  walk(tree, null);
  return { rootId: "demo-root", folders, assets, builtAt: base };
}

export const demoIndex = build();

export const demoSettings: HubSettings = {
  links: [
    {
      section: "Order & shop",
      title: "Order print",
      description: "Door hangers, yard signs, business cards and other marketing material, through the Zinga's Vistaprint store.",
      url: "https://zingas.ourproshop.com",
      buttonLabel: "Open the print store",
    },
    {
      section: "Order & shop",
      title: "Shop apparel",
      description: "Branded apparel and merchandise for your team, home shows and events.",
      url: "https://zingas.istoremerch.com/index.jsf",
      buttonLabel: "Open the merch store",
    },
  ],
  announcements: [
    {
      date: "2026-10-27",
      title: "Fall outdoor catalog is live",
      message: "The 2026 outdoor catalog is in Print → Brochures & Catalogs and in the print store.",
    },
    {
      date: "2026-10-20",
      title: "November social posts are ready",
      message: "Two posts and captions for November are in Social Media. Post the patio one first.",
    },
    {
      date: "2026-10-06",
      title: "New Florida job photos",
      message: "New louvered pergola and screen photos from the Vero Beach shoot are in Photos.",
    },
  ],
  users: [],
};
