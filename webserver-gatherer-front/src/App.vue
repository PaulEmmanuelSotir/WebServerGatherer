<template>
  <v-app>
    <v-app-bar color="primary" dark app>
      <v-container class="d-flex align-center" style="width: 100%">
        <v-app-bar-nav-icon @click="$store.state.drawer = !$store.state.drawer" class="flex-shrink-1 flex-grow-0"></v-app-bar-nav-icon>
        <div class="d-flex align-center flex-grow-1 flex-shrink-1" v-if="$store.state.currentComponent !== null">
          <v-icon class="flex-shrink-1 flex-grow-0 ma-1" v-if="!currentComponentIsServer">{{ $store.state.currentComponent.icon }}</v-icon>
          <v-toolbar-title
            class="flex-shrink-1 flex-grow-0"
            v-if="!currentComponentIsServer || $store.state.currentComponent.latestPageTitle"
            >{{ $store.state.currentComponent.name }}</v-toolbar-title
          >

          <!-- Address Bar (Webview URL) -->
          <v-text-field
            class="flex-grow-1 flex-shrink-1 ml-4 mr-4 mt-7 centered-input"
            type="text"
            ref="AddressBar"
            clearable
            v-model.trim="currentPath.$model"
            :prefix="$store.state.currentComponent.server.baseURL"
            :prepend-inner-icon="$store.state.currentComponent.icon"
            :append-icon="addressBarIsAtCurrentURL ? 'mdi-magnify' : 'mdi-reload'"
            @click:append="onAddressBarBrowseOrReload"
            @keydown.enter="onAddressBarBrowseOrReload"
            :disabled="$store.state.currentComponent.webviewIsLoading"
            single-line
            solo-inverted
            rounded
            dense
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
              <v-btn
                text
                v-bind="attrs"
                v-on="on"
                @click="$store.state.currentComponent.remote.addIgnoredPort($store, $store.state.currentComponent.server.port)"
              >
                <v-icon>mdi-filter-remove</v-icon>
              </v-btn>
            </template>
            <span>
              Ignore any WebServer listening on "{{ $store.state.currentComponent.server.port }}" port from
              {{
                $store.state.currentComponent.server.isLocalhost
                  ? " localhost "
                  : ` remote server at "${$store.state.currentComponent.server.hostname}" `
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

          <!-- Settings reset button -->
          <v-tooltip bottom class="flex-shrink-1 flex-grow-1" v-if="$store.state.currentComponent.name === globalViews.SETTINGS.name">
            <template v-slot:activator="{ on, attrs }">
              <v-btn right v-bind="attrs" v-on="on" @click="resetLocalSettingsWithConfirmation">
                <v-icon> mdi-backup-restore </v-icon>
                <span class="font-weight-regular"> Restore default settings </span>
              </v-btn>
            </template>
            <span> All application settings will be lost and restored to its defaults, including remote servers list </span>
          </v-tooltip>
        </div>
      </v-container>
    </v-app-bar>

    <v-navigation-drawer v-model="$store.state.drawer" dark app>
      <v-list dense class="pb-0">
        <!-- App title -->
        <v-container>
          <span class="text-uppercase text-h6"> {{ $store.state.title }}</span>
        </v-container>

        <!-- WebServer Tiles and Settings global views -->
        <v-btn-toggle borderless group class="mb-0 d-flex flex-column" v-model="selectedView">
          <v-btn class="justify-start ma-0 pr-4 pl-4" v-for="otherView in globalViews" :key="otherView.name" :value="otherView.name">
            <v-icon> {{ otherView.icon }} </v-icon>
            <span class="ml-2 font-weight-regular"> {{ otherView.name }} </span>
          </v-btn>
        </v-btn-toggle>
      </v-list>

      <!-- Listening web servers for each remote servers -->
      <v-list dense class="pt-0">
        <!-- TODO: Change color of each servers with it respective main color from its webview and display a preview tumbail on over -->

        <v-divider></v-divider>
        <v-list>
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
                    <!-- TODO: if not localhost, also report about remote server connection success(badge? if no server
                    + precision in this warning message) or failure (error message) -->
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
            <v-btn-toggle rounded background-color="transparent" class="d-flex justify-center" v-model="selectedView">
              <v-btn outlined elevation="1" v-for="otherView in remoteServerViews" :key="otherView.name" :value="otherView.name">
                <!-- TODO: Figure out how to setup tooltip on button toggle -->
                <!--<v-tooltip bottom>
                  <template> -->
                <v-icon> {{ otherView.icon }} </v-icon>
                <span class="ml-1 font-weight-regular"> {{ otherView.name }} </span>
                <!-- </template> -->
                <!-- <span> {{ otherView.name }}: {{ otherView.description }} </span> -->
                <!-- </v-tooltip> -->
              </v-btn>
            </v-btn-toggle>
          </v-list>

          <v-divider></v-divider>
        </v-list>

        <v-list-item elevation="4">
          <v-list-item-content>
            <v-container class="pa-0 d-flex flex-column">
              <!-- Project Github link button -->
              <v-btn class="mb-2" elevation="1" rounded :href="$store.state.github" target="_blank">
                <v-icon>mdi-git</v-icon>
                <span class="ml-2 font-weight-regular">Project GitHub</span>
              </v-btn>

              <!-- Privacy policy dialog (button opens privacy policy dialog) -->
              <v-dialog v-model="privacyPolicyDialog" width="50%">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn rounded elevation="1" color="green darken-1" v-bind="attrs" v-on="on">
                    <v-icon>mdi-shield-search</v-icon>
                    <span class="ml-2 font-weight-regular">Privacy Policy</span>
                  </v-btn>
                </template>
                <privacyPolicy></privacyPolicy>
              </v-dialog>
            </v-container>
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
            v-for="otherView in [...Object.values(globalViews), ...Object.values(remoteServerViews)]"
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
//import { validationMixin } from "vuelidate";
//import { maxLength, ipAddress, url, or } from "vuelidate/lib/validators";

import ServersTileView from "@/components/ServersTileView.vue";
import PrivacyPolicy from "@/components/privacyPolicy.vue";
import WebserverView from "@/components/Webserver.vue";
import Settings from "@/components/Settings.vue";
import Console from "@/components/Console.vue";
import Editor from "@/components/Editor.vue";
import { notNullNorUndefined, messageTypes } from "@/js/utils";
import { globalViews, remoteServerViews } from "@/js/store";

export default {
  name: "webserver-gatherer",

  //mixins: [validationMixin],

  components: {
    serversTileView: ServersTileView,
    webserverView: WebserverView,
    settings: Settings,
    console: Console,
    editor: Editor,
    privacyPolicy: PrivacyPolicy
  },

  data: () => ({
    selectedView: "Server tiles view",
    currentPath: "",
    globalViews: globalViews,
    remoteServerViews: remoteServerViews,
    privacyPolicyDialog: false
  }),

  watch: {
    selectedView: function (newVal, oldVal) {
      // Don't allow to unselect a view (select previous value back)
      if (!notNullNorUndefined(newVal) && notNullNorUndefined(oldVal)) {
        newVal = oldVal;
        this.selectedView = newVal;
      } else {
        console.log(`Switched from "${oldVal}" to "${newVal}"`);

        // Determine which view is currently selected
        const state = this.$store.state;
        let curr = null;
        if (notNullNorUndefined(newVal)) {
          curr = state.webserverTabs.find(tab => tab.id === newVal);
          if (!notNullNorUndefined(curr)) {
            curr = Object.values(globalViews).find(view => view.name === newVal);
            if (!notNullNorUndefined(curr)) curr = Object.values(remoteServerViews).find(view => view.name === newVal);
          }
        }
        // If could't find current view, set to default one (settings)
        if (!notNullNorUndefined(curr)) curr = globalViews.TILES;

        this.$store.commit("changeCurrentComponent", curr);
      }
    }
  },

  computed: {
    ...mapGetters(["webserverProgress", "currentComponentIsServer"]),
    addressBarIsAtCurrentURL: function () {
      return this.currentPath !== this.$store.state.currentComponent.currentPath;
    }
  },

  methods: {
    ...mapActions([
      "confirmDialog",
      "scanWebservers",
      "loadLocalSettings",
      "updateLocalSettings",
      "resetLocalSettings",
      "killWebserver",
      "showMessage"
    ]),
    onAddressBarBrowseOrReload: function () {
      //this.$v.currentPath.$touch();
      this.$refs.AddressBar.blur();
      this.addressBarIsAtCurrentURL ? this.BrowseWebviewTo(this.currentPath) : this.ReloadWebview();
    },
    resetLocalSettingsWithConfirmation: function () {
      const msg = `You are about to reset all settings to their defaults.
                   All existing settings will be lost, including remote server list. Please confirm:`;
      const choices = ["Confirm settings reset", "Cancel"];
      this.confirmDialog(msg, choices).then(answer => {
        if (answer === 0) this.resetLocalSettings(this.$vuetify);
      });
    }
  },

  // Vuelidate validation of current webview URL text field (allows to browse to paths under webserver domain)
  validations: {
    currentPath: {
      // maxLength: maxLength(1000),
      // ipOrUrl: or(ipAddress, url)
    }
  },

  created: function () {
    console.log("!created!");
    this.loadLocalSettings(this.$vuetify);
  },

  destroyed: function () {
    console.log("!destroyed!");
  },

  errorCaptured: function (err, component, info) {
    const errMessage = `"${component}" component thrown unexpected error. (error: "${err}"; error info: "${info}")`;
    this.showMessage({ type: messageTypes.ERROR, details: errMessage });
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
