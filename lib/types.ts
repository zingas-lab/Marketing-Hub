export type AssetKind = "image" | "video" | "pdf" | "design" | "document" | "font" | "other";

export interface Asset {
  id: string;
  name: string;
  kind: AssetKind;
  mimeType: string;
  ext: string;
  size: number | null;
  createdTime: string;
  modifiedTime: string;
  folderId: string;
  width?: number;
  height?: number;
  durationMs?: number;
  description?: string;
  /** Drive thumbnail URL. Requires the service account's token to fetch. */
  thumbnailLink?: string;
  /** Google Docs/Sheets/Slides files are exported to PDF on download. */
  googleNative: boolean;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  parentId: string | null;
  folderIds: string[];
  assetIds: string[];
  /** Assets in this folder and every folder beneath it. */
  totalAssets: number;
}

export interface HubIndex {
  rootId: string;
  folders: Record<string, Folder>;
  assets: Record<string, Asset>;
  builtAt: number;
}

export interface HubLink {
  section: string;
  title: string;
  description: string;
  url: string;
  buttonLabel: string;
}

export interface Announcement {
  date: string;
  title: string;
  message: string;
  url?: string;
}

export interface HubUser {
  email: string;
  name: string;
  location: string;
  role: "admin" | "franchisee";
}

export interface HubSettings {
  links: HubLink[];
  announcements: Announcement[];
  users: HubUser[];
}

export interface Viewer {
  email: string;
  name: string;
  location: string;
  role: "admin" | "franchisee";
}
