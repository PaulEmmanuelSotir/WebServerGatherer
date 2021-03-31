import fs from "fs";

import RemoteServer, { localhost } from "@/js/remoteServer";
import { messageTypes, notNullNorUndefined } from "@/js/utils";

// TODO: remove it
const dummyRemoteServer = new RemoteServer(1, "192.168.0.1", "Remote AWS VM #1", "", true, 22);

export class LocalSettings {
  constructor(scanEvery = 2000, darktheme = false, remotes = [localhost, dummyRemoteServer]) {
    this.scanEvery = scanEvery;
    this.darktheme = darktheme;
    this.remotes = remotes;
  }

  apply(commit, dispatch, vuetify) {
    // Update vuetify theme
    if (notNullNorUndefined(vuetify) && vuetify.theme.dark !== this.darktheme) vuetify.theme.dark = this.darktheme;

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
        const msg = `Failed to write local settings file: "${err.message}"`;
        dispatch("showMessage", { type: messageTypes.ERROR, details: msg });
        if (state.debug) console.log(`ERR: ${msg}`);
      } else {
        localSettings.apply(commit, dispatch, vuetify);
        if (state.debug) console.log(`Local settings file "${state.localSettingsFilepath}" succesfully saved!`);
      }
    });
  }
}

export function resetLocalSettings({ dispatch, state }, vuetify) {
  const localSettings = new LocalSettings();
  dispatch("updateLocalSettings", { localSettings: localSettings, vuetify: vuetify });
  const msg = `Sucessfully created new settings file at "${state.localSettingsFilepath}" with its default values`;
  dispatch("showMessage", { type: messageTypes.SUCCESS, details: msg, title: "Created JSON settings file" });
}

export function loadLocalSettings({ commit, dispatch, state }, vuetify) {
  if (state.debug) console.log(`Reading local settings from "${state.localSettingsFilepath}"...`);

  fs.readFile(state.localSettingsFilepath, "utf-8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        // If file doesnt exists, create it
        resetLocalSettings({ dispatch: dispatch, state: state }, vuetify);
      } else {
        dispatch("showMessage", { type: messageTypes.ERROR, details: `Failed to read local settings file: "${err.message}"` });
        return;
      }
    } else {
      const localSettings = Object.assign(new LocalSettings(), JSON.parse(data));
      if (state.debug) console.log(`Parsed JSON local settings: "${JSON.stringify(localSettings)}"`);

      // Make sure localhost is allways among local settings remotes
      let localhostFound = localSettings.remotes.find(r => localhost.id === r.id);
      if (typeof localhostFound === "undefined") {
        localSettings.remotes.push(localhost);
        dispatch("updateLocalSettings", { localSettings: localSettings, vuetify: vuetify });
      } else {
        // Apply settings otherwise (updateLocalSettings will apply it if localhost was missing)
        localSettings.apply(commit, dispatch, vuetify);
      }
    }
  });
}
