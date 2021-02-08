<template>
  <v-container id="console" class="ma-0 pa-0 full-height-width">
    <v-row class="text-center full-height-width">
      <v-col class="mb-4 full-height-width">
        <div id="terminal" class="full-height-width"></div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { Terminal } from "xterm";

export default {
  name: "console",

  data: () => ({
    content: "...",
    currentPrompt: "ls -alh ."
  }),
  mounted: function() {
    var term = new Terminal();
    term.open(document.getElementById("terminal"));
    term.write("ls -alh");
  }
};
</script>

<style>
.full-height-width {
  height: 100%;
  width: 100%;
}
</style>
