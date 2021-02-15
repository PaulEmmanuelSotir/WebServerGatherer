import Vue from "vue";
import Vuex from "vuex";

import { writeLocalSettings, loadLocalSettings } from "@/js/settings";
import Backend from "@/js/backend";
import { scanWebservers } from "@/js/webserver";

Vue.use(Vuex);

const state = {
  debug: process.env.NODE_ENV !== "production",
  availableBackends: [new Backend("localhost", "127.0.0.1")],
  drawer: null,
  errorSnackbar: false,
  errorMessage: "",
  currentView: 0,
  title: "Web-Server Gatherer",
  version: "0.0.1",
  author: "PaulEmmanuel SOTIR",
  github: "https://github.com/PaulEmmanuelSotir/DashboardWebUIGatherer",
  servers: [],
  localSettingsFilepath: "settings.json",
  settings: null,
  scanInterval: null,
  otherViews: [
    {
      name: "Server tiles view",
      icon: "mdi-view-compact",
      component: "servers-tile-view"
    },
    {
      name: "Console",
      icon: "mdi-console",
      component: "console"
    },
    {
      name: "Editor",
      icon: "mdi-code-braces",
      component: "editor"
    },
    {
      name: "Settings",
      icon: "mdi-settings",
      component: "settings"
    }
  ]
};

// Mutations are operations that actually mutate the state. each mutation handler gets the entire state tree as the first argument,
// followed by additional payload arguments. mutations must be synchronous and can be recorded by plugins for debugging purposes.
const mutations = {
  changeBackend(state, newBackend) {
    state.severs = []; // Empty servers list as we are changing current backend
    state.bakcend = newBackend;
  },
  updateServers(state, scannedServers) {
    // TODO: make sure focus stays on already discovered server and keep server.infos + loading/crashed/... statue
    // NOTE: If modifying/asigning a server inside existing server array, use Vue.set(state.servers, index, newServer) instead for reactivity to be effective
    // for (let i in scannedServers) {
    //   const srv = scannedServers[i];
    // }
    const lenDelta = Math.abs(state.servers.length - scannedServers.length);
    state.servers = scannedServers; // Update state servers list to the newly scanned one from current backend

    // Make sure current component/view stays the same if servers count changes
    // TODO: make sure servers are sorted in a deterministic way
    if (state.currentView > scannedServers.length) {
      state.currentView -= lenDelta;
    }
  },
  unexpectedError(state, errorMessage) {
    console.log(errorMessage);
    state.errorMessage = errorMessage;
    state.errorSnackbar = true;
  },
  closeErrorSnackbar(state) {
    state.errorMessage = "";
    state.errorSnackbar = false;
  },
  setLocalSettings(state, newSettings, scanInterval = null) {
    state.settings = newSettings;
    state.scanInterval = scanInterval;
  }
};

// actions are functions that cause side effects and can involve asynchronous operations (may be appended to vue's 'methods')
const actions = {
  loadLocalSettings,
  writeLocalSettings,
  scanWebservers
};

function _currentComponentIsServer(state) {
  if (typeof state.currentView !== "undefined" && state.currentView !== null) {
    if (state.debug) return state.currentView < state.servers.length;
  }
  return false;
}

// Function which may be appended to vue's 'computed' properties
const getters = {
  config: () => {
    // const defaults = {}

    // return new Promise(resolve => {
    //   const conf = {}
    //   return resolve(conf)
    // })
    return {};
  },
  webserverProgress: () => {
    // TODO: return download progress from webview...
    return 33; //(new Date().getSeconds() * 2) / 120;
  },
  subtitle: state => {
    return !Array.isArray(state.servers) || state.servers.length === 0
      ? "No listening server found"
      : `${state.servers.length} listening server found`;
  },
  currentComponentIsServer: _currentComponentIsServer,
  currentComponent: state => {
    const comp_list = _currentComponentIsServer(state) ? state.servers : state.otherViews;
    const idx = state.currentView - (_currentComponentIsServer(state) ? 0 : state.servers.length);
    if (idx > comp_list.length) {
      return null;
    }
    return comp_list[idx];
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
