import "server-only";
import { config } from "./config";
import type { HubUser, Viewer } from "./types";

/**
 * Who may use the hub: anyone listed on the Users tab of the settings sheet,
 * anyone in HUB_ADMIN_EMAILS, and anyone with an email at a domain in HUB_ALLOWED_DOMAINS.
 */
export function resolveAccess(email: string, users: HubUser[]): Viewer | null {
  const e = email.toLowerCase();
  const user = users.find((u) => u.email === e);
  const domain = e.split("@")[1] ?? "";
  const admin = config.adminEmails.includes(e) || user?.role === "admin";
  if (!admin && !user && !config.allowedDomains.includes(domain)) return null;
  return {
    email: e,
    name: user?.name ?? "",
    location: user?.location ?? "",
    role: admin ? "admin" : "franchisee",
  };
}
