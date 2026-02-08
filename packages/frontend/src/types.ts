import { type Caido } from "@caido/sdk-frontend";
import { type API } from "backend";

export type FrontendSDK = Caido<API, Record<string, never>>;

export type GitHubRepo = {
  owner: string;
  repo: string;
  name: string;
  isDefault: boolean;
};

export type GitHubContent = {
  name: string;
  path: string;
  type: "file" | "dir";
  sha: string;
  size: number;
  downloadUrl: string | undefined;
};

export type Favorite = {
  id: string;
  owner: string;
  repo: string;
  path: string;
  name: string;
  addedAt: number;
  note?: string;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  description?: string;
};

export type TaggedItem = {
  itemId: string;
  tagId: string;
};

export type Collection = {
  id: string;
  name: string;
  description: string;
  createdAt: number;
};

export type CollectionItem = {
  collectionId: string;
  owner: string;
  repo: string;
  path: string;
  name: string;
  note?: string;
};

export type SearchResult = {
  name: string;
  path: string;
  repository: string;
  htmlUrl: string;
  textMatches: string[];
};

export type ViewState =
  | "categories"
  | "detail"
  | "search"
  | "favorites"
  | "settings"
  | "tagged"
  | "collections"
  | "collection-detail"
  | "repo-search"
  | "history"
  | "logs";

export type HistoryItem = {
  id: string;
  owner: string;
  repo: string;
  path: string;
  name: string;
  accessedAt: number;
  action: "viewed" | "copied" | "exported";
};

export type LogLevel = "info" | "success" | "warning" | "error";

export type LogEntry = {
  id: string;
  timestamp: number;
  level: LogLevel;
  action: string;
  details?: string;
  metadata?: Record<string, unknown>;
};

export type Command = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  action: () => void | Promise<void>;
  category?: string;
};

export type CachedFile = {
  content: string;
  cachedAt: number;
  size: number;
};

export type GitHubRepoSearchResult = {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string;
  topics: string[];
  updated_at: string;
};

export type BreadcrumbItem = {
  label: string;
  path: string;
};

export type SettingsTab = "repos" | "tags" | "collections";
