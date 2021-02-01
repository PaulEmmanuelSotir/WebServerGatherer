<template>
  <v-container id="settings">
    <v-row class="text-center">
      <v-col class="mb-4">
        <!-- TODO: Allow both form and config setting from code editor -->
        <v-form ref="settingsForm">
          <v-expansion-panels
            accordion
            multiple
            focusable
            v-model="curr_panels"
          >
            <v-expansion-panel expand>
              <v-expansion-panel-header>
                Front Settings
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-checkbox
                  v-model="settings.autoLocahostScan"
                  label="Automatic localhost server scan"
                />
                <v-text-field
                  v-model="settings.foo"
                  :rules="rules.emailRules"
                  type="text"
                  label="foo"
                />
                <v-slider
                  v-model="settings.scanRefreshRate"
                  label="Auto scan refresh rate"
                  max="100"
                  min="1"
                  thumb-label="always"
                />
                <!-- ... -->
              </v-expansion-panel-content>
            </v-expansion-panel>

            <v-expansion-panel expand>
              <v-expansion-panel-header>
                Backend(s) WebServer profiles
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                TODO...
              </v-expansion-panel-content>
            </v-expansion-panel>

            <v-expansion-panel expand>
              <v-expansion-panel-header>
                Backend(s) SSH connections
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-icon>
                  mdi-key-variant
                </v-icon>

                TODO...
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-form>
      </v-col>

      <!-- <v-col class="mb-4">
        <h1 class="display-2 font-weight-bold mb-3">Welcome to Vuetify</h1>

        <p class="subheading font-weight-regular">
          For help and collaboration with other Vuetify developers,
          <br />please join our online
          <a
            href="https://community.vuetifyjs.com"
            target="_blank"
          >Discord Community</a>
        </p>
      </v-col>

      <v-col class="mb-5" cols="12">
        <h2 class="headline font-weight-bold mb-3">What's next?</h2>

        <v-row justify="center">
          <a
            v-for="(next, i) in whatsNext"
            :key="i"
            :href="next.href"
            class="subheading mx-3"
            target="_blank"
          >{{ next.text }}</a>
        </v-row>
      </v-col>

      <v-col class="mb-5" cols="12">
        <h2 class="headline font-weight-bold mb-3">Important Links</h2>

        <v-row justify="center">
          <a
            v-for="(link, i) in importantLinks"
            :key="i"
            :href="link.href"
            class="subheading mx-3"
            target="_blank"
          >{{ link.text }}</a>
        </v-row>
      </v-col>

      <v-col class="mb-5" cols="12">
        <h2 class="headline font-weight-bold mb-3">Ecosystem</h2>

        <v-row justify="center">
          <a
            v-for="(eco, i) in ecosystem"
            :key="i"
            :href="eco.href"
            class="subheading mx-3"
            target="_blank"
          >{{ eco.text }}</a>
        </v-row>
      </v-col>-->
    </v-row>
  </v-container>
</template>

<script>
function defineSettingsRules() {
  function maxStrSizeRule() {
    return text =>
      (text || "").length <= this.max ||
      `A maximum of ${this.max} characters is allowed`;
  }

  const rules = {};
  rules.emailRules = [
    maxStrSizeRule(),
    v => !!v || "E-mail is required",
    v => /.+@.+\..+/.test(v) || "E-mail must be valid"
  ];
  rules.nameRules = [maxStrSizeRule()];
  return rules;
}

export default {
  name: "settings",

  data: () => ({
    // TODO: load settings from config file
    settings: {
      autoLocahostScan: false,
      scanRefreshRate: 0,
      foo: "foo text field"
    },
    curr_panels: [0, 1, 2]
  }),
  watch: {
    settings: "validate"
  },
  methods: {
    validate() {
      this.$refs.settingsForm.validate();
    },
    reset() {
      this.$refs.settingsForm.reset();
    },
    resetValidation() {
      this.$refs.settingsForm.resetValidation();
    }
  },
  computed: {
    rules: defineSettingsRules
  }
};
</script>

<style scoped></style>
