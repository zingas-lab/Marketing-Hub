import { downloadName } from "@/lib/assets";
import { isDemo } from "@/lib/config";
import { fetchContent, getIndex } from "@/lib/drive";
import { getViewer } from "@/lib/session";

// Large videos can take a while to stream through.
export const maxDuration = 300;

function disposition(type: "inline" | "attachment", filename: string) {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

/**
 * Streams a file from Drive through the hub, so franchisees don't need their own Drive access.
 * `?inline=1` displays it in the browser (used for video and PDF previews) instead of downloading.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getViewer())) return new Response("Sign in to download files.", { status: 401 });
  const { id } = await params;
  const asset = (await getIndex()).assets[id];
  if (!asset) return new Response("Not found", { status: 404 });

  const inline = new URL(request.url).searchParams.get("inline") === "1";
  const filename = downloadName(asset);

  if (isDemo) {
    return new Response(`This is a demo file standing in for "${asset.name}".\nConnect Google Drive to serve real files (see README).\n`, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": disposition("attachment", `${filename}.txt`) },
    });
  }

  const upstream = await fetchContent(asset, request.headers.get("Range"));
  if (!upstream.ok && upstream.status !== 206) {
    return new Response("Google Drive couldn't return this file. Try again, or ask the marketing team to check it.", { status: 502 });
  }

  const headers = new Headers({
    "Content-Type": upstream.headers.get("Content-Type") ?? asset.mimeType,
    "Content-Disposition": disposition(inline ? "inline" : "attachment", filename),
    "Cache-Control": "private, max-age=300",
  });
  for (const h of ["Content-Length", "Content-Range", "Accept-Ranges"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}
