<template>
  <v-app>
    <v-navigation-drawer
      class="deep-blue accent-4"
      v-model="current_view"
      dark
      expand-on-hover
    >
      <!-- App title and status subtitle -->
      <v-list-item link>
        <v-list-item-content>
          <v-list-item-title class="title"> {{ title }} </v-list-item-title>
          <v-list-item-subtitle> {{ subtitle }} </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <!-- Listenning web servers -->
      <v-list dense nav>
        <v-list-item
          v-for="server in localhost_servers"
          :key="server.name"
          link
        >
          <v-list-item-icon>
            <v-icon>{{ server.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ server.url }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-divider></v-divider>

      <!-- Servers tiles/grid and settings views -->
      <v-list>
        <v-list-item link>
          <v-list-item-icon>
            <v-icon>mdi-view-compact</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Servers tiles view</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link>
          <v-list-item-icon>
            <v-icon>mdi-console-line</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Console</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link>
          <v-list-item-icon>
            <v-icon>mdi-cogs</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Settings</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app color="primary" dark>
      <div class="d-flex align-center"></div>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Web-Servers listenning on localhost</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        href="https://github.com/PaulEmmanuelSotir/DashboardWebUIGatherer"
        target="_blank"
        text
      >
        <span class="mr-2">Github</span>
        <v-icon>mdi-github</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container v-for="server in localhost_servers" :key="server">
        <v-lazy :options="{ threshold: 0.5 }" transition="fade-transition">
          <dashboard :server="server" />
        </v-lazy>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
function loadConfig() {
  // const defaults = {}

  // return new Promise(resolve => {
  //   const conf = {}
  //   return resolve(conf)
  // })
  return {}
}

class Server {
  constructor(name, port, domain, config_profile) {
    this.name = name
    this.port = port
    this.domain = domain
    this.config_profile = config_profile
    this.mean_size = 0.0
    this.size_count = 0
    this.status = null
  }

  get size_metric() {
    return this.size
  }

  get is_localhost() {
    return domain === 'localhost' || '127.0.0.1'
  }

  get url() {
    return `${this.domain}:${this.port}`
  }

  get icon() {
    // TODO: allow icon from config profile and update icon (from v-icon to image or svg one) once loaded if available + fallback to default icon (mdi-web or mdi-web-clock is loading)
    if (
      this.config_profile != null &&
      typeof this.config_profile.icon === 'string'
    ) {
      return this.config_profile.icon
    }
    if (this.status !== 200) {
      return 'mdi-web' // mdi-web-clock
    }
    return 'mdi-web'
  }

  update_status(status) {
    this.status = status
  }

  update_size_metric(latest_size) {
    // Update running mean of page size (size metric used for having an approximate idea of page size)
    this.size_count += 1
    this.size =
      this.mean_size / (1 + 1.0 / this.size_count) +
      latest_size / (this.size_count + 1)
  }
}

function scanLocalhost() {
  // return new Promise(resolve => {
  // TODO: Scan localhost ports for servers listenning and yield them asynchronously into an Array
  // TODO: Pass this.config promise and load servers on config.then
  const servers = [
    new Server('Test Jupyter Notebook server', 8888, 'localhost', null)
  ]
  return servers
  // return resolve(servers)
  //})
}

export default {
  name: 'DashboardGatherer',

  components: {
    dashboard: () => import('@/components/Dashboard.vue')
    //settings: () => import('@/components/Settings.vue')
  },

  data: () => ({
    current_view: null,
    title: 'DashBoard Web UI Gatherer',
    shorttitle: 'DashBoard Gatherer',
    version: '0.0.1',
    author: 'PaulEmmanuel SOTIR',
    github: 'https://github.com/PaulEmmanuelSotir/DashboardWebUIGatherer',
    localhost_servers: scanLocalhost()
  }),

  computed: {
    conf: loadConfig(),
    subtitle: function() {
      return !Array.isArray(this.localhost_servers) ||
        this.localhost_servers.length === 0
        ? 'No listenning server found'
        : `${this.localhost_servers.length} listenning server found`
    }
  },

  created: function() {
    console.log('!created!')
  },

  destroyed: function() {
    console.log('!destroyed!')
  }
}
</script>

<style></style>
