// Sample content for running the hub without Google credentials (HUB_DEMO=1).
// The folder names mirror the real "Marketing Material" folders in Drive.
import { extensionOf, kindOf } from "./assets";
import type { Asset, Folder, HubIndex, HubSettings } from "./types";

type Tree = { name: string; description?: string; files?: string[]; folders?: Tree[] };

const tree: Tree = {
  name: "Zinga's Franchise Marketing Hub",
  folders: [
    {
      name: "Logos & Brand",
      description: "Approved logo lockups in every format, plus brand fonts and the full brand guide.",
      files: [
        "Zingas Logo Horizontal Lockup-Black.png",
        "Zingas Logo Horizontal Lockup-White.png",
        "Zingas Logo Horizontal Lockup-Gold.png",
        "Zingas Logo Horizontal Lockup.svg",
        "Zingas Logo Horizontal Lockup.eps",
        "Zingas Logo Horizontal Lockup.ai",
        "Zingas Logo Vertical Lockup-Black.png",
        "Zingas Logo Vertical Lockup-White.png",
        "Zingas Logo Vertical Lockup.eps",
        "Zingas Brand & Usage Guide.pdf",
        "email-signature.png",
      ],
      folders: [{ name: "Fonts", files: ["Essonnes Display Bold.otf", "Essonnes Display Regular.otf", "Alfabet Black.otf"] }],
    },
    {
      name: "Job Photos",
      description: "Finished installs by product line. Use these on social, your Google Business Profile and print.",
      folders: [
        { name: "Pergolas", files: ["Vero Beach louvered pergola - dusk.jpg", "Azenco R-Blade poolside.jpg", "ZLouver kit backyard - morning.jpg", "Pergola with motorized screens.jpg", "Covered outdoor kitchen.jpg"] },
        { name: "Motorized Screens", files: ["Lanai screens half down.jpg", "Screens closed at sunset.jpg", "Patio screen detail.jpg", "Restaurant patio enclosure.jpg"] },
        { name: "Retractable Awnings", files: ["Awning extended over deck.jpg", "Awning retracted.jpg", "Second-story awning.jpg"] },
        { name: "Window Treatments", files: ["Living room roller shades.jpg", "Plantation shutters - bedroom.jpg", "Motorized drapes - great room.jpg", "Woven wood shades.jpg"] },
      ],
    },
    {
      name: "Video",
      description: "Finished spots and raw b-roll from the January shoots.",
      files: ["Expertly Shaded - 30s spot.mp4", "Pergola time-lapse.mp4", "Motorized screens demo - 15s.mp4"],
      folders: [{ name: "Raw Footage", files: ["Florida shoot - drone pass 01.mov", "Florida shoot - install crew.mov"] }],
    },
    {
      name: "Print",
      description: "Print-ready files. Order through the Vistaprint store, or send these to your local printer.",
      folders: [
        { name: "Door Hangers", files: ["Door Hanger - Outdoor.pdf", "Door Hanger - Indoor.pdf", "Door Hanger - Outdoor.indd"] },
        { name: "Yard Signs", files: ["Yard Sign 18x24 - Installed by Zingas.pdf"] },
        { name: "Business Cards", files: ["Business Card Template.pdf", "Business Card Template.ai"] },
        { name: "Vehicle Wrap", files: ["Transit Van Wrap - Proof.pdf", "Transit Van Wrap.ai"] },
        { name: "Catalog", files: ["Zingas Outdoor Catalog 2026.pdf", "Zingas Indoor Catalog 2026.pdf"] },
        { name: "Home Show", files: ["Home Show Banner 8ft.pdf", "Home Show Table Throw.pdf"] },
      ],
    },
    {
      name: "Social Media",
      description: "Ready-to-post graphics and captions, organized by month.",
      folders: [
        { name: "November 2026", files: ["Nov - Patio season extended.png", "Nov - Holiday hosting.png", "Nov captions.gdoc"] },
        { name: "December 2026", files: ["Dec - Gift of shade.png", "Dec captions.gdoc"] },
      ],
    },
    {
      name: "Email Templates",
      description: "Follow-up and nurture emails to copy into your email tool.",
      files: ["Post-consultation follow up.gdoc", "Review request.gdoc", "Spring outdoor season.gdoc"],
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
      description: "Door hangers, yard signs, business cards and brochures, pre-loaded with approved designs. Add your territory phone number at checkout.",
      url: "https://www.vistaprint.com/",
      buttonLabel: "Open the Vistaprint store",
    },
    {
      section: "Order & shop",
      title: "Shop apparel",
      description: "Polos, hats and jackets for your crew, plus branded giveaways for home shows.",
      url: "https://example.com/zingas-merch",
      buttonLabel: "Open the merch store",
    },
    {
      section: "Approved vendors",
      title: "Vehicle wraps",
      description: "Use the Transit Van Wrap file in Print → Vehicle Wrap. Ask corporate for the installer list in your area.",
      url: "mailto:marketing@zingashome.com?subject=Vehicle%20wrap%20vendors",
      buttonLabel: "Email marketing",
    },
    {
      section: "Get help",
      title: "Request a design",
      description: "Need something that isn't in the library, like a sponsorship banner or local event flyer? Send a request and the marketing team will build it.",
      url: "https://forms.google.com/",
      buttonLabel: "Send a design request",
    },
  ],
  announcements: [
    {
      date: "2026-10-27",
      title: "Fall outdoor catalog is live",
      message: "The 2026 outdoor catalog is in Print → Catalog and loaded in the Vistaprint store.",
    },
    {
      date: "2026-10-20",
      title: "November social posts are ready",
      message: "Two posts and captions for November are in Social Media. Post the patio one first.",
    },
    {
      date: "2026-10-06",
      title: "New Florida job photos",
      message: "Fourteen new pergola and screen photos from the Vero Beach shoot.",
    },
  ],
  users: [],
};
