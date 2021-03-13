<template>
  <v-app>
    <v-app-bar color="primary" dark app>
      <v-container class="d-flex align-center" style="width: 100%">
        <!-- TODO: Add support for URL arddress text box, "Add to backend server profiles" button, "Ignore this port on ... bakend" button, and "Duplicate tab (creates a new profile which browses to current URL)"  -->
        <v-app-bar-nav-icon @click="$store.state.drawer = !$store.state.drawer" class="flex-shrink-1 flex-grow-0"></v-app-bar-nav-icon>
        <div class="d-flex align-center flex-grow-1 flex-shrink-1" v-if="$store.state.currentComponent !== null">
          <v-icon class="flex-shrink-1 flex-grow-0 ma-1" v-if="!currentComponentIsServer">{{ $store.state.currentComponent.icon }}</v-icon>
          <v-toolbar-title
            class="flex-shrink-1 flex-grow-0"
            v-if="!currentComponentIsServer || $store.state.currentComponent.latestPageTitle"
            >{{ $store.state.currentComponent.name }}</v-toolbar-title
          >
          <v-text-field
            class="flex-grow-1 flex-shrink-1 ml-4 mr-4 mt-7 centered-input"
            type="text"
            :prepend-inner-icon="$store.state.currentComponent.icon"
            clearable
            single-line
            solo-inverted
            rounded
            dense
            :value="$store.state.currentComponent.currentURL"
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
          <!-- TODO: allow to clone a webserver view into another 'tab' (e.g. mdi-content-copy or mdi-content-duplicate icon) -->
          <!-- Ignore/filter-out port button -->
          <v-tooltip bottom class="flex-shrink-1 flex-grow-0" v-if="currentComponentIsServer">
            <template v-slot:activator="{ on, attrs }">
              <v-btn text v-bind="attrs" v-on="on">
                <v-icon>mdi-filter-remove</v-icon>
              </v-btn>
            </template>
            <span>
              Ignore any WebServer listening on "{{ $store.state.currentComponent.server.port }}" port for "{{
                $store.state.currentComponent.server.hostname
              }}" backend (can be changed in settings view)
            </span>
          </v-tooltip>
          <!-- Kill button -->
          <v-tooltip bottom class="flex-shrink-1 flex-grow-0" v-if="currentComponentIsServer">
            <template v-slot:activator="{ on, attrs }">
              <v-btn text v-bind="attrs" v-on="on" v-on:click="killWebserver($store.state.currentComponent.server)">
                <v-icon> mdi-close </v-icon>
              </v-btn>
            </template>
            <span> Kill WebServer process listening on "{{ $store.state.currentComponent.server.port }}" port </span>
          </v-tooltip>
        </div>
      </v-container>
    </v-app-bar>

    <v-navigation-drawer class="deep-blue accent-4" v-model="$store.state.drawer" app dark>
      <!-- App title and status subtitle -->
      <v-list-item elevation="4">
        <v-list-item-content>
          <v-list-item-title class="title">
            {{ $store.state.title }}
          </v-list-item-title>
          <v-list-item-subtitle class="mb-2"> {{ subtitle }} </v-list-item-subtitle>
          <v-btn-toggle borderless group class="d-flex flex-column" v-model="selectedView">
            <v-btn
              text
              class="justify-start pb-0 pt-0 pr-4 pl-4"
              v-for="otherView in $store.state.otherGlobalViews"
              :key="otherView.name"
              :value="otherView.name"
            >
              <v-icon left> {{ otherView.icon }} </v-icon>
              <span class="font-weight-regular"> {{ otherView.name }} </span>
            </v-btn>
          </v-btn-toggle>
          <!-- <v-btn
            text
            v-for="otherView in $store.state.otherGlobalViews"
            :key="otherView.name"
            @click="$store.state.currentComponent = otherView.name"
          >
          </v-btn> -->
        </v-list-item-content>
      </v-list-item>

      <!-- Listening web servers -->
      <v-list dense nav>
        <!-- TODO: Change color of each servers wit it respective main color from its webview and display a preview tumbail on over -->
        <v-divider></v-divider>
        <v-spacer></v-spacer>
        <v-subheader> Localhost </v-subheader>
        <v-list-item-group v-model="selectedView">
          <v-list-item v-for="serverTab in $store.state.webserverTabs" :key="serverTab.id" :value="serverTab.id" link>
            <v-list-item-icon>
              <v-icon>{{ serverTab.icon }}</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>
                {{ serverTab.name }}
              </v-list-item-title>
              <v-list-item-subtitle v-if="serverTab.latestPageTitle">
                <!-- I.e., if serverTab.name is other than url (name from serverTab.latestPageTitle) -->
                {{ serverTab.server.baseURL }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>

        <!-- Servers tiles/grid, console, ... and settings views -->
        <v-btn-toggle borderless group class="d-flex justify-center" v-model="selectedView">
          <v-btn text v-for="otherView in $store.state.otherBackendViews" :key="otherView.name" :value="otherView.name">
            <!-- <v-tooltip bottom>
              <template> -->
            <v-icon left> {{ otherView.icon }} </v-icon>
            <span class="font-weight-regular"> {{ otherView.name }} </span>
            <!-- </template> -->
            <!-- <span> {{ otherView.name }}: {{ otherView.description }} </span> -->
            <!-- </v-tooltip> -->
          </v-btn>
        </v-btn-toggle>
        <!-- <v-list-item v-for="otherView in $store.state.otherViews" :key="otherView.name" link>
            <v-list-item-icon>
              <v-icon> {{ otherView.icon }} </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{ otherView.name }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item> -->

        <v-divider></v-divider>
        <v-spacer></v-spacer>
        <v-subheader> Remote Backend #1 </v-subheader>

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
      <!-- Error message snackbar (unexpected error have been thrown) -->
      <v-snackbar :value="$store.state.snackbarErrorMessage === null" :multi-line="true" color="accent-4" elevation="16">
        <p class="text-justify">
          <span class="font-weight-bold"> Unexpected error have been thrown:<br /> </span>
          "<em>{{ $store.state.errorMessage }}</em
          >"
        </p>
        <template v-slot:action="{ attrs }">
          <v-btn text color="red" v-bind="attrs" @click="$store.commit('closeMessage', { type: 'error' })">
            Close
          </v-btn>
        </template>
      </v-snackbar>

      <!-- Web-Server webview or other view component (settings/tile-view/console/etc) -->
      <v-container fill-height class="ma-0 pa-0">
        <v-tabs-items v-if="currentComponentIsServer" v-model="selectedView" continuous class="full-height-width">
          <v-tab-item class="full-height-width" v-for="serverTab in $store.state.webserverTabs" :key="serverTab.id" :value="serverTab.id">
            <v-lazy class="full-height-width">
              <keep-alive class="full-height-width">
                <webserver-view :serverTab="serverTab" />
              </keep-alive>
            </v-lazy>
          </v-tab-item>
        </v-tabs-items>

        <v-tabs-items v-else v-model="selectedView" continuous class="full-height-width">
          <v-tab-item
            class="full-height-width"
            v-for="otherView in [...$store.state.otherGlobalViews, ...$store.state.otherBackendViews]"
            :key="otherView.name"
            :value="otherView.name"
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
import Editor from "@/components/Editor.vue";
import { notNullNorUndefined } from "@/js/utils";

export default {
  name: "webserver-gatherer",

  components: {
    serversTileView: ServersTileView,
    webserverView: WebserverView,
    settings: Settings,
    console: Console,
    editor: Editor
  },

  data: () => ({
    selectedView: "Server tiles view"
  }),

  watch: {
    selectedView: function(oldVal, newVal) {
      console.log(`Switched to ${JSON.stringify(newVal)}`);

      // Determine which view is currently selected
      const state = this.$store.state;
      let curr = null;
      if (notNullNorUndefined(newVal)) {
        curr = state.webserverTabs.find(tab => tab.id === newVal);
        if (!notNullNorUndefined(curr)) {
          curr = state.otherGlobalViews.find(view => view.name === newVal);
          if (!notNullNorUndefined(curr)) curr = state.otherBackendViews.find(view => view.name === newVal);
        }
      }
      // If could't find current view, set to default one
      if (!notNullNorUndefined(curr)) curr = this.$store.state.globalViews[0];

      this.$store.commit("changeCurrentComponent", curr);
    }
  },

  computed: {
    ...mapGetters(["config", "webserverProgress", "subtitle", "currentComponentIsServer"])
  },

  methods: { ...mapActions(["scanWebservers", "loadLocalSettings", "writeLocalSettings", "killWebserver", "showMessage"]) },

  created: function() {
    console.log("!created!");
    this.$store.dispatch("loadLocalSettings");
  },

  destroyed: function() {
    console.log("!destroyed!");
  },

  errorCaptured: function(err, component, info) {
    const errMessage = `"${component}" component thrown unexpected error. (error: "${err}"; error info: "${info}")`;
    this.showMessage({ type: "error", message: `ERR: "${errMessage}"` });
    return this.$store.state.debug; // Error should be propagating further in debug
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
