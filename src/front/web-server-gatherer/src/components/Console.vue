<template>
  <v-container id="settings">
    <v-row class="text-center">
      <v-col class="mb-4">
        Console view...
        <strong>Yet to be implemented...</strong>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "console",

  data: () => ({
    content: "...",
    currentPrompt: "ls -alh ."
  })
};
</script>

<style scoped></style>
