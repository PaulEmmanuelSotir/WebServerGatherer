import { net } from "electron";
import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

// For now, we assume backend API is listennin on tis port (assumed to be a free and allowed port when deploying backend API on remote server or localhost)
const backend_port = 8546;

/** notNullNorUndefined
 *  Small helper function wich may be used to test for a value to be non-null and not 'undefined'. (May be usefull for easier conditions in vue templates)
 * May take an additional 'type' argument if type check on value is also needed ('null' by default, ie, no additional type check)
 **/
function notNullNorUndefined(val, type = null) {
  const type_check = type !== null ? typeof val === type : true;
  return typeof val !== "undefined" && val !== null && type_check;
}

/** Server class
 *
 */
class Server {
  constructor(port, hostname, isHttps = false) {
    this.port = port;
    this.hostname = hostname;
    this.isHttps = isHttps;
    this.loading = false;
    this.crashed = false;
    this.failedLoading = false;
    this.errorInfo = null;

    this.info = {
      currentPath: "",
      latestIcon: null,
      latestStatus: null,
      latestPageTitle: null,
      latestThumbnail: null,
      meanSize: null,
      sizeRuningMeanCounter: 0,
      errorLog: []
    };
  }

  get failed() {
    return this.crashed || this.failedLoading;
  }

  get name() {
    return this.info.latestPageTitle
      ? this.info.latestPageTitle
      : `"${this.baseURL}"`;
  }

  get sizeMetric() {
    return this.size;
  }

  get isLocalhost() {
    return this.hostname === "localhost" || this.hostname === "127.0.0.1"; // TODO: not as robust/reliable as intended: Remove this property if possible
  }

  get baseURL() {
    const hostname =
      this.hostname === "localhost" ? "127.0.0.1" : this.hostname;
    const port = this.port ? `:${this.port}` : "";
    return `${this.isHttps ? "https" : "http"}://${hostname}${port}/`;
  }

  get currentURL() {
    return `${this.baseURL}${this.info.currentPath}`;
  }

  get icon() {
    // TODO: update icon (from v-icon to image or svg one) once loaded if available + fallback to default icon (mdi-web or mdi-web-clock is loading)
    if (notNullNorUndefined(this.info.latestIcon, "string")) {
      return this.info.latestIcon;
    }
    if (this.status !== 200) {
      return "mdi-web"; // mdi-web-clock
    }
    return "mdi-web";
  }

  // updateInfoFromWebViewContent(/*webview*/) {
  //   //const content = webview.getWebContents();
  //   // TODO: fill/update this.info fields from "content"
  //   // ...
  // }

  // updateSizeMetric(latestSize) {
  //   // Update running mean of page size (size metric used for having an approximate idea of page size)
  //   this.sizeRuningMeanCounter += 1;
  //   if (this.meanSize === null)
  //    this.meanSize = 0.
  //   this.size =
  //     this.meanSize * (this.sizeRuningMeanCounter - 1) + latestSize / this.sizeRuningMeanCounter;
  // }
}

const DEFAULT_SERVERS = [
  new Server(8888, "127.0.0.1"),
  new Server(8881, "127.0.0.1", true),
  new Server(9001, "127.0.0.1")
];

class Backend {
  constructor(
    name,
    hostname,
    sshcreds = null,
    sshopts = {},
    apiPort = backend_port
  ) {
    this.name = name;
    this.hostname = hostname;
    this.sshcreds = sshcreds;
    this.sshopts = sshopts;
    this.apiPort = apiPort;
  }

  get is_localhost() {
    return this.hostname === "localhost" || this.hostname === "127.0.0.1";
  }
}

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
  servers: DEFAULT_SERVERS,
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
      name: "Settings",
      icon: "mdi-settings",
      component: "settings"
    }
  ]
};

// Mutations are operations that actually mutate the state. each mutation handler gets the entire state tree as the first argument,
// followed by additional payload arguments. mutations must be synchronous and can be recorded by plugins for debugging purposes.
const mutations = {
  changeBackend(state, new_backend) {
    state.severs = []; // Empty servers list as we are changing current backend
    state.bakcend = new_backend;
  },
  updateServers(state, scanned_servers) {
    state.servers = scanned_servers; // Update state servers list to the newly scanned one from current backend
  },
  unexpectedError(state, error_message) {
    state.errorMessage = error_message;
    state.errorSnackbar = true;
  },
  closeErrorSnackbar(state) {
    state.errorMessage = "";
    state.errorSnackbar = false;
  }
};

// actions are functions that cause side effects and can involve asynchronous operations (may be appended to vue's 'methods')
const actions = {
  // incrementIfOdd({ commit, state }) {
  //   if ((state.count + 1) % 2 === 0) {
  //     commit("increment");
  //   }
  // },
  // incrementAsync({ commit }) {
  //   return new Promise((resolve, reject) => {
  //     setTimeout(() => {
  //       commit("increment");
  //       resolve();
  //     }, 1000);
  //   });
  // },
  scanWebservers({ commit }) {
    const state = this.store.state;
    const scan_promises = [];

    for (var backend in state.availableBackends) {
      if (state.debug)
        console.log(`Scanning for listening ports on ${backend} backend`);

      const request = net.request({
        method: "GET",
        protocol: "http:",
        hostname: backend.hostname,
        port: backend_port,
        path: "/"
      });
      request.on("response", response => {
        console.log(`STATUS: ${response.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(response.headers)}`);
        response.on("data", chunk => {
          console.log(`BODY: ${chunk}`);
        });
        response.on("end", () => {
          console.log("No more data in response.");
        });
      });
      request.end();

      scan_promises.push(
        new Promise(() => {
          // TODO: Scan localhost ports for servers listening and yield them asynchronously into an Array
          // TODO: Pass this.config promise and load servers on config.then
          commit("updateServers", DEFAULT_SERVERS);
        })
      );
    }
    return Promise.all(scan_promises);
  }
};

function _currentComponentIsServer(state) {
  if (typeof state.currentView !== "undefined" && state.currentView !== null) {
    return state.currentView < state.servers.length;
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
    const comp_list = _currentComponentIsServer(state)
      ? state.servers
      : state.otherViews;
    const idx =
      state.currentView -
      (_currentComponentIsServer(state) ? 0 : state.servers.length);
    if (idx > comp_list.length) {
      return null;
    }
    return comp_list[idx];
  }
};

// A Vuex instance is created by combining the state, mutations, actions, and getters.
export default new Vuex.Store({
  state,
  getters,
  actions,
  mutations
});
