<template>
  <v-app>
    <v-app-bar color="primary" dark app>
      <v-container class="d-flex align-center" style="width: 100%">
        <!-- TODO: Add support for URL arddress text box, "Add to remote webserver profiles" button, "Ignore this port on ... remote" button, and "Duplicate tab (creates a new profile which browses to current URL)"  -->
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
              Ignore any WebServer listening on "{{ $store.state.currentComponent.server.port }}" port for
              {{
                $store.state.currentComponent.server.isLocalhost()
                  ? ` remote server at ${$store.state.currentComponent.server.hostname} `
                  : " localhost "
              }}
              (can be changed in settings view)
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

    <v-navigation-drawer v-model="$store.state.drawer" dark app>
      <v-list dense class=" pb-0">
        <!-- App title -->
        <v-container>
          <span class="text-uppercase text-h6"> {{ $store.state.title }}</span>
        </v-container>

        <!-- WebServer Tiles and Settings global views -->
        <v-btn-toggle borderless group class="mb-0 d-flex flex-column" v-model="selectedView">
          <v-btn
            class="justify-start ma-0 pr-4 pl-4"
            v-for="otherView in $store.state.otherGlobalViews"
            :key="otherView.name"
            :value="otherView.name"
          >
            <v-icon left> {{ otherView.icon }} </v-icon>
            <span class="font-weight-regular"> {{ otherView.name }} </span>
          </v-btn>
        </v-btn-toggle>
      </v-list>

      <!-- Listening web servers for each remote servers -->
      <v-list dense class="pt-0">
        <!-- TODO: Change color of each servers with it respective main color from its webview and display a preview tumbail on over -->

        <v-list>
          <v-divider></v-divider>
          <v-list class="pt-0">
            <!-- RemoteServer title -->
            <v-list-item class="mb-0 pb-0">
              <v-list-item-content>
                <v-list-item-title class="mb-0 pb-0">
                  <v-badge
                    :content="$store.state.webserverTabs.length"
                    :value="$store.state.webserverTabs.length"
                    color="blue"
                    right
                    inline
                    class="mt-0 mb-0"
                  >
                    <span class="text-overline font-weight-bold">Localhost</span>
                  </v-badge>
                </v-list-item-title>
                <v-list-item-subtitle class="text-wrap font-weight-light mb-0 pb-0">
                  <span v-if="!$store.state.webserverTabs.length <= 0">
                    <strong>{{ $store.state.webserverTabs.length }} </strong> listening web-servers found
                  </span>
                  <v-alert v-else dense type="warning" outlined class="pt-2 pb-2 pl-2 pr-0">
                    <!-- TODO: replace "localhost" with current remote server binding (v-for) -->
                    <!-- TODO: if not localhost, also report about remote server connection success(badge? if no server + precision in this warning message) or failure (error message) -->
                    No listening web-server have been found on "localhost"
                  </v-alert>
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <!-- RemoteServer webservers list -->
            <v-list-item-group v-model="selectedView" v-if="$store.state.webserverTabs.length > 0">
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

            <!-- Console/Editor buttons (remoteServer-wide views) -->
            <v-btn-toggle borderless group class="d-flex justify-center" v-model="selectedView">
              <v-btn v-for="otherView in $store.state.RemoteServerViews" :key="otherView.name" :value="otherView.name">
                <!-- <v-tooltip bottom>
                  <template> -->
                <v-icon left> {{ otherView.icon }} </v-icon>
                <span class="font-weight-regular"> {{ otherView.name }} </span>
                <!-- </template> -->
                <!-- <span> {{ otherView.name }}: {{ otherView.description }} </span> -->
                <!-- </v-tooltip> -->
              </v-btn>
            </v-btn-toggle>
          </v-list>

          <v-divider></v-divider>
        </v-list>

        <v-divider></v-divider>

        <v-list-item elevation="4">
          <v-list-item-content>
            <v-btn :href="$store.state.github" target="_blank">
              <v-icon>mdi-git</v-icon>
              <span class="ml-2">Project Github</span>
            </v-btn>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <!-- Error message snackbar (unexpected error have been thrown) -->
      <v-snackbar
        v-if="$store.state.snackbarErrorMessage !== null"
        :value="$store.state.snackbarErrorMessage !== null"
        :multi-line="Boolean($store.state.snackbarErrorMessage.details)"
        color="accent-4"
        elevation="16"
      >
        <p class="text-justify">
          <span class="font-weight-bold text-capitalize"> {{ $store.state.snackbarErrorMessage.title }}:<br /> </span>
          <em v-if="$store.state.snackbarErrorMessage.details">"{{ $store.state.snackbarErrorMessage.details }}"</em>
        </p>
        <template v-if="$store.state.snackbarErrorMessage.hasCloseButton" v-slot:action="{ attrs }">
          <v-btn text color="red" v-bind="attrs" @click="$store.commit('closeMessage', $store.state.snackbarErrorMessage.type)">
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
            v-for="otherView in [...$store.state.otherGlobalViews, ...$store.state.RemoteServerViews]"
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
    selectedView: function(newVal, oldVal) {
      console.log(`Switched from "${oldVal}" to "${newVal}"`);

      // Determine which view is currently selected
      const state = this.$store.state;
      let curr = null;
      if (notNullNorUndefined(newVal)) {
        curr = state.webserverTabs.find(tab => tab.id === newVal);
        if (!notNullNorUndefined(curr)) {
          curr = state.otherGlobalViews.find(view => view.name === newVal);
          if (!notNullNorUndefined(curr)) curr = state.RemoteServerViews.find(view => view.name === newVal);
        }
      }
      // If could't find current view, set to default one
      if (!notNullNorUndefined(curr)) curr = this.$store.state.globalViews[0];

      this.$store.commit("changeCurrentComponent", curr);
    }
  },

  computed: {
    ...mapGetters(["config", "webserverProgress", "currentComponentIsServer"])
  },

  methods: { ...mapActions(["scanWebservers", "loadLocalSettings", "updateLocalSettings", "killWebserver", "showMessage"]) },

  created: function() {
    console.log("!created!");
    this.loadLocalSettings(this.$vuetify);
  },

  destroyed: function() {
    console.log("!destroyed!");
  },

  errorCaptured: function(err, component, info) {
    const errMessage = `"${component}" component thrown unexpected error. (error: "${err}"; error info: "${info}")`;
    this.showMessage({ type: messageTypes.ERROR, details: `ERR: "${errMessage}"` });
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
#app {
  font-family: Roboto, Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
