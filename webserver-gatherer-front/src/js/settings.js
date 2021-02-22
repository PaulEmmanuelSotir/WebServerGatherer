import fs from "fs";

export class LocalSettings {
  constructor(scanEvery = 2000) {
    this.scanEvery = scanEvery;
  }
}

export function writeLocalSettings({ dispatch, state }) {
  if (state.debug) console.log(`Writing local settings to "${state.localSettingsFilepath}"`);

  if (typeof state.settings === LocalSettings) {
    const strSettings = JSON.stringify(state.settings);
    fs.writeFile(state.localSettingsFilepath, strSettings, err => {
      if (err) {
        dispatch("showMessage", { type: "error", message: `ERR: Failed to write local settings file: "${err.message}"` });
      } else if (state.debug) console.log(`Local settings file "${state.localSettingsFilepath}" succesfully saved`);
    });
  }
}

export function loadLocalSettings({ commit, dispatch, state }) {
  if (state.debug) console.log(`Reading local settings from "${state.localSettingsFilepath}"`);

  const updateScanInterval = settings => {
    if (state.scanInterval) clearInterval(state.scanInterval);
    dispatch("scanWebservers");
    return setInterval(() => {
      dispatch("scanWebservers");
    }, settings.scanEvery);
  };

  fs.readFile(state.localSettingsFilepath, "utf-8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        // If file doesnt exists, create it
        const settings = new LocalSettings();
        writeLocalSettings({ commit: commit, state: state });
        commit("setLocalSettings", settings, updateScanInterval(settings));
      } else {
        dispatch("showMessage", { type: "error", message: `ERR: Failed to read local settings file: "${err.message}"` });
        return;
      }
    } else {
      if (state.debug) console.log(`Parsing JSON local settings from data="${data}"...`);
      const settings = new LocalSettings(JSON.parse(data));
      commit("setLocalSettings", settings, updateScanInterval(settings));
    }
  });
}
