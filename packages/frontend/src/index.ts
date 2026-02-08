import { Classic } from "@caido/primevue";
import PrimeVue from "primevue/config";
import { createApp } from "vue";

import { SDKPlugin } from "./plugins/sdk";
import "./styles/index.css";
import type { FrontendSDK } from "./types";
import App from "./views/App.vue";

const COMMAND_PREFIX = "repo-explorer";

export const init = (sdk: FrontendSDK) => {
  const app = createApp(App);

  app.use(PrimeVue, {
    unstyled: true,
    pt: Classic,
  });

  app.use(SDKPlugin, sdk);

  const root = document.createElement("div");
  Object.assign(root.style, {
    height: "100%",
    width: "100%",
  });

  root.id = `plugin--repo-explorer`;

  app.mount(root);

  sdk.navigation.addPage("/repo-explorer", {
    body: root,
  });

  sdk.sidebar.registerItem("RepoExplorer", "/repo-explorer", {
    icon: "fas fa-layer-group",
  });

  sdk.commands.register(`${COMMAND_PREFIX}.open`, {
    name: "RepoExplorer: Open Plugin",
    run: () => {
      sdk.navigation.goTo("/repo-explorer");
    },
  });
  sdk.commandPalette.register(`${COMMAND_PREFIX}.open`);

  sdk.commands.register(`${COMMAND_PREFIX}.favorites`, {
    name: "RepoExplorer: View Favorites",
    run: () => {
      sdk.navigation.goTo("/repo-explorer?view=favorites");
      window.dispatchEvent(
        new CustomEvent("repo-navigate", { detail: "favorites" }),
      );
    },
  });
  sdk.commandPalette.register(`${COMMAND_PREFIX}.favorites`);

  sdk.commands.register(`${COMMAND_PREFIX}.collections`, {
    name: "RepoExplorer: View Collections",
    run: () => {
      sdk.navigation.goTo("/repo-explorer?view=collections");
      window.dispatchEvent(
        new CustomEvent("repo-navigate", { detail: "collections" }),
      );
    },
  });
  sdk.commandPalette.register(`${COMMAND_PREFIX}.collections`);

  sdk.commands.register(`${COMMAND_PREFIX}.history`, {
    name: "RepoExplorer: View Recent Files",
    run: () => {
      sdk.navigation.goTo("/repo-explorer?view=history");
      window.dispatchEvent(
        new CustomEvent("repo-navigate", { detail: "history" }),
      );
    },
  });
  sdk.commandPalette.register(`${COMMAND_PREFIX}.history`);

  sdk.commands.register(`${COMMAND_PREFIX}.search-repos`, {
    name: "RepoExplorer: Search Repositories",
    run: () => {
      sdk.navigation.goTo("/repo-explorer?view=repo-search");
      window.dispatchEvent(
        new CustomEvent("repo-navigate", { detail: "repo-search" }),
      );
    },
  });
  sdk.commandPalette.register(`${COMMAND_PREFIX}.search-repos`);

  sdk.commands.register(`${COMMAND_PREFIX}.settings`, {
    name: "RepoExplorer: Open Settings",
    run: () => {
      sdk.navigation.goTo("/repo-explorer?view=settings");
      window.dispatchEvent(
        new CustomEvent("repo-navigate", { detail: "settings" }),
      );
    },
  });
  sdk.commandPalette.register(`${COMMAND_PREFIX}.settings`);

  sdk.commands.register(`${COMMAND_PREFIX}.export-favorites`, {
    name: "RepoExplorer: Export Favorites",
    run: () => {
      window.dispatchEvent(
        new CustomEvent("repo-action", { detail: "export-favorites" }),
      );
    },
  });
  sdk.commandPalette.register(`${COMMAND_PREFIX}.export-favorites`);

  sdk.commands.register(`${COMMAND_PREFIX}.export-collections`, {
    name: "RepoExplorer: Export Collections",
    run: () => {
      window.dispatchEvent(
        new CustomEvent("repo-action", { detail: "export-collections" }),
      );
    },
  });
  sdk.commandPalette.register(`${COMMAND_PREFIX}.export-collections`);

  sdk.commands.register(`${COMMAND_PREFIX}.clear-cache`, {
    name: "RepoExplorer: Clear Cache",
    run: () => {
      window.dispatchEvent(
        new CustomEvent("repo-action", { detail: "clear-cache" }),
      );
    },
  });
  sdk.commandPalette.register(`${COMMAND_PREFIX}.clear-cache`);

  sdk.commands.register(`${COMMAND_PREFIX}.clear-history`, {
    name: "RepoExplorer: Clear History",
    run: () => {
      window.dispatchEvent(
        new CustomEvent("repo-action", { detail: "clear-history" }),
      );
    },
  });
  sdk.commandPalette.register(`${COMMAND_PREFIX}.clear-history`);

  sdk.commands.register(`${COMMAND_PREFIX}.logs`, {
    name: "RepoExplorer: View Logs",
    run: () => {
      sdk.navigation.goTo("/repo-explorer?view=logs");
      window.dispatchEvent(
        new CustomEvent("repo-navigate", { detail: "logs" }),
      );
    },
  });
  sdk.commandPalette.register(`${COMMAND_PREFIX}.logs`);

  sdk.commands.register(`${COMMAND_PREFIX}.clear-logs`, {
    name: "RepoExplorer: Clear Logs",
    run: () => {
      window.dispatchEvent(
        new CustomEvent("repo-action", { detail: "clear-logs" }),
      );
    },
  });
  sdk.commandPalette.register(`${COMMAND_PREFIX}.clear-logs`);
};
