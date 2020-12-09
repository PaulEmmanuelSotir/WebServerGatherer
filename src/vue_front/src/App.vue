<template>
  <v-app>
    <v-app-bar color="primary" dark app>
      <div class="d-flex align-center flex-wrap">
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
        <v-toolbar-title>{{ title }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          href="https://github.com/PaulEmmanuelSotir/DashboardWebUIGatherer"
          target="_blank"
          text
        >
          <v-icon>mdi-github</v-icon>
          <v-spacer></v-spacer>
          <span class="mr-2">Github</span>
        </v-btn>
      </div>
    </v-app-bar>

    <v-navigation-drawer class="deep-blue accent-4" v-model="drawer" app dark>
      <!-- App title and status subtitle -->
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="title"> {{ navtitle }} </v-list-item-title>
          <v-list-item-subtitle> {{ navsubtitle }} </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <!-- Listenning web servers -->
      <v-list dense nav>
        <v-list-item-group mandatory v-model="current_view">
          <v-list-item
            v-for="server in localhost_servers"
            :key="server.id"
            link
          >
            <v-list-item-icon>
              <v-icon>{{ server.icon }}</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>
                {{
                  server.config_profile
                    ? server.config_profile.name
                    : server.url
                }}
              </v-list-item-title>
              <v-list-item-subtitle v-if="server.config_profile">
                {{ server.url }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <v-divider></v-divider>

          <!-- Servers tiles/grid and settings views -->

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
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-card flat tile height="100%">
        <v-tabs-items v-model="current_view" continuous mandatory>
          <v-tab-item v-for="(server, i) in localhost_servers" :key="server.id">
            <v-lazy>
              <div>
                <strong> Server number {{ i }}: "{{ server }}"</strong>
                <dashboard :server="server" />
              </div>
            </v-lazy>
          </v-tab-item>

          <v-tab-item>
            <v-lazy>
              <v-card>
                Servers tile view...
              </v-card>
            </v-lazy>
          </v-tab-item>

          <v-tab-item>
            <v-lazy>
              <v-card>
                Console view...
              </v-card>
            </v-lazy>
          </v-tab-item>

          <v-tab-item>
            <v-lazy>
              Settings view
              <settings />
            </v-lazy>
          </v-tab-item>
        </v-tabs-items>
      </v-card>
    </v-main>

    <v-footer app padless>
      <v-card flat tile width="100%" class="primary lighten-1 text-center">
        <!-- <v-card-text>
          Lorem ipsum .... <strong>bla bla bla</strong>
        </v-card-text>

        <v-divider></v-divider> -->

        <v-card-text class="white--text">
          {{ new Date().getFullYear() }} —
          <strong>{{ title }}</strong>
        </v-card-text>
      </v-card>
    </v-footer>
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
  constructor(port, domain, config_profile, is_https = false) {
    this.port = port
    this.domain = domain
    this.config_profile = config_profile
    this.mean_size = 0.0
    this.size_count = 0
    this.status = null
    this.is_https = is_https
  }

  get id() {
    // A Web Server is either identified by its config profile, if it exists, or its URL
    return this.config_profile ? this.config_profile.id : this.url
  }

  get size_metric() {
    return this.size
  }

  get is_localhost() {
    return domain === 'localhost' || '127.0.0.1'
  }

  get url() {
    const domain = this.domain === 'localhost' ? '127.0.0.1' : this.domain
    const port = this.port ? `:${this.port}` : ''
    return `${this.is_https ? 'https' : 'http'}://${domain}${port}`
  }

  get icon() {
    // TODO: allow icon from config profile and update icon (from v-icon to image or svg one) once loaded if available + fallback to default icon (mdi-web or mdi-web-clock is loading)
    if (this.config_profile && typeof this.config_profile.icon === 'string') {
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
    new Server(8888, '127.0.0.1', { name: 'Jupyter Notebook', id: 45645646 }),
    new Server(8881, '127.0.0.1', null),
    new Server(9001, '127.0.0.1', { name: 'Tensorboard', id: 345354353 })
  ]
  return servers
  // return resolve(servers)
  //})
}

export default {
  name: 'DashboardGatherer',

  components: {
    dashboard: () => import('@/components/Dashboard.vue'),
    settings: () => import('@/components/Settings.vue')
  },

  data: () => ({
    drawer: null,
    current_view: 0,
    title: 'DashBoard Web UI Gatherer',
    navtitle: 'Web-Servers listenning on localhost',
    shorttitle: 'DashBoard Gatherer',
    version: '0.0.1',
    author: 'PaulEmmanuel SOTIR',
    github: 'https://github.com/PaulEmmanuelSotir/DashboardWebUIGatherer',
    localhost_servers: scanLocalhost()
  }),

  computed: {
    conf: loadConfig(),
    navsubtitle: function() {
      return !Array.isArray(this.localhost_servers) ||
        this.localhost_servers.length === 0
        ? 'No listenning server found'
        : `${this.localhost_servers.length} listenning server found`
    }
  },

  watch: {
    current_view: function(newView, oldView) {
      console.log(
        `Drawer model is "${this.drawer}", localhost servers : "${this.localhost_servers}"`
      )
      console.log(`View changed from "${oldView}" to "${newView}"...`)
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
