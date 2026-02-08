/ packages/backend/src/index.ts
var DEFAULT_REPO = {
  owner: "swisskyrepo",
  repo: "PayloadsAllTheThings",
  name: "PayloadsAllTheThings",
  isDefault: true
};
var DEFAULT_TAGS = [
  { id: "tag-xss", name: "XSS", color: "#ef4444" },
  { id: "tag-sqli", name: "SQLi", color: "#f97316" },
  { id: "tag-lfi", name: "LFI", color: "#eab308" },
  { id: "tag-rce", name: "RCE", color: "#22c55e" },
  { id: "tag-ssrf", name: "SSRF", color: "#3b82f6" }
];
var savedRepos = [DEFAULT_REPO];
var favorites = [];
var tags = [...DEFAULT_TAGS];
var taggedItems = [];
var collections = [];
var collectionItems = [];
var history = [];
var logs = [];
var MAX_HISTORY_ITEMS = 50;
var MAX_LOG_ITEMS = 500;
var STORAGE_KEYS = {
  REPOS: "repo-explorer-repos",
  FAVORITES: "repo-explorer-favorites",
  TAGS: "repo-explorer-tags",
  TAGGED_ITEMS: "repo-explorer-tagged-items",
  COLLECTIONS: "repo-explorer-collections",
  COLLECTION_ITEMS: "repo-explorer-collection-items",
  HISTORY: "repo-explorer-history",
  LOGS: "repo-explorer-logs"
};
var storageData = {};
var saveToStorage = (sdk, key, data) => {
  try {
    const jsonData = JSON.stringify(data);
    storageData[key] = jsonData;
    sdk.console.log(
      `Saved ${key}: ${Array.isArray(data) ? data.length : "1"} items`
    );
  } catch (error) {
    sdk.console.error(`Failed to save ${key}:`, error);
  }
};
var loadFromStorage = (sdk, key, defaultValue) => {
  try {
    const stored = storageData[key];
    if (stored !== void 0) {
      const parsed = JSON.parse(stored);
      sdk.console.log(
        `Loaded ${key}: ${Array.isArray(parsed) ? parsed.length : "1"} items`
      );
      return parsed;
    }
    sdk.console.log(`No data found for ${key}, using defaults`);
  } catch (error) {
    sdk.console.error(`Failed to load ${key}:`, error);
  }
  return defaultValue;
};
var getRepos = () => {
  return { kind: "Ok", value: savedRepos };
};
var addRepo = (sdk, owner, repo, name) => {
  const exists = savedRepos.some((r) => r.owner === owner && r.repo === repo);
  if (exists) {
    return { kind: "Error", error: "Repository already exists" };
  }
  const newRepo = {
    owner,
    repo,
    name: name.length > 0 ? name : repo,
    isDefault: savedRepos.length === 0
  };
  savedRepos.push(newRepo);
  saveToStorage(sdk, STORAGE_KEYS.REPOS, savedRepos);
  sdk.console.log(`Added repo: ${owner}/${repo}`);
  return { kind: "Ok", value: savedRepos };
};
var removeRepo = (sdk, owner, repo) => {
  const index = savedRepos.findIndex(
    (r) => r.owner === owner && r.repo === repo
  );
  if (index === -1) {
    return { kind: "Error", error: "Repository not found" };
  }
  const wasDefault = savedRepos[index]?.isDefault === true;
  savedRepos.splice(index, 1);
  if (wasDefault && savedRepos.length > 0 && savedRepos[0] !== void 0) {
    savedRepos[0].isDefault = true;
  }
  saveToStorage(sdk, STORAGE_KEYS.REPOS, savedRepos);
  sdk.console.log(`Removed repo: ${owner}/${repo}`);
  return { kind: "Ok", value: savedRepos };
};
var setDefaultRepo = (sdk, owner, repo) => {
  const targetRepo = savedRepos.find(
    (r) => r.owner === owner && r.repo === repo
  );
  if (!targetRepo) {
    return { kind: "Error", error: "Repository not found" };
  }
  savedRepos = savedRepos.map((r) => ({
    ...r,
    isDefault: r.owner === owner && r.repo === repo
  }));
  saveToStorage(sdk, STORAGE_KEYS.REPOS, savedRepos);
  sdk.console.log(`Set default repo: ${owner}/${repo}`);
  return { kind: "Ok", value: savedRepos };
};
var getFavorites = () => {
  return { kind: "Ok", value: favorites };
};
var addFavorite = (sdk, owner, repo, path, name, note) => {
  const id = `${owner}/${repo}/${path}`;
  const exists = favorites.some((f) => f.id === id);
  if (exists) {
    return { kind: "Error", error: "Already in favorites" };
  }
  const favorite = {
    id,
    owner,
    repo,
    path,
    name,
    addedAt: Date.now(),
    note: note !== void 0 && note.length > 0 ? note : void 0
  };
  favorites.push(favorite);
  saveToStorage(sdk, STORAGE_KEYS.FAVORITES, favorites);
  sdk.console.log(`Added favorite: ${path}`);
  return { kind: "Ok", value: favorites };
};
var removeFavorite = (sdk, id) => {
  const index = favorites.findIndex((f) => f.id === id);
  if (index === -1) {
    return { kind: "Error", error: "Favorite not found" };
  }
  favorites.splice(index, 1);
  saveToStorage(sdk, STORAGE_KEYS.FAVORITES, favorites);
  sdk.console.log(`Removed favorite: ${id}`);
  return { kind: "Ok", value: favorites };
};
var getTags = () => {
  return { kind: "Ok", value: tags };
};
var addTag = (sdk, name, color) => {
  const exists = tags.some((t) => t.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    return { kind: "Error", error: "Tag already exists" };
  }
  const newTag = {
    id: `tag-${Date.now()}`,
    name,
    color
  };
  tags.push(newTag);
  saveToStorage(sdk, STORAGE_KEYS.TAGS, tags);
  sdk.console.log(`Added tag: ${name}`);
  return { kind: "Ok", value: tags };
};
var removeTag = (sdk, tagId) => {
  const index = tags.findIndex((t) => t.id === tagId);
  if (index === -1) {
    return { kind: "Error", error: "Tag not found" };
  }
  tags.splice(index, 1);
  let i = taggedItems.length;
  while (i--) {
    if (taggedItems[i]?.tagId === tagId) {
      taggedItems.splice(i, 1);
    }
  }
  saveToStorage(sdk, STORAGE_KEYS.TAGS, tags);
  saveToStorage(sdk, STORAGE_KEYS.TAGGED_ITEMS, taggedItems);
  sdk.console.log(`Removed tag: ${tagId}`);
  return { kind: "Ok", value: tags };
};
var updateTag = (sdk, tagId, name, color) => {
  const tag = tags.find((t) => t.id === tagId);
  if (!tag) {
    return { kind: "Error", error: "Tag not found" };
  }
  tag.name = name;
  tag.color = color;
  saveToStorage(sdk, STORAGE_KEYS.TAGS, tags);
  sdk.console.log(`Updated tag: ${tagId}`);
  return { kind: "Ok", value: tags };
};
var getTaggedItems = () => {
  return { kind: "Ok", value: taggedItems };
};
var assignTag = (sdk, itemId, tagId) => {
  const exists = taggedItems.some(
    (ti) => ti.itemId === itemId && ti.tagId === tagId
  );
  if (exists) {
    return { kind: "Ok", value: taggedItems };
  }
  taggedItems.push({ itemId, tagId });
  saveToStorage(sdk, STORAGE_KEYS.TAGGED_ITEMS, taggedItems);
  sdk.console.log(`Assigned tag ${tagId} to ${itemId}`);
  return { kind: "Ok", value: taggedItems };
};
var unassignTag = (sdk, itemId, tagId) => {
  const index = taggedItems.findIndex(
    (ti) => ti.itemId === itemId && ti.tagId === tagId
  );
  if (index !== -1) {
    taggedItems.splice(index, 1);
    saveToStorage(sdk, STORAGE_KEYS.TAGGED_ITEMS, taggedItems);
    sdk.console.log(`Unassigned tag ${tagId} from ${itemId}`);
  }
  return { kind: "Ok", value: taggedItems };
};
var getItemTags = (itemId) => {
  const itemTagIds = taggedItems.filter((ti) => ti.itemId === itemId).map((ti) => ti.tagId);
  const itemTags = tags.filter((t) => itemTagIds.includes(t.id));
  return { kind: "Ok", value: itemTags };
};
var getCollections = () => {
  return { kind: "Ok", value: collections };
};
var createCollection = (sdk, name, description) => {
  const exists = collections.some(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  if (exists) {
    return { kind: "Error", error: "Collection already exists" };
  }
  const newCollection = {
    id: `col-${Date.now()}`,
    name,
    description,
    createdAt: Date.now()
  };
  collections.push(newCollection);
  saveToStorage(sdk, STORAGE_KEYS.COLLECTIONS, collections);
  sdk.console.log(`Created collection: ${name}`);
  return { kind: "Ok", value: collections };
};
var deleteCollection = (sdk, collectionId) => {
  const index = collections.findIndex((c) => c.id === collectionId);
  if (index === -1) {
    return { kind: "Error", error: "Collection not found" };
  }
  collections.splice(index, 1);
  let i = collectionItems.length;
  while (i--) {
    if (collectionItems[i]?.collectionId === collectionId) {
      collectionItems.splice(i, 1);
    }
  }
  saveToStorage(sdk, STORAGE_KEYS.COLLECTIONS, collections);
  saveToStorage(sdk, STORAGE_KEYS.COLLECTION_ITEMS, collectionItems);
  sdk.console.log(`Deleted collection: ${collectionId}`);
  return { kind: "Ok", value: collections };
};
var getCollectionItems = (collectionId) => {
  const items = collectionItems.filter(
    (ci) => ci.collectionId === collectionId
  );
  return { kind: "Ok", value: items };
};
var addToCollection = (sdk, collectionId, owner, repo, path, name, note) => {
  const exists = collectionItems.some(
    (ci) => ci.collectionId === collectionId && ci.owner === owner && ci.repo === repo && ci.path === path
  );
  if (exists) {
    return { kind: "Error", error: "Item already in collection" };
  }
  collectionItems.push({
    collectionId,
    owner,
    repo,
    path,
    name,
    note: note !== void 0 && note.length > 0 ? note : void 0
  });
  saveToStorage(sdk, STORAGE_KEYS.COLLECTION_ITEMS, collectionItems);
  sdk.console.log(`Added to collection: ${path}`);
  return {
    kind: "Ok",
    value: collectionItems.filter((ci) => ci.collectionId === collectionId)
  };
};
var removeFromCollection = (sdk, collectionId, owner, repo, path) => {
  const index = collectionItems.findIndex(
    (ci) => ci.collectionId === collectionId && ci.owner === owner && ci.repo === repo && ci.path === path
  );
  if (index !== -1) {
    collectionItems.splice(index, 1);
    saveToStorage(sdk, STORAGE_KEYS.COLLECTION_ITEMS, collectionItems);
    sdk.console.log(`Removed from collection: ${path}`);
  }
  return {
    kind: "Ok",
    value: collectionItems.filter((ci) => ci.collectionId === collectionId)
  };
};
var getAllCollectionItems = () => {
  return { kind: "Ok", value: collectionItems };
};
var getHistory = () => {
  return { kind: "Ok", value: history.slice().reverse() };
};
var addToHistory = (sdk, owner, repo, path, name, action) => {
  const id = `${owner}/${repo}/${path}`;
  const existingIndex = history.findIndex(
    (h) => h.id === id && h.action === action
  );
  if (existingIndex !== -1) {
    history.splice(existingIndex, 1);
  }
  const newItem = {
    id,
    owner,
    repo,
    path,
    name,
    accessedAt: Date.now(),
    action
  };
  history.push(newItem);
  if (history.length > MAX_HISTORY_ITEMS) {
    history.shift();
  }
  saveToStorage(sdk, STORAGE_KEYS.HISTORY, history);
  sdk.console.log(`Added to history: ${path} (${action})`);
  return { kind: "Ok", value: history.slice().reverse() };
};
var clearHistory = (sdk) => {
  history.length = 0;
  saveToStorage(sdk, STORAGE_KEYS.HISTORY, history);
  sdk.console.log("Cleared history");
  return { kind: "Ok", value: [] };
};
var updateFavoriteNote = (sdk, id, note) => {
  const favorite = favorites.find((f) => f.id === id);
  if (!favorite) {
    return { kind: "Error", error: "Favorite not found" };
  }
  favorite.note = note.length > 0 ? note : void 0;
  saveToStorage(sdk, STORAGE_KEYS.FAVORITES, favorites);
  sdk.console.log(`Updated favorite note: ${id}`);
  return { kind: "Ok", value: favorites };
};
var updateTagDescription = (sdk, tagId, description) => {
  const tag = tags.find((t) => t.id === tagId);
  if (!tag) {
    return { kind: "Error", error: "Tag not found" };
  }
  tag.description = description.length > 0 ? description : void 0;
  saveToStorage(sdk, STORAGE_KEYS.TAGS, tags);
  sdk.console.log(`Updated tag description: ${tagId}`);
  return { kind: "Ok", value: tags };
};
var updateCollectionDescription = (sdk, collectionId, description) => {
  const collection = collections.find((c) => c.id === collectionId);
  if (!collection) {
    return { kind: "Error", error: "Collection not found" };
  }
  collection.description = description;
  saveToStorage(sdk, STORAGE_KEYS.COLLECTIONS, collections);
  sdk.console.log(`Updated collection description: ${collectionId}`);
  return { kind: "Ok", value: collections };
};
var updateCollectionItemNote = (sdk, collectionId, owner, repo, path, note) => {
  const item = collectionItems.find(
    (ci) => ci.collectionId === collectionId && ci.owner === owner && ci.repo === repo && ci.path === path
  );
  if (!item) {
    return { kind: "Error", error: "Collection item not found" };
  }
  item.note = note.length > 0 ? note : void 0;
  saveToStorage(sdk, STORAGE_KEYS.COLLECTION_ITEMS, collectionItems);
  sdk.console.log(`Updated collection item note: ${path}`);
  return {
    kind: "Ok",
    value: collectionItems.filter((ci) => ci.collectionId === collectionId)
  };
};
var getLogs = () => {
  return { kind: "Ok", value: logs.slice().reverse() };
};
var addLog = (sdk, level, action, details, metadata) => {
  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    level,
    action,
    details,
    metadata
  };
  logs.push(newLog);
  if (logs.length > MAX_LOG_ITEMS) {
    logs.shift();
  }
  saveToStorage(sdk, STORAGE_KEYS.LOGS, logs);
  return { kind: "Ok", value: logs.slice().reverse() };
};
var clearLogs = (sdk) => {
  logs.length = 0;
  saveToStorage(sdk, STORAGE_KEYS.LOGS, logs);
  sdk.console.log("Cleared logs");
  return { kind: "Ok", value: [] };
};
var loadAllData = (sdk) => {
  const loadedRepos = loadFromStorage(sdk, STORAGE_KEYS.REPOS, [DEFAULT_REPO]);
  savedRepos.length = 0;
  savedRepos.push(...loadedRepos);
  const loadedFavorites = loadFromStorage(sdk, STORAGE_KEYS.FAVORITES, []);
  favorites.length = 0;
  favorites.push(...loadedFavorites);
  const loadedTags = loadFromStorage(sdk, STORAGE_KEYS.TAGS, [...DEFAULT_TAGS]);
  tags.length = 0;
  tags.push(...loadedTags);
  const loadedTaggedItems = loadFromStorage(sdk, STORAGE_KEYS.TAGGED_ITEMS, []);
  taggedItems.length = 0;
  taggedItems.push(...loadedTaggedItems);
  const loadedCollections = loadFromStorage(sdk, STORAGE_KEYS.COLLECTIONS, []);
  collections.length = 0;
  collections.push(...loadedCollections);
  const loadedCollectionItems = loadFromStorage(
    sdk,
    STORAGE_KEYS.COLLECTION_ITEMS,
    []
  );
  collectionItems.length = 0;
  collectionItems.push(...loadedCollectionItems);
  const loadedHistory = loadFromStorage(sdk, STORAGE_KEYS.HISTORY, []);
  history.length = 0;
  history.push(...loadedHistory);
  const loadedLogs = loadFromStorage(sdk, STORAGE_KEYS.LOGS, []);
  logs.length = 0;
  logs.push(...loadedLogs);
  sdk.console.log("RepoExplorer data loaded from storage");
  sdk.console.log(`Default repo loaded: ${savedRepos[0]?.name}`);
  sdk.console.log(`Loaded ${logs.length} log entries`);
};
function init(sdk) {
  loadAllData(sdk);
  sdk.api.register("getRepos", getRepos);
  sdk.api.register("addRepo", addRepo);
  sdk.api.register("removeRepo", removeRepo);
  sdk.api.register("setDefaultRepo", setDefaultRepo);
  sdk.api.register("getFavorites", getFavorites);
  sdk.api.register("addFavorite", addFavorite);
  sdk.api.register("removeFavorite", removeFavorite);
  sdk.api.register("updateFavoriteNote", updateFavoriteNote);
  sdk.api.register("getTags", getTags);
  sdk.api.register("addTag", addTag);
  sdk.api.register("removeTag", removeTag);
  sdk.api.register("updateTag", updateTag);
  sdk.api.register("updateTagDescription", updateTagDescription);
  sdk.api.register("getTaggedItems", getTaggedItems);
  sdk.api.register("assignTag", assignTag);
  sdk.api.register("unassignTag", unassignTag);
  sdk.api.register("getItemTags", getItemTags);
  sdk.api.register("getCollections", getCollections);
  sdk.api.register("createCollection", createCollection);
  sdk.api.register("deleteCollection", deleteCollection);
  sdk.api.register("updateCollectionDescription", updateCollectionDescription);
  sdk.api.register("getCollectionItems", getCollectionItems);
  sdk.api.register("addToCollection", addToCollection);
  sdk.api.register("removeFromCollection", removeFromCollection);
  sdk.api.register("updateCollectionItemNote", updateCollectionItemNote);
  sdk.api.register("getAllCollectionItems", getAllCollectionItems);
  sdk.api.register("getHistory", getHistory);
  sdk.api.register("addToHistory", addToHistory);
  sdk.api.register("clearHistory", clearHistory);
  sdk.api.register("getLogs", getLogs);
  sdk.api.register("addLog", addLog);
  sdk.api.register("clearLogs", clearLogs);
  sdk.console.log("RepoExplorer plugin initialized");
}
export {
  init
};
