import { GoogleAuth } from "google-auth-library";
import { config } from "./config";

/**
 * "read" covers the library and the settings sheet. "write" is used only for franchisee
 * uploads; the service account can still only write where it has been given access
 * (the uploads Shared Drive).
 */
export type Access = "read" | "write";

const SCOPES: Record<Access, string[]> = {
  read: ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/spreadsheets.readonly"],
  write: ["https://www.googleapis.com/auth/drive"],
};

const auths: Partial<Record<Access, GoogleAuth>> = {};

/** Accepts the service account key as raw JSON or base64-encoded JSON. */
function parseKey(raw: string) {
  const text = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  return JSON.parse(text);
}

export async function getAccessToken(access: Access = "read"): Promise<string> {
  if (!config.serviceAccountKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not set. See README → Setup.");
  }
  auths[access] ??= new GoogleAuth({ credentials: parseKey(config.serviceAccountKey), scopes: SCOPES[access] });
  const token = await auths[access].getAccessToken();
  if (!token) throw new Error("Google did not return an access token for the service account.");
  return token;
}

export async function googleFetch(url: string, init: RequestInit = {}, access: Access = "read"): Promise<Response> {
  const token = await getAccessToken(access);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...init, headers, cache: "no-store" });
}

export async function googleJson<T>(url: string, init: RequestInit = {}, access: Access = "read"): Promise<T> {
  const res = await googleFetch(url, init, access);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google API ${res.status} for ${url.split("?")[0]}: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}
