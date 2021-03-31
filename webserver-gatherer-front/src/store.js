import Vue from "vue";
import Vuex from "vuex";

import { updateLocalSettings, loadLocalSettings } from "@/js/settings";
import { scanWebservers, killWebserver, WebServerTab } from "@/js/webserver";
import { IDGenerator, messageTypes } from "@/js/utils";
import { localhost } from "@/js/remoteServer";

Vue.use(Vuex);
const WebserverTabIDGen = new IDGenerator();

export const globalViews = {
  SETTINGS: { name: "Settings", icon: "mdi-settings", component: "settings" },
  TILES: {
    name: "Server tiles view",
    icon: "mdi-view-compact",
    component: "servers-tile-view",
    description: "WebServers tile view displaying all listening webservers at once"
  }
};

export const remoteServerViews = {
  CONSOLE: { name: "Console", icon: "mdi-console", component: "console", description: "Remote server terminal prompt throught SSH tunnel" },
  EDITOR: {
    name: "Editor",
    icon: "mdi-code-braces",
    component: "editor",
    description: "code editor for easier script running on remote server"
  }
};

const state = {
  debug: process.env.NODE_ENV !== "production",
  availableRemoteServers: [localhost],
  drawer: null,
  snackbarErrorMessage: null,
  successMessage: null,
  currentComponent: globalViews.SETTINGS,
  title: "Web-Server Gatherer",
  version: "0.0.1",
  author: "PaulEmmanuel SOTIR",
  github: "https://github.com/PaulEmmanuelSotir/DashboardWebUIGatherer",
  localSettingsFilepath: "localsettings.json",
  localSettings: null,
  scanInterval: null,
  webserverTabs: []
};

// Mutations are operations that actually mutate the state. each mutation handler gets the entire state tree as the first argument,
// followed by additional payload arguments. mutations must be synchronous and can be recorded by plugins for debugging purposes.
const mutations = {
  updateServers(state, newWebservers) {
    // Find matching server(s) between scanned 'newWebservers' and current/displayed server tabs and create new tabs array
    const NewServerTabs = [];
    for (let i in newWebservers) {
      // TODO: provide remote server by grouping webserver by their remote when scanning (assumed to be localhost for now)
      const remote = state.localSettings.remotes.find(r => r.id === localhost.id);

      // Filter out webservers which are among ingored ports list
      if (!remote.ignoredPorts.includes(newWebservers[i].port)) {
        // NOTE: There may be more than one tab with matching server if user duplicated a tab to browse to different pathes on the same webserver
        let matchingTabs = state.webserverTabs.filter(tab => newWebservers[i].isSame(tab.server));
        if (matchingTabs.length === 0) {
          // Create a new WebserverTab from newly scanned server (wasn't present among existing/displayed WebserverTabs)
          const t = new WebServerTab(WebserverTabIDGen.getNewId(), newWebservers[i], remote);
          NewServerTabs.push(t);
        } else {
          // Add existing webserver tab to new tabs array (respective server is still among scanned servers)
          NewServerTabs.push(...matchingTabs);
        }
      }
    }

    if (typeof state.currentComponent.id !== "undefined") {
      // Update Current (Displayed/Selected webserver tab) to a another one if it have been removed (no longer among scanned servers)
      if (!NewServerTabs.some(tab => state.currentComponent.id === tab.id)) {
        if (NewServerTabs.length > 0) state.currentComponent = NewServerTabs[0];
        else if (state.availableRemoteServers.lenght > 0) state.currentComponent = globalViews.TILES;
        else state.currentComponent = globalViews.SETTINGS;
      }
    }

    state.webserverTabs = NewServerTabs;
  },
  commitMessage(state, payload) {
    if (payload.type === messageTypes.ERROR) {
      state.snackbarErrorMessage = payload;
    } else if (payload.type === messageTypes.SUCCESS) {
      // TODO: Display successMessage in App.vue and replace snackbarErrorMessage here
      state.snackbarErrorMessage = payload;
    }
  },
  closeMessage(state, type) {
    if (type == messageTypes.ERROR) {
      state.snackbarErrorMessage = null;
    } else if (type === messageTypes.SUCCESS) {
      // TODO: Display successMessage in App.vue and replace snackbarErrorMessage here
      state.snackbarErrorMessage = null;
    }
  },
  setLocalSettings(state, { settings, scanInterval }) {
    state.localSettings = settings;
    if (state.scanInterval !== null) clearInterval(state.scanInterval);
    state.scanInterval = scanInterval;
  },
  changeCurrentComponent(state, currentView) {
    state.currentComponent = currentView;
  }
};

// actions are functions that cause side effects and can involve asynchronous operations (may be appended to vue's 'methods')
const actions = {
  loadLocalSettings,
  updateLocalSettings,
  scanWebservers,
  killWebserver,
  confirmDialog: ({ dispatch }, { message, choices, title = null }) => {
    // Show a confirmation message popup before calling callback
    // TODO: implement it (and showMessage with messageTypes.ASK)
    // TODO: and return a promise over anwser
    dispatch("showMessage", { title: title ? title : "Confirmation", details: message, type: messageTypes.ASK });
    return choices[0];
  },
  showMessage: ({ state, commit }, payload) => {
    // Set default values for payload title, hasCloseButton and timeout (only payload.details is mandatory)
    payload.title = payload.title ? payload.title : payload.type;
    payload.timeout = typeof payload.timeout === "number" ? payload.timeout : 7000;
    payload.hasCloseButton = typeof payload.hasCloseButton !== "boolean" ? true : payload.hasCloseButton;

    if (!Object.values(messageTypes).includes(payload.type)) {
      console.log(`Error: Wrong message type: "${payload.type}", valid values are: "${messageTypes}".`);
    } else {
      if (state.debug) console.log(`${payload.type}: ${payload.details}`);

      if (payload.timeout > 0) {
        // Setup close timeout (zero or negative timout values allow to disable timeout)
        setTimeout(() => {
          commit("closeMessage", payload.type);
        }, payload.timeout);
      }
      commit("commitMessage", payload);
    }
  }
};

// Function which may be appended to vue's 'computed' properties
const getters = {
  webserverProgress: () => {
    // TODO: return download progress from webview...
    return 33; //(new Date().getSeconds() * 2) / 120;
  },
  currentComponentIsServer: state => {
    return typeof state.currentComponent.id !== "undefined";
  }
};

// A Vuex instance is created by combining the state, mutations, actions, and getters.
const store = new Vuex.Store({
  state,
  getters,
  actions,
  mutations
});
export default store;
