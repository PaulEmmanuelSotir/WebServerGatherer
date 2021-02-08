import { net } from "electron";
import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

class Server {
  constructor(port, hostname, configProfile, isHttps = false) {
    this.port = port;
    this.hostname = hostname;
    this.configProfile = configProfile;
    this.mean_size = 0.0;
    this.sizeCount = 0;
    this.status = null;
    this.isHttps = isHttps;
  }

  get hasConfigProfile() {
    return (
      typeof this.configProfile !== "undefined" && this.configProfile !== null
    );
  }

  get id() {
    // A Web Server is either identified by its config profile, if it exists, or its URL
    return this.hasConfigProfile ? this.configProfile.id : this.url;
  }

  get name() {
    return this.hasConfigProfile ? this.configProfile.name : `"${this.url}"`;
  }

  get displayName() {
    const default_name = `Web-Server listening at "${this.url}"`;
    return this.hasConfigProfile
      ? this.configProfile.name || default_name
      : default_name;
  }

  get sizeMetric() {
    return this.size;
  }

  get isLocalhost() {
    return this.hostname === "localhost" || this.hostname === "127.0.0.1"; // TODO: not as robust/reliable as intended: Remove this property if possible
  }

  get url() {
    const hostname =
      this.hostname === "localhost" ? "127.0.0.1" : this.hostname;
    const port = this.port ? `:${this.port}` : "";
    return `${this.isHttps ? "https" : "http"}://${hostname}${port}`;
  }

  get icon() {
    // TODO: allow icon from config profile and update icon (from v-icon to image or svg one) once loaded if available + fallback to default icon (mdi-web or mdi-web-clock is loading)
    if (this.hasConfigProfile && typeof this.configProfile.icon === "string") {
      return this.configProfile.icon;
    }
    if (this.status !== 200) {
      return "mdi-web"; // mdi-web-clock
    }
    return "mdi-web";
  }

  // TODO : if needed, move these functions to mutation/action vuex logic
  // updateStatus(status) {
  //   this.status = status;
  // }

  // updateSizeMetric(latestSize) {
  //   // Update running mean of page size (size metric used for having an approximate idea of page size)
  //   this.sizeCount += 1;
  //   this.size =
  //     this.mean_size / (1 + 1.0 / this.sizeCount) +
  //     latestSize / (this.sizeCount + 1);
  // }
}

const DEFAULT_SERVERS = [
  new Server(8888, "127.0.0.1", {
    name: "Jupyter Notebook",
    id: 45645646
  }),
  new Server(8881, "127.0.0.1", null),
  new Server(9001, "127.0.0.1", { name: "Tensorboard", id: 345354353 })
];

class Backend {
  constructor(name, hostname, apiPort = 8000, sshcreds = null, sshopts = {}) {
    this.name = name;
    this.hostname = hostname;
    this.apiPort = apiPort;
    this.sshcreds = sshcreds;
    this.sshopts = sshopts;
  }

  get is_localhost() {
    return this.url === "localhost" || this.url === "127.0.0.1";
  }
}

const state = {
  debug: process.env.NODE_ENV !== "production",
  availableBackends: [new Backend("localhost", "127.0.0.1")],
  drawer: null,
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
        port: 443,
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
