<template>
  <v-container id="webserverView" class="ma-0 pa-0 full-height-width">
    <div class="dashgray full-height-width">
      <webview
        :id="`${server.displayName}-webview`"
        :src="server.url"
        :hidden="webview_hidden"
        class="full-height-width"
        disablewebsecurity
        allowpopups
        @did-start-loading="onWebViewStartLoading"
        @did-stop-loading="onWebViewStopLoading"
        @did-fail-load="onWebViewFailedLoading"
        @crashed="onWebViewCrashed"
      ></webview>
      <!-- <iframe
            :title="`'${server.displayName}' web server webview ('${server.url}')`"
            ref="webserverViewIFrame"
            frameborder="0"
            style="width: 100%; height: 100%"
            :src="server.url"
            @error="onIframeError"
            @change="onIframeChange"
            @click="onIFrameClick"
            @loadeddata="onIframeLoaded"
            @onLoad="onIframeLoad"
            /> -->
      <!-- :src="server.url" -->
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
    },
    onWebViewCrashed: function() {
      console.log("WebView Crashed!");
      this.webview_error = true;
    },
    onWebViewStartLoading: function() {
      console.log("WebView Started loading...");
      // TODO: check whether iframe succefully displayed web server UI
    },
    onWebViewStopLoading: function(e) {
      console.log(`WebView Stoped loading (error: "${e}")!`);
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
