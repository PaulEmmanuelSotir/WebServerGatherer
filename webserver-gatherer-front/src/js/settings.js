import fs from "fs";

import RemoteServer from "@/js/remoteServer";
import { messageTypes } from "@/js/utils";

// TODO: remove it
const dummyRemoteServer = new RemoteServer(1, "192.168.0.1", "Remote AWS VM #1", "", true, 22);
export class LocalSettings {
  constructor(scanEvery = 2000, darktheme = false, remotes = [dummyRemoteServer]) {
    this.scanEvery = scanEvery;
    this.darktheme = darktheme;
    this.remotes = remotes;
  }

  apply(commit, dispatch, vuetify) {
    // Update vuetify theme
    vuetify.theme.dark = this.darktheme;

    // Apply scan interval update
    dispatch("scanWebservers");
    var scanIntervalID = setInterval(() => {
      dispatch("scanWebservers");
    }, this.scanEvery);

    // Commit state mutation
    commit("setLocalSettings", { settings: this, scanInterval: scanIntervalID });
  }
}

export function updateLocalSettings({ commit, dispatch, state }, { localSettings, vuetify }) {
  if (state.debug) console.log(`Writing local settings to "${state.localSettingsFilepath}"`);

  if (localSettings instanceof LocalSettings) {
    const strSettings = JSON.stringify(localSettings);
    fs.writeFile(state.localSettingsFilepath, strSettings, err => {
      if (err) {
        dispatch("showMessage", { type: messageTypes.ERROR, details: `ERR: Failed to write local settings file: "${err.message}"` });
        if (state.debug) console.log(`ERR: Failed to write local settings file: "${err.message}"`);
      } else {
        localSettings.apply(commit, dispatch, vuetify);
        if (state.debug) console.log(`Local settings file "${state.localSettingsFilepath}" succesfully saved!`);
      }
    });
  }
}

export function loadLocalSettings({ commit, dispatch, state }, vuetify) {
  if (state.debug) console.log(`Reading local settings from "${state.localSettingsFilepath}"`);

  fs.readFile(state.localSettingsFilepath, "utf-8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        // If file doesnt exists, create it
        const localSettings = new LocalSettings();
        dispatch("updateLocalSettings", { localSettings: localSettings, vuetify: vuetify });
      } else {
        dispatch("showMessage", { type: messageTypes.ERROR, details: `ERR: Failed to read local settings file: "${err.message}"` });
        return;
      }
    } else {
      if (state.debug) console.log(`Parsing JSON local settings from data="${data}"...`);
      const localSettings = Object.assign(new LocalSettings(), JSON.parse(data));
      console.log(`parsed localSettings: ${localSettings}`);
      localSettings.apply(commit, dispatch, vuetify);
    }
  });
}
