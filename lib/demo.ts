// Sample content for running the hub without Google credentials (HUB_DEMO=1).
// The folders mirror the real "Marketing Hub" folder in Drive; the files are made up.
import { extensionOf, kindOf } from "./assets";
import { parseScripts } from "./scripts-parse";
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

/** Starter scripts, in the same shape as rows on the Scripts tab of the settings sheet. */
export const SAMPLE_SCRIPT_ROWS: string[][] = [
  [
    "2026-11",
    "Ready before the guests arrive",
    "Thanksgiving's coming, and a lot of you will end up out on the patio.\nHere's what usually goes wrong. The afternoon sun lands on one end of the table, and by five the bugs find you.\nThis is a louvered pergola with motorized screens. The louvers angle for shade in the afternoon. The screens come down when the light drops.\nSame patio. Everyone stays outside.",
    "Film vertical, with the phone steady or on a tripod.\nOpen on a wide shot of the patio, with the table set if you can.\nClose-up of the louvers rotating. Hold the shot for the whole movement.\nThe screens coming down. Hold until they stop.\nGet the homeowner's OK before filming their home.",
    "30 seconds",
  ],
  [
    "2026-11",
    "Three questions we ask in every consultation",
    "I'm [your name] with Zinga's of [your territory]. Every consultation I do starts with the same three questions.\nOne: when are you in this room, and where does the light bother you?\nTwo: who can see in, and when does that matter?\nThree: what are you tired of doing by hand?\nYour answers decide the fabric, the control, and whether motorization is worth it. The product comes last.",
    "Talk straight to the camera, phone at eye level.\nFace a window so the light is on your face, not behind you.\nPick a quiet room.\nDo two or three takes and upload them all.",
    "45 seconds",
  ],
  [
    "2026-11",
    "Install day in 20 seconds",
    "No voiceover. These lines go on screen:\nMorning: an empty patio.\nMidday: posts set, louvers going on.\nEvening: shade where they need it.",
    "Before the crew starts, set your phone on a tripod in a corner of the yard and start a time-lapse.\nGrab three or four short close-ups of the crew working. Ask them first.\nEnd on the homeowner using the space.\nUpload the time-lapse and each close-up as separate files.",
    "15 to 20 seconds",
  ],
  [
    "2026-11",
    "Afternoon glare, fixed",
    "This is four o'clock in a west-facing family room. You can't see the TV, and the floor is fading.\nThese are solar shades. Same view, without the glare.\nBetter light, less glare.",
    "Film the before and the after at the same time of day, from the same spot.\nTap and hold on the window to lock the exposure so the view doesn't wash out.\nStart on the glare on the TV or floor, then pan to the window.\nUpload the before and after as separate clips.",
    "20 seconds",
  ],
  [
    "2026-12",
    "Cool evenings, still outside",
    "Cool evenings are the best part of the year, until the wind picks up.\nThis patio has clear vinyl enclosures. They roll down when it's breezy and hold the heater's warmth where you're sitting.\nYou keep the view, and you stay out longer.",
    "Film at dusk.\nWide shot of the patio with the enclosures up, then rolling down.\nClose-up of people at the table or the heater, if the homeowner is happy to be on camera.",
    "30 seconds",
  ],
  [
    "2026-12",
    "Why we measure twice",
    "Every window gets measured twice: once at the consultation, and again before we order.\nWindows aren't square, even in new homes. A quarter inch is the difference between a clean fit and a strip of light down the side.\nSo we check. Then we make it.",
    "Close-ups of the tape measure on the window frame and the measurement being written down.\nThen say the lines to camera.\nIf you have a finished install with a tight fit, add a close-up of the edge.",
    "30 seconds",
  ],
  [
    "2026-12",
    "Our favorite install this year",
    "My favorite install this year was [the project].\nThe problem was [glare, heat, bugs or privacy].\nHere's what we did: [the products].\nAnd here's what changed: [how they use the space now].",
    "Pick a project you have good photos or video of.\nFilm yourself telling the story in one take, under a minute.\nUpload the project photos and clips too.",
    "45 to 60 seconds",
  ],
];

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
  users: [
    { email: "demo@zingashome.com", name: "Alex Rivera", location: "Vero Beach, FL", role: "admin" },
    { email: "owner.nashville@example.com", name: "Sam Carter", location: "Nashville, TN", role: "franchisee" },
    { email: "owner.omaha@example.com", name: "Jordan Lee", location: "Omaha, NE", role: "franchisee" },
  ],
  scripts: parseScripts(SAMPLE_SCRIPT_ROWS),
};
