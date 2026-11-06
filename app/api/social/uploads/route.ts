import { getViewer } from "@/lib/session";
import { resolveTarget } from "@/lib/social";
import { createUploadToken } from "@/lib/upload-token";
import { MAX_UPLOAD_BYTES, isMediaFile, listUploads, startUpload, trashUpload, uploadsEnabled } from "@/lib/uploads";
import { isDemo } from "@/lib/config";

const json = (body: unknown, status = 200) => Response.json(body, { status });

/** Blocks state-changing requests from other sites. */
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

function targetFrom(params: URLSearchParams) {
  return { month: params.get("month"), script: params.get("script"), location: params.get("location") };
}

/** Lists the files uploaded for one script. */
export async function GET(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return json({ error: "Sign in to see uploads." }, 401);
  if (!uploadsEnabled()) return json({ error: "Uploads aren't set up yet." }, 503);
  const target = await resolveTarget(viewer, targetFrom(new URL(request.url).searchParams));
  if (!target.ok) return json({ error: target.message }, target.status);
  return json({ files: await listUploads(target.folderId) });
}

/** Starts an upload for one file and returns where to send its bytes. */
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return json({ error: "Sign in to upload." }, 401);
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  if (!uploadsEnabled()) return json({ error: "Uploads aren't set up yet." }, 503);

  const body = (await request.json().catch(() => null)) as {
    month?: string;
    script?: string;
    location?: string;
    name?: string;
    size?: number;
    type?: string;
  } | null;
  const name = body?.name?.trim().slice(0, 200);
  const size = Number(body?.size);
  const type = body?.type ?? "";
  if (!name || !Number.isFinite(size)) return json({ error: "Missing file details." }, 400);
  if (size <= 0) return json({ error: `${name} is empty.` }, 400);
  if (size > MAX_UPLOAD_BYTES) return json({ error: `${name} is over 10 GB. Trim it or export at a lower resolution.` }, 413);
  if (!isMediaFile(name, type)) return json({ error: `${name} isn't a video or photo.` }, 415);

  const target = await resolveTarget(viewer, { month: body?.month, script: body?.script, location: body?.location });
  if (!target.ok) return json({ error: target.message }, target.status);

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const sessionUrl = await startUpload(target.folderId, { name, size, type }, { email: viewer.email, name: viewer.name }, origin);
  return json({
    // In demo mode there's no Google session to upload to directly; everything goes through the relay.
    uploadUrl: isDemo ? null : sessionUrl,
    token: createUploadToken(sessionUrl, viewer.email),
  });
}

/** Moves one uploaded file to the trash. */
export async function DELETE(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return json({ error: "Sign in first." }, 401);
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  const params = new URL(request.url).searchParams;
  const fileId = params.get("file");
  if (!fileId) return json({ error: "Missing file." }, 400);
  const target = await resolveTarget(viewer, targetFrom(params));
  if (!target.ok) return json({ error: target.message }, target.status);
  if (!(await trashUpload(fileId, target.folderId))) return json({ error: "That file isn't in this script's folder." }, 404);
  return json({ ok: true });
}
