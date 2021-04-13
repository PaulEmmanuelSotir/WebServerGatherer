<template>
  <v-container id="webserverView" class="ma-0 pa-0 full-height-width">
    <div class="dashgray full-height-width">
      <!-- Webview displaying webpage from server -->
      <webview
        :ref="`${serverTab.id}-webview`"
        :src="serverTab.currentURL"
        class="full-height-width"
        disablewebsecurity
        allowpopups
        @did-start-loading="onWebViewStartLoading"
        @did-stop-loading="onWebViewStopLoading"
        @did-fail-load="onWebViewFailedLoading"
        @crashed="onWebViewCrashed"
      ></webview>

      <!-- Loading progress from webview -->
      <v-overlay :value="serverTab.webviewIsLoading" absolute>
        <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
      </v-overlay>

      <!-- WebServer webview error message (webview failed loading web page or crashed) -->
      <v-overlay :value="serverTab.webviewError" absolute>
        <v-alert prominent type="error" elevation="4">
          <v-row align="center" class="grow">
            <v-col class="grow" v-if="serverTab.webviewCrashed">
              <!--webview.isCrashed() -->
              {{ serverTab.name }} Web-Server's webview crashed. <br />
              {{ serverTab.webviewErrorInfo }}
            </v-col>
            <v-col class="grow" v-else>
              Failed to load {{ serverTab.name }} Web-Server landing page. <br />
              {{ serverTab.webviewErrorInfo }}
            </v-col>
            <v-col class="shrink">
              <v-btn class="mb-2" @click="retry">Retry</v-btn>
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn v-bind="attrs" v-on="on" @click="serverTab.remote.addIgnoredPort($store, serverTab.server.port)">
                    Ignore {{ serverTab.server.port }} port
                  </v-btn>
                </template>
                <span>
                  Ignore any WebServer listening on "{{ serverTab.server.port }}" port from
                  {{ serverTab.server.isLocalhost ? ` remote server at ${serverTab.server.hostname} ` : " localhost " }}
                  (can be changed in settings view)
                </span>
              </v-tooltip>
            </v-col>
          </v-row>
        </v-alert>
      </v-overlay>
    </div>
  </v-container>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  name: "webserver-view",
  props: {
    serverTab: {
      type: Object,
      required: true
    }
  },

  data: () => ({}),

  computed: { ...mapGetters(["webserverProgress"]) },

  methods: {
    ...mapActions(["killWebserver", "showMessage", "updateWebServerTabStatus"]),
    onWebViewFailedLoading: function (errorCode, errorDescription, validatedURL) {
      const err = `Error: Failed to load webpage from webview:
                   "${errorDescription}"; error-code="${errorCode}"; validatedURL="${validatedURL}"`;
      this.updateWebServerTabStatus(this.serverTab, null, true, err, false, true);
    },
    onWebViewCrashed: function () {
      this.updateWebServerTabStatus(this.serverTab, null, true, "", true, false);
    },
    onWebViewStartLoading: function () {
      this.updateWebServerTabStatus(this.serverTab, null, false, "", false, true);
    },
    onWebViewStopLoading: function (e) {
      console.log(`WebView Stoped loading (e="${JSON.stringify(e)}")!`);
      this.updateWebServerTabStatus(this.serverTab, null, null, null, null, false);
      // TODO: check whether webserver succefully displayed web server UI?
    },
    retry: function () {
      this.updateWebServerTabStatus(this.serverTab, null, false, null, false, true);
      this.$refs[`${this.serverTab.id}-webview`].reload();
    }
  }
};
</script>

<style scoped>
.dashgray {
  background: #aeaba4;
}
.full-height-width {
  height: 100%;
  width: 100%;
}
</style>
