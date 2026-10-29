import { isDemo } from "@/lib/config";
import { demoThumbnail } from "@/lib/demo-thumbnail";
import { fetchThumbnail, getIndex } from "@/lib/drive";
import { getViewer } from "@/lib/session";

const SIZES = [400, 800, 1600];

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getViewer())) return new Response("Sign in to view files.", { status: 401 });
  const { id } = await params;
  const asset = (await getIndex()).assets[id];
  if (!asset) return new Response("Not found", { status: 404 });

  const requested = Number(new URL(request.url).searchParams.get("s")) || 400;
  const size = SIZES.find((s) => s >= requested) ?? SIZES[SIZES.length - 1];
  const cacheHeaders = { "Cache-Control": "private, max-age=3600" };

  if (isDemo) {
    return new Response(demoThumbnail(asset), { headers: { ...cacheHeaders, "Content-Type": "image/svg+xml" } });
  }
  const res = await fetchThumbnail(asset, size);
  if (!res) return new Response("No preview", { status: 404 });
  return new Response(res.body, {
    headers: { ...cacheHeaders, "Content-Type": res.headers.get("Content-Type") ?? "image/jpeg" },
  });
}
