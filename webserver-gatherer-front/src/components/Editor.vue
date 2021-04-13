<template>
  <v-container style="width: 100%; height: 100%">
    <div id="editor" style="width: 100%; height: 100%"></div>
  </v-container>
</template>

<script>
import * as monaco from "monaco-editor";

export default {
  name: "editor",

  data: () => ({
    editor: null
  }),

  mounted: function () {
    monaco.editor.create(document.getElementById("editor"), {
      value: 'console.log("Hello, world")',
      language: "javascript"
    });
  }
};
</script>
