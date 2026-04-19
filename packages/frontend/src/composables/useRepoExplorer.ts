import { computed, onMounted, ref, watch } from "vue";

import { useSDK } from "@/plugins/sdk";
import type {
  BreadcrumbItem,
  CachedFile,
  Collection,
  CollectionItem,
  CustomPayload,
  Favorite,
  GitHubContent,
  GitHubRepo,
  GitHubRepoSearchResult,
  HistoryItem,
  LogEntry,
  LogLevel,
  SearchResult,
  SettingsTab,
  Tag,
  TaggedItem,
  ViewState,
} from "@/types";

const STORAGE_KEYS = {
  FAVORITES: "repo-explorer-favorites",
  COLLECTIONS: "repo-explorer-collections",
  COLLECTION_ITEMS: "repo-explorer-collection-items",
  TAGS: "repo-explorer-tags",
  TAGGED_ITEMS: "repo-explorer-tagged-items",
  REPOS: "repo-explorer-repos",
  HISTORY: "repo-explorer-history",
  LOGS: "repo-explorer-logs",
  CUSTOM_PAYLOADS: "repo-explorer-custom-payloads",
} as const;

const sanitizeImportedData = (text: string): string => {
  try {
    const parsed = JSON.parse(text);
    const sanitized = JSON.parse(
      JSON.stringify(parsed, (key, value) =>
        value === null ? undefined : value,
      ),
    );
    return JSON.stringify(sanitized);
  } catch {
    return text;
  }
};

const saveToLocalStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error);
  }
};

const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      const parsed = JSON.parse(stored) as T;

      if (key === STORAGE_KEYS.FAVORITES && Array.isArray(parsed)) {
        const validFavorites = (parsed as unknown as Favorite[]).filter((f) => {
          return (
            f !== null &&
            f !== undefined &&
            typeof f.owner === "string" &&
            f.owner !== null &&
            typeof f.repo === "string" &&
            f.repo !== null &&
            typeof f.path === "string" &&
            f.path !== null &&
            typeof f.name === "string" &&
            f.name !== null
          );
        });
        return validFavorites as T;
      }

      if (key === STORAGE_KEYS.COLLECTIONS && Array.isArray(parsed)) {
        const validCollections = (parsed as unknown as Collection[]).filter(
          (c) => {
            return (
              c !== null &&
              c !== undefined &&
              typeof c.id === "string" &&
              c.id !== null &&
              typeof c.name === "string" &&
              c.name !== null
            );
          },
        );
        return validCollections as T;
      }

      if (key === STORAGE_KEYS.COLLECTION_ITEMS && Array.isArray(parsed)) {
        const validItems = (parsed as unknown as CollectionItem[]).filter(
          (i) => {
            return (
              i !== null &&
              i !== undefined &&
              typeof i.collectionId === "string" &&
              i.collectionId !== null &&
              typeof i.owner === "string" &&
              i.owner !== null &&
              typeof i.repo === "string" &&
              i.repo !== null &&
              typeof i.path === "string" &&
              i.path !== null &&
              typeof i.name === "string" &&
              i.name !== null
            );
          },
        );
        return validItems as T;
      }

      if (key === STORAGE_KEYS.CUSTOM_PAYLOADS && Array.isArray(parsed)) {
        const validPayloads = (parsed as unknown as CustomPayload[]).filter(
          (p) => {
            return (
              p !== null &&
              p !== undefined &&
              typeof p.id === "string" &&
              p.id !== null &&
              typeof p.name === "string" &&
              p.name !== null &&
              typeof p.content === "string" &&
              p.content !== null
            );
          },
        );
        return validPayloads as T;
      }

      return parsed;
    }
  } catch (error) {
    console.error(`Failed to load from localStorage: ${key}`, error);
    localStorage.removeItem(key);
  }
  return defaultValue;
};

export const useRepoExplorer = () => {
  const sdk = useSDK();

  const viewState = ref<ViewState>("categories");
  const currentRepo = ref<GitHubRepo | undefined>(undefined);
  const repos = ref<GitHubRepo[]>([]);
  const categories = ref<GitHubContent[]>([]);
  const currentPath = ref("");
  const currentContents = ref<GitHubContent[]>([]);
  const breadcrumbs = ref<BreadcrumbItem[]>([]);
  const searchQuery = ref("");
  const globalSearchQuery = ref("");
  const isLoading = ref(false);
  const isSearching = ref(false);
  const fileContent = ref("");
  const selectedFile = ref<GitHubContent | undefined>(undefined);
  const showFileDialog = ref(false);
  const showSettings = ref(false);
  const newRepoUrl = ref("");
  const addRepoError = ref("");
  const favorites = ref<Favorite[]>(
    loadFromLocalStorage(STORAGE_KEYS.FAVORITES, []),
  );
  const searchResults = ref<SearchResult[]>([]);
  const allRepoFiles = ref<SearchResult[]>([]);
  const tags = ref<Tag[]>(loadFromLocalStorage(STORAGE_KEYS.TAGS, []));
  const taggedItems = ref<TaggedItem[]>(
    loadFromLocalStorage(STORAGE_KEYS.TAGGED_ITEMS, []),
  );
  const settingsTab = ref<SettingsTab>("repos");
  const newTagName = ref("");
  const newTagColor = ref("#e94560");
  const selectedItemTags = ref<Tag[]>([]);
  const showTagDialog = ref(false);
  const filterTag = ref<Tag | undefined>(undefined);
  const collections = ref<Collection[]>(
    loadFromLocalStorage(STORAGE_KEYS.COLLECTIONS, []),
  );
  const collectionItems = ref<CollectionItem[]>(
    loadFromLocalStorage(STORAGE_KEYS.COLLECTION_ITEMS, []),
  );
  const selectedCollection = ref<Collection | undefined>(undefined);
  const currentCollectionItems = ref<CollectionItem[]>([]);
  const showCollectionDialog = ref(false);
  const newCollectionName = ref("");
  const newCollectionDescription = ref("");
  const selectedCollectionItems = ref<Set<string>>(new Set());
  const selectedFavoriteItems = ref<Set<string>>(new Set());
  const repoSearchQuery = ref("");
  const repoSearchResults = ref<GitHubRepoSearchResult[]>([]);
  const isSearchingRepos = ref(false);
  const repoSearchResultsPerPage = ref(100);
  const repoSearchCurrentPage = ref(1);
  const repoSearchTotalCount = ref(0);
  const history = ref<HistoryItem[]>(
    loadFromLocalStorage(STORAGE_KEYS.HISTORY, []),
  );
  const logs = ref<LogEntry[]>(loadFromLocalStorage(STORAGE_KEYS.LOGS, []));
  const customPayloads = ref<CustomPayload[]>(
    loadFromLocalStorage(STORAGE_KEYS.CUSTOM_PAYLOADS, []),
  );
  const showCustomPayloadDialog = ref(false);
  const showCustomPayloadViewDialog = ref(false);
  const viewingCustomPayload = ref<CustomPayload | undefined>(undefined);
  const editingCustomPayload = ref<CustomPayload | undefined>(undefined);
  const newCustomPayloadName = ref("");
  const newCustomPayloadContent = ref("");
  const newCustomPayloadDescription = ref("");
  const fileCache = ref<Map<string, CachedFile>>(new Map());
  const CACHE_DURATION = 1000 * 60 * 30;
  const showNoteDialog = ref(false);
  const editingNoteItem = ref<
    | { type: "favorite"; item: Favorite }
    | { type: "collection"; item: Collection }
    | { type: "collectionItem"; item: CollectionItem; collectionId: string }
    | { type: "tag"; item: Tag }
    | undefined
  >(undefined);
  const noteEditValue = ref("");
  const selectedBulkItems = ref<Set<string>>(new Set());
  const bulkSelectionMode = ref(false);

  const filteredCategories = computed(() => {
    if (searchQuery.value.length === 0) {
      return categories.value;
    }
    const query = searchQuery.value.toLowerCase();
    return categories.value.filter((cat) =>
      cat.name.toLowerCase().includes(query),
    );
  });

  const hasTag = (itemPath: string): boolean => {
    if (!currentRepo.value) return false;
    const itemId = `${currentRepo.value.owner}/${currentRepo.value.repo}/${itemPath}`;
    const itemTagIds = taggedItems.value
      .filter((ti) => ti.itemId === itemId)
      .map((ti) => ti.tagId);
    return filterTag.value ? itemTagIds.includes(filterTag.value.id) : false;
  };

  const getTaggedFilesForCurrentRepo = computed(() => {
    if (!currentRepo.value || !filterTag.value) return new Set<string>();
    const prefix = `${currentRepo.value.owner}/${currentRepo.value.repo}/`;
    const tagged = taggedItems.value
      .filter(
        (ti) =>
          ti.tagId === filterTag.value?.id && ti.itemId.startsWith(prefix),
      )
      .map((ti) => ti.itemId.replace(prefix, ""));
    return new Set(tagged);
  });

  const filteredContents = computed(() => {
    let result = currentContents.value;

    if (searchQuery.value.length > 0) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(query));
    }

    if (filterTag.value) {
      result = result.filter((item) => {
        if (item.type === "dir") {
          const taggedFiles = getTaggedFilesForCurrentRepo.value;
          return Array.from(taggedFiles).some((path) =>
            path.startsWith(item.path + "/"),
          );
        }
        return hasTag(item.path);
      });
    }

    return result;
  });

  const filteredSearchResults = computed(() => {
    if (globalSearchQuery.value.length === 0 && !filterTag.value) {
      return [];
    }

    let result = allRepoFiles.value;

    if (filterTag.value) {
      result = result.filter((file) => hasTag(file.path));
    }

    if (globalSearchQuery.value.length > 0) {
      const query = globalSearchQuery.value.toLowerCase();
      result = result.filter(
        (file) =>
          file.name.toLowerCase().includes(query) ||
          file.path.toLowerCase().includes(query),
      );
    }

    return result;
  });

  const isFavorite = computed(() => {
    if (!selectedFile.value || !currentRepo.value) return false;
    const id = `${currentRepo.value.owner}/${currentRepo.value.repo}/${selectedFile.value.path}`;
    return favorites.value.some((f) => f.id === id);
  });

  const fetchRepoContents = async (
    owner: string,
    repo: string,
    path: string,
  ): Promise<GitHubContent[]> => {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (response.ok === false) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Unexpected response format");
    }

    return data.map(
      (item: {
        name: string;
        path: string;
        type: string;
        sha: string;
        size: number;
        download_url: string | undefined;
      }) => ({
        name: item.name,
        path: item.path,
        type: item.type === "dir" ? "dir" : "file",
        sha: item.sha,
        size: item.size,
        downloadUrl: item.download_url,
      }),
    );
  };

  const getCacheKey = (owner: string, repo: string, path: string): string => {
    return `${owner}/${repo}/${path}`;
  };

  const getCachedFile = (
    owner: string,
    repo: string,
    path: string,
  ): string | undefined => {
    const key = getCacheKey(owner, repo, path);
    const cached = fileCache.value.get(key);

    if (cached !== undefined) {
      const age = Date.now() - cached.cachedAt;
      if (age < CACHE_DURATION) {
        return cached.content;
      }
      fileCache.value.delete(key);
    }

    return undefined;
  };

  const setCachedFile = (
    owner: string,
    repo: string,
    path: string,
    content: string,
  ) => {
    const key = getCacheKey(owner, repo, path);
    fileCache.value.set(key, {
      content,
      cachedAt: Date.now(),
      size: content.length,
    });
  };

  const clearCache = () => {
    fileCache.value.clear();
    sdk.window.showToast("Cache cleared", { variant: "success" });
  };

  const fetchFileContent = async (
    owner: string,
    repo: string,
    path: string,
    skipCache = false,
  ): Promise<string> => {
    if (!skipCache) {
      const cached = getCachedFile(owner, repo, path);
      if (cached !== undefined) {
        return cached;
      }
    }

    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/${path}`;
    try {
      const rawResponse = await fetch(rawUrl);
      if (rawResponse.ok) {
        const content = await rawResponse.text();
        setCachedFile(owner, repo, path, content);
        return content;
      }
    } catch {
      // Fall back to API method
    }

    const mainUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;
    try {
      const mainResponse = await fetch(mainUrl);
      if (mainResponse.ok) {
        const content = await mainResponse.text();
        setCachedFile(owner, repo, path, content);
        return content;
      }
    } catch {
      // Fall back to API method
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (response.ok === false) {
      if (response.status === 404) {
        throw new Error(`File not found: ${path}`);
      } else if (response.status === 403) {
        throw new Error(`Rate limit exceeded or access denied`);
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      content?: string;
      encoding?: string;
      download_url?: string;
      size?: number;
    };

    if (data.size !== undefined && data.size > 1000000) {
      throw new Error(`File too large: ${path}`);
    }

    let content: string;
    if (data.content !== undefined && data.encoding === "base64") {
      content = atob(data.content.replace(/\n/g, ""));
    } else if (data.download_url !== undefined) {
      const dlResponse = await fetch(data.download_url);
      content = await dlResponse.text();
    } else {
      throw new Error("Unable to fetch file content");
    }

    setCachedFile(owner, repo, path, content);
    return content;

    throw new Error("Could not fetch file content");
  };

  const fetchRepoTree = async (owner: string, repo: string): Promise<void> => {
    const branches = ["master", "main"];

    for (const branch of branches) {
      try {
        const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
        const response = await fetch(url, {
          headers: {
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (response.ok) {
          const data = (await response.json()) as {
            tree: Array<{
              path: string;
              type: string;
            }>;
          };

          allRepoFiles.value = data.tree
            .filter((item) => item.type === "blob")
            .map((item) => ({
              name: item.path.split("/").pop() ?? item.path,
              path: item.path,
              repository: `${owner}/${repo}`,
              htmlUrl: `https://github.com/${owner}/${repo}/blob/${branch}/${item.path}`,
              textMatches: [],
            }));
          return;
        }
      } catch {
        // Try next branch
      }
    }
  };

  const performGlobalSearch = () => {
    if (globalSearchQuery.value.length < 2) {
      return;
    }
    searchResults.value = filteredSearchResults.value;
    if (searchResults.value.length > 0) {
      viewState.value = "search";
    }
  };

  const onSearchKeyup = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      performGlobalSearch();
    } else if (globalSearchQuery.value.length >= 2) {
      searchResults.value = filteredSearchResults.value.slice(0, 50);
      if (viewState.value !== "search" && searchResults.value.length > 0) {
        viewState.value = "search";
      }
    }
  };

  const clearSearch = () => {
    globalSearchQuery.value = "";
    searchResults.value = [];
    viewState.value = "categories";
  };

  const openSearchResult = async (result: SearchResult) => {
    if (!currentRepo.value) return;

    isLoading.value = true;
    try {
      const content = await fetchFileContent(
        currentRepo.value.owner,
        currentRepo.value.repo,
        result.path,
      );
      fileContent.value = content;
      selectedFile.value = {
        name: result.name,
        path: result.path,
        type: "file",
        sha: "",
        size: 0,
        downloadUrl: undefined,
      };
      showFileDialog.value = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      sdk.window.showToast(message, { variant: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  const loadRepos = async () => {
    const result = await sdk.backend.getRepos();
    if (result.kind === "Ok") {
      repos.value = result.value;
      const defaultRepo = result.value.find((r) => r.isDefault);
      if (defaultRepo) {
        currentRepo.value = defaultRepo;
        await loadCategories(defaultRepo);
      }
    }
  };

  const loadCategories = async (repo: GitHubRepo) => {
    isLoading.value = true;
    currentRepo.value = repo;

    try {
      const contents = await fetchRepoContents(repo.owner, repo.repo, "");
      categories.value = contents.filter(
        (item) =>
          item.type === "dir" &&
          !item.name.startsWith(".") &&
          !item.name.startsWith("_"),
      );
      viewState.value = "categories";
      currentPath.value = "";
      breadcrumbs.value = [];

      await addLogEntry(
        "info",
        "Repository Loaded",
        `Successfully loaded repository ${repo.owner}/${repo.repo} with ${categories.value.length} categories. Repository is now active and ready to browse.`,
        {
          repoOwner: repo.owner,
          repoName: repo.repo,
          categoriesCount: categories.value.length,
        },
      );

      fetchRepoTree(repo.owner, repo.repo);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await addLogEntry(
        "error",
        "Repository Load Failed",
        `Unable to load repository ${repo.owner}/${repo.repo}. Error: ${message}. Please check if the repository exists and is accessible.`,
        {
          repoOwner: repo.owner,
          repoName: repo.repo,
          errorMessage: message,
        },
      );
      sdk.window.showToast(message, { variant: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  const openCategory = async (category: GitHubContent) => {
    if (!currentRepo.value) return;

    isLoading.value = true;
    currentPath.value = category.path;
    breadcrumbs.value = [{ label: category.name, path: category.path }];

    try {
      const contents = await fetchRepoContents(
        currentRepo.value.owner,
        currentRepo.value.repo,
        category.path,
      );
      currentContents.value = contents;
      viewState.value = "detail";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      sdk.window.showToast(message, { variant: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  const navigateToPath = async (path: string) => {
    if (!currentRepo.value) return;

    isLoading.value = true;
    currentPath.value = path;

    if (path.length === 0) {
      viewState.value = "categories";
      breadcrumbs.value = [];
      isLoading.value = false;
      return;
    }

    const parts = path.split("/");
    breadcrumbs.value = parts.map((part, idx) => ({
      label: part,
      path: parts.slice(0, idx + 1).join("/"),
    }));

    try {
      const contents = await fetchRepoContents(
        currentRepo.value.owner,
        currentRepo.value.repo,
        path,
      );
      currentContents.value = contents;
      viewState.value = "detail";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      sdk.window.showToast(message, { variant: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  const openItem = async (item: GitHubContent) => {
    if (item.type === "dir") {
      await navigateToPath(item.path);
    } else {
      await viewFile(item);
    }
  };

  const viewFile = async (item: GitHubContent) => {
    if (!currentRepo.value) return;

    isLoading.value = true;
    selectedFile.value = item;

    try {
      const content = await fetchFileContent(
        currentRepo.value.owner,
        currentRepo.value.repo,
        item.path,
      );
      fileContent.value = content;
      showFileDialog.value = true;
      await addHistory("viewed");
      await addLogEntry(
        "info",
        "File Viewed",
        `Opened file "${item.name}" from ${currentRepo.value.owner}/${currentRepo.value.repo}. File size: ${formatFileSize(item.size)}. The file content is now displayed in the viewer and ready for use.`,
        {
          fileName: item.name,
          filePath: item.path,
          fileSize: item.size,
          repo: `${currentRepo.value.owner}/${currentRepo.value.repo}`,
        },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await addLogEntry(
        "error",
        "File View Failed",
        `Could not open file "${item.name}". Error: ${message}. The file may be too large, inaccessible, or in an unsupported format.`,
        {
          fileName: item.name,
          filePath: item.path,
          errorMessage: message,
        },
      );
      sdk.window.showToast(message, { variant: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  const viewFavoriteFile = async (fav: Favorite) => {
    isLoading.value = true;
    selectedFile.value = {
      name: fav.name,
      path: fav.path,
      type: "file",
      sha: "",
      size: 0,
      downloadUrl: undefined,
    };

    try {
      const content = await fetchFileContent(fav.owner, fav.repo, fav.path);
      fileContent.value = content;
      showFileDialog.value = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      sdk.window.showToast(message, { variant: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  const goBack = () => {
    if (viewState.value === "search") {
      clearSearch();
      return;
    }

    if (viewState.value === "favorites") {
      viewState.value = "categories";
      return;
    }

    if (viewState.value === "settings") {
      viewState.value = "categories";
      return;
    }

    if (viewState.value === "tagged") {
      filterTag.value = undefined;
      viewState.value = "categories";
      return;
    }

    if (viewState.value === "collections") {
      viewState.value = "categories";
      return;
    }

    if (viewState.value === "collection-detail") {
      selectedCollection.value = undefined;
      viewState.value = "collections";
      return;
    }

    if (viewState.value === "logs") {
      viewState.value = "categories";
      return;
    }

    if (breadcrumbs.value.length > 1) {
      const parentPath =
        breadcrumbs.value[breadcrumbs.value.length - 2]?.path ?? "";
      navigateToPath(parentPath);
    } else {
      viewState.value = "categories";
      breadcrumbs.value = [];
      currentPath.value = "";
      searchQuery.value = "";
    }
  };

  const switchRepo = async (repo: GitHubRepo) => {
    globalSearchQuery.value = "";
    searchResults.value = [];
    allRepoFiles.value = [];
    await loadCategories(repo);
    showSettings.value = false;
  };

  const parseRepoUrl = (
    url: string,
  ): { owner: string; repo: string } | undefined => {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    const owner = match?.[1];
    const repo = match?.[2];
    if (owner !== undefined && repo !== undefined) {
      return {
        owner,
        repo: repo.replace(/\.git$/, ""),
      };
    }
    return undefined;
  };

  const addNewRepo = async () => {
    addRepoError.value = "";
    const parsed = parseRepoUrl(newRepoUrl.value);
    if (!parsed) {
      addRepoError.value =
        "Invalid GitHub URL. Use format: https://github.com/owner/repo";
      return;
    }

    try {
      const checkUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`;
      const checkResponse = await fetch(checkUrl, {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!checkResponse.ok) {
        if (checkResponse.status === 404) {
          addRepoError.value =
            "Repository not found. Please check if it exists and is public.";
          sdk.window.showToast("Repository not found or not public", {
            variant: "error",
          });
        } else if (checkResponse.status === 403) {
          addRepoError.value = "Access forbidden. Repository may be private.";
          sdk.window.showToast("Cannot access repository - may be private", {
            variant: "error",
          });
        } else {
          addRepoError.value = `Failed to validate repository (${checkResponse.status})`;
          sdk.window.showToast("Failed to validate repository", {
            variant: "error",
          });
        }
        return;
      }

      const result = await sdk.backend.addRepo(
        parsed.owner,
        parsed.repo,
        parsed.repo,
      );
      if (result.kind === "Ok") {
        repos.value = result.value;
        newRepoUrl.value = "";
        await addLogEntry(
          "success",
          "Repository Added",
          `Successfully added new repository ${parsed.owner}/${parsed.repo} to your collection. You can now browse its payload categories and files.`,
          {
            repoOwner: parsed.owner,
            repoName: parsed.repo,
            repoUrl: newRepoUrl.value,
          },
        );
        sdk.window.showToast("Repository added successfully", {
          variant: "success",
        });
      } else {
        addRepoError.value = result.error;
        await addLogEntry(
          "error",
          "Repository Add Failed",
          `Failed to add repository ${parsed.owner}/${parsed.repo}. Error: ${result.error}. Please verify the repository URL and try again.`,
          {
            repoOwner: parsed.owner,
            repoName: parsed.repo,
            errorMessage: result.error,
          },
        );
      }
    } catch (error) {
      addRepoError.value = "Network error. Please check your connection.";
      sdk.window.showToast("Failed to connect to GitHub", {
        variant: "error",
      });
    }
  };

  const removeRepo = async (repo: GitHubRepo) => {
    const result = await sdk.backend.removeRepo(repo.owner, repo.repo);
    if (result.kind === "Ok") {
      repos.value = result.value;
      if (
        currentRepo.value?.owner === repo.owner &&
        currentRepo.value?.repo === repo.repo
      ) {
        const defaultRepo = result.value.find((r) => r.isDefault);
        if (defaultRepo) {
          await loadCategories(defaultRepo);
        }
      }
      await addLogEntry(
        "info",
        "Repository Removed",
        `Repository ${repo.owner}/${repo.repo} has been removed from your collection. All associated data remains intact if it was used in favorites or collections.`,
        {
          repoOwner: repo.owner,
          repoName: repo.repo,
        },
      );
      sdk.window.showToast("Repository removed", { variant: "success" });
    } else {
      await addLogEntry(
        "error",
        "Repository Removal Failed",
        `Unable to remove repository ${repo.owner}/${repo.repo}. Error: ${result.error}. Please try again or contact support if the issue persists.`,
        {
          repoOwner: repo.owner,
          repoName: repo.repo,
          errorMessage: result.error,
        },
      );
      sdk.window.showToast(result.error, { variant: "error" });
    }
  };

  const setDefault = async (repo: GitHubRepo) => {
    const result = await sdk.backend.setDefaultRepo(repo.owner, repo.repo);
    if (result.kind === "Ok") {
      repos.value = result.value;
      sdk.window.showToast(`${repo.name} set as default`, {
        variant: "success",
      });
    }
  };

  const toggleFavorite = async () => {
    if (!selectedFile.value || !currentRepo.value) return;

    const id = `${currentRepo.value.owner}/${currentRepo.value.repo}/${selectedFile.value.path}`;

    if (isFavorite.value) {
      const result = await sdk.backend.removeFavorite(id);
      if (result.kind === "Ok") {
        favorites.value = result.value;
        saveToLocalStorage(STORAGE_KEYS.FAVORITES, favorites.value);
        await addLogEntry(
          "info",
          "Favorite Removed",
          `File "${selectedFile.value.name}" has been removed from your favorites. You can still access it by browsing the repository.`,
          {
            fileName: selectedFile.value.name,
            filePath: selectedFile.value.path,
          },
        );
        sdk.window.showToast("Removed from favorites", { variant: "success" });
      }
    } else {
      const result = await sdk.backend.addFavorite(
        currentRepo.value.owner,
        currentRepo.value.repo,
        selectedFile.value.path,
        selectedFile.value.name,
      );
      if (result.kind === "Ok") {
        favorites.value = result.value;
        saveToLocalStorage(STORAGE_KEYS.FAVORITES, favorites.value);
        await addLogEntry(
          "success",
          "Favorite Added",
          `File "${selectedFile.value.name}" has been added to your favorites for quick access. You can view all favorites from the favorites tab.`,
          {
            fileName: selectedFile.value.name,
            filePath: selectedFile.value.path,
          },
        );
        sdk.window.showToast("Added to favorites", { variant: "success" });
      }
    }
  };

  const removeFavorite = async (fav: Favorite) => {
    favorites.value = favorites.value.filter((f) => f.id !== fav.id);
    saveToLocalStorage(STORAGE_KEYS.FAVORITES, favorites.value);

    await sdk.backend.removeFavorite(fav.id);

    sdk.window.showToast("Removed from favorites", { variant: "success" });
  };

  const toggleBulkSelectionMode = () => {
    bulkSelectionMode.value = !bulkSelectionMode.value;
    if (!bulkSelectionMode.value) {
      selectedBulkItems.value.clear();
    }
  };

  const toggleBulkItemSelection = (itemId: string) => {
    if (selectedBulkItems.value.has(itemId)) {
      selectedBulkItems.value.delete(itemId);
    } else {
      selectedBulkItems.value.add(itemId);
    }
  };

  const isBulkItemSelected = (itemId: string) => {
    return selectedBulkItems.value.has(itemId);
  };

  const selectAllInView = () => {
    if (viewState.value === "detail") {
      filteredContents.value.forEach((item) => {
        if (item.type === "file" && currentRepo.value) {
          const id = `${currentRepo.value.owner}/${currentRepo.value.repo}/${item.path}`;
          selectedBulkItems.value.add(id);
        }
      });
    } else if (viewState.value === "search") {
      searchResults.value.forEach((item) => {
        if (currentRepo.value) {
          const id = `${currentRepo.value.owner}/${currentRepo.value.repo}/${item.path}`;
          selectedBulkItems.value.add(id);
        }
      });
    }
  };

  const clearBulkSelection = () => {
    selectedBulkItems.value.clear();
  };

  const bulkToggleFavorite = async (addToFavorites: boolean) => {
    if (!currentRepo.value || selectedBulkItems.value.size === 0) return;

    let successCount = 0;
    let errorCount = 0;

    for (const itemId of selectedBulkItems.value) {
      const parts = itemId.split("/");
      const path = parts.slice(2).join("/");
      const fileName = path.split("/").pop() ?? "";

      if (addToFavorites) {
        const result = await sdk.backend.addFavorite(
          currentRepo.value.owner,
          currentRepo.value.repo,
          path,
          fileName,
        );
        if (result.kind === "Ok") {
          favorites.value = result.value;
          successCount++;
        } else {
          errorCount++;
        }
      } else {
        const result = await sdk.backend.removeFavorite(itemId);
        if (result.kind === "Ok") {
          favorites.value = result.value;
          successCount++;
        } else {
          errorCount++;
        }
      }
    }

    saveToLocalStorage(STORAGE_KEYS.FAVORITES, favorites.value);

    const action = addToFavorites ? "added to" : "removed from";
    sdk.window.showToast(
      `${successCount} items ${action} favorites${errorCount > 0 ? ` (${errorCount} errors)` : ""}`,
      { variant: successCount > 0 ? "success" : "error" },
    );

    await addLogEntry(
      successCount > 0 ? "success" : "error",
      `Bulk Favorites ${addToFavorites ? "Added" : "Removed"}`,
      `${successCount} items ${action} favorites${errorCount > 0 ? `, ${errorCount} failed` : ""}.`,
      {
        successCount,
        errorCount,
        totalItems: selectedBulkItems.value.size,
      },
    );

    clearBulkSelection();
    bulkSelectionMode.value = false;
  };

  const bulkAddToCollection = async (collectionId: string) => {
    if (!currentRepo.value || selectedBulkItems.value.size === 0) return;

    const collection = collections.value.find((c) => c.id === collectionId);
    if (collection === undefined) return;

    let successCount = 0;

    for (const itemId of selectedBulkItems.value) {
      const parts = itemId.split("/");
      const path = parts.slice(2).join("/");
      const fileName = path.split("/").pop() ?? "";

      const result = await sdk.backend.addToCollection(
        collectionId,
        currentRepo.value.owner,
        currentRepo.value.repo,
        path,
        fileName,
      );

      if (result.kind === "Ok") {
        successCount++;
      }
    }

    sdk.window.showToast(
      `${successCount} items added to collection "${collection.name}"`,
      { variant: "success" },
    );

    await addLogEntry(
      "success",
      "Bulk Add to Collection",
      `${successCount} items added to collection "${collection.name}".`,
      {
        collectionName: collection.name,
        itemCount: successCount,
      },
    );

    clearBulkSelection();
    bulkSelectionMode.value = false;
  };

  const bulkApplyTag = async (tagId: string) => {
    if (selectedBulkItems.value.size === 0) return;

    const tag = tags.value.find((t) => t.id === tagId);
    if (tag === undefined) return;

    let successCount = 0;

    for (const itemId of selectedBulkItems.value) {
      const result = await sdk.backend.assignTag(itemId, tagId);
      if (result.kind === "Ok") {
        successCount++;
      }
    }

    const taggedResult = await sdk.backend.getTaggedItems();
    if (taggedResult.kind === "Ok") {
      saveToLocalStorage(STORAGE_KEYS.TAGGED_ITEMS, taggedResult.value);
    }

    sdk.window.showToast(`Applied tag "${tag.name}" to ${successCount} items`, {
      variant: "success",
    });

    await addLogEntry(
      "success",
      "Bulk Tag Applied",
      `Applied tag "${tag.name}" to ${successCount} items.`,
      {
        tagName: tag.name,
        itemCount: successCount,
      },
    );

    clearBulkSelection();
    bulkSelectionMode.value = false;
  };

  const loadCustomPayloads = async () => {
    const result = await sdk.backend.getCustomPayloads();
    if (result.kind === "Ok") {
      customPayloads.value = result.value;
      saveToLocalStorage(STORAGE_KEYS.CUSTOM_PAYLOADS, result.value);
    }
  };

  const openCustomPayloadDialog = (payload?: CustomPayload) => {
    if (payload !== undefined) {
      editingCustomPayload.value = payload;
      newCustomPayloadName.value = payload.name;
      newCustomPayloadContent.value = payload.content;
      newCustomPayloadDescription.value = payload.description ?? "";
    } else {
      editingCustomPayload.value = undefined;
      newCustomPayloadName.value = "";
      newCustomPayloadContent.value = "";
      newCustomPayloadDescription.value = "";
    }
    showCustomPayloadDialog.value = true;
  };

  const saveCustomPayload = async () => {
    if (newCustomPayloadName.value.trim().length === 0) {
      sdk.window.showToast("Payload name is required", { variant: "error" });
      return;
    }

    if (newCustomPayloadContent.value.trim().length === 0) {
      sdk.window.showToast("Payload content is required", { variant: "error" });
      return;
    }

    if (editingCustomPayload.value !== undefined) {
      const result = await sdk.backend.updateCustomPayload(
        editingCustomPayload.value.id,
        newCustomPayloadName.value.trim(),
        newCustomPayloadContent.value,
        newCustomPayloadDescription.value.trim(),
      );
      if (result.kind === "Ok") {
        customPayloads.value = result.value;
        saveToLocalStorage(STORAGE_KEYS.CUSTOM_PAYLOADS, result.value);
        showCustomPayloadDialog.value = false;
        sdk.window.showToast("Custom payload updated successfully", {
          variant: "success",
        });
        await addLogEntry(
          "success",
          "Custom Payload Updated",
          `Updated custom payload "${newCustomPayloadName.value}"`,
        );
      } else {
        sdk.window.showToast(result.error, { variant: "error" });
      }
    } else {
      const result = await sdk.backend.createCustomPayload(
        newCustomPayloadName.value.trim(),
        newCustomPayloadContent.value,
        newCustomPayloadDescription.value.trim(),
      );
      if (result.kind === "Ok") {
        customPayloads.value = result.value;
        saveToLocalStorage(STORAGE_KEYS.CUSTOM_PAYLOADS, result.value);
        showCustomPayloadDialog.value = false;
        sdk.window.showToast("Custom payload created successfully", {
          variant: "success",
        });
        await addLogEntry(
          "success",
          "Custom Payload Created",
          `Created custom payload "${newCustomPayloadName.value}"`,
        );
      } else {
        sdk.window.showToast(result.error, { variant: "error" });
      }
    }
  };

  const deleteCustomPayload = async (id: string) => {
    const payload = customPayloads.value.find((p) => p.id === id);
    if (payload === undefined) return;

    const result = await sdk.backend.deleteCustomPayload(id);
    if (result.kind === "Ok") {
      customPayloads.value = result.value;
      saveToLocalStorage(STORAGE_KEYS.CUSTOM_PAYLOADS, result.value);
      sdk.window.showToast("Custom payload deleted", { variant: "success" });
      await addLogEntry(
        "info",
        "Custom Payload Deleted",
        `Deleted custom payload "${payload.name}"`,
      );
    } else {
      sdk.window.showToast(result.error, { variant: "error" });
    }
  };

  const copyCustomPayloadToClipboard = async (payload: CustomPayload) => {
    try {
      await navigator.clipboard.writeText(payload.content);
      sdk.window.showToast(`Copied "${payload.name}" to clipboard`, {
        variant: "success",
      });
      await addLogEntry(
        "success",
        "Custom Payload Copied",
        `Copied custom payload "${payload.name}" to clipboard`,
      );
    } catch {
      sdk.window.showToast("Failed to copy to clipboard", {
        variant: "error",
      });
    }
  };

  const exportCustomPayloads = () => {
    if (customPayloads.value.length === 0) {
      sdk.window.showToast("No custom payloads to export", {
        variant: "warning",
      });
      return;
    }

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      customPayloads: customPayloads.value,
    };

    const blob = new Blob([JSON.stringify(exportData, undefined, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `custom-payloads-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    sdk.window.showToast(
      `Exported ${customPayloads.value.length} custom payload(s)`,
      { variant: "success" },
    );
  };

  const importCustomPayloads = async (file: File) => {
    let hasSuccess = false;
    try {
      const text = await file.text();

      if (text.trim().length === 0) {
        sdk.window.showToast("File is empty", {
          variant: "error",
        });
        return;
      }

      let isJsonFile = false;
      let data:
        | { version?: number; customPayloads?: CustomPayload[] }
        | undefined;

      try {
        const sanitized = sanitizeImportedData(text);
        data = JSON.parse(sanitized) as {
          version?: number;
          customPayloads?: CustomPayload[];
        };
        isJsonFile = true;
      } catch {
        isJsonFile = false;
      }

      if (
        isJsonFile &&
        data !== undefined &&
        data.customPayloads !== undefined &&
        Array.isArray(data.customPayloads)
      ) {
        if (data.customPayloads.length === 0) {
          sdk.window.showToast("No custom payloads found in file", {
            variant: "info",
          });
          return;
        }

        let importedCount = 0;
        let skippedCount = 0;
        const errors: string[] = [];

        for (const payload of data.customPayloads) {
          try {
            if (
              payload !== null &&
              payload !== undefined &&
              typeof payload.name === "string" &&
              payload.name !== null &&
              payload.name.trim().length > 0 &&
              typeof payload.content === "string" &&
              payload.content !== null &&
              payload.content.trim().length > 0
            ) {
              const exists = customPayloads.value.some(
                (p) =>
                  p.name.toLowerCase() === payload.name.trim().toLowerCase(),
              );

              if (!exists) {
                const description =
                  typeof payload.description === "string" &&
                  payload.description !== null &&
                  payload.description.trim().length > 0
                    ? payload.description.trim()
                    : undefined;

                const tags =
                  Array.isArray(payload.tags) && payload.tags.length > 0
                    ? payload.tags
                    : undefined;

                let result;
                if (description !== undefined && tags !== undefined) {
                  result = await sdk.backend.createCustomPayload(
                    payload.name.trim(),
                    payload.content,
                    description,
                    tags,
                  );
                } else if (description !== undefined) {
                  result = await sdk.backend.createCustomPayload(
                    payload.name.trim(),
                    payload.content,
                    description,
                  );
                } else {
                  result = await sdk.backend.createCustomPayload(
                    payload.name.trim(),
                    payload.content,
                  );
                }

                if (result.kind === "Ok") {
                  customPayloads.value = result.value;
                  importedCount++;
                } else {
                  errors.push(`${payload.name}: ${result.error}`);
                }
              } else {
                skippedCount++;
              }
            } else {
              const name =
                payload !== null &&
                payload !== undefined &&
                typeof payload.name === "string" &&
                payload.name !== null
                  ? payload.name
                  : "Unknown";
              errors.push(`${name}: missing name or content`);
            }
          } catch (err) {
            const name =
              payload !== null &&
              payload !== undefined &&
              typeof payload.name === "string" &&
              payload.name !== null
                ? payload.name
                : "Unknown";
            errors.push(
              `${name}: ${err instanceof Error ? err.message : "Import error"}`,
            );
          }
        }

        saveToLocalStorage(STORAGE_KEYS.CUSTOM_PAYLOADS, customPayloads.value);

        if (importedCount > 0) {
          hasSuccess = true;
          let message = `Imported ${importedCount} custom payload(s)`;
          if (skippedCount > 0) {
            message += `, skipped ${skippedCount} duplicate(s)`;
          }
          sdk.window.showToast(message, { variant: "success" });
          try {
            await addLogEntry("success", "Custom Payloads Imported", message);
          } catch {
            // Ignore log errors
          }
        } else if (skippedCount > 0) {
          hasSuccess = true;
          sdk.window.showToast(
            `All ${skippedCount} custom payloads already exist`,
            {
              variant: "info",
            },
          );
        } else if (errors.length > 0) {
          sdk.window.showToast(
            `Import failed: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? "..." : ""}`,
            { variant: "error" },
          );
        }
      } else {
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        const baseName = fileName.length > 0 ? fileName : "Imported Payload";

        let finalName = baseName;
        let counter = 1;
        while (
          customPayloads.value.some(
            (p) => p.name.toLowerCase() === finalName.toLowerCase(),
          )
        ) {
          finalName = `${baseName} (${counter})`;
          counter++;
        }

        const result = await sdk.backend.createCustomPayload(
          finalName,
          text,
          `Imported from ${file.name}`,
        );

        if (result.kind === "Ok") {
          hasSuccess = true;
          customPayloads.value = result.value;
          saveToLocalStorage(STORAGE_KEYS.CUSTOM_PAYLOADS, result.value);
          sdk.window.showToast(
            `Imported text file "${file.name}" as custom payload "${finalName}"`,
            { variant: "success" },
          );
          try {
            await addLogEntry(
              "success",
              "Custom Payload Created from File",
              `Imported ${file.name} as "${finalName}"`,
            );
          } catch {
            // Ignore log errors
          }
        } else {
          sdk.window.showToast(result.error, { variant: "error" });
        }
      }
    } catch (error) {
      if (!hasSuccess) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        sdk.window.showToast(`Failed to import: ${errorMessage}`, {
          variant: "error",
        });
      }
    }
  };

  const triggerCustomPayloadImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.txt,.md";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file !== undefined) {
        importCustomPayloads(file);
      }
    };
    input.click();
  };

  const viewCustomPayloads = () => {
    viewState.value = "custom-payloads";
  };

  const exportCustomPayloadAsFile = (payload: CustomPayload) => {
    const blob = new Blob([payload.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${payload.name.replace(/\s+/g, "-").toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    sdk.window.showToast(`Exported "${payload.name}" as file`, {
      variant: "success",
    });
  };

  const viewCustomPayload = (payload: CustomPayload) => {
    viewingCustomPayload.value = payload;
    showCustomPayloadViewDialog.value = true;
  };

  const getFileIcon = (item: GitHubContent): string => {
    if (item.type === "dir") return "fas fa-folder";
    const ext = item.name.split(".").pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      md: "fas fa-file-alt",
      txt: "fas fa-file-alt",
      py: "fas fa-file-code",
      js: "fas fa-file-code",
      ts: "fas fa-file-code",
      json: "fas fa-file-code",
      xml: "fas fa-file-code",
      html: "fas fa-file-code",
      css: "fas fa-file-code",
      php: "fas fa-file-code",
      sh: "fas fa-file-code",
      yaml: "fas fa-file-code",
      yml: "fas fa-file-code",
    };
    return iconMap[ext ?? ""] ?? "fas fa-file";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fileContent.value);
      sdk.window.showToast("Copied to clipboard", { variant: "success" });
      if (selectedFile.value !== undefined && currentRepo.value !== undefined) {
        await sdk.backend.addToHistory(
          currentRepo.value.owner,
          currentRepo.value.repo,
          selectedFile.value.path,
          selectedFile.value.name,
          "copied",
        );
        await addLogEntry(
          "success",
          "File Copied",
          `Copied ${selectedFile.value.name} to clipboard`,
          {
            fileName: selectedFile.value.name,
            filePath: selectedFile.value.path,
            repository: `${currentRepo.value.owner}/${currentRepo.value.repo}`,
          },
        );
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      if (
        error instanceof Error &&
        error.message.includes("document is not focused")
      ) {
        sdk.window.showToast(
          "Please click inside the window first, then try again",
          { variant: "warning" },
        );
      } else {
        sdk.window.showToast(
          "Failed to copy. Your browser may not support this feature.",
          { variant: "warning" },
        );
      }
    }
  };

  const exportFavorites = () => {
    if (favorites.value.length === 0) {
      sdk.window.showToast("No favorites to export", { variant: "warning" });
      return;
    }

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      favorites: favorites.value,
    };

    const blob = new Blob([JSON.stringify(exportData, undefined, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `repo-favorites-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    sdk.window.showToast(`Exported ${favorites.value.length} favorites`, {
      variant: "success",
    });
  };

  const importFavorites = async (file: File) => {
    let hasSuccess = false;
    try {
      let text = await file.text();

      if (text.trim().length === 0) {
        sdk.window.showToast("File is empty", {
          variant: "error",
        });
        return;
      }

      text = sanitizeImportedData(text);

      let data;
      try {
        data = JSON.parse(text) as {
          version?: number;
          favorites?: Favorite[];
        };
      } catch (parseError) {
        sdk.window.showToast(
          `Invalid JSON format: ${parseError instanceof Error ? parseError.message : "Parse error"}`,
          {
            variant: "error",
          },
        );
        return;
      }

      if (data.favorites === undefined || !Array.isArray(data.favorites)) {
        sdk.window.showToast(
          "Invalid favorites file format - missing 'favorites' array",
          {
            variant: "error",
          },
        );
        return;
      }

      if (data.favorites.length === 0) {
        sdk.window.showToast("No favorites found in file", {
          variant: "info",
        });
        return;
      }

      let importedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      for (const fav of data.favorites) {
        try {
          if (
            fav !== null &&
            fav !== undefined &&
            typeof fav.owner === "string" &&
            fav.owner !== null &&
            fav.owner.trim().length > 0 &&
            typeof fav.repo === "string" &&
            fav.repo !== null &&
            fav.repo.trim().length > 0 &&
            typeof fav.path === "string" &&
            fav.path !== null &&
            fav.path.trim().length > 0 &&
            typeof fav.name === "string" &&
            fav.name !== null &&
            fav.name.trim().length > 0
          ) {
            const id = `${fav.owner.trim()}/${fav.repo.trim()}/${fav.path.trim()}`;
            const exists = favorites.value.some((f) => f.id === id);

            if (!exists) {
              const note =
                typeof fav.note === "string" &&
                fav.note !== null &&
                fav.note.trim().length > 0
                  ? fav.note.trim()
                  : undefined;

              const result =
                note !== undefined
                  ? await sdk.backend.addFavorite(
                      fav.owner.trim(),
                      fav.repo.trim(),
                      fav.path.trim(),
                      fav.name.trim(),
                      note,
                    )
                  : await sdk.backend.addFavorite(
                      fav.owner.trim(),
                      fav.repo.trim(),
                      fav.path.trim(),
                      fav.name.trim(),
                    );

              if (result.kind === "Ok") {
                favorites.value = result.value;
                importedCount++;
              } else {
                errors.push(`${fav.name}: ${result.error}`);
              }
            } else {
              skippedCount++;
            }
          } else {
            const name =
              fav !== null &&
              fav !== undefined &&
              typeof fav.name === "string" &&
              fav.name !== null
                ? fav.name
                : "Unknown";
            errors.push(`${name}: missing required fields`);
          }
        } catch (err) {
          const name =
            fav !== null &&
            fav !== undefined &&
            typeof fav.name === "string" &&
            fav.name !== null
              ? fav.name
              : "Unknown";
          errors.push(
            `${name}: ${err instanceof Error ? err.message : "Import error"}`,
          );
        }
      }

      saveToLocalStorage(STORAGE_KEYS.FAVORITES, favorites.value);

      if (importedCount > 0) {
        hasSuccess = true;
        let message = `Imported ${importedCount} favorite(s)`;
        if (skippedCount > 0) {
          message += `, skipped ${skippedCount} duplicate(s)`;
        }
        sdk.window.showToast(message, { variant: "success" });
      } else if (skippedCount > 0) {
        hasSuccess = true;
        sdk.window.showToast(`All ${skippedCount} favorites already exist`, {
          variant: "info",
        });
      } else if (errors.length > 0) {
        sdk.window.showToast(
          `Import failed: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? "..." : ""}`,
          { variant: "error" },
        );
      }
    } catch (error) {
      if (!hasSuccess) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        sdk.window.showToast(`Failed to import favorites: ${errorMessage}`, {
          variant: "error",
        });
      }
    }
  };

  const triggerImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        importFavorites(file);
      }
    };
    input.click();
  };

  const loadTags = async () => {
    const result = await sdk.backend.getTags();
    if (result.kind === "Ok") {
      tags.value = result.value;
      saveToLocalStorage(STORAGE_KEYS.TAGS, tags.value);
    }
  };

  const addTag = async () => {
    if (newTagName.value.trim().length === 0) {
      sdk.window.showToast("Tag name is required", { variant: "error" });
      return;
    }

    const colorValue = newTagColor.value.startsWith("#")
      ? newTagColor.value
      : `#${newTagColor.value}`;

    const result = await sdk.backend.addTag(
      newTagName.value.trim(),
      colorValue,
    );
    if (result.kind === "Ok") {
      tags.value = result.value;
      saveToLocalStorage(STORAGE_KEYS.TAGS, tags.value);
      await addLogEntry(
        "success",
        "Tag Created",
        `New tag "${newTagName.value.trim()}" has been created successfully. You can now use this tag to organize and categorize your favorite files.`,
        {
          tagName: newTagName.value.trim(),
          tagColor: colorValue,
        },
      );
      newTagName.value = "";
      newTagColor.value = "#e94560";
      sdk.window.showToast("Tag created", { variant: "success" });
    } else {
      await addLogEntry(
        "error",
        "Tag Creation Failed",
        `Unable to create tag. Error: ${result.error}. Please check if a tag with this name already exists.`,
      );
      sdk.window.showToast(result.error, { variant: "error" });
    }
  };

  const removeTag = async (tagId: string) => {
    const tag = tags.value.find((t) => t.id === tagId);
    const tagName = tag?.name ?? tagId;

    const result = await sdk.backend.removeTag(tagId);
    if (result.kind === "Ok") {
      tags.value = result.value;
      if (filterTag.value?.id === tagId) {
        filterTag.value = undefined;
      }
      await addLogEntry(
        "info",
        "Tag Removed",
        `Tag "${tagName}" has been removed from the system. All items that were tagged with this tag have been untagged.`,
        {
          tagId,
          tagName,
        },
      );
      sdk.window.showToast("Tag removed", { variant: "success" });
    }
  };

  const getItemId = (): string | undefined => {
    if (!selectedFile.value || !currentRepo.value) return undefined;
    return `${currentRepo.value.owner}/${currentRepo.value.repo}/${selectedFile.value.path}`;
  };

  const openTagDialog = async () => {
    const itemId = getItemId();
    if (itemId === undefined) return;

    const result = await sdk.backend.getItemTags(itemId);
    if (result.kind === "Ok") {
      selectedItemTags.value = result.value;
    }
    showTagDialog.value = true;
  };

  const toggleItemTag = async (tag: Tag) => {
    const itemId = getItemId();
    if (itemId === undefined) return;

    const hasTag = selectedItemTags.value.some((t) => t.id === tag.id);

    if (hasTag) {
      const result = await sdk.backend.unassignTag(itemId, tag.id);
      if (result.kind === "Ok") {
        taggedItems.value = result.value;
        selectedItemTags.value = selectedItemTags.value.filter(
          (t) => t.id !== tag.id,
        );
      }
    } else {
      const result = await sdk.backend.assignTag(itemId, tag.id);
      if (result.kind === "Ok") {
        taggedItems.value = result.value;
        selectedItemTags.value = [...selectedItemTags.value, tag];
      }
    }
  };

  const getTagsForItem = (itemId: string): Tag[] => {
    const itemTagIds = taggedItems.value
      .filter((ti) => ti.itemId === itemId)
      .map((ti) => ti.tagId);
    return tags.value.filter((t) => itemTagIds.includes(t.id));
  };

  const filteredFavorites = computed(() => {
    if (!filterTag.value) {
      return favorites.value;
    }
    return favorites.value.filter((fav) => {
      const itemTags = getTagsForItem(fav.id);
      return itemTags.some((t) => t.id === filterTag.value?.id);
    });
  });

  const taggedFiles = computed(() => {
    if (!filterTag.value || !currentRepo.value) return [];

    const prefix = `${currentRepo.value.owner}/${currentRepo.value.repo}/`;
    const taggedPaths = taggedItems.value
      .filter(
        (ti) =>
          ti.tagId === filterTag.value?.id && ti.itemId.startsWith(prefix),
      )
      .map((ti) => ti.itemId.replace(prefix, ""));

    return taggedPaths.map((path) => ({
      name: path.split("/").pop() ?? path,
      path,
      type: "file" as const,
      sha: "",
      size: 0,
      downloadUrl: undefined,
    }));
  });

  const setFilterTag = (tag: Tag | undefined) => {
    filterTag.value = tag;
    if (tag) {
      viewState.value = "tagged";
    } else {
      viewState.value = "categories";
    }
  };

  const loadCollections = async () => {
    // Collections are now loaded from localStorage on init, no need to fetch from backend
  };

  const viewCollections = async () => {
    await loadCollections();
    viewState.value = "collections";
  };

  const loadHistory = async () => {
    // History is now loaded from localStorage on init, no need to fetch from backend
  };

  const addHistory = async (action: "viewed" | "copied" | "exported") => {
    if (!selectedFile.value || !currentRepo.value) return;

    await sdk.backend.addToHistory(
      currentRepo.value.owner,
      currentRepo.value.repo,
      selectedFile.value.path,
      selectedFile.value.name,
      action,
    );

    await loadHistory();
  };

  const clearAllHistory = async () => {
    const result = await sdk.backend.clearHistory();
    if (result.kind === "Ok") {
      history.value = result.value;
      sdk.window.showToast("History cleared", { variant: "success" });
    }
  };

  const viewHistory = async () => {
    await loadHistory();
    viewState.value = "history";
  };

  const loadLogs = async () => {
    const result = await sdk.backend.getLogs();
    if (result.kind === "Ok") {
      logs.value = result.value;
      saveToLocalStorage(STORAGE_KEYS.LOGS, logs.value);
    }
  };

  const addLogEntry = async (
    level: LogLevel,
    action: string,
    details?: string,
    metadata?: Record<string, unknown>,
  ) => {
    const result = await sdk.backend.addLog(level, action, details, metadata);
    if (result.kind === "Ok") {
      logs.value = result.value;
      saveToLocalStorage(STORAGE_KEYS.LOGS, logs.value);
    }
  };

  const clearAllLogs = async () => {
    const result = await sdk.backend.clearLogs();
    if (result.kind === "Ok") {
      logs.value = result.value;
      saveToLocalStorage(STORAGE_KEYS.LOGS, logs.value);
      sdk.window.showToast("Logs cleared", { variant: "success" });
    }
  };

  const viewLogs = async () => {
    await loadLogs();
    viewState.value = "logs";
  };

  const openNoteDialog = (
    item:
      | { type: "favorite"; item: Favorite }
      | { type: "collection"; item: Collection }
      | { type: "collectionItem"; item: CollectionItem; collectionId: string }
      | { type: "tag"; item: Tag },
  ) => {
    editingNoteItem.value = item;

    if (item.type === "favorite") {
      noteEditValue.value = item.item.note ?? "";
    } else if (item.type === "collection") {
      noteEditValue.value = item.item.description ?? "";
    } else if (item.type === "collectionItem") {
      noteEditValue.value = item.item.note ?? "";
    } else if (item.type === "tag") {
      noteEditValue.value = item.item.description ?? "";
    }

    showNoteDialog.value = true;
  };

  const saveNote = async () => {
    if (editingNoteItem.value === undefined) return;

    const item = editingNoteItem.value;

    if (item.type === "favorite") {
      const result = await sdk.backend.updateFavoriteNote(
        item.item.id,
        noteEditValue.value,
      );
      if (result.kind === "Ok") {
        favorites.value = result.value;
        sdk.window.showToast("Note updated", { variant: "success" });
      }
    } else if (item.type === "collection") {
      const result = await sdk.backend.updateCollectionDescription(
        item.item.id,
        noteEditValue.value,
      );
      if (result.kind === "Ok") {
        collections.value = result.value;
        sdk.window.showToast("Description updated", { variant: "success" });
      }
    } else if (item.type === "collectionItem") {
      const result = await sdk.backend.updateCollectionItemNote(
        item.collectionId,
        item.item.owner,
        item.item.repo,
        item.item.path,
        noteEditValue.value,
      );
      if (result.kind === "Ok") {
        const allItems = await sdk.backend.getAllCollectionItems();
        if (allItems.kind === "Ok") {
          collectionItems.value = allItems.value;
        }
        currentCollectionItems.value = result.value;
        sdk.window.showToast("Note updated", { variant: "success" });
      }
    } else if (item.type === "tag") {
      const result = await sdk.backend.updateTagDescription(
        item.item.id,
        noteEditValue.value,
      );
      if (result.kind === "Ok") {
        tags.value = result.value;
        sdk.window.showToast("Description updated", { variant: "success" });
      }
    }

    showNoteDialog.value = false;
    editingNoteItem.value = undefined;
    noteEditValue.value = "";
  };

  const viewHistoryFile = async (item: HistoryItem) => {
    isLoading.value = true;
    selectedFile.value = {
      name: item.name,
      path: item.path,
      type: "file",
      sha: "",
      size: 0,
      downloadUrl: undefined,
    };

    try {
      const content = await fetchFileContent(item.owner, item.repo, item.path);
      fileContent.value = content;
      showFileDialog.value = true;

      const repoMatch = repos.value.find(
        (r) => r.owner === item.owner && r.repo === item.repo,
      );
      if (repoMatch !== undefined) {
        currentRepo.value = repoMatch;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load file";
      sdk.window.showToast(message, { variant: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  const createCollection = async () => {
    if (newCollectionName.value.trim().length === 0) {
      sdk.window.showToast("Collection name is required", { variant: "error" });
      return;
    }

    const result = await sdk.backend.createCollection(
      newCollectionName.value.trim(),
      newCollectionDescription.value.trim(),
    );
    if (result.kind === "Ok") {
      collections.value = result.value;
      saveToLocalStorage(STORAGE_KEYS.COLLECTIONS, collections.value);
      await addLogEntry(
        "success",
        "Collection Created",
        `New collection "${newCollectionName.value.trim()}" has been created successfully. You can now add payload files to this collection for organized access.`,
        {
          collectionName: newCollectionName.value.trim(),
        },
      );
      newCollectionName.value = "";
      newCollectionDescription.value = "";
      sdk.window.showToast("Collection created", { variant: "success" });
    } else {
      await addLogEntry(
        "error",
        "Collection Creation Failed",
        `Unable to create collection. Error: ${result.error}. Please check if a collection with this name already exists.`,
      );
      sdk.window.showToast(result.error, { variant: "error" });
    }
  };

  const deleteCollection = async (collectionId: string) => {
    const collection = collections.value.find((c) => c.id === collectionId);
    const collectionName = collection?.name ?? collectionId;

    collections.value = collections.value.filter((c) => c.id !== collectionId);
    saveToLocalStorage(STORAGE_KEYS.COLLECTIONS, collections.value);

    collectionItems.value = collectionItems.value.filter(
      (item) => item.collectionId !== collectionId,
    );
    saveToLocalStorage(STORAGE_KEYS.COLLECTION_ITEMS, collectionItems.value);

    if (selectedCollection.value?.id === collectionId) {
      selectedCollection.value = undefined;
      viewState.value = "collections";
    }

    await sdk.backend.deleteCollection(collectionId);
    await addLogEntry(
      "info",
      "Collection Deleted",
      `Collection "${collectionName}" and all its items have been permanently deleted. This action cannot be undone.`,
      {
        collectionId,
        collectionName,
      },
    );

    sdk.window.showToast("Collection deleted", { variant: "success" });
  };

  const openCollectionDialog = () => {
    showCollectionDialog.value = true;
  };

  const addToCollection = async (collection: Collection) => {
    if (!selectedFile.value) {
      sdk.window.showToast("No file selected", { variant: "error" });
      return;
    }
    if (!currentRepo.value) {
      sdk.window.showToast("No repository selected", { variant: "error" });
      return;
    }

    const newItem: CollectionItem = {
      collectionId: collection.id,
      owner: currentRepo.value.owner,
      repo: currentRepo.value.repo,
      path: selectedFile.value.path,
      name: selectedFile.value.name,
    };

    const exists = collectionItems.value.some(
      (ci) =>
        ci.collectionId === collection.id &&
        ci.owner === newItem.owner &&
        ci.repo === newItem.repo &&
        ci.path === newItem.path,
    );

    if (exists) {
      sdk.window.showToast("Item already in collection", { variant: "info" });
      return;
    }

    try {
      await fetchFileContent(newItem.owner, newItem.repo, newItem.path);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to validate file";
      sdk.window.showToast(`Cannot add file: ${message}`, {
        variant: "error",
      });
      return;
    }

    await sdk.backend.addToCollection(
      collection.id,
      currentRepo.value.owner,
      currentRepo.value.repo,
      selectedFile.value.path,
      selectedFile.value.name,
    );

    collectionItems.value = [...collectionItems.value, newItem];
    saveToLocalStorage(STORAGE_KEYS.COLLECTION_ITEMS, collectionItems.value);
    sdk.window.showToast(`Added to "${collection.name}"`, {
      variant: "success",
    });
    showCollectionDialog.value = false;
  };

  const removeFromCollection = async (item: CollectionItem) => {
    if (!selectedCollection.value) return;

    await sdk.backend.removeFromCollection(
      selectedCollection.value.id,
      item.owner,
      item.repo,
      item.path,
    );

    collectionItems.value = collectionItems.value.filter(
      (ci) =>
        !(
          ci.collectionId === selectedCollection.value?.id &&
          ci.owner === item.owner &&
          ci.repo === item.repo &&
          ci.path === item.path
        ),
    );
    saveToLocalStorage(STORAGE_KEYS.COLLECTION_ITEMS, collectionItems.value);

    currentCollectionItems.value = collectionItems.value.filter(
      (ci) => ci.collectionId === selectedCollection.value?.id,
    );

    sdk.window.showToast("Removed from collection", { variant: "success" });
  };

  const openCollection = (collection: Collection) => {
    selectedCollection.value = collection;
    currentCollectionItems.value = collectionItems.value.filter(
      (ci) => ci.collectionId === collection.id,
    );
    selectedCollectionItems.value = new Set();
    viewState.value = "collection-detail";
  };

  const getItemKey = (item: CollectionItem): string => {
    return `${item.owner}/${item.repo}/${item.path}`;
  };

  const toggleCollectionItemSelection = (item: CollectionItem) => {
    const key = getItemKey(item);
    if (selectedCollectionItems.value.has(key)) {
      selectedCollectionItems.value.delete(key);
    } else {
      selectedCollectionItems.value.add(key);
    }
    selectedCollectionItems.value = new Set(selectedCollectionItems.value);
  };

  const isCollectionItemSelected = (item: CollectionItem): boolean => {
    return selectedCollectionItems.value.has(getItemKey(item));
  };

  const selectAllCollectionItems = () => {
    if (
      selectedCollectionItems.value.size === currentCollectionItems.value.length
    ) {
      selectedCollectionItems.value = new Set();
    } else {
      selectedCollectionItems.value = new Set(
        currentCollectionItems.value.map((item) => getItemKey(item)),
      );
    }
  };

  const getSelectedItems = (collectionId?: string): CollectionItem[] => {
    if (selectedCollectionItems.value.size === 0) {
      return currentCollectionItems.value;
    }

    const sourceItems =
      collectionId !== undefined
        ? collectionItems.value.filter((ci) => ci.collectionId === collectionId)
        : currentCollectionItems.value;

    return sourceItems.filter((item) =>
      selectedCollectionItems.value.has(getItemKey(item)),
    );
  };

  const viewCollectionFile = async (item: CollectionItem) => {
    isLoading.value = true;
    selectedFile.value = {
      name: item.name,
      path: item.path,
      type: "file",
      sha: "",
      size: 0,
      downloadUrl: undefined,
    };

    try {
      const content = await fetchFileContent(item.owner, item.repo, item.path);
      fileContent.value = content;
      showFileDialog.value = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      sdk.window.showToast(message, { variant: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  const getCollectionItemCount = (collectionId: string): number => {
    return collectionItems.value.filter(
      (ci) => ci.collectionId === collectionId,
    ).length;
  };

  const exportCollectionAsWordlist = async (
    collection: Collection,
    useSelected = false,
  ) => {
    const items = useSelected
      ? getSelectedItems(collection.id)
      : collectionItems.value.filter((ci) => ci.collectionId === collection.id);

    if (items.length === 0) {
      sdk.window.showToast("No items to export", { variant: "warning" });
      return;
    }

    isLoading.value = true;
    const allPayloads: string[] = [];
    let successCount = 0;
    let failCount = 0;
    const failedFiles: string[] = [];

    try {
      for (const item of items) {
        try {
          const content = await fetchFileContent(
            item.owner,
            item.repo,
            item.path,
          );
          const lines = content
            .split("\n")
            .filter((line) => line.trim().length > 0);
          for (const line of lines) {
            allPayloads.push(line);
          }
          successCount++;
        } catch (error) {
          failCount++;
          failedFiles.push(item.name);
          console.error(
            `Failed to fetch ${item.owner}/${item.repo}/${item.path}:`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      if (allPayloads.length === 0) {
        sdk.window.showToast("No payloads could be fetched", {
          variant: "error",
        });
        return;
      }

      const uniquePayloads = [...new Set(allPayloads)];
      const blob = new Blob([uniquePayloads.join("\n")], {
        type: "text/plain",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${collection.name.replace(/\s+/g, "-").toLowerCase()}-wordlist.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      let message =
        failCount > 0
          ? `Exported ${uniquePayloads.length} payloads (${successCount} files succeeded, ${failCount} failed)`
          : `Exported ${uniquePayloads.length} payloads from ${successCount} files`;

      if (failCount > 0 && failedFiles.length > 0) {
        console.warn("Failed files:", failedFiles.join(", "));
        if (failedFiles.length <= 3) {
          message += `. Failed: ${failedFiles.join(", ")}`;
        }
      }

      sdk.window.showToast(message, {
        variant: failCount > 0 ? "warning" : "success",
        duration: failCount > 0 ? 7000 : 4000,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to export";
      sdk.window.showToast(message, { variant: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  const copyCollectionToClipboard = async (
    collection: Collection,
    useSelected = false,
  ) => {
    const items = useSelected
      ? getSelectedItems(collection.id)
      : collectionItems.value.filter((ci) => ci.collectionId === collection.id);

    if (items.length === 0) {
      sdk.window.showToast("No items to copy", { variant: "warning" });
      return;
    }

    isLoading.value = true;
    const allPayloads: string[] = [];
    let successCount = 0;
    let failCount = 0;

    try {
      for (const item of items) {
        try {
          const content = await fetchFileContent(
            item.owner,
            item.repo,
            item.path,
          );
          const lines = content
            .split("\n")
            .filter((line) => line.trim().length > 0);
          for (const line of lines) {
            allPayloads.push(line);
          }
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to fetch ${item.name}:`, error);
        }
      }

      if (allPayloads.length === 0) {
        sdk.window.showToast("No payloads could be fetched", {
          variant: "error",
        });
        return;
      }

      const uniquePayloads = [...new Set(allPayloads)];
      await navigator.clipboard.writeText(uniquePayloads.join("\n"));

      const message =
        failCount > 0
          ? `Copied ${uniquePayloads.length} payloads (${failCount} files failed)`
          : `Copied ${uniquePayloads.length} payloads to clipboard`;

      sdk.window.showToast(message, {
        variant: failCount > 0 ? "warning" : "success",
      });
    } catch (error) {
      sdk.window.showToast("Failed to copy", { variant: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  const sendToAutomate = async (
    collection: Collection,
    useSelected = false,
  ) => {
    const items = useSelected
      ? getSelectedItems(collection.id)
      : collectionItems.value.filter((ci) => ci.collectionId === collection.id);

    if (items.length === 0) {
      sdk.window.showToast("No items to send", { variant: "warning" });
      return;
    }

    isLoading.value = true;
    const allPayloads: string[] = [];
    let failCount = 0;

    try {
      for (const item of items) {
        try {
          const content = await fetchFileContent(
            item.owner,
            item.repo,
            item.path,
          );
          const lines = content
            .split("\n")
            .filter((line) => line.trim().length > 0);
          for (const line of lines) {
            allPayloads.push(line);
          }
        } catch (error) {
          failCount++;
          console.error(`Failed to fetch ${item.name}:`, error);
        }
      }

      if (allPayloads.length === 0) {
        sdk.window.showToast("No payloads could be fetched", {
          variant: "error",
        });
        return;
      }

      const uniquePayloads = [...new Set(allPayloads)];
      await navigator.clipboard.writeText(uniquePayloads.join("\n"));

      const message =
        failCount > 0
          ? `${uniquePayloads.length} payloads copied (${failCount} files failed)! Select "Simple List" in Automate and paste`
          : `${uniquePayloads.length} payloads copied! Select "Simple List" in Automate and paste`;

      sdk.window.showToast(message, {
        variant: failCount > 0 ? "warning" : "success",
      });

      sdk.navigation.goTo("/automate");
    } catch (error) {
      sdk.window.showToast("Failed to prepare payloads", { variant: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  const saveCollectionToFile = async (
    collection: Collection,
    useSelected = false,
  ) => {
    const items = useSelected
      ? getSelectedItems(collection.id)
      : collectionItems.value.filter((ci) => ci.collectionId === collection.id);

    if (items.length === 0) {
      sdk.window.showToast("No items to save", { variant: "warning" });
      return;
    }

    isLoading.value = true;
    const allPayloads: string[] = [];
    let failCount = 0;

    try {
      for (const item of items) {
        try {
          const content = await fetchFileContent(
            item.owner,
            item.repo,
            item.path,
          );
          const lines = content
            .split("\n")
            .filter((line) => line.trim().length > 0);
          for (const line of lines) {
            allPayloads.push(line);
          }
        } catch (error) {
          failCount++;
          console.error(`Failed to fetch ${item.name}:`, error);
        }
      }

      if (allPayloads.length === 0) {
        sdk.window.showToast("No payloads could be fetched", {
          variant: "error",
        });
        return;
      }

      const uniquePayloads = [...new Set(allPayloads)];
      const filename = `${collection.name.replace(/\s+/g, "-").toLowerCase()}.txt`;

      const blob = new Blob([uniquePayloads.join("\n")], {
        type: "text/plain",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const message =
        failCount > 0
          ? `Saved ${filename} with ${uniquePayloads.length} payloads (${failCount} files failed). Use "Hosted File" in Automate.`
          : `Saved ${filename} with ${uniquePayloads.length} payloads. Use "Hosted File" in Automate to load it.`;

      sdk.window.showToast(message, {
        variant: failCount > 0 ? "warning" : "success",
      });
    } catch (error) {
      sdk.window.showToast("Failed to save file", { variant: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  const exportCollections = () => {
    if (collections.value.length === 0) {
      sdk.window.showToast("No collections to export", { variant: "warning" });
      return;
    }

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      collections: collections.value,
      collectionItems: collectionItems.value,
    };

    const blob = new Blob([JSON.stringify(exportData, undefined, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `repo-collections-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    sdk.window.showToast(
      `Exported ${collections.value.length} collections with ${collectionItems.value.length} items`,
      { variant: "success" },
    );
  };

  const importCollections = async (file: File) => {
    let hasSuccess = false;
    try {
      let text = await file.text();

      if (text.trim().length === 0) {
        sdk.window.showToast("File is empty", {
          variant: "error",
        });
        return;
      }

      text = sanitizeImportedData(text);

      let data;
      try {
        data = JSON.parse(text) as {
          version?: number;
          collections?: Array<{
            id?: string;
            name?: string;
            description?: string;
            createdAt?: number;
          }>;
          collectionItems?: CollectionItem[];
        };
      } catch (parseError) {
        sdk.window.showToast(
          `Invalid JSON format: ${parseError instanceof Error ? parseError.message : "Parse error"}`,
          {
            variant: "error",
          },
        );
        return;
      }

      if (data.collections === undefined || !Array.isArray(data.collections)) {
        sdk.window.showToast(
          "Invalid collections file format - missing 'collections' array",
          {
            variant: "error",
          },
        );
        return;
      }

      if (data.collections.length === 0) {
        sdk.window.showToast("No collections found in file", {
          variant: "info",
        });
        return;
      }

      let importedCollections = 0;
      let skippedCollections = 0;
      let importedItems = 0;
      const errors: string[] = [];

      for (const col of data.collections) {
        try {
          if (
            col !== null &&
            col !== undefined &&
            typeof col.name === "string" &&
            col.name !== null &&
            col.name.trim().length > 0
          ) {
            const exists = collections.value.some(
              (c) => c.name.toLowerCase() === col.name.trim().toLowerCase(),
            );
            if (!exists) {
              const newId = `col-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
              collections.value.push({
                id: newId,
                name: col.name.trim(),
                description:
                  typeof col.description === "string" &&
                  col.description !== null
                    ? col.description.trim()
                    : "",
                createdAt:
                  typeof col.createdAt === "number"
                    ? col.createdAt
                    : Date.now(),
              });

              if (
                data.collectionItems !== undefined &&
                Array.isArray(data.collectionItems)
              ) {
                const colItems = data.collectionItems.filter(
                  (item) => item.collectionId === col.id,
                );
                for (const item of colItems) {
                  try {
                    if (
                      item !== null &&
                      item !== undefined &&
                      typeof item.owner === "string" &&
                      item.owner !== null &&
                      item.owner.trim().length > 0 &&
                      typeof item.repo === "string" &&
                      item.repo !== null &&
                      item.repo.trim().length > 0 &&
                      typeof item.path === "string" &&
                      item.path !== null &&
                      item.path.trim().length > 0 &&
                      typeof item.name === "string" &&
                      item.name !== null &&
                      item.name.trim().length > 0
                    ) {
                      collectionItems.value.push({
                        collectionId: newId,
                        owner: item.owner.trim(),
                        repo: item.repo.trim(),
                        path: item.path.trim(),
                        name: item.name.trim(),
                        note:
                          typeof item.note === "string" && item.note !== null
                            ? item.note.trim()
                            : undefined,
                      });
                      importedItems++;
                    } else {
                      errors.push(
                        `Skipped item in "${col.name}": missing required fields`,
                      );
                    }
                  } catch (itemErr) {
                    errors.push(
                      `Error importing item in "${col.name}": ${itemErr instanceof Error ? itemErr.message : "Unknown error"}`,
                    );
                  }
                }
              }

              importedCollections++;
            } else {
              skippedCollections++;
            }
          } else {
            const name =
              col !== null &&
              col !== undefined &&
              typeof col.name === "string" &&
              col.name !== null
                ? col.name
                : "Unknown";
            errors.push(`${name}: missing name`);
          }
        } catch (err) {
          const name =
            col !== null &&
            col !== undefined &&
            typeof col.name === "string" &&
            col.name !== null
              ? col.name
              : "Unknown";
          errors.push(
            `${name}: ${err instanceof Error ? err.message : "Import error"}`,
          );
        }
      }

      if (importedCollections > 0 || importedItems > 0) {
        hasSuccess = true;
        saveToLocalStorage(STORAGE_KEYS.COLLECTIONS, collections.value);
        saveToLocalStorage(
          STORAGE_KEYS.COLLECTION_ITEMS,
          collectionItems.value,
        );
        let message = `Imported ${importedCollections} collection(s) with ${importedItems} item(s)`;
        if (skippedCollections > 0) {
          message += `, skipped ${skippedCollections} duplicate collection(s)`;
        }
        sdk.window.showToast(message, { variant: "success" });

        if (errors.length > 0) {
          sdk.window.showToast(`Note: ${errors.length} item(s) had errors`, {
            variant: "warning",
          });
        }
      } else if (skippedCollections > 0) {
        hasSuccess = true;
        sdk.window.showToast(
          `All ${skippedCollections} collections already exist`,
          { variant: "info" },
        );
      } else if (errors.length > 0) {
        sdk.window.showToast(
          `Import failed: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? "..." : ""}`,
          { variant: "error" },
        );
      }
    } catch (error) {
      if (!hasSuccess) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        sdk.window.showToast(`Failed to import collections: ${errorMessage}`, {
          variant: "error",
        });
      }
    }
  };

  const triggerCollectionImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        importCollections(file);
      }
    };
    input.click();
  };

  const toggleFavoriteItemSelection = (favoriteId: string) => {
    if (selectedFavoriteItems.value.has(favoriteId)) {
      selectedFavoriteItems.value.delete(favoriteId);
    } else {
      selectedFavoriteItems.value.add(favoriteId);
    }
  };

  const isFavoriteItemSelected = (favoriteId: string): boolean => {
    return selectedFavoriteItems.value.has(favoriteId);
  };

  const selectAllFavoriteItems = () => {
    if (selectedFavoriteItems.value.size === filteredFavorites.value.length) {
      selectedFavoriteItems.value.clear();
    } else {
      selectedFavoriteItems.value.clear();
      filteredFavorites.value.forEach((fav) =>
        selectedFavoriteItems.value.add(fav.id),
      );
    }
  };

  const getSelectedFavorites = (): Favorite[] => {
    return filteredFavorites.value.filter((fav) =>
      selectedFavoriteItems.value.has(fav.id),
    );
  };

  const sendFavoritesToAutomate = async (useSelected = false) => {
    const items = useSelected
      ? getSelectedFavorites()
      : filteredFavorites.value;

    if (items.length === 0) {
      sdk.window.showToast("No favorites to send", { variant: "warning" });
      return;
    }

    isLoading.value = true;
    const allPayloads: string[] = [];
    let failCount = 0;

    try {
      for (const item of items) {
        try {
          const content = await fetchFileContent(
            item.owner,
            item.repo,
            item.path,
          );
          const lines = content
            .split("\n")
            .filter((line) => line.trim().length > 0);
          for (const line of lines) {
            allPayloads.push(line);
          }
        } catch (error) {
          failCount++;
          console.error(`Failed to fetch ${item.name}:`, error);
        }
      }

      if (allPayloads.length === 0) {
        sdk.window.showToast("No payloads could be fetched", {
          variant: "error",
        });
        return;
      }

      const uniquePayloads = [...new Set(allPayloads)];
      await navigator.clipboard.writeText(uniquePayloads.join("\n"));

      sdk.navigation.goTo("/automate");

      const message =
        failCount > 0
          ? `Copied ${uniquePayloads.length} payloads (${failCount} files failed) - paste into Simple List`
          : `Copied ${uniquePayloads.length} payloads to clipboard - paste into Simple List`;

      sdk.window.showToast(message, {
        variant: failCount > 0 ? "warning" : "success",
        duration: 5000,
      });
    } catch (error) {
      sdk.window.showToast("Failed to prepare payloads", { variant: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  const saveFavoritesToFile = async (useSelected = false) => {
    const items = useSelected
      ? getSelectedFavorites()
      : filteredFavorites.value;

    if (items.length === 0) {
      sdk.window.showToast("No favorites to save", { variant: "warning" });
      return;
    }

    isLoading.value = true;
    const allPayloads: string[] = [];
    let successCount = 0;
    let failCount = 0;

    try {
      for (const item of items) {
        try {
          const content = await fetchFileContent(
            item.owner,
            item.repo,
            item.path,
          );
          const lines = content
            .split("\n")
            .filter((line) => line.trim().length > 0);
          for (const line of lines) {
            allPayloads.push(line);
          }
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to fetch ${item.name}:`, error);
        }
      }

      if (allPayloads.length === 0) {
        sdk.window.showToast("No payloads could be fetched", {
          variant: "error",
        });
        return;
      }

      const uniquePayloads = [...new Set(allPayloads)];
      const blob = new Blob([uniquePayloads.join("\n")], {
        type: "text/plain",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `favorites-wordlist.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const message =
        failCount > 0
          ? `Exported ${uniquePayloads.length} payloads (${successCount} files succeeded, ${failCount} failed)`
          : `Exported ${uniquePayloads.length} payloads from ${successCount} files`;

      sdk.window.showToast(message, {
        variant: failCount > 0 ? "warning" : "success",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to export";
      sdk.window.showToast(message, { variant: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  const validateCollection = async (collection: Collection) => {
    const items = collectionItems.value.filter(
      (ci) => ci.collectionId === collection.id,
    );

    if (items.length === 0) {
      sdk.window.showToast("Collection is empty", { variant: "info" });
      return;
    }

    isLoading.value = true;
    const invalidItems: CollectionItem[] = [];

    try {
      for (const item of items) {
        try {
          await fetchFileContent(item.owner, item.repo, item.path);
        } catch (error) {
          invalidItems.push(item);
          console.error(
            `Invalid item: ${item.owner}/${item.repo}/${item.path}:`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      if (invalidItems.length === 0) {
        sdk.window.showToast(
          `✓ All ${items.length} items are valid and accessible`,
          { variant: "success" },
        );
      } else {
        const removeInvalid = confirm(
          `Found ${invalidItems.length} invalid items out of ${items.length}.\n\nRemove them from the collection?\n\nInvalid items:\n${invalidItems.map((i) => i.name).join("\n")}`,
        );

        if (removeInvalid) {
          for (const item of invalidItems) {
            await sdk.backend.removeFromCollection(
              collection.id,
              item.owner,
              item.repo,
              item.path,
            );
          }

          collectionItems.value = collectionItems.value.filter(
            (ci) =>
              !invalidItems.some(
                (inv) =>
                  inv.collectionId === ci.collectionId &&
                  inv.owner === ci.owner &&
                  inv.repo === ci.repo &&
                  inv.path === ci.path,
              ),
          );

          if (
            selectedCollection.value !== undefined &&
            selectedCollection.value.id === collection.id
          ) {
            currentCollectionItems.value = collectionItems.value.filter(
              (ci) => ci.collectionId === collection.id,
            );
          }

          sdk.window.showToast(
            `Removed ${invalidItems.length} invalid items. ${items.length - invalidItems.length} items remain.`,
            { variant: "success" },
          );
        }
      }
    } catch (error) {
      sdk.window.showToast("Failed to validate collection", {
        variant: "error",
      });
    } finally {
      isLoading.value = false;
    }
  };

  const searchGitHubRepos = async (page = 1) => {
    if (repoSearchQuery.value.length < 2) {
      repoSearchResults.value = [];
      repoSearchCurrentPage.value = 1;
      repoSearchTotalCount.value = 0;
      return;
    }

    isSearchingRepos.value = true;
    repoSearchCurrentPage.value = page;

    try {
      const query = encodeURIComponent(repoSearchQuery.value);
      const url = `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=${repoSearchResultsPerPage.value}&page=${page}`;

      const response = await fetch(url, {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      repoSearchResults.value = data.items !== undefined ? data.items : [];
      repoSearchTotalCount.value =
        data.total_count !== undefined ? Math.min(data.total_count, 1000) : 0;

      if (repoSearchResults.value.length > 0) {
        const totalPages = Math.ceil(
          repoSearchTotalCount.value / repoSearchResultsPerPage.value,
        );
        sdk.window.showToast(
          `Page ${page} of ${totalPages} (${repoSearchTotalCount.value} total)`,
          {
            variant: "success",
          },
        );
      }
    } catch (error) {
      sdk.window.showToast("Failed to search repositories", {
        variant: "error",
      });
      repoSearchResults.value = [];
      repoSearchTotalCount.value = 0;
    } finally {
      isSearchingRepos.value = false;
    }
  };

  const scrollToTop = () => {
    const container = document.querySelector(".main-content");
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const repoSearchTotalPages = computed(() => {
    if (repoSearchResultsPerPage.value === 0) return 0;
    return Math.ceil(
      repoSearchTotalCount.value / repoSearchResultsPerPage.value,
    );
  });

  const canGoToNextPage = computed(() => {
    return repoSearchCurrentPage.value < repoSearchTotalPages.value;
  });

  const canGoToPreviousPage = computed(() => {
    return repoSearchCurrentPage.value > 1;
  });

  const goToNextPage = async () => {
    if (canGoToNextPage.value) {
      scrollToTop();
      await searchGitHubRepos(repoSearchCurrentPage.value + 1);
    }
  };

  const goToPreviousPage = async () => {
    if (canGoToPreviousPage.value) {
      scrollToTop();
      await searchGitHubRepos(repoSearchCurrentPage.value - 1);
    }
  };

  const addRepoFromSearch = async (repo: GitHubRepoSearchResult) => {
    const exists = repos.value.some(
      (r) => r.owner === repo.owner.login && r.repo === repo.name,
    );

    if (exists) {
      sdk.window.showToast("Repository already added", { variant: "info" });
      return;
    }

    const result = await sdk.backend.addRepo(
      repo.owner.login,
      repo.name,
      repo.name,
    );

    if (result.kind === "Ok") {
      repos.value = result.value;
      sdk.window.showToast(`Added ${repo.full_name}`, { variant: "success" });
    } else {
      sdk.window.showToast(result.error, { variant: "error" });
    }
  };

  const viewRepoSearch = () => {
    viewState.value = "repo-search";
    repoSearchQuery.value = "";
    repoSearchResults.value = [];
  };

  watch(
    favorites,
    (newFavorites) => {
      saveToLocalStorage(STORAGE_KEYS.FAVORITES, newFavorites);
    },
    { deep: true },
  );

  watch(
    collections,
    (newCollections) => {
      saveToLocalStorage(STORAGE_KEYS.COLLECTIONS, newCollections);
    },
    { deep: true },
  );

  watch(
    collectionItems,
    (newItems) => {
      saveToLocalStorage(STORAGE_KEYS.COLLECTION_ITEMS, newItems);
    },
    { deep: true },
  );

  watch(
    tags,
    (newTags) => {
      saveToLocalStorage(STORAGE_KEYS.TAGS, newTags);
    },
    { deep: true },
  );

  watch(
    taggedItems,
    (newTaggedItems) => {
      saveToLocalStorage(STORAGE_KEYS.TAGGED_ITEMS, newTaggedItems);
    },
    { deep: true },
  );

  watch(
    logs,
    (newLogs) => {
      saveToLocalStorage(STORAGE_KEYS.LOGS, newLogs);
    },
    { deep: true },
  );

  watch(
    customPayloads,
    (newPayloads) => {
      saveToLocalStorage(STORAGE_KEYS.CUSTOM_PAYLOADS, newPayloads);
    },
    { deep: true },
  );

  onMounted(() => {
    loadRepos();
    loadTags();
    loadCollections();
    loadHistory();
    loadLogs();
    loadCustomPayloads();
  });

  return {
    viewState,
    currentRepo,
    repos,
    categories,
    currentPath,
    currentContents,
    breadcrumbs,
    searchQuery,
    globalSearchQuery,
    isLoading,
    isSearching,
    fileContent,
    selectedFile,
    showFileDialog,
    showSettings,
    newRepoUrl,
    addRepoError,
    favorites,
    searchResults,
    filteredCategories,
    filteredContents,
    isFavorite,
    onSearchKeyup,
    clearSearch,
    openSearchResult,
    openCategory,
    openItem,
    viewFavoriteFile,
    goBack,
    switchRepo,
    addNewRepo,
    removeRepo,
    setDefault,
    toggleFavorite,
    removeFavorite,
    getFileIcon,
    formatFileSize,
    copyToClipboard,
    exportFavorites,
    triggerImport,
    tags,
    settingsTab,
    newTagName,
    newTagColor,
    selectedItemTags,
    showTagDialog,
    filterTag,
    filteredFavorites,
    taggedFiles,
    addTag,
    removeTag,
    openTagDialog,
    toggleItemTag,
    getTagsForItem,
    setFilterTag,
    collections,
    selectedCollection,
    currentCollectionItems,
    showCollectionDialog,
    newCollectionName,
    newCollectionDescription,
    selectedCollectionItems,
    createCollection,
    deleteCollection,
    openCollectionDialog,
    addToCollection,
    removeFromCollection,
    openCollection,
    viewCollectionFile,
    getCollectionItemCount,
    exportCollectionAsWordlist,
    copyCollectionToClipboard,
    toggleCollectionItemSelection,
    isCollectionItemSelected,
    selectAllCollectionItems,
    viewCollections,
    sendToAutomate,
    saveCollectionToFile,
    exportCollections,
    importCollections,
    triggerCollectionImport,
    selectedFavoriteItems,
    toggleFavoriteItemSelection,
    isFavoriteItemSelected,
    selectAllFavoriteItems,
    sendFavoritesToAutomate,
    saveFavoritesToFile,
    repoSearchQuery,
    repoSearchResults,
    isSearchingRepos,
    repoSearchResultsPerPage,
    repoSearchCurrentPage,
    repoSearchTotalCount,
    repoSearchTotalPages,
    searchGitHubRepos,
    goToNextPage,
    goToPreviousPage,
    canGoToNextPage,
    canGoToPreviousPage,
    addRepoFromSearch,
    viewRepoSearch,
    validateCollection,
    history,
    viewHistory,
    viewHistoryFile,
    clearAllHistory,
    fileCache,
    clearCache,
    showNoteDialog,
    editingNoteItem,
    noteEditValue,
    openNoteDialog,
    saveNote,
    logs,
    viewLogs,
    addLogEntry,
    clearAllLogs,
    selectedBulkItems,
    bulkSelectionMode,
    toggleBulkSelectionMode,
    toggleBulkItemSelection,
    isBulkItemSelected,
    selectAllInView,
    clearBulkSelection,
    bulkToggleFavorite,
    bulkAddToCollection,
    bulkApplyTag,
    customPayloads,
    showCustomPayloadDialog,
    showCustomPayloadViewDialog,
    viewingCustomPayload,
    editingCustomPayload,
    newCustomPayloadName,
    newCustomPayloadContent,
    newCustomPayloadDescription,
    loadCustomPayloads,
    openCustomPayloadDialog,
    saveCustomPayload,
    deleteCustomPayload,
    copyCustomPayloadToClipboard,
    exportCustomPayloads,
    importCustomPayloads,
    triggerCustomPayloadImport,
    viewCustomPayloads,
    viewCustomPayload,
    exportCustomPayloadAsFile,
  };
};
