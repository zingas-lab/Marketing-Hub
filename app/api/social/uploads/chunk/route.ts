import { getViewer } from "@/lib/session";
import { readUploadToken } from "@/lib/upload-token";
import { sendChunk } from "@/lib/uploads";

// Relay for browsers that can't upload straight to Google. Chunks stay under Vercel's
// 4.5 MB request limit (the browser sends 4 MB at a time).
export const maxDuration = 60;

export async function PUT(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ error: "Sign in to upload." }, { status: 401 });
  const sessionUrl = readUploadToken(request.headers.get("x-upload-token") ?? "", viewer.email);
  if (!sessionUrl) return Response.json({ error: "This upload expired. Start it again." }, { status: 403 });
  const contentRange = request.headers.get("x-content-range") ?? "";
  try {
    const result = await sendChunk(sessionUrl, await request.arrayBuffer(), contentRange);
    return Response.json(result);
  } catch (error) {
    console.warn("Upload chunk failed:", error);
    return Response.json({ error: "Google Drive didn't accept part of the file. Try again." }, { status: 502 });
  }
}
