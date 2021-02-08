<template>
  <v-app>
    <v-app-bar color="primary" dark app>
      <v-container class="d-flex align-center" style="width: 100%">
        <!-- TODO: Add support for URL arddress text box, "Add to backend server profiles" button, "Ignore this port on ... bakend" button, and "Duplicate tab (creates a new profile which browses to current URL)"  -->
        <v-app-bar-nav-icon
          @click="$store.state.drawer = !$store.state.drawer"
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

    <v-navigation-drawer
      class="deep-blue accent-4"
      v-model="$store.state.drawer"
      app
      dark
    >
      <!-- App title and status subtitle -->
      <v-list-item elevation="4">
        <v-list-item-content>
          <v-list-item-title class="title">
            {{ $store.state.title }}
          </v-list-item-title>
          <v-list-item-subtitle> {{ subtitle }} </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <!-- listening web servers -->
      <v-list dense nav>
        <!-- TODO: Change color of each servers wit it respective main color from its webview and display a preview tumbail on over -->
        <v-list-item-group mandatory v-model="$store.state.currentView">
          <v-list-item
            v-for="server in $store.state.servers"
            :key="server.id"
            link
          >
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
            v-for="otherView in $store.state.otherViews"
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
            <v-btn :href="$store.state.github" target="_blank">
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
          v-model="$store.state.currentView"
          continuous
          mandatory
          class="full-height-width"
        >
          <v-tab-item
            class="full-height-width"
            v-for="server in $store.state.servers"
            :key="server.id"
          >
            <v-lazy class="full-height-width">
              <keep-alive class="full-height-width">
                <webserver-view :server="server" />
              </keep-alive>
            </v-lazy>
          </v-tab-item>

          <v-tab-item
            class="full-height-width"
            v-for="otherView in $store.state.otherViews"
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
import { mapGetters, mapActions } from "vuex";

import ServersTileView from "@/components/ServersTileView.vue";
import WebserverView from "@/components/Webserver.vue";
import Settings from "@/components/Settings.vue";
import Console from "@/components/Console.vue";

export default {
  name: "webserver-gatherer",

  components: {
    serversTileView: ServersTileView,
    webserverView: WebserverView,
    settings: Settings,
    console: Console
  },

  computed: mapGetters([
    "config",
    "webserverProgress",
    "subtitle",
    "currentComponentIsServer",
    "currentComponent"
  ]),

  methods: mapActions(["scanWebservers"]),

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
