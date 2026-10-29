"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KIND_FILTERS,
  KIND_LABELS,
  displayName,
  downloadName,
  formatBytes,
  formatDate,
  formatDuration,
  isPhotographic,
} from "@/lib/assets";
import type { Asset, AssetKind } from "@/lib/types";

export type GridAsset = Asset & { path?: string };

const thumbUrl = (id: string, size = 400) => `/api/files/${id}/thumbnail?s=${size}`;
const fileUrl = (id: string, inline = false) => `/api/files/${id}/download${inline ? "?inline=1" : ""}`;

function Thumb({ asset, size = 400 }: { asset: GridAsset; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (!asset.thumbnailLink || failed) {
    return <div className="thumb-fallback">{asset.ext.toUpperCase() || KIND_LABELS[asset.kind]}</div>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={thumbUrl(asset.id, size)} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

function metaLine(asset: GridAsset) {
  const parts = [KIND_LABELS[asset.kind]];
  if (asset.ext && asset.kind !== "document") parts[0] = asset.ext.toUpperCase();
  if (asset.durationMs) parts.push(formatDuration(asset.durationMs));
  else if (asset.size) parts.push(formatBytes(asset.size));
  return parts.join(", ");
}

interface Props {
  assets: GridAsset[];
  /** Show the type filter row above the grid. */
  filterable?: boolean;
  /** Stream video and PDFs in the preview. Off in demo mode, where files are placeholders. */
  canStream: boolean;
  /** Show "Open in Drive" in the preview. */
  isAdmin?: boolean;
  initialFileId?: string;
}

export function AssetGrid({ assets, filterable = false, canStream, isAdmin = false, initialFileId }: Props) {
  const [kind, setKind] = useState<AssetKind | null>(null);
  const [openId, setOpenId] = useState<string | null>(initialFileId ?? null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const kinds = useMemo(() => new Set(assets.map((a) => a.kind)), [assets]);
  const visible = useMemo(() => (kind ? assets.filter((a) => a.kind === kind) : assets), [assets, kind]);
  const index = visible.findIndex((a) => a.id === openId);
  const current = index >= 0 ? visible[index] : null;

  // Keep ?file= in the address bar so a preview can be shared as a link.
  const syncUrl = useCallback((id: string | null) => {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("file", id);
    else url.searchParams.delete("file");
    window.history.replaceState(null, "", url);
  }, []);

  const open = (id: string, trigger?: HTMLElement) => {
    returnFocus.current = trigger ?? null;
    setOpenId(id);
    syncUrl(id);
  };

  const close = useCallback(() => {
    setOpenId(null);
    syncUrl(null);
  }, [syncUrl]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (current && !dialog.open) dialog.showModal();
    if (!current && dialog.open) {
      dialog.close();
      returnFocus.current?.focus();
    }
  }, [current]);

  const step = (delta: number) => {
    const next = visible[index + delta];
    if (next) {
      setOpenId(next.id);
      syncUrl(next.id);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  };

  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {filterable && kinds.size > 1 && (
        <div className="toolbar">
          <div className="filters" role="group" aria-label="Filter by type">
            <button type="button" className="filter" aria-pressed={kind === null} onClick={() => setKind(null)}>
              All
            </button>
            {KIND_FILTERS.filter((f) => kinds.has(f.kind)).map((f) => (
              <button key={f.kind} type="button" className="filter" aria-pressed={kind === f.kind} onClick={() => setKind(f.kind)}>
                {f.label}
              </button>
            ))}
          </div>
          <span className="count" aria-live="polite">
            {visible.length} {visible.length === 1 ? "file" : "files"}
          </span>
        </div>
      )}

      <ul className="asset-grid" role="list">
        {visible.map((asset) => (
          <li key={asset.id}>
            <button type="button" className="asset" onClick={(e) => open(asset.id, e.currentTarget)}>
              <span className={`asset-thumb${isPhotographic(asset) ? " photo" : ""}`}>
                <Thumb asset={asset} />
                {asset.kind === "video" && asset.durationMs ? <span className="asset-badge">{formatDuration(asset.durationMs)}</span> : null}
              </span>
              <span className="asset-name">{displayName(asset.name)}</span>
              <span className="asset-meta">{asset.path ?? metaLine(asset)}</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog ref={dialogRef} className="preview" onClose={close} onKeyDown={onKeyDown} aria-labelledby="preview-title">
        {current && (
          <>
            <div className="preview-media">
              <PreviewMedia asset={current} canStream={canStream} />
            </div>
            <div className="preview-info">
              <button type="button" className="preview-close" onClick={close}>
                Close
              </button>
              <h2 id="preview-title">{displayName(current.name)}</h2>
              <dl>
                <dt>Type</dt>
                <dd>
                  {KIND_LABELS[current.kind]}
                  {current.ext ? ` (.${current.ext})` : ""}
                </dd>
                {current.width && current.height ? (
                  <>
                    <dt>Size</dt>
                    <dd>
                      {current.width} × {current.height} px
                    </dd>
                  </>
                ) : null}
                {current.durationMs ? (
                  <>
                    <dt>Length</dt>
                    <dd>{formatDuration(current.durationMs)}</dd>
                  </>
                ) : null}
                {current.size ? (
                  <>
                    <dt>File size</dt>
                    <dd>{formatBytes(current.size)}</dd>
                  </>
                ) : null}
                <dt>Updated</dt>
                <dd>{formatDate(current.modifiedTime)}</dd>
                {current.path ? (
                  <>
                    <dt>Folder</dt>
                    <dd>{current.path}</dd>
                  </>
                ) : null}
              </dl>
              {current.description ? <p>{current.description}</p> : null}
              {current.kind === "design" ? (
                <p className="preview-hint">Opens in Adobe Illustrator or InDesign. Send it to your printer or sign shop as is.</p>
              ) : null}
              {current.googleNative ? <p className="preview-hint">Downloads as a PDF.</p> : null}
              <div className="preview-actions">
                <a className="button gold" href={fileUrl(current.id)} download={downloadName(current)}>
                  Download
                </a>
                <button type="button" className="button secondary" onClick={copyLink}>
                  {copied ? "Link copied" : "Copy link"}
                </button>
                {isAdmin && canStream ? (
                  <a className="button secondary" href={`https://drive.google.com/file/d/${current.id}/view`} target="_blank" rel="noreferrer">
                    Open in Drive
                  </a>
                ) : null}
              </div>
              <div className="preview-nav">
                <button type="button" onClick={() => step(-1)} disabled={index <= 0}>
                  Previous
                </button>
                <span className="count">
                  {index + 1} of {visible.length}
                </span>
                <button type="button" onClick={() => step(1)} disabled={index >= visible.length - 1}>
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}

function PreviewMedia({ asset, canStream }: { asset: GridAsset; canStream: boolean }) {
  if (canStream && asset.kind === "video") {
    return <video key={asset.id} controls preload="metadata" poster={asset.thumbnailLink ? thumbUrl(asset.id, 1600) : undefined} src={fileUrl(asset.id, true)} />;
  }
  if (canStream && asset.kind === "pdf") {
    return <iframe key={asset.id} src={fileUrl(asset.id, true)} title={asset.name} />;
  }
  if (asset.thumbnailLink) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img key={asset.id} src={thumbUrl(asset.id, 1600)} alt={`Preview of ${asset.name}`} />;
  }
  return <div className="thumb-fallback">No preview for .{asset.ext || "this file"}</div>;
}
