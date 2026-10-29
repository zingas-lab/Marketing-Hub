import "server-only";
import { extensionOf, kindOf } from "./assets";
import { config, isDemo } from "./config";
import { demoIndex } from "./demo";
import { googleFetch, googleJson } from "./google";
import type { Asset, Folder, HubIndex } from "./types";

const FOLDER = "application/vnd.google-apps.folder";
const SHORTCUT = "application/vnd.google-apps.shortcut";
const FIELDS =
  "nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,description,thumbnailLink,imageMediaMetadata(width,height),videoMediaMetadata(width,height,durationMillis),shortcutDetails(targetId,targetMimeType))";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  description?: string;
  thumbnailLink?: string;
  imageMediaMetadata?: { width?: number; height?: number };
  videoMediaMetadata?: { width?: number; height?: number; durationMillis?: string };
  shortcutDetails?: { targetId: string; targetMimeType: string };
}

const API = "https://www.googleapis.com/drive/v3/files";

async function listChildren(folderId: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: FIELDS,
      pageSize: "1000",
      orderBy: "folder,name_natural",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const page = await googleJson<{ files: DriveFile[]; nextPageToken?: string }>(`${API}?${params}`);
    files.push(...page.files);
    pageToken = page.nextPageToken;
  } while (pageToken);
  return files;
}

async function getFile(id: string): Promise<DriveFile> {
  const fields = FIELDS.replace(/^nextPageToken,files\((.*)\)$/, "$1");
  return googleJson<DriveFile>(`${API}/${id}?fields=${encodeURIComponent(fields)}&supportsAllDrives=true`);
}

/** Names starting with "_" or "." stay in Drive but are hidden from the hub (drafts, working files). */
function isHidden(name: string) {
  return name.startsWith("_") || name.startsWith(".");
}

function toAsset(file: DriveFile, folderId: string, name = file.name): Asset {
  const ext = extensionOf(name);
  const video = file.videoMediaMetadata;
  return {
    id: file.id,
    name,
    kind: kindOf(file.mimeType, ext),
    mimeType: file.mimeType,
    ext,
    size: file.size ? Number(file.size) : null,
    createdTime: file.createdTime,
    modifiedTime: file.modifiedTime,
    folderId,
    width: file.imageMediaMetadata?.width ?? video?.width,
    height: file.imageMediaMetadata?.height ?? video?.height,
    durationMs: video?.durationMillis ? Number(video.durationMillis) : undefined,
    description: file.description,
    thumbnailLink: file.thumbnailLink,
    googleNative: file.mimeType.startsWith("application/vnd.google-apps."),
  };
}

/**
 * Walks the hub's root folder and everything under it. Drive shortcuts are followed,
 * so existing folders can be added to the hub without moving them, as long as the
 * service account can read the shortcut's target.
 */
async function buildIndex(rootId: string): Promise<HubIndex> {
  const folders: Record<string, Folder> = {};
  const assets: Record<string, Asset> = {};
  const root = await getFile(rootId);
  folders[rootId] = { id: rootId, name: root.name, description: root.description, parentId: null, folderIds: [], assetIds: [], totalAssets: 0 };

  let queue = [rootId];
  while (queue.length) {
    const next: string[] = [];
    // Breadth-first, a few folders at a time, to stay well inside Drive's rate limits.
    for (let i = 0; i < queue.length; i += 8) {
      await Promise.all(
        queue.slice(i, i + 8).map(async (folderId) => {
          const parent = folders[folderId];
          for (const child of await listChildren(folderId)) {
            if (isHidden(child.name)) continue;
            let file = child;
            if (child.mimeType === SHORTCUT && child.shortcutDetails) {
              try {
                file = { ...(await getFile(child.shortcutDetails.targetId)), name: child.name };
              } catch {
                continue; // Target isn't shared with the service account.
              }
            }
            if (file.mimeType === FOLDER) {
              if (folders[file.id]) continue; // Already reached through another path.
              folders[file.id] = { id: file.id, name: file.name, description: file.description, parentId: folderId, folderIds: [], assetIds: [], totalAssets: 0 };
              parent.folderIds.push(file.id);
              next.push(file.id);
            } else if (!assets[file.id]) {
              assets[file.id] = toAsset(file, folderId, file.name);
              parent.assetIds.push(file.id);
            }
          }
        }),
      );
    }
    queue = next;
  }

  const count = (id: string): number => {
    const folder = folders[id];
    folder.totalAssets = folder.assetIds.length + folder.folderIds.reduce((sum, f) => sum + count(f), 0);
    return folder.totalAssets;
  };
  count(rootId);

  return { rootId, folders, assets, builtAt: Date.now() };
}

let cached: HubIndex | null = null;
let inflight: Promise<HubIndex> | null = null;

export async function getIndex(): Promise<HubIndex> {
  if (isDemo) return demoIndex;
  if (!config.rootFolderId) throw new Error("HUB_DRIVE_FOLDER_ID is not set. See README → Setup.");
  const fresh = cached && Date.now() - cached.builtAt < config.cacheSeconds * 1000;
  if (fresh) return cached!;
  inflight ??= buildIndex(config.rootFolderId)
    .then((index) => (cached = index))
    .finally(() => (inflight = null));
  // Serve the previous copy while a refresh runs, if there is one.
  return cached ?? inflight;
}

// ---- Queries over the index -------------------------------------------------

export function categories(index: HubIndex): Folder[] {
  return index.folders[index.rootId].folderIds.map((id) => index.folders[id]);
}

export function breadcrumbs(index: HubIndex, folderId: string): Folder[] {
  const trail: Folder[] = [];
  let folder: Folder | undefined = index.folders[folderId];
  while (folder && folder.parentId) {
    trail.unshift(folder);
    folder = index.folders[folder.parentId];
  }
  return trail;
}

export function folderPath(index: HubIndex, folderId: string): string {
  return breadcrumbs(index, folderId)
    .map((f) => f.name)
    .join(" / ");
}

function descendants(index: HubIndex, folderId: string): Asset[] {
  const folder = index.folders[folderId];
  return [...folder.assetIds.map((id) => index.assets[id]), ...folder.folderIds.flatMap((id) => descendants(index, id))];
}

/** The first photo in a folder (or anything with a thumbnail) to use as its cover. */
export function coverFor(index: HubIndex, folderId: string): Asset | undefined {
  const all = descendants(index, folderId);
  return all.find((a) => a.kind === "image" && a.thumbnailLink && /jpe?g|heic|webp/.test(a.ext)) ?? all.find((a) => a.thumbnailLink);
}

export function recentAssets(index: HubIndex, limit: number): Asset[] {
  return Object.values(index.assets)
    .sort((a, b) => b.createdTime.localeCompare(a.createdTime))
    .slice(0, limit);
}

export function searchIndex(index: HubIndex, query: string, kind?: string): { assets: Asset[]; folders: Folder[] } {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return { assets: [], folders: [] };
  const matches = (text: string) => terms.every((t) => text.includes(t));

  const folders = Object.values(index.folders).filter((f) => f.parentId && matches(`${f.name} ${f.description ?? ""}`.toLowerCase()));

  const scored = Object.values(index.assets)
    .filter((a) => !kind || a.kind === kind)
    .map((a) => {
      const name = a.name.toLowerCase();
      const haystack = `${name} ${a.description ?? ""} ${folderPath(index, a.folderId)}`.toLowerCase();
      if (!matches(haystack)) return null;
      // Name matches rank above matches that only hit the folder path.
      const score = terms.filter((t) => name.includes(t)).length;
      return { a, score };
    })
    .filter((x): x is { a: Asset; score: number } => x !== null)
    .sort((x, y) => y.score - x.score || x.a.name.localeCompare(y.a.name));

  return { assets: scored.map((x) => x.a), folders };
}

// ---- File content -----------------------------------------------------------

const EXPORT_TYPES: Record<string, string> = {
  "application/vnd.google-apps.drawing": "image/png",
};

/** Streams a file's bytes from Drive. Google Docs, Sheets and Slides are exported as PDF. */
export async function fetchContent(asset: Asset, range?: string | null): Promise<Response> {
  if (asset.googleNative) {
    const mime = EXPORT_TYPES[asset.mimeType] ?? "application/pdf";
    return googleFetch(`${API}/${asset.id}/export?mimeType=${encodeURIComponent(mime)}`);
  }
  const headers: HeadersInit = range ? { Range: range } : {};
  return googleFetch(`${API}/${asset.id}?alt=media&supportsAllDrives=true`, { headers });
}

export async function fetchThumbnail(asset: Asset, size: number): Promise<Response | null> {
  if (!asset.thumbnailLink) return null;
  const url = asset.thumbnailLink.replace(/=s\d+$/, `=s${size}`);
  const res = await googleFetch(url);
  return res.ok ? res : null;
}
