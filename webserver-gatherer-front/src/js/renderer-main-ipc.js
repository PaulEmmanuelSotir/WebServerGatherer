/** Setup Inter Process Communication between electron main process and renderer process
 * Renderer process can't call electron nor node APIs, thus main process listen for events
 * sent by renderer process and executes a given function synchronously or asynchronously.
 **/
export function runOnMainProcess(func) {
  const id = generateId();
  const eventName = `run-on-main:${id}`;

  const { ipcRenderer, ipcMain } = require("electron");
  ipcMain.once(eventName, event => {
    event.returnValue = func();
  });
  return ipcRenderer.sendSync(eventName);
}

export function runOnMainProcessAsync(func) {
  const id = generateId();
  const eventName = `run-on-main:${id}`;
  const ResulteventName = `${eventName}:async-result`;

  const { ipcRenderer, ipcMain } = require("electron");
  ipcMain.once(eventName, event => {
    Promise.resolve(func()).then(
      returnValue => {
        event.sender.send(ResulteventName, null, returnValue);
      },
      error => {
        event.sender.send(ResulteventName, error.toString());
      }
    );
  });

  return new Promise((resolve, reject) => {
    // Listen to asyncFunc results from main process and return it throught promise reject/resolve
    ipcRenderer.once(ResulteventName, (event, strError, returnValue) => {
      if (strError) {
        reject(new Error(strError));
      } else {
        resolve(returnValue);
      }
    });

    // Trigger asyncFunc execution on main process
    ipcRenderer.send(eventName);
  });
}
