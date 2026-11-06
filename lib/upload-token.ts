import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { isDemo } from "./config";

// When a browser can't upload straight to Google, it sends chunks through the hub with this
// token. The token names the upload session the hub created and who it was created for,
// so the relay can't be pointed at any other URL or used by anyone else.

const TTL_MS = 24 * 60 * 60 * 1000;

function secret() {
  const value = process.env.AUTH_SECRET || (isDemo ? "demo-only-secret" : "");
  if (!value) throw new Error("AUTH_SECRET is not set.");
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createUploadToken(sessionUrl: string, email: string): string {
  const payload = Buffer.from(JSON.stringify({ u: sessionUrl, e: email, x: Date.now() + TTL_MS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Returns the session URL if the token is valid for this person, otherwise null. */
export function readUploadToken(token: string, email: string): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { u, e, x } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (e !== email || typeof x !== "number" || x < Date.now() || typeof u !== "string") return null;
    if (u.startsWith("demo:")) return isDemo ? u : null;
    const url = new URL(u);
    if (url.protocol !== "https:" || url.hostname !== "www.googleapis.com" || !url.pathname.startsWith("/upload/drive/v3/files")) return null;
    return u;
  } catch {
    return null;
  }
}
