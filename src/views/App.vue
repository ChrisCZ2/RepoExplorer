<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import ColorPicker from "primevue/colorpicker";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import ProgressSpinner from "primevue/progressspinner";
import Select from "primevue/select";
import { onMounted, onUnmounted } from "vue";

import { useRepoExplorer } from "@/composables/useRepoExplorer";

const {
  viewState,
  currentRepo,
  repos,
  breadcrumbs,
  searchQuery,
  globalSearchQuery,
  isLoading,
  fileContent,
  selectedFile,
  showFileDialog,
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
} = useRepoExplorer();

const openInNewTab = (url: string) => {
  window.open(url, "_blank");
};

const handleRepoNavigate = (event: Event) => {
  const customEvent = event as CustomEvent<string>;
  const view = customEvent.detail;

  if (view === "favorites") {
    viewState.value = "favorites";
  } else if (view === "collections") {
    viewCollections();
  } else if (view === "history") {
    viewHistory();
  } else if (view === "logs") {
    viewLogs();
  } else if (view === "repo-search") {
    viewRepoSearch();
  } else if (view === "settings") {
    viewState.value = "settings";
  }
};

const handleRepoAction = (event: Event) => {
  const customEvent = event as CustomEvent<string>;
  const action = customEvent.detail;

  if (action === "export-favorites") {
    exportFavorites();
  } else if (action === "export-collections") {
    exportCollections();
  } else if (action === "clear-cache") {
    clearCache();
  } else if (action === "clear-history") {
    clearAllHistory();
  } else if (action === "clear-logs") {
    clearAllLogs();
  }
};

onMounted(() => {
  window.addEventListener("repo-navigate", handleRepoNavigate);
  window.addEventListener("repo-action", handleRepoAction);
});

onUnmounted(() => {
  window.removeEventListener("repo-navigate", handleRepoNavigate);
  window.removeEventListener("repo-action", handleRepoAction);
});
</script>

<template>
  <div class="repo-container">
    <header class="repo-header">
      <div class="header-left">
        <Button
          v-if="
            viewState === 'detail' ||
            viewState === 'search' ||
            viewState === 'favorites' ||
            viewState === 'settings' ||
            viewState === 'tagged' ||
            viewState === 'collections' ||
            viewState === 'collection-detail' ||
            viewState === 'repo-search' ||
            viewState === 'history' ||
            viewState === 'logs'
          "
          icon="fas fa-arrow-left"
          text
          class="back-btn"
          @click="goBack"
        />
        <div class="logo-section">
          <i class="fas fa-layer-group logo-icon"></i>
          <span class="logo-text">RepoExplorer</span>
        </div>
      </div>

      <div class="header-center">
        <div class="global-search-box">
          <i class="fas fa-search global-search-icon"></i>
          <InputText
            v-model="globalSearchQuery"
            placeholder="Search all files..."
            class="global-search-input"
            @keyup="onSearchKeyup"
          />
          <Button
            v-if="globalSearchQuery.length > 0"
            icon="fas fa-times"
            text
            size="small"
            class="clear-search-btn"
            @click="clearSearch"
          />
        </div>
      </div>

      <div class="header-right">
        <div class="cache-indicator" :title="`${fileCache.size} files cached`">
          <i class="fas fa-database"></i>
          <span>{{ fileCache.size }}</span>
        </div>
        <Button
          icon="fas fa-star"
          text
          class="action-btn"
          :class="{ 'has-items': favorites.length > 0 }"
          title="Favorites (Alt+F)"
          @click="viewState = 'favorites'"
        />
        <Button
          icon="fas fa-layer-group"
          text
          class="action-btn"
          :class="{ 'has-items': collections.length > 0 }"
          title="Collections"
          @click="viewCollections"
        />
        <Button
          icon="fas fa-history"
          text
          class="action-btn"
          :class="{ 'has-items': history.length > 0 }"
          title="Recent Files"
          @click="viewHistory"
        />
        <Button
          icon="fas fa-list-alt"
          text
          class="action-btn"
          :class="{ 'has-items': logs.length > 0 }"
          title="Action Logs"
          @click="viewLogs"
        />
        <Button
          icon="fas fa-search-plus"
          text
          class="action-btn"
          title="Find Repositories"
          @click="viewRepoSearch"
        />
        <div class="filter-box">
          <i class="fas fa-filter filter-icon"></i>
          <InputText
            v-model="searchQuery"
            placeholder="Filter..."
            class="filter-input"
          />
        </div>
        <Select
          v-if="tags.length > 0"
          :model-value="filterTag"
          :options="[{ id: '', name: 'All Tags', color: '#71717a' }, ...tags]"
          option-label="name"
          placeholder="Tag"
          class="tag-filter-dropdown"
          @update:model-value="
            (val) =>
              setFilterTag(
                val?.id !== '' && val !== undefined ? val : undefined,
              )
          "
        >
          <template #value="slotProps">
            <div v-if="slotProps.value" class="tag-dropdown-value">
              <span
                class="tag-dropdown-dot"
                :style="{ backgroundColor: slotProps.value.color }"
              ></span>
              <span>{{ slotProps.value.name }}</span>
            </div>
            <span v-else>Tag</span>
          </template>
          <template #option="slotProps">
            <div class="tag-dropdown-option">
              <span
                class="tag-dropdown-dot"
                :style="{ backgroundColor: slotProps.option.color }"
              ></span>
              <span>{{ slotProps.option.name }}</span>
            </div>
          </template>
        </Select>
        <Select
          v-if="repos.length > 0"
          :model-value="currentRepo"
          :options="repos"
          option-label="name"
          placeholder="Select Repo"
          class="repo-dropdown"
          @update:model-value="switchRepo"
        >
          <template #value="slotProps">
            <div v-if="slotProps.value" class="repo-dropdown-value">
              <i class="fas fa-code-branch"></i>
              <span>{{ slotProps.value.name }}</span>
            </div>
            <span v-else>Select Repo</span>
          </template>
          <template #option="slotProps">
            <div class="repo-dropdown-option">
              <i class="fas fa-code-branch"></i>
              <span>{{ slotProps.option.name }}</span>
              <span v-if="slotProps.option.isDefault" class="default-tag">
                default
              </span>
            </div>
          </template>
        </Select>
        <Button
          icon="fas fa-cog"
          text
          class="settings-btn"
          title="Settings"
          @click="viewState = 'settings'"
        />
      </div>
    </header>

    <main class="repo-main">
      <div v-if="isLoading" class="loading-state">
        <ProgressSpinner />
        <p>Loading...</p>
      </div>

      <template v-else-if="viewState === 'categories'">
        <div class="categories-header">
          <h2>
            <i class="fas fa-layer-group"></i>
            Payload Categories
          </h2>
          <span class="category-count">
            {{ filteredCategories.length }} categories
          </span>
        </div>

        <div class="categories-grid">
          <Card
            v-for="category in filteredCategories"
            :key="category.path"
            class="category-card"
            @click="openCategory(category)"
          >
            <template #content>
              <div class="category-content">
                <div class="category-icon-wrapper">
                  <i class="fas fa-folder category-icon"></i>
                </div>
                <h3 class="category-name">
                  {{ category.name.replace(/-/g, " ").replace(/_/g, " ") }}
                </h3>
              </div>
            </template>
          </Card>
        </div>

        <div
          v-if="filteredCategories.length === 0 && !isLoading"
          class="empty-state"
        >
          <i class="fas fa-search"></i>
          <p v-if="searchQuery.length > 0">
            No categories found matching "{{ searchQuery }}"
          </p>
          <p v-else>
            No categories loaded. Check your connection or try another
            repository.
          </p>
        </div>
      </template>

      <template v-else-if="viewState === 'detail'">
        <div class="detail-header">
          <h2>
            <i class="fas fa-folder-open"></i>
            {{ breadcrumbs[breadcrumbs.length - 1]?.label ?? "Files" }}
          </h2>
          <div class="header-actions">
            <Button
              :icon="bulkSelectionMode ? 'fas fa-times' : 'fas fa-check-square'"
              :label="bulkSelectionMode ? 'Cancel' : 'Select'"
              size="small"
              text
              @click="toggleBulkSelectionMode"
            />
            <span class="file-count">{{ filteredContents.length }} items</span>
          </div>
        </div>

        <div
          v-if="bulkSelectionMode && selectedBulkItems.size > 0"
          class="bulk-actions-bar"
        >
          <div class="bulk-info">
            <i class="fas fa-check-circle"></i>
            <span>{{ selectedBulkItems.size }} selected</span>
          </div>
          <div class="bulk-actions">
            <Button
              icon="fas fa-check-double"
              label="Select All"
              size="small"
              text
              @click="selectAllInView"
            />
            <Button
              icon="fas fa-star"
              label="Add to Favorites"
              size="small"
              text
              @click="bulkToggleFavorite(true)"
            />
            <Select
              v-if="collections.length > 0"
              :model-value="undefined"
              :options="collections"
              option-label="name"
              option-value="id"
              placeholder="Add to Collection"
              class="bulk-collection-select"
              @change="(e) => bulkAddToCollection(e.value)"
            />
            <Select
              v-if="tags.length > 0"
              :model-value="undefined"
              :options="tags"
              option-label="name"
              option-value="id"
              placeholder="Apply Tag"
              class="bulk-tag-select"
              @change="(e) => bulkApplyTag(e.value)"
            />
            <Button
              icon="fas fa-times"
              label="Clear"
              size="small"
              severity="secondary"
              text
              @click="clearBulkSelection"
            />
          </div>
        </div>

        <div class="file-list">
          <div
            v-for="item in filteredContents"
            :key="item.path"
            class="file-item"
            :class="{
              'is-dir': item.type === 'dir',
              'is-selected':
                bulkSelectionMode &&
                item.type === 'file' &&
                currentRepo &&
                isBulkItemSelected(
                  `${currentRepo.owner}/${currentRepo.repo}/${item.path}`,
                ),
            }"
            @click="
              bulkSelectionMode && item.type === 'file'
                ? toggleBulkItemSelection(
                    `${currentRepo.owner}/${currentRepo.repo}/${item.path}`,
                  )
                : openItem(item)
            "
          >
            <input
              v-if="bulkSelectionMode && item.type === 'file'"
              type="checkbox"
              :checked="
                currentRepo &&
                isBulkItemSelected(
                  `${currentRepo.owner}/${currentRepo.repo}/${item.path}`,
                )
              "
              class="bulk-checkbox"
              @click.stop="
                toggleBulkItemSelection(
                  `${currentRepo.owner}/${currentRepo.repo}/${item.path}`,
                )
              "
            />
            <i :class="getFileIcon(item)" class="file-icon"></i>
            <span class="file-name">{{ item.name }}</span>
            <span v-if="item.type === 'file'" class="file-size">
              {{ formatFileSize(item.size) }}
            </span>
            <i
              v-if="item.type === 'dir'"
              class="fas fa-chevron-right file-arrow"
            ></i>
          </div>
        </div>

        <div v-if="filteredContents.length === 0" class="empty-state">
          <i class="fas fa-folder-open"></i>
          <p>No files found</p>
        </div>
      </template>

      <template v-else-if="viewState === 'search'">
        <div class="detail-header">
          <h2>
            <i class="fas fa-search"></i>
            Results for "{{ globalSearchQuery }}"
          </h2>
          <div class="header-actions">
            <Button
              :icon="bulkSelectionMode ? 'fas fa-times' : 'fas fa-check-square'"
              :label="bulkSelectionMode ? 'Cancel' : 'Select'"
              size="small"
              text
              @click="toggleBulkSelectionMode"
            />
            <span class="file-count">{{ searchResults.length }} matches</span>
          </div>
        </div>

        <div
          v-if="bulkSelectionMode && selectedBulkItems.size > 0"
          class="bulk-actions-bar"
        >
          <div class="bulk-info">
            <i class="fas fa-check-circle"></i>
            <span>{{ selectedBulkItems.size }} selected</span>
          </div>
          <div class="bulk-actions">
            <Button
              icon="fas fa-check-double"
              label="Select All"
              size="small"
              text
              @click="selectAllInView"
            />
            <Button
              icon="fas fa-star"
              label="Add to Favorites"
              size="small"
              text
              @click="bulkToggleFavorite(true)"
            />
            <Select
              v-if="collections.length > 0"
              :model-value="undefined"
              :options="collections"
              option-label="name"
              option-value="id"
              placeholder="Add to Collection"
              class="bulk-collection-select"
              @change="(e) => bulkAddToCollection(e.value)"
            />
            <Select
              v-if="tags.length > 0"
              :model-value="undefined"
              :options="tags"
              option-label="name"
              option-value="id"
              placeholder="Apply Tag"
              class="bulk-tag-select"
              @change="(e) => bulkApplyTag(e.value)"
            />
            <Button
              icon="fas fa-times"
              label="Clear"
              size="small"
              severity="secondary"
              text
              @click="clearBulkSelection"
            />
          </div>
        </div>

        <div class="file-list">
          <div
            v-for="result in searchResults"
            :key="result.path"
            class="file-item search-result"
            :class="{
              'is-selected':
                bulkSelectionMode &&
                currentRepo &&
                isBulkItemSelected(
                  `${currentRepo.owner}/${currentRepo.repo}/${result.path}`,
                ),
            }"
            @click="
              bulkSelectionMode
                ? toggleBulkItemSelection(
                    `${currentRepo.owner}/${currentRepo.repo}/${result.path}`,
                  )
                : openSearchResult(result)
            "
          >
            <input
              v-if="bulkSelectionMode"
              type="checkbox"
              :checked="
                currentRepo &&
                isBulkItemSelected(
                  `${currentRepo.owner}/${currentRepo.repo}/${result.path}`,
                )
              "
              class="bulk-checkbox"
              @click.stop="
                toggleBulkItemSelection(
                  `${currentRepo.owner}/${currentRepo.repo}/${result.path}`,
                )
              "
            />
            <i class="fas fa-file-alt file-icon"></i>
            <div class="search-result-info">
              <span class="file-name">{{ result.name }}</span>
              <span class="file-path">{{ result.path }}</span>
            </div>
          </div>
        </div>

        <div v-if="searchResults.length === 0" class="empty-state">
          <i class="fas fa-search"></i>
          <p v-if="globalSearchQuery.length < 2">
            Type at least 2 characters to search
          </p>
          <p v-else>No files found matching "{{ globalSearchQuery }}"</p>
        </div>
      </template>

      <template v-else-if="viewState === 'favorites'">
        <div class="detail-header">
          <h2>
            <i class="fas fa-star"></i>
            Your Favorites
          </h2>
          <div class="favorites-actions">
            <span class="file-count">{{ filteredFavorites.length }} items</span>
            <Select
              v-if="tags.length > 0"
              :model-value="filterTag"
              :options="[
                { id: '', name: 'All Tags', color: '#71717a' },
                ...tags,
              ]"
              option-label="name"
              placeholder="Filter by tag"
              class="tag-filter-select"
              @update:model-value="
                (val) =>
                  setFilterTag(
                    val?.id !== '' && val !== undefined ? val : undefined,
                  )
              "
            >
              <template #value="slotProps">
                <div v-if="slotProps.value" class="tag-select-value">
                  <span
                    class="tag-dot"
                    :style="{ backgroundColor: slotProps.value.color }"
                  ></span>
                  <span>{{ slotProps.value.name }}</span>
                </div>
                <span v-else>Filter by tag</span>
              </template>
              <template #option="slotProps">
                <div class="tag-select-option">
                  <span
                    class="tag-dot"
                    :style="{ backgroundColor: slotProps.option.color }"
                  ></span>
                  <span>{{ slotProps.option.name }}</span>
                </div>
              </template>
            </Select>
            <Button
              icon="fas fa-file-import"
              label="Import"
              text
              size="small"
              title="Import favorites from file"
              @click="triggerImport"
            />
            <Button
              icon="fas fa-file-export"
              label="Export"
              text
              size="small"
              :disabled="favorites.length === 0"
              title="Export favorites to file"
              @click="exportFavorites"
            />
          </div>
        </div>

        <div
          v-if="filteredFavorites.length > 0"
          class="collection-selection-bar"
        >
          <div class="selection-info">
            <Button
              :icon="
                selectedFavoriteItems.size === filteredFavorites.length
                  ? 'fas fa-check-square'
                  : 'far fa-square'
              "
              text
              size="small"
              @click="selectAllFavoriteItems"
            />
            <span>
              {{ selectedFavoriteItems.size }} of
              {{ filteredFavorites.length }} selected
            </span>
          </div>
          <div v-if="selectedFavoriteItems.size > 0" class="selection-actions">
            <Button
              icon="fas fa-bolt"
              label="Send to Automate"
              size="small"
              @click="sendFavoritesToAutomate(true)"
            />
            <Button
              icon="fas fa-download"
              label="Save for Hosted File"
              text
              size="small"
              @click="saveFavoritesToFile(true)"
            />
          </div>
        </div>

        <div v-if="filteredFavorites.length > 0" class="file-list">
          <div
            v-for="fav in filteredFavorites"
            :key="fav.id"
            class="file-item favorite-item"
            :class="{ selected: isFavoriteItemSelected(fav.id) }"
          >
            <div class="item-checkbox">
              <Button
                :icon="
                  isFavoriteItemSelected(fav.id)
                    ? 'fas fa-check-square'
                    : 'far fa-square'
                "
                text
                size="small"
                @click.stop="toggleFavoriteItemSelection(fav.id)"
              />
            </div>
            <i class="fas fa-file-alt file-icon"></i>
            <div class="favorite-info" @click="viewFavoriteFile(fav)">
              <span class="file-name">{{ fav.name }}</span>
              <span class="file-path">
                {{ fav.owner }}/{{ fav.repo }}/{{ fav.path }}
              </span>
              <div v-if="getTagsForItem(fav.id).length > 0" class="item-tags">
                <span
                  v-for="tag in getTagsForItem(fav.id)"
                  :key="tag.id"
                  class="item-tag"
                  :style="{
                    backgroundColor: tag.color + '25',
                    color: tag.color,
                    borderColor: tag.color + '50',
                  }"
                >
                  {{ tag.name }}
                </span>
              </div>
              <div v-if="fav.note" class="item-note">
                <i class="fas fa-sticky-note"></i>
                <span>{{ fav.note }}</span>
              </div>
            </div>
            <Button
              :icon="fav.note ? 'fas fa-edit' : 'far fa-sticky-note'"
              text
              size="small"
              :title="fav.note ? 'Edit note' : 'Add note'"
              @click.stop="openNoteDialog({ type: 'favorite', item: fav })"
            />
            <Button
              icon="fas fa-trash"
              text
              size="small"
              severity="danger"
              title="Remove from favorites"
              @click.stop="removeFavorite(fav)"
            />
          </div>
        </div>

        <div v-else class="empty-state">
          <i class="fas fa-star"></i>
          <p v-if="filterTag">No favorites with tag "{{ filterTag.name }}"</p>
          <p v-else>
            No favorites yet. Open a file and click the star to add it!
          </p>
        </div>
      </template>

      <template v-else-if="viewState === 'tagged'">
        <div class="detail-header">
          <h2>
            <i class="fas fa-tag" :style="{ color: filterTag?.color }"></i>
            Files tagged "{{ filterTag?.name }}"
          </h2>
          <span class="file-count">{{ taggedFiles.length }} files</span>
        </div>

        <div v-if="taggedFiles.length > 0" class="file-list">
          <div
            v-for="item in taggedFiles"
            :key="item.path"
            class="file-item"
            @click="openItem(item)"
          >
            <i class="fas fa-file-alt file-icon"></i>
            <div class="tagged-file-info">
              <span class="file-name">{{ item.name }}</span>
              <span class="file-path">{{ item.path }}</span>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <i
            class="fas fa-tag"
            :style="{ color: filterTag?.color, opacity: 0.5 }"
          ></i>
          <p>No files tagged with "{{ filterTag?.name }}"</p>
          <span class="empty-hint"
            >Open files and click the Tags button to assign this tag</span
          >
        </div>
      </template>

      <template v-else-if="viewState === 'collections'">
        <div class="detail-header">
          <h2>
            <i class="fas fa-layer-group"></i>
            Your Collections
          </h2>
          <div class="collections-header-actions">
            <span class="file-count">{{ collections.length }} collections</span>
            <Button
              icon="fas fa-file-export"
              text
              size="small"
              title="Export Collections"
              @click="exportCollections"
            />
            <Button
              icon="fas fa-file-import"
              text
              size="small"
              title="Import Collections"
              @click="triggerCollectionImport"
            />
          </div>
        </div>

        <div v-if="collections.length > 0" class="collections-grid">
          <Card
            v-for="collection in collections"
            :key="collection.id"
            class="collection-card"
            @click="openCollection(collection)"
          >
            <template #content>
              <div class="collection-card-content">
                <div class="collection-card-header">
                  <div class="collection-icon-wrapper">
                    <i class="fas fa-layer-group"></i>
                  </div>
                  <div class="collection-info">
                    <h3>{{ collection.name }}</h3>
                    <p v-if="collection.description">
                      {{ collection.description }}
                    </p>
                    <span class="collection-count">
                      {{ getCollectionItemCount(collection.id) }} payloads
                    </span>
                  </div>
                </div>
                <div class="collection-actions" @click.stop>
                  <Button
                    icon="fas fa-edit"
                    text
                    size="small"
                    title="Edit description"
                    @click="
                      openNoteDialog({ type: 'collection', item: collection })
                    "
                  />
                  <Button
                    icon="fas fa-paste"
                    text
                    size="small"
                    title="Use in Automate (Simple List)"
                    class="automate-btn"
                    @click="sendToAutomate(collection)"
                  />
                  <Button
                    icon="fas fa-file-export"
                    text
                    size="small"
                    title="Save for Hosted File"
                    @click="saveCollectionToFile(collection)"
                  />
                  <Button
                    icon="fas fa-copy"
                    text
                    size="small"
                    title="Copy all payloads"
                    @click="copyCollectionToClipboard(collection)"
                  />
                  <Button
                    icon="fas fa-trash"
                    text
                    size="small"
                    severity="danger"
                    title="Delete collection"
                    @click="deleteCollection(collection.id)"
                  />
                </div>
              </div>
            </template>
          </Card>
        </div>

        <div v-else class="empty-state">
          <i class="fas fa-layer-group"></i>
          <p>No collections yet</p>
          <span class="empty-hint"
            >Create collections in Settings to group payloads from multiple
            repos</span
          >
        </div>
      </template>

      <template v-else-if="viewState === 'collection-detail'">
        <div class="detail-header">
          <div class="collection-detail-title">
            <h2>
              <i class="fas fa-layer-group"></i>
              {{ selectedCollection?.name }}
            </h2>
            <p
              v-if="selectedCollection?.description"
              class="collection-description"
            >
              {{ selectedCollection.description }}
            </p>
          </div>
          <div class="collection-detail-actions">
            <Button
              v-if="selectedCollection"
              icon="fas fa-edit"
              label="Edit Description"
              size="small"
              text
              @click="
                openNoteDialog({ type: 'collection', item: selectedCollection })
              "
            />
            <span class="file-count">
              {{
                selectedCollectionItems.size > 0
                  ? `${selectedCollectionItems.size} selected`
                  : `${currentCollectionItems.length} payloads`
              }}
            </span>
            <Button
              v-if="selectedCollection"
              icon="fas fa-download"
              :label="
                selectedCollectionItems.size > 0
                  ? 'Export Selected'
                  : 'Export All'
              "
              size="small"
              text
              @click="
                exportCollectionAsWordlist(
                  selectedCollection,
                  selectedCollectionItems.size > 0,
                )
              "
            />
            <Button
              v-if="selectedCollection"
              icon="fas fa-copy"
              :label="
                selectedCollectionItems.size > 0 ? 'Copy Selected' : 'Copy All'
              "
              size="small"
              text
              @click="
                copyCollectionToClipboard(
                  selectedCollection,
                  selectedCollectionItems.size > 0,
                )
              "
            />
            <Button
              v-if="selectedCollection"
              icon="fas fa-paste"
              :label="
                selectedCollectionItems.size > 0
                  ? 'Use in Simple List'
                  : 'Use in Simple List'
              "
              size="small"
              severity="success"
              title="Copy payloads and open Automate - paste in Simple List"
              @click="
                sendToAutomate(
                  selectedCollection,
                  selectedCollectionItems.size > 0,
                )
              "
            />
            <Button
              v-if="selectedCollection"
              icon="fas fa-file-export"
              :label="
                selectedCollectionItems.size > 0
                  ? 'Save for Hosted File'
                  : 'Save for Hosted File'
              "
              size="small"
              text
              title="Save as .txt file for use with Hosted File option"
              @click="
                saveCollectionToFile(
                  selectedCollection,
                  selectedCollectionItems.size > 0,
                )
              "
            />
            <Button
              v-if="selectedCollection"
              icon="fas fa-check-circle"
              label="Validate"
              size="small"
              text
              severity="info"
              title="Check if all items in collection are accessible and remove invalid ones"
              @click="validateCollection(selectedCollection)"
            />
          </div>
        </div>

        <div
          v-if="currentCollectionItems.length > 0"
          class="collection-selection-controls"
        >
          <Button
            :icon="
              selectedCollectionItems.size === currentCollectionItems.length
                ? 'fas fa-check-square'
                : 'far fa-square'
            "
            :label="
              selectedCollectionItems.size === currentCollectionItems.length
                ? 'Deselect All'
                : 'Select All'
            "
            size="small"
            text
            @click="selectAllCollectionItems"
          />
          <span v-if="selectedCollectionItems.size > 0" class="selection-hint">
            Click items to toggle selection, or use Export/Copy buttons
          </span>
        </div>

        <div v-if="currentCollectionItems.length > 0" class="file-list">
          <div
            v-for="item in currentCollectionItems"
            :key="`${item.owner}/${item.repo}/${item.path}`"
            class="file-item collection-item-selectable"
            :class="{ 'is-selected': isCollectionItemSelected(item) }"
            @click="toggleCollectionItemSelection(item)"
          >
            <div class="collection-checkbox">
              <i
                :class="
                  isCollectionItemSelected(item)
                    ? 'fas fa-check-square'
                    : 'far fa-square'
                "
              ></i>
            </div>
            <i class="fas fa-file-alt file-icon"></i>
            <div
              class="collection-item-info"
              @click.stop="viewCollectionFile(item)"
            >
              <span class="file-name">{{ item.name }}</span>
              <span class="file-path"
                >{{ item.owner }}/{{ item.repo }}/{{ item.path }}</span
              >
              <div v-if="item.note" class="item-note">
                <i class="fas fa-sticky-note"></i>
                <span>{{ item.note }}</span>
              </div>
            </div>
            <Button
              :icon="item.note ? 'fas fa-edit' : 'far fa-sticky-note'"
              text
              size="small"
              :title="item.note ? 'Edit note' : 'Add note'"
              @click.stop="
                openNoteDialog({
                  type: 'collectionItem',
                  item,
                  collectionId: selectedCollection?.id ?? '',
                })
              "
            />
            <Button
              icon="fas fa-trash"
              text
              size="small"
              severity="danger"
              title="Remove from collection"
              @click.stop="removeFromCollection(item)"
            />
          </div>
        </div>

        <div v-else class="empty-state">
          <i class="fas fa-layer-group"></i>
          <p>This collection is empty</p>
          <span class="empty-hint"
            >Browse files and click "Add to Collection" to add payloads</span
          >
        </div>
      </template>

      <template v-else-if="viewState === 'repo-search'">
        <div class="detail-header">
          <h2>
            <i class="fas fa-search-plus"></i>
            Find Repositories
          </h2>
          <p class="search-description">
            Search for public GitHub repositories and add them to your
            collection
          </p>
        </div>

        <div class="repo-search-container">
          <div class="repo-search-box">
            <i class="fas fa-search"></i>
            <InputText
              v-model="repoSearchQuery"
              placeholder="Search GitHub repositories (e.g., 'xss wordlist', 'payloads', 'fuzzing')"
              class="repo-search-input"
              @keyup.enter="searchGitHubRepos"
            />
            <Select
              v-model="repoSearchResultsPerPage"
              :options="[25, 50, 100]"
              class="results-per-page-select"
              @update:model-value="
                (value) => {
                  repoSearchCurrentPage.value = 1;
                  if (repoSearchQuery.length >= 2) {
                    searchGitHubRepos(1);
                  }
                }
              "
            >
              <template #value="slotProps">
                {{ slotProps.value }} results
              </template>
              <template #option="slotProps">
                {{ slotProps.option }} results
              </template>
            </Select>
            <Button
              icon="fas fa-search"
              label="Search"
              :disabled="repoSearchQuery.length < 2"
              @click="searchGitHubRepos"
            />
          </div>

          <div v-if="isSearchingRepos" class="loading-spinner">
            <ProgressSpinner />
            <p>Searching GitHub...</p>
          </div>

          <div
            v-else-if="repoSearchResults.length > 0"
            class="repo-search-results"
          >
            <p class="results-count">
              Showing {{ repoSearchResults.length }} of
              {{ repoSearchTotalCount.toLocaleString() }} repositories
            </p>
            <div
              v-for="repo in repoSearchResults"
              :key="repo.id"
              class="repo-search-result-item"
            >
              <img
                :src="repo.owner.avatar_url"
                :alt="repo.owner.login"
                class="repo-avatar"
              />
              <div class="repo-info">
                <div class="repo-title">
                  <h3>{{ repo.full_name }}</h3>
                  <div class="repo-stats">
                    <span class="repo-stat">
                      <i class="fas fa-star"></i>
                      {{ repo.stargazers_count.toLocaleString() }}
                    </span>
                    <span v-if="repo.language" class="repo-language">
                      {{ repo.language }}
                    </span>
                  </div>
                </div>
                <p v-if="repo.description" class="repo-description">
                  {{ repo.description }}
                </p>
                <div
                  v-if="repo.topics && repo.topics.length > 0"
                  class="repo-topics"
                >
                  <span
                    v-for="topic in repo.topics.slice(0, 5)"
                    :key="topic"
                    class="repo-topic"
                  >
                    {{ topic }}
                  </span>
                </div>
              </div>
              <div class="repo-actions">
                <Button
                  v-if="
                    repos.some(
                      (r) =>
                        r.owner === repo.owner.login && r.repo === repo.name,
                    )
                  "
                  icon="fas fa-check"
                  label="Added"
                  disabled
                  size="small"
                />
                <Button
                  v-else
                  icon="fas fa-plus"
                  label="Add"
                  size="small"
                  @click="addRepoFromSearch(repo)"
                />
                <Button
                  icon="fas fa-external-link-alt"
                  text
                  size="small"
                  title="View on GitHub"
                  @click="() => openInNewTab(repo.html_url)"
                />
              </div>
            </div>

            <div
              v-if="repoSearchTotalCount > repoSearchResultsPerPage"
              class="pagination-controls"
            >
              <div class="pagination-info">
                <span class="page-counter">
                  Page {{ repoSearchCurrentPage }} of {{ repoSearchTotalPages }}
                </span>
                <span class="results-counter">
                  ({{ repoSearchTotalCount.toLocaleString() }} total
                  repositories)
                </span>
              </div>
              <div class="pagination-buttons">
                <Button
                  icon="fas fa-chevron-left"
                  label="Previous"
                  :disabled="!canGoToPreviousPage"
                  @click="goToPreviousPage"
                />
                <Button
                  icon="fas fa-chevron-right"
                  label="Next"
                  icon-pos="right"
                  :disabled="!canGoToNextPage"
                  @click="goToNextPage"
                />
              </div>
            </div>
          </div>

          <div
            v-else-if="repoSearchQuery.length >= 2 && !isSearchingRepos"
            class="empty-state"
          >
            <i class="fas fa-search"></i>
            <p>No repositories found</p>
            <span>Try different search terms</span>
          </div>

          <div v-else class="repo-search-help">
            <div class="help-section">
              <h3><i class="fas fa-lightbulb"></i> Search Tips</h3>
              <ul>
                <li>
                  <strong>Keywords:</strong> Try "xss payloads", "sqli
                  wordlist", "fuzzing"
                </li>
                <li>
                  <strong>Specific repos:</strong> Search by repository name
                  like "SecLists"
                </li>
                <li>
                  <strong>Popular:</strong> Results are sorted by stars (most
                  popular first)
                </li>
              </ul>
            </div>
            <div class="help-section">
              <h3><i class="fas fa-info-circle"></i> Popular Security Repos</h3>
              <p class="help-hint">
                Try searching for: <code>PayloadsAllTheThings</code>,
                <code>SecLists</code>, <code>fuzzdb</code>,
                <code>awesome-pentest</code>
              </p>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="viewState === 'history'">
        <div class="detail-header">
          <h2>
            <i class="fas fa-history"></i>
            Recent Files
          </h2>
          <div class="favorites-actions">
            <span class="file-count">{{ history.length }} items</span>
            <Button
              icon="fas fa-trash"
              label="Clear History"
              text
              size="small"
              severity="danger"
              :disabled="history.length === 0"
              title="Clear all history"
              @click="clearAllHistory"
            />
          </div>
        </div>

        <div v-if="history.length > 0" class="history-list">
          <div
            v-for="item in history"
            :key="`${item.id}-${item.accessedAt}`"
            class="history-item"
          >
            <div class="history-action-badge" :class="`action-${item.action}`">
              <i
                :class="{
                  'fas fa-eye': item.action === 'viewed',
                  'fas fa-copy': item.action === 'copied',
                  'fas fa-download': item.action === 'exported',
                }"
              ></i>
              {{ item.action }}
            </div>
            <i class="fas fa-file-alt file-icon"></i>
            <div class="history-info" @click="viewHistoryFile(item)">
              <span class="file-name">{{ item.name }}</span>
              <span class="file-path">
                {{ item.owner }}/{{ item.repo }}/{{ item.path }}
              </span>
              <span class="history-time">
                {{ new Date(item.accessedAt).toLocaleString() }}
              </span>
            </div>
            <div class="history-quick-actions">
              <Button
                icon="fas fa-eye"
                text
                size="small"
                title="View file"
                @click="viewHistoryFile(item)"
              />
              <Button
                v-if="!favorites.some((f) => f.id === item.id)"
                icon="fas fa-star"
                text
                size="small"
                title="Add to favorites"
                @click="
                  async () => {
                    const repo = repos.find(
                      (r) => r.owner === item.owner && r.repo === item.repo,
                    );
                    if (repo) {
                      currentRepo = repo;
                      selectedFile = {
                        name: item.name,
                        path: item.path,
                        type: 'file',
                        sha: '',
                        size: 0,
                        downloadUrl: undefined,
                      };
                      await toggleFavorite();
                    }
                  }
                "
              />
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <i class="fas fa-history"></i>
          <p>No recent files</p>
          <span>Files you view, copy, or export will appear here</span>
        </div>
      </template>

      <template v-else-if="viewState === 'logs'">
        <div class="detail-header">
          <h2>
            <i class="fas fa-list-alt"></i>
            Action Logs
          </h2>
          <div class="favorites-actions">
            <span class="file-count">{{ logs.length }} entries</span>
            <Button
              icon="fas fa-trash"
              label="Clear Logs"
              text
              size="small"
              severity="danger"
              :disabled="logs.length === 0"
              title="Clear all logs"
              @click="clearAllLogs"
            />
          </div>
        </div>

        <div v-if="logs.length > 0" class="logs-list">
          <div
            v-for="log in logs"
            :key="log.id"
            class="log-item"
            :class="`log-level-${log.level}`"
          >
            <div class="log-level-badge" :class="`level-${log.level}`">
              <i
                :class="{
                  'fas fa-info-circle': log.level === 'info',
                  'fas fa-check-circle': log.level === 'success',
                  'fas fa-exclamation-triangle': log.level === 'warning',
                  'fas fa-times-circle': log.level === 'error',
                }"
              ></i>
              {{ log.level }}
            </div>
            <div class="log-content">
              <div class="log-header">
                <span class="log-action">{{ log.action }}</span>
                <span class="log-time">
                  {{ new Date(log.timestamp).toLocaleString() }}
                </span>
              </div>
              <div v-if="log.details" class="log-details">
                {{ log.details }}
              </div>
              <div v-if="log.metadata" class="log-metadata">
                <span
                  v-for="(value, key) in log.metadata"
                  :key="key"
                  class="log-meta-item"
                >
                  <strong>{{ key }}:</strong> {{ value }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <i class="fas fa-list-alt"></i>
          <p>No logs yet</p>
          <span>Actions performed in the plugin will be logged here</span>
        </div>
      </template>

      <template v-else-if="viewState === 'settings'">
        <div class="settings-page">
          <div class="settings-page-header">
            <h2>
              <i class="fas fa-cog"></i>
              Settings
            </h2>
          </div>

          <div class="settings-tabs-row">
            <button
              class="settings-tab-btn"
              :class="{ active: settingsTab === 'repos' }"
              @click="settingsTab = 'repos'"
            >
              <i class="fas fa-code-branch"></i>
              Repositories
            </button>
            <button
              class="settings-tab-btn"
              :class="{ active: settingsTab === 'tags' }"
              @click="settingsTab = 'tags'"
            >
              <i class="fas fa-tags"></i>
              Tags
            </button>
            <button
              class="settings-tab-btn"
              :class="{ active: settingsTab === 'collections' }"
              @click="settingsTab = 'collections'"
            >
              <i class="fas fa-layer-group"></i>
              Collections
            </button>
          </div>

          <div class="settings-page-content">
            <div v-if="settingsTab === 'repos'" class="settings-section">
              <div class="settings-card">
                <div class="settings-card-header">
                  <i class="fas fa-plus-circle"></i>
                  <h3>Add New Repository</h3>
                </div>
                <p class="settings-card-description">
                  Add a GitHub repository URL to browse its payload files
                </p>
                <div class="add-repo-form-large">
                  <InputText
                    v-model="newRepoUrl"
                    placeholder="https://github.com/owner/repository"
                    class="repo-url-input-large"
                  />
                  <Button
                    label="Add Repository"
                    icon="fas fa-plus"
                    @click="addNewRepo"
                  />
                </div>
                <p v-if="addRepoError.length > 0" class="error-text">
                  {{ addRepoError }}
                </p>
              </div>

              <div class="settings-card">
                <div class="settings-card-header">
                  <i class="fas fa-list"></i>
                  <h3>Your Repositories</h3>
                </div>
                <p class="settings-card-description">
                  Manage your saved repositories. Click to switch, star to set
                  default.
                </p>
                <div class="repos-list-large">
                  <div
                    v-for="repo in repos"
                    :key="`${repo.owner}/${repo.repo}`"
                    class="repo-item-large"
                    :class="{
                      'is-current':
                        currentRepo?.owner === repo.owner &&
                        currentRepo?.repo === repo.repo,
                    }"
                  >
                    <div class="repo-item-icon">
                      <i class="fas fa-code-branch"></i>
                    </div>
                    <div class="repo-item-info">
                      <span class="repo-item-name">{{ repo.name }}</span>
                      <span class="repo-item-path"
                        >{{ repo.owner }}/{{ repo.repo }}</span
                      >
                      <div class="repo-item-badges">
                        <span v-if="repo.isDefault" class="badge badge-default">
                          <i class="fas fa-star"></i> Default
                        </span>
                        <span
                          v-if="
                            currentRepo?.owner === repo.owner &&
                            currentRepo?.repo === repo.repo
                          "
                          class="badge badge-active"
                        >
                          <i class="fas fa-check"></i> Active
                        </span>
                      </div>
                    </div>
                    <div class="repo-item-actions">
                      <Button
                        label="Switch"
                        icon="fas fa-exchange-alt"
                        text
                        size="small"
                        @click="switchRepo(repo)"
                      />
                      <Button
                        v-if="!repo.isDefault"
                        icon="fas fa-star"
                        text
                        size="small"
                        title="Set as default"
                        @click="setDefault(repo)"
                      />
                      <Button
                        v-if="repos.length > 1"
                        icon="fas fa-trash"
                        text
                        size="small"
                        severity="danger"
                        title="Remove"
                        @click="removeRepo(repo)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="settingsTab === 'tags'" class="settings-section">
              <div class="settings-card">
                <div class="settings-card-header">
                  <i class="fas fa-plus-circle"></i>
                  <h3>Create New Tag</h3>
                </div>
                <p class="settings-card-description">
                  Create custom tags to organize your favorite payloads by type
                </p>
                <div class="add-tag-form-large">
                  <div class="color-picker-large">
                    <label>Color</label>
                    <ColorPicker v-model="newTagColor" format="hex" />
                    <div
                      class="color-preview"
                      :style="{ backgroundColor: newTagColor }"
                    ></div>
                  </div>
                  <div class="tag-name-field">
                    <label>Tag Name</label>
                    <InputText
                      v-model="newTagName"
                      placeholder="e.g., XSS, SQLi, LFI, RCE"
                      class="tag-name-input-large"
                    />
                  </div>
                  <Button
                    label="Create Tag"
                    icon="fas fa-plus"
                    class="create-tag-btn"
                    @click="addTag"
                  />
                </div>
              </div>

              <div class="settings-card">
                <div class="settings-card-header">
                  <i class="fas fa-tags"></i>
                  <h3>Your Tags</h3>
                </div>
                <p class="settings-card-description">
                  Tags you've created for organizing payloads
                </p>
                <div v-if="tags.length > 0" class="tags-grid-large">
                  <div v-for="tag in tags" :key="tag.id" class="tag-item-large">
                    <span
                      class="tag-color-dot"
                      :style="{ backgroundColor: tag.color }"
                    ></span>
                    <div class="tag-content">
                      <span class="tag-label">{{ tag.name }}</span>
                      <span v-if="tag.description" class="tag-desc">{{
                        tag.description
                      }}</span>
                    </div>
                    <Button
                      :icon="
                        tag.description ? 'fas fa-edit' : 'far fa-sticky-note'
                      "
                      text
                      size="small"
                      :title="
                        tag.description ? 'Edit description' : 'Add description'
                      "
                      @click="openNoteDialog({ type: 'tag', item: tag })"
                    />
                    <Button
                      icon="fas fa-trash"
                      text
                      size="small"
                      severity="danger"
                      title="Delete tag"
                      @click="removeTag(tag.id)"
                    />
                  </div>
                </div>
                <div v-else class="empty-tags-state">
                  <i class="fas fa-tags"></i>
                  <p>No tags created yet</p>
                  <span>Create your first tag above to start organizing!</span>
                </div>
              </div>

              <div class="info-card">
                <i class="fas fa-info-circle"></i>
                <div>
                  <strong>How to use tags</strong>
                  <p>
                    After favoriting a file, you can assign tags to it by
                    clicking the "Tags" button in the file viewer. Then filter
                    your favorites by tag to quickly find payloads for specific
                    vulnerability types.
                  </p>
                </div>
              </div>
            </div>

            <div v-if="settingsTab === 'collections'" class="settings-section">
              <div class="settings-card">
                <div class="settings-card-header">
                  <i class="fas fa-plus-circle"></i>
                  <h3>Create New Collection</h3>
                </div>
                <p class="settings-card-description">
                  Collections let you group payloads from multiple repos into
                  custom wordlists
                </p>
                <div class="add-collection-form">
                  <div class="collection-name-field">
                    <label>Collection Name</label>
                    <InputText
                      v-model="newCollectionName"
                      placeholder="e.g., XSS Payloads, SQL Injections"
                      class="collection-name-input"
                    />
                  </div>
                  <div class="collection-desc-field">
                    <label>Description (optional)</label>
                    <InputText
                      v-model="newCollectionDescription"
                      placeholder="Brief description of this collection"
                      class="collection-desc-input"
                    />
                  </div>
                  <Button
                    label="Create Collection"
                    icon="fas fa-plus"
                    class="create-collection-btn"
                    @click="createCollection"
                  />
                </div>
              </div>

              <div class="settings-card">
                <div class="settings-card-header">
                  <i class="fas fa-layer-group"></i>
                  <h3>Your Collections</h3>
                </div>
                <p class="settings-card-description">
                  Manage your custom payload collections
                </p>
                <div
                  v-if="collections.length > 0"
                  class="collections-list-large"
                >
                  <div
                    v-for="collection in collections"
                    :key="collection.id"
                    class="collection-item-large"
                  >
                    <div class="collection-item-icon">
                      <i class="fas fa-layer-group"></i>
                    </div>
                    <div class="collection-item-info-large">
                      <span class="collection-item-name">{{
                        collection.name
                      }}</span>
                      <span
                        v-if="collection.description"
                        class="collection-item-desc"
                      >
                        {{ collection.description }}
                      </span>
                      <span class="collection-item-count">
                        {{ getCollectionItemCount(collection.id) }} payloads
                      </span>
                    </div>
                    <div class="collection-item-actions">
                      <Button
                        label="View"
                        icon="fas fa-eye"
                        text
                        size="small"
                        @click="openCollection(collection)"
                      />
                      <Button
                        icon="fas fa-download"
                        text
                        size="small"
                        title="Export as wordlist"
                        @click="exportCollectionAsWordlist(collection)"
                      />
                      <Button
                        icon="fas fa-trash"
                        text
                        size="small"
                        severity="danger"
                        title="Delete"
                        @click="deleteCollection(collection.id)"
                      />
                    </div>
                  </div>
                </div>
                <div v-else class="empty-collections-state">
                  <i class="fas fa-layer-group"></i>
                  <p>No collections yet</p>
                  <span>Create your first collection above</span>
                </div>
              </div>

              <div class="info-card">
                <i class="fas fa-info-circle"></i>
                <div>
                  <strong>How to use collections</strong>
                  <p>
                    1. Create a collection above<br />
                    2. Browse files and click "Add to Collection"<br />
                    3. Export as a wordlist file or copy all payloads to
                    clipboard<br />
                    4. Use the exported wordlist in Caido's Automate tab for
                    fuzzing
                  </p>
                </div>
              </div>

              <div class="settings-card">
                <div class="settings-card-header">
                  <i class="fas fa-file-import"></i>
                  <h3>Import / Export Collections</h3>
                </div>
                <p class="settings-card-description">
                  Backup your collections or share them between Caido instances
                </p>
                <div class="import-export-actions">
                  <Button
                    icon="fas fa-file-export"
                    label="Export Collections"
                    @click="exportCollections"
                  />
                  <Button
                    icon="fas fa-file-import"
                    label="Import Collections"
                    severity="secondary"
                    @click="triggerCollectionImport"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>

    <Dialog
      v-model:visible="showFileDialog"
      :header="selectedFile?.name ?? 'File Content'"
      modal
      :style="{ width: '90vw', maxWidth: '1400px' }"
      class="file-dialog"
      :pt="{
        content: {
          style: 'padding: 1.5rem; display: flex; flex-direction: column;',
        },
      }"
    >
      <div class="file-dialog-actions">
        <span class="edit-hint">
          <i class="fas fa-edit"></i>
          Editable - modify content before copying
        </span>
        <div class="dialog-buttons">
          <Button
            :icon="isFavorite ? 'fas fa-star' : 'far fa-star'"
            :label="isFavorite ? 'Favorited' : 'Favorite'"
            size="small"
            :class="{ 'is-favorite': isFavorite }"
            text
            @click="toggleFavorite"
          />
          <Button
            icon="fas fa-tags"
            label="Tags"
            size="small"
            text
            @click="openTagDialog"
          />
          <Button
            icon="fas fa-layer-group"
            label="Add to Collection"
            size="small"
            text
            @click="openCollectionDialog"
          />
          <Button
            icon="fas fa-copy"
            label="Copy"
            size="small"
            @click="copyToClipboard"
          />
        </div>
      </div>
      <textarea
        v-model="fileContent"
        class="file-content-textarea"
        :style="{
          width: '100%',
          minHeight: '60vh',
          height: '65vh',
          backgroundColor: '#0d1117',
          color: '#c9d1d9',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          fontFamily: 'Fira Code, Monaco, Consolas, monospace',
          fontSize: '0.9rem',
          lineHeight: '1.8',
          resize: 'vertical',
          boxSizing: 'border-box',
        }"
      ></textarea>
    </Dialog>

    <Dialog
      v-model:visible="showTagDialog"
      header="Assign Tags"
      modal
      :style="{ width: '500px' }"
      class="tag-dialog"
    >
      <div class="tag-dialog-content">
        <p class="tag-dialog-hint">
          <i class="fas fa-info-circle"></i>
          Click tags to assign or unassign them from this file
        </p>
        <div v-if="tags.length > 0" class="tag-toggle-grid">
          <div
            v-for="tag in tags"
            :key="tag.id"
            class="tag-toggle-item"
            :class="{ active: selectedItemTags.some((t) => t.id === tag.id) }"
            :style="
              selectedItemTags.some((t) => t.id === tag.id)
                ? {
                    backgroundColor: `${tag.color}15`,
                    borderColor: `${tag.color}80`,
                  }
                : {}
            "
            @click="toggleItemTag(tag)"
          >
            <span
              class="tag-toggle-dot"
              :style="{ backgroundColor: tag.color }"
            ></span>
            <span class="tag-toggle-name">{{ tag.name }}</span>
            <i
              v-if="selectedItemTags.some((t) => t.id === tag.id)"
              class="fas fa-check-circle tag-toggle-check"
              :style="{ color: tag.color }"
            ></i>
          </div>
        </div>
        <div v-else class="no-tags-state">
          <i class="fas fa-tags"></i>
          <p>No tags available</p>
          <span>Create tags in Settings first</span>
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="showCollectionDialog"
      header="Add to Collection"
      modal
      :style="{ width: '500px' }"
      class="collection-dialog"
    >
      <div class="collection-dialog-content">
        <p class="collection-dialog-hint">
          Select a collection to add this file to:
        </p>
        <div v-if="collections.length > 0" class="collection-select-grid">
          <div
            v-for="collection in collections"
            :key="collection.id"
            class="collection-select-item"
            @click="addToCollection(collection)"
          >
            <div class="collection-select-icon">
              <i class="fas fa-layer-group"></i>
            </div>
            <div class="collection-select-info">
              <span class="collection-select-name">{{ collection.name }}</span>
              <span class="collection-select-count">
                {{ getCollectionItemCount(collection.id) }} payloads
              </span>
            </div>
            <i class="fas fa-plus collection-select-add"></i>
          </div>
        </div>
        <div v-else class="no-collections-state">
          <i class="fas fa-layer-group"></i>
          <p>No collections available</p>
          <span>Create collections in Settings first</span>
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="showNoteDialog"
      :header="
        editingNoteItem?.type === 'collection'
          ? 'Edit Collection Description'
          : editingNoteItem?.type === 'tag'
            ? 'Edit Tag Description'
            : 'Edit Note'
      "
      modal
      :style="{ width: '600px' }"
      :pt="{
        root: { class: 'note-dialog-root' },
        header: { class: 'note-dialog-header' },
        content: { class: 'note-dialog-content' },
      }"
    >
      <div class="note-dialog">
        <p class="note-hint">
          <i class="fas fa-info-circle"></i>
          <span v-if="editingNoteItem?.type === 'favorite'">
            Add a note to remember why this file is useful
          </span>
          <span v-else-if="editingNoteItem?.type === 'collection'">
            Describe what this collection is for
          </span>
          <span v-else-if="editingNoteItem?.type === 'collectionItem'">
            Add a note about when to use this payload
          </span>
          <span v-else-if="editingNoteItem?.type === 'tag'">
            Describe what this tag means
          </span>
        </p>
        <textarea
          v-model="noteEditValue"
          placeholder="Enter your note or description..."
          class="note-textarea"
          rows="6"
          style="
            background: #09090b !important;
            color: #e4e4e7 !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
          "
        ></textarea>
        <div class="note-actions">
          <Button label="Cancel" text @click="showNoteDialog = false" />
          <Button label="Save" @click="saveNote" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.repo-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #e4e4e7;
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  position: relative;
  overflow: hidden;
}

.repo-container::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(233, 69, 96, 0.08) 0%,
    transparent 70%
  );
  animation: pulse 15s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(10%, 10%) scale(1.1);
    opacity: 0.3;
  }
}

.repo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(233, 69, 96, 0.3);
  backdrop-filter: blur(20px);
  gap: 1rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 2px 4px -1px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.back-btn {
  color: #e94560 !important;
  transition: all 0.2s ease;
}

.back-btn:hover {
  color: #ff6b6b !important;
  transform: translateX(-3px);
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(
    135deg,
    rgba(233, 69, 96, 0.1),
    rgba(255, 107, 107, 0.05)
  );
  border-radius: 0.75rem;
  border: 1px solid rgba(233, 69, 96, 0.2);
}

.logo-icon {
  font-size: 1.5rem;
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(90deg, #e94560, #ff6b6b, #ff8787);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% auto;
  animation: shimmer 3s linear infinite;
}

@keyframes shimmer {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 500px;
}

.global-search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.global-search-icon {
  position: absolute;
  left: 1rem;
  color: #71717a;
  pointer-events: none;
}

.global-search-input {
  width: 100% !important;
  padding-left: 2.75rem !important;
  padding-right: 2.5rem !important;
  background: rgba(233, 69, 96, 0.1) !important;
  border: 1px solid rgba(233, 69, 96, 0.3) !important;
  border-radius: 1rem !important;
  color: #e4e4e7 !important;
  font-size: 0.95rem !important;
  height: 2.75rem !important;
  transition: all 0.3s ease;
}

.global-search-input::placeholder {
  color: #94a3b8;
}

.global-search-input:focus {
  border-color: rgba(233, 69, 96, 0.6) !important;
  box-shadow:
    0 0 0 3px rgba(233, 69, 96, 0.15),
    0 10px 15px -3px rgba(233, 69, 96, 0.1) !important;
  background: rgba(233, 69, 96, 0.15) !important;
  transform: translateY(-1px);
}

.clear-search-btn {
  position: absolute;
  right: 0.5rem;
  color: #71717a !important;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.action-btn {
  color: #94a3b8 !important;
  transition: all 0.2s ease;
  position: relative;
}

.action-btn:hover {
  color: #ff6b6b !important;
  transform: scale(1.1);
}

.action-btn.has-items {
  color: #fbbf24 !important;
  animation: glow 2s ease-in-out infinite;
}

.action-btn.has-items::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(233, 69, 96, 0.6);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes glow {
  0%,
  100% {
    filter: drop-shadow(0 0 4px rgba(233, 69, 96, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 8px rgba(233, 69, 96, 0.6));
  }
}

@keyframes pulse-dot {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.7;
  }
}

.filter-box {
  position: relative;
  display: flex;
  align-items: center;
}

.filter-icon {
  position: absolute;
  left: 0.75rem;
  color: #71717a;
  pointer-events: none;
  font-size: 0.8rem;
}

.filter-input {
  padding-left: 2rem !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 0.5rem !important;
  color: #e4e4e7 !important;
  width: 140px;
  font-size: 0.85rem !important;
}

.filter-input::placeholder {
  color: #71717a;
}

.repo-dropdown {
  min-width: 180px;
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  border-radius: 0.5rem !important;
}

.tag-filter-dropdown {
  min-width: 130px;
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  border-radius: 0.5rem !important;
}

.tag-dropdown-value,
.tag-dropdown-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tag-dropdown-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.repo-dropdown-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e4e4e7;
}

.repo-dropdown-value i {
  color: #e94560;
  font-size: 0.85rem;
}

.repo-dropdown-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.repo-dropdown-option i {
  color: #e94560;
  font-size: 0.85rem;
}

.repo-dropdown-option .default-tag {
  margin-left: auto;
  font-size: 0.65rem;
  text-transform: uppercase;
  color: #e94560;
  background: rgba(233, 69, 96, 0.15);
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  font-weight: 600;
}

.settings-btn {
  color: #a1a1aa !important;
}

.repo-main {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: rgba(15, 23, 42, 0.3);
  position: relative;
  z-index: 1;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1.5rem;
  color: #94a3b8;
}

.loading-state i {
  font-size: 3rem;
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: float 2s ease-in-out infinite;
}

.loading-state p {
  font-size: 1.125rem;
  font-weight: 600;
  color: #f1f5f9;
}

.categories-header,
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.categories-header h2,
.detail-header h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.categories-header h2 i,
.detail-header h2 i {
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 4px rgba(233, 69, 96, 0.3));
}

.category-count,
.file-count {
  color: #71717a;
  font-size: 0.875rem;
}

.favorites-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.category-card {
  cursor: pointer;
  background: linear-gradient(
    135deg,
    rgba(233, 69, 96, 0.1),
    rgba(255, 107, 107, 0.05)
  ) !important;
  border: 1px solid rgba(233, 69, 96, 0.2) !important;
  border-radius: 1rem !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.category-card::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent,
    rgba(233, 69, 96, 0.1),
    transparent
  );
  transition: transform 0.6s;
  transform: translateX(-100%);
}

.category-card:hover::before {
  transform: translateX(100%);
}

.category-card:hover {
  background: linear-gradient(
    135deg,
    rgba(233, 69, 96, 0.2),
    rgba(255, 107, 107, 0.15)
  ) !important;
  border-color: rgba(233, 69, 96, 0.5) !important;
  transform: translateY(-4px) scale(1.02);
  box-shadow:
    0 20px 25px -5px rgba(233, 69, 96, 0.2),
    0 10px 10px -5px rgba(233, 69, 96, 0.1);
}

.category-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem;
  text-align: center;
  position: relative;
  z-index: 1;
}

.category-icon-wrapper {
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  border-radius: 1rem;
  box-shadow: 0 8px 16px -4px rgba(233, 69, 96, 0.4);
  transition: all 0.3s ease;
}

.category-card:hover .category-icon-wrapper {
  transform: rotate(5deg) scale(1.1);
  box-shadow: 0 12px 24px -6px rgba(233, 69, 96, 0.6);
}

.category-icon {
  font-size: 1.5rem;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.category-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f5f9;
  text-transform: capitalize;
  word-break: break-word;
  transition: color 0.3s ease;
}

.category-card:hover .category-name {
  color: #ffffff;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(
    135deg,
    rgba(233, 69, 96, 0.05),
    rgba(255, 107, 107, 0.03)
  );
  border: 1px solid rgba(233, 69, 96, 0.1);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.file-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #e94560, #ff6b6b);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.file-item:hover::before {
  transform: scaleY(1);
}

.file-item:hover {
  background: linear-gradient(
    135deg,
    rgba(233, 69, 96, 0.15),
    rgba(255, 107, 107, 0.1)
  );
  border-color: rgba(233, 69, 96, 0.4);
  transform: translateX(4px);
  box-shadow: 0 4px 12px -2px rgba(233, 69, 96, 0.2);
}

.file-item.is-dir .file-icon {
  color: #fbbf24;
  filter: drop-shadow(0 2px 4px rgba(251, 191, 36, 0.3));
}

.file-icon {
  font-size: 1.1rem;
  color: #94a3b8;
  width: 1.5rem;
  text-align: center;
  transition: all 0.2s ease;
}

.file-item:hover .file-icon {
  transform: scale(1.2);
  color: #ff8787;
}

.file-name {
  flex: 1;
  font-size: 0.95rem;
  color: #f1f5f9;
  font-weight: 500;
  transition: color 0.2s ease;
}

.file-item:hover .file-name {
  color: #ffffff;
}

.file-path {
  font-size: 0.8rem;
  color: #94a3b8;
  transition: color 0.2s ease;
}

.file-item:hover .file-path {
  color: #ff8787;
}

.file-size {
  font-size: 0.8rem;
  color: #94a3b8;
  font-family: "Monaco", "Courier New", monospace;
  padding: 0.25rem 0.5rem;
  background: rgba(233, 69, 96, 0.1);
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.file-item:hover .file-size {
  background: rgba(233, 69, 96, 0.2);
  color: #ff8787;
}

.file-arrow {
  font-size: 0.75rem;
  color: #52525b;
}

.search-result-info,
.favorite-info,
.tagged-file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  cursor: pointer;
}

.empty-hint {
  font-size: 0.85rem;
  color: #52525b;
  margin-top: 0.5rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #94a3b8;
  text-align: center;
  background: linear-gradient(
    135deg,
    rgba(233, 69, 96, 0.05),
    rgba(255, 107, 107, 0.03)
  );
  border: 2px dashed rgba(233, 69, 96, 0.2);
  border-radius: 1.5rem;
  margin: 2rem 0;
  transition: all 0.3s ease;
}

.empty-state:hover {
  border-color: rgba(233, 69, 96, 0.4);
  background: linear-gradient(
    135deg,
    rgba(233, 69, 96, 0.08),
    rgba(255, 107, 107, 0.05)
  );
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: float 3s ease-in-out infinite;
}

.empty-state p {
  font-size: 1.125rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0.5rem 0;
}

.empty-state span {
  font-size: 0.9rem;
  color: #94a3b8;
  margin-bottom: 1.5rem;
}

.file-dialog-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 2px solid rgba(233, 69, 96, 0.2);
}

.dialog-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.is-favorite {
  color: #fbbf24 !important;
  animation: favorite-pulse 0.5s ease;
}

@keyframes favorite-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.edit-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #94a3b8;
  padding: 0.5rem 1rem;
  background: linear-gradient(
    135deg,
    rgba(233, 69, 96, 0.1),
    rgba(255, 107, 107, 0.05)
  );
  border-radius: 0.5rem;
  border: 1px solid rgba(233, 69, 96, 0.2);
}

.edit-hint i {
  color: #e94560;
  font-size: 1rem;
}

.file-content-textarea {
  display: block;
  width: 100% !important;
  min-height: 60vh !important;
  height: 65vh !important;
  background-color: #0d1117 !important;
  color: #c9d1d9 !important;
  padding: 1.5rem !important;
  border-radius: 0.75rem !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  font-family: "Fira Code", "Monaco", "Consolas", monospace !important;
  font-size: 0.9rem !important;
  line-height: 1.8 !important;
  resize: vertical !important;
  box-sizing: border-box !important;
  -webkit-appearance: none !important;
  appearance: none !important;
}

.file-content-textarea:focus {
  outline: none !important;
  border-color: rgba(233, 69, 96, 0.5) !important;
  box-shadow: 0 0 0 2px rgba(233, 69, 96, 0.1) !important;
  background-color: #0d1117 !important;
}

.error-text {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.75rem;
}

.settings-page {
  max-width: 900px;
  margin: 0 auto;
}

.settings-page-header {
  margin-bottom: 2rem;
}

.settings-page-header h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  font-weight: 600;
  color: #fafafa;
}

.settings-page-header h2 i {
  color: #e94560;
}

.settings-tabs-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.settings-tab-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  color: #a1a1aa;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  font-weight: 500;
}

.settings-tab-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e4e4e7;
  border-color: rgba(255, 255, 255, 0.2);
}

.settings-tab-btn.active {
  background: rgba(233, 69, 96, 0.15);
  border-color: #e94560;
  color: #e94560;
}

.settings-tab-btn i {
  font-size: 1.1rem;
}

.settings-page-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 2rem;
}

.settings-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.settings-card-header i {
  color: #e94560;
  font-size: 1.25rem;
}

.settings-card-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fafafa;
}

.settings-card-description {
  color: #71717a;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.add-repo-form-large {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.repo-url-input-large {
  flex: 1;
  height: 3rem;
  font-size: 1rem;
}

.repos-list-large {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.repo-item-large {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  transition: all 0.15s ease;
}

.repo-item-large:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
}

.repo-item-large.is-current {
  border-color: rgba(233, 69, 96, 0.4);
  background: rgba(233, 69, 96, 0.05);
}

.repo-item-icon {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(233, 69, 96, 0.15);
  border-radius: 0.75rem;
  flex-shrink: 0;
}

.repo-item-icon i {
  color: #e94560;
  font-size: 1.25rem;
}

.repo-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.repo-item-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: #fafafa;
}

.repo-item-path {
  font-size: 0.85rem;
  color: #71717a;
}

.repo-item-badges {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.35rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  padding: 0.25rem 0.6rem;
  border-radius: 0.35rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-default {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.badge-active {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.repo-item-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.add-tag-form-large {
  display: flex;
  gap: 1.5rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.color-picker-large {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.color-picker-large label {
  font-size: 0.85rem;
  color: #a1a1aa;
  font-weight: 500;
}

.color-preview {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  margin-top: 0.5rem;
}

.tag-name-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
}

.tag-name-field label {
  font-size: 0.85rem;
  color: #a1a1aa;
  font-weight: 500;
}

.tag-name-input-large {
  height: 3rem;
  font-size: 1rem;
}

.create-tag-btn {
  height: 3rem;
}

.tags-grid-large {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tag-item-large {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

.tag-color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-label {
  font-size: 1rem;
  color: #e4e4e7;
  font-weight: 500;
}

.empty-tags-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
  color: #71717a;
  text-align: center;
}

.empty-tags-state i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  opacity: 0.4;
}

.empty-tags-state p {
  font-size: 1rem;
  color: #a1a1aa;
  margin-bottom: 0.25rem;
}

.empty-tags-state span {
  font-size: 0.85rem;
}

.info-card {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 0.75rem;
}

.info-card i {
  color: #60a5fa;
  font-size: 1.25rem;
  margin-top: 0.1rem;
  flex-shrink: 0;
}

.info-card strong {
  display: block;
  color: #93c5fd;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.info-card p {
  color: #93c5fd;
  font-size: 0.9rem;
  line-height: 1.6;
  opacity: 0.9;
}

.tag-dialog-content {
  padding: 1rem;
}

.tag-dialog-hint {
  color: #a1a1aa;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tag-dialog-hint i {
  font-size: 0.9rem;
  opacity: 0.8;
}

.tag-toggle-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.tag-toggle-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tag-toggle-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateX(4px);
}

.tag-toggle-item.active {
  border-width: 2px;
}

.tag-toggle-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 8px currentColor;
  opacity: 0.9;
}

.tag-toggle-name {
  flex: 1;
  font-size: 1rem;
  color: #e4e4e7;
  font-weight: 500;
}

.tag-toggle-check {
  font-size: 1.25rem;
  opacity: 1;
  filter: drop-shadow(0 0 4px currentColor);
}

.no-tags-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: #71717a;
  text-align: center;
}

.no-tags-state i {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  opacity: 0.4;
}

.no-tags-state p {
  font-size: 1rem;
  color: #a1a1aa;
  margin-bottom: 0.25rem;
}

.no-tags-state span {
  font-size: 0.85rem;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.35rem;
}

.item-tag {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid;
  font-weight: 500;
}

.tag-filter-select {
  min-width: 140px;
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  border-radius: 0.5rem !important;
}

.tag-select-value,
.tag-select-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tag-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.collection-card {
  cursor: pointer;
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 0.75rem !important;
  transition: all 0.2s ease;
}

.collection-card:hover {
  background: rgba(233, 69, 96, 0.1) !important;
  border-color: rgba(233, 69, 96, 0.3) !important;
}

.collection-card-content {
  padding: 0.5rem;
}

.collection-card-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.collection-icon-wrapper {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  border-radius: 0.75rem;
  flex-shrink: 0;
}

.collection-icon-wrapper i {
  font-size: 1.25rem;
  color: white;
}

.collection-info {
  flex: 1;
  min-width: 0;
}

.collection-info h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fafafa;
  margin-bottom: 0.25rem;
}

.collection-info p {
  font-size: 0.85rem;
  color: #a1a1aa;
  margin-bottom: 0.35rem;
}

.collection-count {
  font-size: 0.8rem;
  color: #71717a;
}

.collection-actions {
  display: flex;
  gap: 0.25rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.collection-actions .automate-btn {
  color: #22c55e;
}

.collection-actions .automate-btn:hover {
  background: rgba(34, 197, 94, 0.15);
}

.collection-detail-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.collection-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  cursor: pointer;
}

.add-collection-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.collection-name-field,
.collection-desc-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.collection-name-field label,
.collection-desc-field label {
  font-size: 0.85rem;
  color: #a1a1aa;
  font-weight: 500;
}

.collection-name-input,
.collection-desc-input {
  height: 3rem;
  font-size: 1rem;
}

.create-collection-btn {
  align-self: flex-start;
  margin-top: 0.5rem;
}

.collections-list-large {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.collection-item-large {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
}

.collection-item-icon {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 0.75rem;
  flex-shrink: 0;
}

.collection-item-icon i {
  color: #3b82f6;
  font-size: 1.25rem;
}

.collection-item-info-large {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.collection-item-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: #fafafa;
}

.collection-item-desc {
  font-size: 0.85rem;
  color: #a1a1aa;
}

.collection-item-count {
  font-size: 0.8rem;
  color: #71717a;
}

.collection-item-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.empty-collections-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
  color: #71717a;
  text-align: center;
}

.empty-collections-state i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  opacity: 0.4;
}

.empty-collections-state p {
  font-size: 1rem;
  color: #a1a1aa;
  margin-bottom: 0.25rem;
}

.empty-collections-state span {
  font-size: 0.85rem;
}

.collection-dialog-content {
  padding: 1rem;
}

.collection-dialog-hint {
  color: #a1a1aa;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

.collection-select-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.collection-select-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.collection-select-item:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.collection-select-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 0.5rem;
  flex-shrink: 0;
}

.collection-select-icon i {
  color: #3b82f6;
  font-size: 1rem;
}

.collection-select-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.collection-select-name {
  font-size: 1rem;
  color: #e4e4e7;
  font-weight: 500;
}

.collection-select-count {
  font-size: 0.8rem;
  color: #71717a;
}

.collection-select-add {
  color: #3b82f6;
  font-size: 1rem;
}

.no-collections-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: #71717a;
  text-align: center;
}

.no-collections-state i {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  opacity: 0.4;
}

.no-collections-state p {
  font-size: 1rem;
  color: #a1a1aa;
  margin-bottom: 0.25rem;
}

.no-collections-state span {
  font-size: 0.85rem;
}

.collection-selection-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.5rem;
}

.selection-hint {
  font-size: 0.85rem;
  color: #71717a;
}

.collection-item-selectable {
  cursor: pointer;
  transition: all 0.15s ease;
}

.collection-item-selectable:hover {
  background: rgba(255, 255, 255, 0.06);
}

.collection-item-selectable.is-selected {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.collection-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  flex-shrink: 0;
}

.collection-checkbox i {
  font-size: 1.1rem;
  color: #71717a;
  transition: color 0.15s ease;
}

.collection-item-selectable.is-selected .collection-checkbox i {
  color: #3b82f6;
}

.collection-item-selectable .collection-item-info {
  cursor: pointer;
}

.collection-item-selectable .collection-item-info:hover .file-name {
  color: #60a5fa;
}

.import-export-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.collections-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.repo-search-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.repo-search-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  margin-bottom: 2rem;
}

.repo-search-box i.fa-search {
  font-size: 1.25rem;
  color: #71717a;
}

.repo-search-input {
  flex: 1;
  font-size: 1rem;
}

.results-per-page-select {
  min-width: 140px;
  font-size: 0.9rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  margin-top: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

.pagination-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.page-counter {
  font-size: 1rem;
  font-weight: 600;
  color: #e4e4e7;
}

.results-counter {
  font-size: 0.85rem;
  color: #a1a1aa;
}

.pagination-buttons {
  display: flex;
  gap: 0.75rem;
}

.search-description {
  color: #a1a1aa;
  font-size: 0.95rem;
  margin-top: 0.5rem;
}

.results-count {
  color: #a1a1aa;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.repo-search-results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.repo-search-result-item {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  transition: all 0.15s ease;
}

.repo-search-result-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.repo-avatar {
  width: 64px;
  height: 64px;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.repo-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.repo-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.repo-title h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e4e4e7;
  margin: 0;
}

.repo-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
  color: #a1a1aa;
}

.repo-stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.repo-stat i {
  color: #fbbf24;
}

.repo-language {
  padding: 0.25rem 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  font-weight: 500;
}

.repo-description {
  color: #d4d4d8;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 4.5em;
  word-wrap: break-word;
  word-break: break-word;
}

.repo-topics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.repo-topic {
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  color: #60a5fa;
  border-radius: 0.375rem;
  font-size: 0.85rem;
}

.repo-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.repo-search-help {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.help-section {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.help-section h3 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.1rem;
  color: #e4e4e7;
  margin: 0 0 1rem 0;
}

.help-section h3 i {
  color: #60a5fa;
}

.help-section ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #d4d4d8;
  line-height: 1.8;
}

.help-section li {
  margin-bottom: 0.5rem;
}

.help-section li strong {
  color: #e4e4e7;
}

.help-hint {
  color: #d4d4d8;
  line-height: 1.6;
  margin: 0;
}

.help-hint code {
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: #60a5fa;
  border-radius: 0.25rem;
  font-family: "Fira Code", monospace;
  font-size: 0.9rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  transition: all 0.15s ease;
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.history-action-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;
  flex-shrink: 0;
}

.history-action-badge i {
  font-size: 0.9rem;
}

.action-viewed {
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.action-copied {
  background: rgba(34, 197, 94, 0.1);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.action-exported {
  background: rgba(168, 85, 247, 0.1);
  color: #a78bfa;
  border: 1px solid rgba(168, 85, 247, 0.2);
}

.history-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  cursor: pointer;
}

.history-info:hover .file-name {
  color: #60a5fa;
}

.history-time {
  font-size: 0.85rem;
  color: #71717a;
}

.history-quick-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cache-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.375rem;
  font-size: 0.85rem;
  color: #a1a1aa;
  cursor: help;
  transition: all 0.15s ease;
}

.cache-indicator:hover {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
  color: #60a5fa;
}

.cache-indicator i {
  color: #60a5fa;
  font-size: 0.9rem;
}

.cache-indicator span {
  font-weight: 600;
  font-family: monospace;
}

.note-dialog {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #18181b;
  color: #e4e4e7;
}

.note-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.375rem;
  font-size: 0.9rem;
  color: #a1a1aa;
}

.note-hint i {
  color: #60a5fa;
  font-size: 1rem;
}

.note-textarea,
textarea.note-textarea,
.note-dialog textarea,
.note-dialog-content textarea {
  width: 100%;
  padding: 0.75rem;
  background: #09090b !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 0.375rem;
  color: #e4e4e7 !important;
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.6;
  resize: vertical;
  min-height: 120px;
}

.note-textarea:focus,
textarea.note-textarea:focus,
.note-dialog textarea:focus {
  outline: none !important;
  border-color: rgba(59, 130, 246, 0.5) !important;
  background: #0a0a0c !important;
}

.note-textarea::placeholder,
textarea.note-textarea::placeholder,
.note-dialog textarea::placeholder {
  color: #71717a !important;
}

.note-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.item-note {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  margin-top: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-left: 3px solid rgba(59, 130, 246, 0.5);
  border-radius: 0.25rem;
  font-size: 0.85rem;
  color: #a1a1aa;
  font-style: italic;
}

.item-note i {
  color: #60a5fa;
  font-size: 0.9rem;
  margin-top: 0.1rem;
  flex-shrink: 0;
}

.item-note span {
  flex: 1;
  line-height: 1.4;
}

.collection-detail-title {
  flex: 1;
}

.collection-description {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  color: #a1a1aa;
  font-style: italic;
}

.tag-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tag-desc {
  font-size: 0.85rem;
  color: #a1a1aa;
  font-style: italic;
}

.note-dialog-root {
  background: #18181b !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.note-dialog-header {
  background: rgba(59, 130, 246, 0.1) !important;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2) !important;
  color: #e4e4e7 !important;
}

.note-dialog-content {
  background: #18181b !important;
  color: #e4e4e7 !important;
  padding: 1.5rem !important;
}

.note-dialog-root .p-dialog-content {
  background: #18181b !important;
  color: #e4e4e7 !important;
}

.note-dialog-root .p-dialog {
  background: #18181b !important;
}

.note-dialog-root .p-dialog-header {
  background: rgba(59, 130, 246, 0.1) !important;
  color: #e4e4e7 !important;
}

.note-dialog-root textarea,
.note-dialog-root input[type="text"] {
  background: #09090b !important;
  color: #e4e4e7 !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.note-dialog-root textarea:focus,
.note-dialog-root input[type="text"]:focus {
  background: #0a0a0c !important;
  border-color: rgba(59, 130, 246, 0.5) !important;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  transition: all 0.15s ease;
}

.log-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

.log-level-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  flex-shrink: 0;
  min-width: 90px;
  justify-content: center;
}

.log-level-badge i {
  font-size: 0.9rem;
}

.level-info {
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.level-success {
  background: rgba(34, 197, 94, 0.1);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.level-warning {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.level-error {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.log-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.log-action {
  font-size: 1rem;
  font-weight: 600;
  color: #e4e4e7;
}

.log-time {
  font-size: 0.8rem;
  color: #71717a;
  font-family: monospace;
}

.log-details {
  font-size: 0.9rem;
  color: #a1a1aa;
  line-height: 1.5;
}

.log-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.log-meta-item {
  font-size: 0.8rem;
  color: #71717a;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-family: monospace;
}

.log-meta-item strong {
  color: #a1a1aa;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bulk-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.bulk-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #60a5fa;
}

.bulk-info i {
  font-size: 1.1rem;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.bulk-collection-select,
.bulk-tag-select {
  min-width: 150px;
}

.bulk-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #e94560;
  margin-right: 0.75rem;
}

.file-item.is-selected {
  background: rgba(59, 130, 246, 0.15) !important;
  border-color: rgba(59, 130, 246, 0.3) !important;
}

.file-item.is-selected:hover {
  background: rgba(59, 130, 246, 0.2) !important;
}

.collection-select-inline {
  min-width: 180px;
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: rgba(26, 26, 46, 0.5);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #e94560, #ff6b6b);
  border-radius: 10px;
  border: 2px solid rgba(26, 26, 46, 0.5);
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #ff6b6b, #ff8787);
}

* {
  scrollbar-width: thin;
  scrollbar-color: #e94560 rgba(26, 26, 46, 0.5);
}
</style>
