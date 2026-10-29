import { GoogleAuth } from "google-auth-library";
import { config } from "./config";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
];

let auth: GoogleAuth | null = null;

/** Accepts the service account key as raw JSON or base64-encoded JSON. */
function parseKey(raw: string) {
  const text = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  return JSON.parse(text);
}

export async function getAccessToken(): Promise<string> {
  if (!config.serviceAccountKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not set. See README → Setup.");
  }
  auth ??= new GoogleAuth({ credentials: parseKey(config.serviceAccountKey), scopes: SCOPES });
  const token = await auth.getAccessToken();
  if (!token) throw new Error("Google did not return an access token for the service account.");
  return token;
}

export async function googleFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...init, headers, cache: "no-store" });
}

export async function googleJson<T>(url: string): Promise<T> {
  const res = await googleFetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google API ${res.status} for ${url.split("?")[0]}: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}
