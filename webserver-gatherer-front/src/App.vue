<template>
  <v-app>
    <v-app-bar color="primary" dark app>
      <v-container class="d-flex align-center" style="width: 100%">
        <!-- TODO: Add support for URL arddress text box, "Add to backend server profiles" button, "Ignore this port on ... bakend" button, and "Duplicate tab (creates a new profile which browses to current URL)"  -->
        <v-app-bar-nav-icon
          @click="drawer = !drawer"
          class="flex-shrink-1 flex-grow-0"
        ></v-app-bar-nav-icon>
        <div
          class="d-flex align-center flex-grow-1 flex-shrink-1"
          v-if="currentComponent !== null"
        >
          <v-icon
            class="flex-shrink-1 flex-grow-0 ma-1"
            v-if="!currentComponentIsServer"
            >{{ currentComponent.icon }}</v-icon
          >
          <v-toolbar-title
            class="flex-shrink-1 flex-grow-0"
            v-if="
              !currentComponentIsServer || currentComponent.hasConfigProfile
            "
            >{{ currentComponent.name }}</v-toolbar-title
          >
          <v-text-field
            class="flex-grow-1 flex-shrink-1 ml-4 mr-4 mt-7 centered-input"
            type="text"
            :prepend-inner-icon="currentComponent.icon"
            clearable
            single-line
            solo-inverted
            rounded
            dense
            :value="currentComponent.url"
            v-if="currentComponentIsServer"
          >
            <template v-slot:progress>
              <v-progress-linear
                class="mr-4 ml-4"
                v-if="webserverProgress != 100"
                :value="webserverProgress"
                color="white"
                absolute
                height="4"
              ></v-progress-linear>
            </template>
          </v-text-field>
          <v-tooltip
            bottom
            v-if="
              currentComponentIsServer && !currentComponent.hasConfigProfile
            "
            class="flex-shrink-1 flex-grow-0"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-btn text v-bind="attrs" v-on="on">
                <v-icon>mdi-server-plus</v-icon>
              </v-btn>
            </template>
            <span>
              Create backend profile for "{{ currentComponent.name }}" WebServer
              (can be changed in settings view)
            </span>
          </v-tooltip>
          <v-tooltip
            bottom
            v-if="currentComponentIsServer && currentComponent.hasConfigProfile"
            class="flex-shrink-1 flex-grow-0"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-btn text v-bind="attrs" v-on="on">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </template>
            <span>
              Modify backend profile for "{{ currentComponent.name }}" WebServer
            </span>
          </v-tooltip>
          <v-tooltip
            bottom
            class="flex-shrink-1 flex-grow-0"
            v-if="currentComponentIsServer"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-btn text v-bind="attrs" v-on="on">
                <v-icon>mdi-filter-remove</v-icon>
              </v-btn>
            </template>
            <span>
              Ignore any WebServer listening on port "{{
                currentComponent.port
              }}" for this backend (can be changed in settings view)
            </span>
          </v-tooltip>
        </div>
      </v-container>
    </v-app-bar>

    <v-navigation-drawer class="deep-blue accent-4" v-model="drawer" app dark>
      <!-- App title and status subtitle -->
      <v-list-item elevation="4">
        <v-list-item-content>
          <v-list-item-title class="title"> {{ title }} </v-list-item-title>
          <v-list-item-subtitle> {{ subtitle }} </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <!-- listening web servers -->
      <v-list dense nav>
        <!-- TODO: Change color of each servers wit it respective main color from its webview and display a preview tumbail on over -->
        <v-list-item-group mandatory v-model="currentView">
          <v-list-item v-for="server in localhostServers" :key="server.id" link>
            <v-list-item-icon>
              <v-icon>{{ server.icon }}</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>
                {{ server.name }}
              </v-list-item-title>
              <v-list-item-subtitle v-if="server.hasConfigProfile">
                <!-- I.e., if server.name is other than url (name from server.configProfile.name) -->
                {{ server.url }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <v-divider></v-divider>
          <v-spacer></v-spacer>

          <!-- Servers tiles/grid and settings views -->

          <v-list-item
            v-for="otherView in otherViews"
            :key="otherView.name"
            link
          >
            <v-list-item-icon>
              <v-icon> {{ otherView.icon }} </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{ otherView.name }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>

        <v-divider></v-divider>

        <v-list-item elevation="4">
          <v-list-item-content>
            <v-btn
              href="https://github.com/PaulEmmanuelSotir/DashboardWebUIGatherer"
              target="_blank"
            >
              <v-icon>mdi-git</v-icon>
              <v-spacer></v-spacer>
              <span class="mr-2">Project Github</span>
            </v-btn>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fill-height class="ma-0 pa-0">
        <v-tabs-items
          v-model="currentView"
          continuous
          mandatory
          class="full-height-width"
        >
          <v-tab-item
            class="full-height-width"
            v-for="server in localhostServers"
            :key="server.id"
          >
            <v-lazy class="full-height-width">
              <keep-alive class="full-height-width">
                <dashboard :server="server" />
              </keep-alive>
            </v-lazy>
          </v-tab-item>

          <v-tab-item
            class="full-height-width"
            v-for="otherView in otherViews"
            :key="otherView.name"
          >
            <v-lazy class="full-height-width">
              <keep-alive class="full-height-width">
                <component :is="otherView.component"></component>
              </keep-alive>
            </v-lazy>
          </v-tab-item>
        </v-tabs-items>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import ServersTileView from "@/components/ServersTileView.vue";
import Dashboard from "@/components/Dashboard.vue";
import Settings from "@/components/Settings.vue";
import Console from "@/components/Console.vue";

function loadConfig() {
  // const defaults = {}

  // return new Promise(resolve => {
  //   const conf = {}
  //   return resolve(conf)
  // })
  return {};
}

// function getCurrentComponent(ctx) {
//   if (typeof ctx.currentView !== "undefined" && ctx.currentView !== null) {
//     return ctx.currentView >= ctx.localhostServers.length
//       ? { isServer: false, view: ctx.otherViews[ctx.currentView] }
//       : { isServer: true, view: ctx.localhostServers[ctx.currentView] };
//   }
//   return null;
// }

class Server {
  constructor(port, domain, configProfile, isHttps = false) {
    this.port = port;
    this.domain = domain;
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
    return this.domain === "localhost" || "127.0.0.1"; // TODO: not as robust/reliable as intended: Remove this property if possible
  }

  get url() {
    const domain = this.domain === "localhost" ? "127.0.0.1" : this.domain;
    const port = this.port ? `:${this.port}` : "";
    return `${this.isHttps ? "https" : "http"}://${domain}${port}`;
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

  updateStatus(status) {
    this.status = status;
  }

  updateSizeMetric(latestSize) {
    // Update running mean of page size (size metric used for having an approximate idea of page size)
    this.sizeCount += 1;
    this.size =
      this.mean_size / (1 + 1.0 / this.sizeCount) +
      latestSize / (this.sizeCount + 1);
  }
}

function scanLocalhost() {
  // return new Promise(resolve => {
  // TODO: Scan localhost ports for servers listening and yield them asynchronously into an Array
  // TODO: Pass this.config promise and load servers on config.then
  const servers = [
    new Server(8888, "127.0.0.1", { name: "Jupyter Notebook", id: 45645646 }),
    new Server(8881, "127.0.0.1", null),
    new Server(9001, "127.0.0.1", { name: "Tensorboard", id: 345354353 })
  ];
  return servers;
  // return resolve(servers)
  //})
}

export default {
  name: "dashboard-gatherer",

  components: {
    serversTileView: ServersTileView,
    dashboard: Dashboard,
    settings: Settings,
    console: Console
  },

  data: () => ({
    drawer: null,
    currentView: 0,
    title: "Web-Server Gatherer",
    version: "0.0.1",
    author: "PaulEmmanuel SOTIR",
    github: "https://github.com/PaulEmmanuelSotir/DashboardWebUIGatherer",
    localhostServers: scanLocalhost(),
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
  }),

  computed: {
    conf: loadConfig,
    webserverProgress: function() {
      // TODO: return download progress from webview...
      return 33; //(new Date().getSeconds() * 2) / 120;
    },
    subtitle: function() {
      return !Array.isArray(this.localhostServers) ||
        this.localhostServers.length === 0
        ? "No listening server found"
        : `${this.localhostServers.length} listening server found`;
    },
    currentComponentIsServer: function() {
      if (
        typeof this.currentView !== "undefined" &&
        this.currentView !== null
      ) {
        return this.currentView < this.localhostServers.length;
      }
      return false;
    },
    currentComponent: function() {
      const comp_list = this.currentComponentIsServer
        ? this.localhostServers
        : this.otherViews;
      const idx =
        this.currentView -
        (this.currentComponentIsServer ? 0 : this.localhostServers.length);
      if (idx > comp_list.length) {
        return null;
      }
      return comp_list[idx];
    }
  },

  created: function() {
    console.log("!created!");
  },

  destroyed: function() {
    console.log("!destroyed!");
  },

  errorCaptured: function(err, component, info) {
    console.log(`ERR: "${component}" component error: "${err}"; info: ${info}`);
    return true; // Error should be propagating further
  }
};
</script>

<style>
.full-height-width {
  height: 100%;
  width: 100%;
}
.centered-input >>> input {
  text-align: center;
}
</style>
