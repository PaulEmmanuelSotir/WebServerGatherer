import Vue from "vue";
import Vuex from "vuex";

import { writeLocalSettings, loadLocalSettings } from "@/js/settings";
import Backend from "@/js/backend";
import { scanWebservers, killWebserver } from "@/js/webserver";
import { WebServerTab } from "@/js/webserver";
import { IDGenerator } from "@/js/utils";

Vue.use(Vuex);
const WebserverTabIDGen = new IDGenerator();
const globalViews = [
  {
    name: "Server tiles view",
    icon: "mdi-view-compact",
    component: "servers-tile-view",
    description: "WebServers tile view displaying all listening webservers at once"
  },
  { name: "Settings", icon: "mdi-settings", component: "settings" }
];

const state = {
  debug: process.env.NODE_ENV !== "production",
  availableBackends: [new Backend("127.0.0.1")],
  drawer: null,
  snackbarErrorMessage: "",
  currentComponent: globalViews[0],
  title: "Web-Server Gatherer",
  version: "0.0.1",
  author: "PaulEmmanuel SOTIR",
  github: "https://github.com/PaulEmmanuelSotir/DashboardWebUIGatherer",
  localSettingsFilepath: "settings.json",
  settings: null,
  scanInterval: null,
  webserverTabs: [],
  otherGlobalViews: globalViews,
  otherBackendViews: [
    { name: "Console", icon: "mdi-console", component: "console", description: "backend terminal prompt throught SSH tunnel" },
    { name: "Editor", icon: "mdi-code-braces", component: "editor", description: "code editor for easier script running on backend" }
  ]
};

// Mutations are operations that actually mutate the state. each mutation handler gets the entire state tree as the first argument,
// followed by additional payload arguments. mutations must be synchronous and can be recorded by plugins for debugging purposes.
const mutations = {
  updateServers(state, newWebservers) {
    // Find matching server(s) between scanned 'newWebservers' and current/displayed server tabs and create new tabs array
    const NewServerTabs = [];
    for (let i in newWebservers) {
      // NOTE: There may be more than one tab with matching server if user duplicated a tab to browse to different pathes on the same webserver
      let matchingTabs = state.webserverTabs.filter(tab => newWebservers[i].isSame(tab.server));
      if (matchingTabs.length === 0) {
        // Create a new WebserverTab from newly scanned server (wasn't present among existing/displayed WebserverTabs)
        // TODO: provide backend by grouping server by backend when scaning (assumed to be localhost for now)
        const backend = state.availableBackends[0];
        const t = new WebServerTab(WebserverTabIDGen.getNewId(), newWebservers[i], backend);
        NewServerTabs.push(t);
      } else {
        // Add existing webserver tab to new tabs array (respective server is still among scanned servers)
        NewServerTabs.push(...matchingTabs);
      }
    }

    if (typeof state.currentComponent.id !== "undefined") {
      // Update Current (Displayed/Selected webserver tab) to a another one if it have been removed (no longer among scanned servers)
      if (!NewServerTabs.some(tab => state.currentComponent.id === tab.id)) {
        if (NewServerTabs.length > 0) {
          state.currentComponent = NewServerTabs[0];
        } else if (state.availableBackends.lenght > 0) {
          state.currentComponent = state.otherGlobalViews[0]; // Tiles
        } else {
          state.currentComponent = state.otherGlobalViews[1]; // Settings
        }
      }
    }

    state.webserverTabs = NewServerTabs;
  },
  showErrorMessage(state, payload) {
    console.log(payload.message);
    state.snackbarErrorMessage = payload.message;
  },
  showSuccessMessage(state, payload) {
    // Set default values for payload title, details, timeout, hasCloseButton and icon (only payload.message is mandatory)
    payload.title = payload.title ? payload.title : "Success";
    payload.details = payload.details ? payload.details : "";
    payload.timeout = payload.timeout ? payload.timeout : 4000;
    payload.hasCloseButton = payload.hasCloseButton ? payload.hasCloseButton : true;

    state.sucessMessage = payload;
  },
  closeMessage(state, type) {
    if (type == "error") {
      state.snackbarErrorMessage = null;
    } else if (type === "success") {
      state.sucessMessage = null;
    }
  },
  setLocalSettings(state, newSettings, scanInterval = null) {
    state.settings = newSettings;
    state.scanInterval = scanInterval;
  },
  changeCurrentComponent(state, currentView) {
    state.currentComponent = currentView;
  }
};

// actions are functions that cause side effects and can involve asynchronous operations (may be appended to vue's 'methods')
const actions = {
  loadLocalSettings,
  writeLocalSettings,
  scanWebservers,
  killWebserver,
  showMessage: ({ commit }, payload) => {
    let openMutation;
    if (payload.type == "error") {
      openMutation = "showSuccessMessage";
    } else if (payload.type === "success") {
      openMutation = "showErrorMessage";
    }

    const timeout = payload.timeout ? payload.timeout : 7000;
    if (timeout > 0) {
      // Setup close timeout (zero or negative timout values allow to disable timeout)
      setTimeout(() => {
        commit("closeMessage", payload.type);
      }, timeout);
    }

    delete payload.timeout;
    delete payload.type;
    commit(openMutation, payload);
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
  // currentComponent: state => {
  //   let curr = state.webserverTabs.find(tab => tab.id === state.currentView);
  //   if (typeof curr !== "undefined" && curr !== null) {
  //     curr = state.otherGlobalViews.find(view => state.currentOtherViewName === view.name);
  //     if (typeof curr === "undefined" || curr === null)
  //       curr = state.otherBackendViews.find(view => state.currentOtherViewName === view.name);
  //   }

  //   if (typeof curr !== "undefined" && curr !== null) return curr;
  //   console.log(`Error: Couldn't identify current view from 'state.currentOtherViewName=${state.currentOtherViewName}',
  //                'state.currentView=${state.currentView}'`);
  //   return null;
  // }
};

// A Vuex instance is created by combining the state, mutations, actions, and getters.
const store = new Vuex.Store({
  state,
  getters,
  actions,
  mutations
});
export default store;
