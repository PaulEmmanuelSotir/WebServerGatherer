<template>
  <v-container id="webserverView" class="ma-0 pa-0 full-height-width">
    <div class="dashgray full-height-width">
      <webview
        :id="`${server.baseURL}-webview`"
        :src="server.currentURL"
        :hidden="webview_hidden"
        class="full-height-width"
        disablewebsecurity
        allowpopups
        @did-start-loading="onWebViewStartLoading"
        @did-stop-loading="onWebViewStopLoading"
        @did-fail-load="onWebViewFailedLoading"
        @crashed="onWebViewCrashed"
      ></webview>
      <v-overlay :value="server.loading" absolute>
        <v-progress-circular
          indeterminate
          size="64"
          color="primary"
        ></v-progress-circular>
      </v-overlay>

      <v-overlay :value="server.failed" absolute>
        <v-alert prominent type="error" elevation="4">
          <v-row align="center" class="grow">
            <v-col class="grow" v-if="server.crashed">
              {{ server.name }} Web-Server's webview crashed.
              {{ server.errorInfo ? `Error: "${server.errorInfo}"` : "" }}
            </v-col>
            <v-col class="grow" v-if="server.failedLoading">
              Failed to load {{ server.name }} Web-Server landing page.
              {{ server.errorInfo ? `Error: "${server.errorInfo}"` : "" }}
            </v-col>
            <v-col class="shrink">
              <v-btn class="mb-2">Retry</v-btn>
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn v-bind="attrs" v-on="on"
                    >Ignore {{ server.port }} port</v-btn
                  >
                </template>
                <span>
                  Ignore any WebServer listening on port "{{ server.port }}" for
                  this backend (can be changed in settings view)
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
export default {
  name: "webserver-view",
  props: {
    server: {
      type: Object,
      required: true,
      validator: function(server) {
        // TODO: use javascript class prototypes instead?
        if (
          typeof server.port === "undefined" ||
          typeof server.hostname === "undefined"
        ) {
          return false;
        }
        return true;
      }
    }
  },

  data: () => ({
    cant_render_webview: false,
    webview_error: null,
    webview_hidden: false
  }),

  errorCaptured: function(err, component, info) {
    console.log(`ERR: "${component}" component error: "${err}"; info: ${info}`);
    return true; // Error should be propagating further
  },

  methods: {
    onWebViewFailedLoading: function() {
      console.log("WebView Failed loading!");
      this.webview_error = true;
      this.server.failedLoading = true;
      this.server.loading = false;
    },
    onWebViewCrashed: function() {
      console.log("WebView Crashed!");
      this.webview_error = true;
      this.server.crashed = true;
      this.server.loading = false;
    },
    onWebViewStartLoading: function() {
      console.log("WebView Started loading...");
      this.server.loading = true;
      // TODO: check whether iframe succefully displayed web server UI
    },
    onWebViewStopLoading: function(e) {
      console.log(`WebView Stoped loading (error: "${e}")!`);
      this.server.loading = false;
      // TODO: test/compare??
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
