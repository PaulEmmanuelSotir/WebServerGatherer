<template>
  <v-container id="dashboard" v-model="server">
    <div>{{ server.name }}</div>
    <keep-alive>
      <div>
        <iframe
          is="x-frame-bypass"
          style="width: 100%; height: 100%"
          frameborder="0"
          id="dashboardIFrame"
          :title="`'${server.name}' web server iframe ('${server.url}')`"
          src="https://news.ycombinator.com/"
        />
        <!-- :src="server.url" -->
      </div>
    </keep-alive>
  </v-container>
</template>

<script>
import xframe from 'x-frame-bypass'

export default {
  name: 'dashboard',
  components: {
    'x-frame-bypass': xframe
  },
  props: {
    server: {
      type: Object,
      required: true,
      validator: function(server) {
        // TODO: use javascript prototypes instead?
        if (
          typeof server.port === 'undefined' ||
          typeof server.domain === 'undefined'
        ) {
          return false
        }
        return true
      }
    }
  },
  data: () => ({})
}
</script>

<style scoped></style>
