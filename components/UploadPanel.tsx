"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { formatBytes, formatDate } from "@/lib/assets";
import type { Upload } from "@/lib/types";

// Chunk sizes must be multiples of 256 KB for Google's resumable uploads.
const DIRECT_CHUNK = 64 * 256 * 1024; // 16 MB, straight to Google
const RELAY_CHUNK = 16 * 256 * 1024; // 4 MB, under Vercel's 4.5 MB request limit
const RETRY_DELAYS = [1000, 3000, 8000];

// Once a direct upload fails in this tab (e.g. the browser blocks it), use the relay from then on.
let relayOnly = false;

class NetworkError extends Error {}

interface Sent {
  done: boolean;
  nextOffset: number;
}

function put(url: string, body: Blob | null, headers: Record<string, string>, onProgress: (loaded: number) => void) {
  return new Promise<{ status: number; range: string | null; text: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () => resolve({ status: xhr.status, range: xhr.getResponseHeader("Range"), text: xhr.responseText });
    xhr.onerror = () => reject(new NetworkError("Network error"));
    xhr.send(body);
  });
}

async function sendDirect(url: string, blob: Blob, range: string, onProgress: (n: number) => void): Promise<Sent> {
  const total = Number(range.split("/")[1]);
  const end = Number(range.match(/-(\d+)\//)![1]);
  const res = await put(url, blob, { "Content-Range": range }, onProgress);
  if (res.status === 200 || res.status === 201) return { done: true, nextOffset: total };
  if (res.status === 308) {
    // Google may not expose the Range header to the browser; full 256 KB-multiple chunks are kept whole.
    const got = res.range?.match(/bytes=0-(\d+)/);
    return { done: false, nextOffset: got ? Number(got[1]) + 1 : end + 1 };
  }
  throw new NetworkError(`Google returned ${res.status}`);
}

async function sendRelay(token: string, blob: Blob | null, range: string, onProgress: (n: number) => void): Promise<Sent> {
  const res = await put("/api/social/uploads/chunk", blob, { "x-upload-token": token, "x-content-range": range }, onProgress);
  const body = JSON.parse(res.text || "{}");
  if (res.status !== 200) throw new Error(body.error ?? `Upload failed (${res.status})`);
  return body as Sent;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MAX_BYTES = 10 * 1024 ** 3;
const MEDIA_EXTENSIONS = /\.(mp4|mov|m4v|avi|webm|mkv|3gp|mts|jpe?g|png|heic|heif|webp)$/i;
const isMedia = (file: File) => /^(video|image)\//.test(file.type) || MEDIA_EXTENSIONS.test(file.name);

/** Uploads one file in chunks, retrying each chunk a few times before giving up. */
async function uploadFile(file: File, start: { uploadUrl: string | null; token: string }, onProgress: (sent: number) => void) {
  let direct = Boolean(start.uploadUrl) && !relayOnly;
  let offset = 0;
  let attempt = 0;
  while (offset < file.size) {
    const size = direct ? DIRECT_CHUNK : RELAY_CHUNK;
    const end = Math.min(offset + size, file.size) - 1;
    const range = `bytes ${offset}-${end}/${file.size}`;
    const blob = file.slice(offset, end + 1);
    const base = offset;
    try {
      const sent = direct
        ? await sendDirect(start.uploadUrl!, blob, range, (n) => onProgress(base + n))
        : await sendRelay(start.token, blob, range, (n) => onProgress(base + n));
      offset = sent.nextOffset;
      attempt = 0;
      onProgress(offset);
      if (sent.done) return;
    } catch (error) {
      if (direct) {
        // Switch to the relay and ask Google how much it already has.
        direct = false;
        relayOnly = true;
        if (offset > 0) offset = (await sendRelay(start.token, null, `bytes */${file.size}`, () => {})).nextOffset;
        continue;
      }
      if (attempt >= RETRY_DELAYS.length) throw error;
      await wait(RETRY_DELAYS[attempt++]);
      offset = (await sendRelay(start.token, null, `bytes */${file.size}`, () => {})).nextOffset;
    }
  }
}

interface QueueItem {
  key: string;
  file: File;
  sent: number;
  status: "waiting" | "uploading" | "done" | "failed";
  error?: string;
}

interface Props {
  month: string;
  scriptId: string;
  scriptTitle: string;
  location: string;
  initialFiles: Upload[];
}

export function UploadPanel({ month, scriptId, scriptTitle, location, initialFiles }: Props) {
  const [files, setFiles] = useState(initialFiles);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const inputId = useId();
  const busy = useRef(false);

  const params = new URLSearchParams({ month, script: scriptId, location }).toString();

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/social/uploads?${params}`, { cache: "no-store" });
    if (res.ok) setFiles((await res.json()).files);
  }, [params]);

  const update = (key: string, patch: Partial<QueueItem>) => setQueue((q) => q.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  // Work through the queue one file at a time.
  useEffect(() => {
    const next = queue.find((item) => item.status === "waiting");
    if (!next || busy.current) return;
    busy.current = true;
    update(next.key, { status: "uploading", sent: 0 });
    (async () => {
      try {
        const res = await fetch("/api/social/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ month, script: scriptId, location, name: next.file.name, size: next.file.size, type: next.file.type }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Couldn't start the upload.");
        await uploadFile(next.file, body, (sent) => update(next.key, { sent }));
        await refresh();
        update(next.key, { status: "done", sent: next.file.size });
      } catch (error) {
        update(next.key, { status: "failed", error: error instanceof Error ? error.message : "Upload failed." });
      } finally {
        busy.current = false;
        setQueue((q) => [...q]); // nudge the effect to pick up the next file
      }
    })();
  }, [queue, month, scriptId, location, refresh]);

  // Warn before leaving the page mid-upload.
  const uploading = queue.some((item) => item.status === "uploading" || item.status === "waiting");
  useEffect(() => {
    if (!uploading) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [uploading]);

  const add = (list: FileList | null) => {
    if (!list?.length) return;
    const all = Array.from(list);
    const ok = all.filter((f) => isMedia(f) && f.size > 0 && f.size <= MAX_BYTES);
    const skipped = all.filter((f) => !ok.includes(f));
    setNotice(
      skipped.length
        ? `Skipped ${skipped.map((f) => f.name).join(", ")}: only videos and photos up to 10 GB can be uploaded.`
        : null,
    );
    const items = ok.map((file, i) => ({ key: `${Date.now()}-${i}-${file.name}`, file, sent: 0, status: "waiting" as const }));
    setQueue((q) => [...q.filter((item) => item.status !== "done"), ...items]);
  };

  const retry = (key: string) => update(key, { status: "waiting", error: undefined, sent: 0 });

  const remove = async (file: Upload) => {
    if (!window.confirm(`Remove ${file.name}? It goes to the trash in Google Drive.`)) return;
    const res = await fetch(`/api/social/uploads?${params}&file=${encodeURIComponent(file.id)}`, { method: "DELETE" });
    if (res.ok) {
      setFiles((list) => list.filter((f) => f.id !== file.id));
      setNotice(`Removed ${file.name}.`);
    } else {
      setNotice((await res.json().catch(() => ({}))).error ?? "Couldn't remove that file.");
    }
  };

  return (
    <div className="upload-panel">
      <h3>
        Your clips <span className="count">{files.length || ""}</span>
      </h3>

      <div
        className={`dropzone${dragging ? " dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
      >
        <input
          id={inputId}
          type="file"
          multiple
          accept="video/*,image/*"
          className="visually-hidden"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
        <label htmlFor={inputId} className="button gold">
          Upload videos
        </label>
        <p>
          <span className="drop-hint">or drag them here. </span>Add as many takes as you like, up to 10 GB each.
        </p>
      </div>

      {queue.length > 0 && (
        <ul className="upload-queue" aria-label={`Uploading for ${scriptTitle}`}>
          {queue.map((item) => {
            const pct = Math.round((item.sent / item.file.size) * 100);
            return (
              <li key={item.key} className={`upload-item ${item.status}`}>
                <div className="upload-row">
                  <span className="upload-name">{item.file.name}</span>
                  <span className="upload-status" aria-live="polite">
                    {item.status === "waiting" && "Waiting"}
                    {item.status === "uploading" && `${pct}%`}
                    {item.status === "done" && "Uploaded"}
                    {item.status === "failed" && (
                      <button type="button" className="link-button" onClick={() => retry(item.key)}>
                        Try again
                      </button>
                    )}
                  </span>
                </div>
                {item.status === "failed" ? (
                  <p className="upload-error">{item.error}</p>
                ) : (
                  <progress max={item.file.size} value={item.sent}>
                    {pct}%
                  </progress>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {notice && (
        <p className="upload-notice" role="status">
          {notice}
        </p>
      )}

      {files.length > 0 ? (
        <ul className="uploaded">
          {files.map((f) => (
            <li key={f.id}>
              <span className="uploaded-name">{f.name}</span>
              <span className="uploaded-meta">
                {[formatBytes(f.size), formatDate(f.createdTime), f.uploadedBy].filter(Boolean).join(", ")}
              </span>
              <button type="button" className="link-button" onClick={() => remove(f)} aria-label={`Remove ${f.name}`}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        queue.length === 0 && <p className="muted uploaded-empty">Nothing uploaded for this script yet.</p>
      )}
    </div>
  );
}
