<template>
  <v-container id="dashboard" v-model="server">
    <div>{{ server.name }}</div>
    <keep-alive>
      <iframe
        style="width: 100%"
        id="dashboardIFrame"
        v-bind:src="server.url"
      />
    </keep-alive>
  </v-container>
</template>

<script>
export default {
  name: 'dashboard',
  props: {
    server: {
      type: Promise,
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
