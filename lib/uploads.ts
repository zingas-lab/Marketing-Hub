import "server-only";
import { randomUUID } from "node:crypto";
import { config, isDemo } from "./config";
import { googleFetch, googleJson } from "./google";
import { monthFolderName, slugify } from "./months";
import type { Script, Upload } from "./types";

// Franchisee uploads live in a Shared Drive, one folder per location:
//   <uploads Shared Drive>/<Location>/<2026-11 November>/<Script title>/<files>
// Each location folder is shared with that location's people, so it also appears in
// their own Google Drive and they can add files from the Drive app.

const FOLDER = "application/vnd.google-apps.folder";
const API = "https://www.googleapis.com/drive/v3/files";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3/files";
const ALL_DRIVES = "supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives";
const JSON_HEADERS = { "Content-Type": "application/json; charset=UTF-8" };

export const MAX_UPLOAD_BYTES = 10 * 1024 ** 3;
const MEDIA_EXTENSIONS = /\.(mp4|mov|m4v|avi|webm|mkv|3gp|mts|jpe?g|png|heic|heif|webp)$/i;

export function uploadsEnabled() {
  return isDemo || Boolean(config.uploadsFolderId);
}

/** Videos and photos only. Phones sometimes send no type for .mov files, so the extension counts too. */
export function isMediaFile(name: string, type: string) {
  return /^(video|image)\//.test(type) || MEDIA_EXTENSIONS.test(name);
}

export function driveFolderLink(id: string) {
  return isDemo ? null : `https://drive.google.com/drive/folders/${id}`;
}

function safeName(text: string) {
  return text.replace(/[/\\]/g, "-").replace(/\s+/g, " ").trim().slice(0, 120) || "Untitled";
}

/** Two scripts with the same title in one month get "(2)" on the second folder. */
export function scriptFolderName(script: Script) {
  const suffix = script.id.slice(slugify(script.title).length).match(/^-(\d+)$/)?.[1];
  return safeName(suffix ? `${script.title} (${suffix})` : script.title);
}

function quote(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

// ---- Demo mode: an in-memory stand-in for Drive --------------------------------

interface DemoSession {
  folderId: string;
  name: string;
  size: number;
  mimeType: string;
  received: number;
  uploadedBy: string;
}

const demo = {
  files: new Map<string, Upload[]>(),
  sessions: new Map<string, DemoSession>(),
};

// ---- Folders ---------------------------------------------------------------------

const FOLDER_CACHE_MS = 10 * 60 * 1000;
const folderCache = new Map<string, { at: number; id: Promise<string> }>();

/** Finds a folder by name under a parent, creating it if needed. Concurrent calls share one lookup. */
async function folderIn(parentId: string, name: string): Promise<string> {
  const key = `${parentId}/${name}`;
  const hit = folderCache.get(key);
  if (hit && Date.now() - hit.at < FOLDER_CACHE_MS) return hit.id;

  const id = (async () => {
    if (isDemo) return `demo-${slugify(key)}`;
    const q = `'${parentId}' in parents and name = '${quote(name)}' and mimeType = '${FOLDER}' and trashed = false`;
    const found = await googleJson<{ files: { id: string }[] }>(
      `${API}?q=${encodeURIComponent(q)}&fields=files(id)&orderBy=createdTime&${ALL_DRIVES}`,
      {},
      "write",
    );
    if (found.files[0]) return found.files[0].id;
    const created = await googleJson<{ id: string }>(
      `${API}?supportsAllDrives=true&fields=id`,
      { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ name, mimeType: FOLDER, parents: [parentId] }) },
      "write",
    );
    return created.id;
  })();
  folderCache.set(key, { at: Date.now(), id });
  id.catch(() => folderCache.delete(key));
  return id;
}

const sharedAlready = new Set<string>();

/** Gives each person at the location edit access to its folder. Failures are logged, not fatal. */
async function shareFolder(folderId: string, emails: string[]) {
  if (isDemo || !config.shareUploadFolders || !emails.length) return;
  const key = `${folderId}:${[...emails].sort().join(",")}`;
  if (sharedAlready.has(key)) return;

  const existing = await googleJson<{ permissions: { emailAddress?: string }[] }>(
    `${API}/${folderId}/permissions?supportsAllDrives=true&fields=permissions(emailAddress)&pageSize=100`,
    {},
    "write",
  );
  const have = new Set(existing.permissions.map((p) => p.emailAddress?.toLowerCase()));
  for (const email of emails.filter((e) => !have.has(e))) {
    const res = await googleFetch(
      `${API}/${folderId}/permissions?supportsAllDrives=true&sendNotificationEmail=false`,
      { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ type: "user", role: "writer", emailAddress: email }) },
      "write",
    );
    if (!res.ok) console.warn(`Couldn't share upload folder ${folderId} with ${email}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
  sharedAlready.add(key);
}

export interface UploadFolders {
  locationFolderId: string;
  monthFolderId: string;
  /** Keyed by script id. */
  scriptFolderIds: Record<string, string>;
}

/** Makes sure the location, month and script folders exist, and that the location's people can open them. */
export async function ensureFolders(location: string, month: string, scripts: Script[], shareWith: string[]): Promise<UploadFolders> {
  const root = isDemo ? "demo-uploads" : config.uploadsFolderId;
  if (!root) throw new Error("HUB_UPLOADS_FOLDER_ID is not set. See README → Social media uploads.");

  const locationFolderId = await folderIn(root, safeName(location));
  await shareFolder(locationFolderId, shareWith).catch((error) => console.warn("Sharing the upload folder failed:", error));
  const monthFolderId = await folderIn(locationFolderId, monthFolderName(month));
  const ids = await Promise.all(scripts.map((s) => folderIn(monthFolderId, scriptFolderName(s))));
  return { locationFolderId, monthFolderId, scriptFolderIds: Object.fromEntries(scripts.map((s, i) => [s.id, ids[i]])) };
}

// ---- Files -----------------------------------------------------------------------

export async function listUploads(folderId: string): Promise<Upload[]> {
  if (isDemo) return demo.files.get(folderId) ?? [];
  const q = `'${folderId}' in parents and trashed = false and mimeType != '${FOLDER}'`;
  const data = await googleJson<{
    files: { id: string; name: string; size?: string; mimeType: string; createdTime: string; appProperties?: Record<string, string> }[];
  }>(
    `${API}?q=${encodeURIComponent(q)}&fields=files(id,name,size,mimeType,createdTime,appProperties)&orderBy=createdTime desc&pageSize=200&${ALL_DRIVES}`,
    {},
    "write",
  );
  return data.files.map((f) => ({
    id: f.id,
    name: f.name,
    size: f.size ? Number(f.size) : null,
    mimeType: f.mimeType,
    createdTime: f.createdTime,
    uploadedBy: f.appProperties?.hubUploader,
  }));
}

/**
 * Starts a resumable upload into a script folder and returns the session URL that the
 * file's bytes are sent to. Sending `Origin` lets the browser upload straight to Google;
 * if the browser can't, it falls back to sending chunks through the hub.
 */
export async function startUpload(
  folderId: string,
  file: { name: string; size: number; type: string },
  uploader: { email: string; name: string },
  origin: string | null,
): Promise<string> {
  if (isDemo) {
    const id = randomUUID();
    demo.sessions.set(id, { folderId, name: file.name, size: file.size, mimeType: file.type, received: 0, uploadedBy: uploader.name });
    return `demo:${id}`;
  }
  const headers: Record<string, string> = {
    ...JSON_HEADERS,
    "X-Upload-Content-Type": file.type || "application/octet-stream",
    "X-Upload-Content-Length": String(file.size),
  };
  if (origin) headers.Origin = origin;
  const res = await googleFetch(
    `${UPLOAD_API}?uploadType=resumable&supportsAllDrives=true&fields=id,name`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: file.name,
        parents: [folderId],
        description: `Uploaded by ${uploader.name} (${uploader.email}) through the Marketing Hub.`,
        // appProperties keys plus values are limited to 124 bytes each.
        appProperties: { hubUploader: uploader.name.slice(0, 100), hubUploaderEmail: uploader.email.slice(0, 100) },
      }),
    },
    "write",
  );
  const sessionUrl = res.headers.get("Location");
  if (!res.ok || !sessionUrl) {
    throw new Error(`Google Drive didn't start the upload (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
  return sessionUrl;
}

export interface ChunkResult {
  done: boolean;
  /** Where the next chunk should start. */
  nextOffset: number;
}

/**
 * Sends one chunk of a resumable upload. `contentRange` is "bytes start-end/total".
 * "bytes *\/total" with an empty body asks how much Google has received, for resuming after an error.
 */
export async function sendChunk(sessionUrl: string, chunk: ArrayBuffer, contentRange: string): Promise<ChunkResult> {
  const status = contentRange.match(/^bytes \*\/(\d+)$/);
  if (status) {
    if (isDemo) {
      const session = demo.sessions.get(sessionUrl.slice("demo:".length));
      return session ? { done: false, nextOffset: session.received } : { done: true, nextOffset: Number(status[1]) };
    }
    const res = await fetch(sessionUrl, { method: "PUT", headers: { "Content-Range": contentRange }, redirect: "manual", cache: "no-store" });
    if (res.status === 200 || res.status === 201) return { done: true, nextOffset: Number(status[1]) };
    if (res.status !== 308) throw new Error(`Google Drive couldn't report upload progress (${res.status})`);
    const received = res.headers.get("Range")?.match(/bytes=0-(\d+)/);
    return { done: false, nextOffset: received ? Number(received[1]) + 1 : 0 };
  }

  const range = contentRange.match(/^bytes (\d+)-(\d+)\/(\d+)$/);
  if (!range) throw new Error("Bad Content-Range");
  const [start, end, total] = range.slice(1).map(Number);
  if (end - start + 1 !== chunk.byteLength) throw new Error("Chunk size doesn't match its Content-Range");

  if (isDemo) {
    const session = demo.sessions.get(sessionUrl.slice("demo:".length));
    if (!session || session.received !== start || session.size !== total) throw new Error("Unknown or out-of-order upload");
    session.received = end + 1;
    if (session.received < total) return { done: false, nextOffset: session.received };
    const list = demo.files.get(session.folderId) ?? [];
    list.unshift({ id: randomUUID(), name: session.name, size: total, mimeType: session.mimeType, createdTime: new Date().toISOString(), uploadedBy: session.uploadedBy });
    demo.files.set(session.folderId, list);
    demo.sessions.delete(sessionUrl.slice("demo:".length));
    return { done: true, nextOffset: total };
  }

  // 308 means "keep going" here, not a redirect, so don't let fetch follow it.
  const res = await fetch(sessionUrl, { method: "PUT", headers: { "Content-Range": contentRange }, body: chunk, redirect: "manual", cache: "no-store" });
  if (res.status === 200 || res.status === 201) return { done: true, nextOffset: total };
  if (res.status === 308) {
    const received = res.headers.get("Range")?.match(/bytes=0-(\d+)/);
    return { done: false, nextOffset: received ? Number(received[1]) + 1 : 0 };
  }
  throw new Error(`Google Drive rejected the chunk (${res.status}): ${(await res.text()).slice(0, 200)}`);
}

/** Moves an upload to the trash, but only if it's in the expected script folder. */
export async function trashUpload(fileId: string, folderId: string): Promise<boolean> {
  if (isDemo) {
    const list = demo.files.get(folderId) ?? [];
    const next = list.filter((f) => f.id !== fileId);
    demo.files.set(folderId, next);
    return next.length !== list.length;
  }
  const file = await googleJson<{ parents?: string[] }>(`${API}/${encodeURIComponent(fileId)}?fields=parents&supportsAllDrives=true`, {}, "write").catch(() => null);
  if (!file?.parents?.includes(folderId)) return false;
  const res = await googleFetch(
    `${API}/${encodeURIComponent(fileId)}?supportsAllDrives=true`,
    { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify({ trashed: true }) },
    "write",
  );
  return res.ok;
}
