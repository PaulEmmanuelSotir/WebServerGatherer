"use strict";

const electron = require("electron");
//const builder = require("vue-cli-plugin-electron-builder/lib");
const devtools = require("electron-devtools-installer");
require("electron-reload")(__dirname);
const isDevelopment = process.env.NODE_ENV !== "production";

// Scheme must be registered before the app is ready
electron.protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { secure: true, standard: true } }]);

async function createWindow() {
  // Create the browser window.
  const win = new electron.BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      //TODO: temp : nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      webviewTag: true
    }
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    //builder.createProtocol("app");
    // Load the index.html when not in development
    win.loadURL(`file://${__dirname}/../dev_build/index.html`);
  }
}

// Quit when all windows are closed.
electron.app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});

electron.app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron.app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await devtools.default(devtools.VUEJS_DEVTOOLS);
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }
  createWindow();
});

// Avoids creating a new BrowserWindows when browsing from a webview and modify its 'src' instead, allowing to browse inplace (without creating popup/windows)
electron.app.on("web-contents-created", function(webContentsCreatedEvent, contents) {
  console.log(`New windows : ${contents.getType()}"`);
  if (contents.getType() === "webview") {
    contents.on("new-window", function(newWindowEvent, url) {
      // TODO: remove it and modify webview src field
      console.log(`Browsing to ${url}...`);

      newWindowEvent.preventDefault();
    });
  }
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", data => {
      if (data === "graceful-exit") {
        electron.app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      electron.app.quit();
    });
  }
}
