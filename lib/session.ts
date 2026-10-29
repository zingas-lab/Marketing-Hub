import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import { resolveAccess } from "./access";
import { config, isDemo } from "./config";
import { getSettings } from "./settings";
import type { Viewer } from "./types";

const DEMO_VIEWER: Viewer = { email: "demo@zingashome.com", name: "Alex Rivera", location: "Vero Beach, FL", role: "admin" };

/**
 * The signed-in person, or null. Access is re-checked against the settings sheet on every
 * request, so removing someone from the Users tab locks them out within the cache window.
 * Pages call this before loading any data: Next renders layouts and pages in parallel,
 * so the layout's check alone wouldn't stop a signed-out request from reading Drive.
 */
export const getViewer = cache(async function getViewer(): Promise<Viewer | null> {
  if (isDemo) return DEMO_VIEWER;
  if (!config.authConfigured) {
    throw new Error("Google sign-in is not configured. Set AUTH_SECRET, AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET (README → Setup).");
  }
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const viewer = resolveAccess(email, (await getSettings()).users);
  if (!viewer) return null;
  return { ...viewer, name: viewer.name || session.user?.name || email.split("@")[0] };
});

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

export function firstName(viewer: Viewer): string {
  return viewer.name.split(/\s+/)[0] ?? viewer.name;
}
