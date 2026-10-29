function list(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

export const config = {
  rootFolderId: process.env.HUB_DRIVE_FOLDER_ID ?? "",
  settingsSheetId: process.env.HUB_SETTINGS_SHEET_ID ?? "",
  serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ?? "",
  allowedDomains: list(process.env.HUB_ALLOWED_DOMAINS),
  adminEmails: list(process.env.HUB_ADMIN_EMAILS),
  authConfigured: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET && process.env.AUTH_SECRET),
  /** How long Drive and Sheet data is cached before the hub re-reads it. */
  cacheSeconds: Number(process.env.HUB_CACHE_SECONDS ?? 300),
  /** Shown in the footer as the place to send questions. */
  supportEmail: process.env.HUB_SUPPORT_EMAIL ?? "",
};

/**
 * Demo mode runs the hub on sample data with no Google credentials, for local previews.
 * It turns on only when explicitly requested or when nothing Google-related is configured,
 * so a half-configured production deploy fails loudly instead of quietly serving demo data.
 */
export const isDemo =
  process.env.HUB_DEMO === "1" || (!config.rootFolderId && !config.serviceAccountKey && !config.authConfigured);

export function driveFolderUrl(id: string) {
  return `https://drive.google.com/drive/folders/${id}`;
}

export function sheetUrl(id: string) {
  return `https://docs.google.com/spreadsheets/d/${id}/edit`;
}
