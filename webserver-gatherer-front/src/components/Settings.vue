<template>
  <v-container id="settings">
    <v-row class="text-center">
      <v-col class="mb-4">
        <!-- TODO: Allow both form and code editor edit methods for local settings  -->
        <v-expansion-panels accordion multiple focusable v-model="curr_panels">
          <!-- Remote RemoteServer configs (contains WebServer Profiles) -->
          <v-expansion-panel expand v-for="remote in $store.state.localSettings.remotes" :key="remote.id">
            <v-expansion-panel-header>
              "{{ remote.displayName }}" WebServer profiles - Hostname: "{{ remote.hostname }}"
            </v-expansion-panel-header>
            <v-expansion-panel-content> TODO... </v-expansion-panel-content>
          </v-expansion-panel>

          <!-- Remote Servers SSH connection config-->
          <v-expansion-panel expand>
            <v-expansion-panel-header>
              <v-icon left> mdi-key-variant </v-icon>
              <span> Remote servers SSH connection setup </span>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-form ref="sshRemoteServersForm" @submit.prevent="submitSSHRemoteServers">
                <!-- TODO: Add a "Add remote server" btn + eventually modify toggle switch into checkbok action on list-item -->
                <v-list>
                  <v-list-item v-for="remote in $v.localSettings.remotes.$each.$iter" :key="remote.id">
                    <v-list-item-title> {{ remote.displayName }} at "{{ remote.hostname }}" </v-list-item-title>
                    <v-list-item-icon> mdi-key-variant </v-list-item-icon>
                    <!-- TODO: Add a "Remove remote server" btn + eventually modify toggle switch into checkbok action on list-item -->
                    <!-- <v-list-item-action> </v-list-item-action> -->
                    <v-list-item-content>
                      <v-switch
                        v-model="remote.enabled.$model"
                        :hint="
                          remote.isLocalhost
                            ? 'Enable hosted web-servers scanning on localhost'
                            : 'Enable SSH connection to this remote server to look for hosted web-servers'
                        "
                        inset
                        required
                        :label="
                          remote.isLocalhost
                            ? 'Enable web-servers scanning on localhost'
                            : 'Enable web-servers scanning on this Remote server throught SSH'
                        "
                        persistent-hint
                      ></v-switch>
                      <!-- TODO: Make sure hostname is unique -->
                      <v-text-field
                        v-model.trim="remote.hostname.$model"
                        clearable
                        :disabled="remote.isLocalhost"
                        required
                        label="Hostname"
                        hint="Remote server hostname to which SSH connection is made"
                        :class="status(remote.hostname)"
                      >
                      </v-text-field>
                      <v-text-field
                        v-model.number="remote.sshport.$model"
                        required
                        v-if="!remote.isLocalhost"
                        label="SSH Port"
                        type="number"
                        hint="Remote server SSH port"
                        :class="status(remote.sshport)"
                      >
                      </v-text-field>
                      <v-text-field
                        v-model.trim="remote.sshopts.$model"
                        v-if="!remote.isLocalhost"
                        clearable
                        placeholder="-l username -o 'ConnectTimeout=10\'"
                        label="Additional SSH command line arguments"
                        hint="Additional command line arguments given to SSH when connecting to remote server
                              (Note that port is already provided and can be changed from its own field) "
                        :class="status(remote.sshopts)"
                      >
                      </v-text-field>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>

                <v-btn
                  class="mr-4"
                  @click="submitSSHRemoteServers"
                  :color="submitStatus === 'ERROR' ? 'error' : 'success'"
                  :disabled="submitStatus === 'PENDING'"
                  v-if="localSettings !== null && localSettings.remotes.length > 0"
                >
                  <!--:disabled="!valid" -->
                  submit
                </v-btn>
                <v-alert v-else dense type="info"> No remote server have been configured so far </v-alert>

                <v-btn class="mr-4" @click="addRemoteServer" :disabled="submitStatus === 'PENDING'">
                  <v-icon>mdi-plus</v-icon>
                  <span>Add Remote server</span>
                </v-btn>
                <p v-if="submitStatus === 'OK'">Succefully saved Remote local app settings</p>
                <p v-if="submitStatus === 'PENDING'">Saving local app settings</p>
                <p v-if="submitStatus === 'ERROR'">Failed to save local app settings, invalid form</p>
              </v-form>
            </v-expansion-panel-content>
          </v-expansion-panel>

          <!-- Local front settings -->
          <v-expansion-panel expand>
            <v-expansion-panel-header> Front Settings </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-form ref="settingsForm" @submit.prevent="submitLocalSettings">
                <!-- <v-checkbox v-model="localSettings.autoLocahostScan" label="Automatic localhost server scan" />
                  <v-text-field v-model="localSettings.foo" :rules="rules.emailRules" type="text" label="foo" /> -->
                <v-slider
                  class="pt-10"
                  v-model.lazy="$v.localSettings.scanEvery.$model"
                  label="Port scan every (ms)"
                  required
                  min="100"
                  max="10000"
                  thumb-label="always"
                  dense
                  step="100"
                  @input="submitLocalSettings($v.localSettings.scanEvery)"
                  @blur="submitLocalSettings($v.localSettings.scanEvery)"
                />
                <v-switch
                  v-model="$v.localSettings.darktheme.$model"
                  hint="Toggles application theme from light to dark"
                  inset
                  required
                  label="Dark theme"
                  persistent-hint
                  @input="submitLocalSettings($v.localSettings.darktheme)"
                  @blur="submitLocalSettings($v.localSettings.darktheme)"
                ></v-switch>
                <p v-if="submitStatus === 'OK'">Succefully saved local app settings</p>
                <p v-if="submitStatus === 'PENDING'">Saving local app settings</p>
                <p v-if="submitStatus === 'ERROR'">Failed to save local app settings, invalid form</p>
              </v-form>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";
import { reactive } from "@vue/composition-api"; // if migrating to Vue 3.x, use `import { reactive } from "vue"` instead
import useVuelidate from "@vuelidate/core";
import { required, maxLength, minLength, ipAddress, url, or, integer, minValue, maxValue } from "@vuelidate/validators";

import { cloneObj } from "@/js/utils";
import RemoteServer from "@/js/remoteServer";
import { IDGenerator } from "@/js/utils";

function defineSettingsRules() {
  function maxStrSizeRule() {
    return text => (text || "").lengthForm <= this.max || `A maximum of ${this.max} characters is allowed`;
  }

  const rules = {};
  rules.emailRules = [maxStrSizeRule(), v => !!v || "E-mail is required", v => /.+@.+\..+/.test(v) || "E-mail must be valid"];
  rules.nameRules = [maxStrSizeRule()];
  return rules;
}

export default {
  name: "settings",

  setup() {
    const data = reactive({
      curr_panels: [0, 1, 2],
      localSettings: null,
      localform: null,
      remoteForms: {},
      submitStatus: null,
      remoteServerIdGenerator: null
    });

    const rules = {
      localSettings: {
        remotes: {
          maxLength: maxLength(500),
          $each: {
            hostname: { required, maxLength: maxLength(200), minLength: minLength(1), ipOrUrl: or(ipAddress, url) },
            sshopts: { maxLength: maxLength(200), minLength: minLength(1) },
            sshport: { integer, minValue: minValue(0), maxValue: maxValue(65535) },
            enabled: { integer, minValue: minValue(0), maxValue: maxValue(1) },
            ignoredPorts: {
              maxLength: maxLength(1000),
              $each: { integer, minValue: minValue(0), maxValue: maxValue(65535) }
            }
          }
        },
        scanEvery: { required },
        darktheme: { required }
      }
    };

    const v$ = useVuelidate(rules, data);
    return { name, v$ };
  },

  methods: {
    ...mapActions(["resetLocalSettings"]),
    resetForm() {
      this.$v.$reset();
      this.localSettings = cloneObj(this.$store.state.localSettings);
      if (typeof this.localSettings.remotes === "undefined" || this.localSettings.remotes === null) this.localSettings.remotes = [];
      // Start remote server IDs from 1 as 0 is reserved for localhost
      const initId = this.localSettings.remotes.length > 0 ? Math.max(...this.localSettings.remotes.map(b => b.id)) : 1;
      this.remoteServerIdGenerator = new IDGenerator(initId);
    },
    submitLocalSettings(field) {
      field.$touch();
      this.$store.dispatch("updateLocalSettings", { localSettings: this.localSettings, vuetify: this.$vuetify });
    },
    submitSSHRemoteServers() {
      this.$v.remotes.$touch();
      this.$store.dispatch("updateLocalSettings", { localSettings: this.localSettings, vuetify: this.$vuetify });
    },
    status(validation) {
      return {
        error: validation.$error,
        dirty: validation.$dirty
      };
    },
    addRemoteServer() {
      // TODO: refactor this to use a vuex mutation instead!
      this.localSettings.remotes.push(new RemoteServer(this.remoteServerIdGenerator.getNewId()));
    }
  },

  computed: {
    rules: defineSettingsRules
  },

  mounted: function () {
    this.resetForm();
  }
};
</script>

<style scoped></style>
