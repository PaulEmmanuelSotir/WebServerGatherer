import { cloneObj, notNullNorUndefined, messageTypes } from "@/js/utils";

export default class RemoteServer {
  constructor(
    id,
    hostname = "",
    displayName = null,
    sshopts = "",
    enabled = true,
    sshport = 22,
    ignoredPorts = [RemoteServer.CONSTANTS.api_port]
  ) {
    this.id = id;
    this.displayName = displayName;
    this.hostname = hostname;
    this.sshopts = sshopts;
    this.enabled = enabled;
    this.sshport = sshport;
    this.ignoredPorts = ignoredPorts;
  }

  get name() {
    if (this.displayName) return this.displayName;
    return this.isLocalhost ? "localhost" : this.hostname;
  }

  get isLocalhost() {
    return this.hostname === "localhost" || this.hostname === "127.0.0.1";
  }

  addIgnoredPort(store, port) {
    const newSettings = cloneObj(store.state.localSettings);

    // Modify 'this' from a copy of state.localSettings and commit updated state.localSettings to avoid state mutation outside of a commit
    let thisRemote = newSettings.remotes.find(r => this.id === r.id);
    if (notNullNorUndefined(thisRemote)) {
      if (!notNullNorUndefined(thisRemote.ignoredPorts)) thisRemote.ignoredPorts = [port];
      thisRemote.ignoredPorts.push(port);
      store.dispatch("updateLocalSettings", { localSettings: newSettings });
      store.dispatch("showMessage", {
        type: messageTypes.SUCCESS,
        details: `Sucessfully added "${port}" port ignore list of ${
          this.isLocalhost ? "localhost" : this.name + " remote server"
        }. Webservers listening on this port won't be shown anymore on this host.
         Note that ignored ports can be changed in settings view for each host(s))`
      });
      return true;
    } else {
      const msg = `Couldn't ignore port '${port}': can't retreive remote server among configured ones.`;
      store.dispatch("showMessage", { type: messageTypes.ERROR, details: msg });
    }
    return false;
  }

  static CONSTANTS = {
    // For now, we assume remote API is listening on this port (assumed to be a free and allowed port when deploying remote API on remote server or localhost)
    api_port: 8546,
    remote_getconfig_endpoint: "/config/get",
    remote_setconfig_endpoint: "/config/set",
    remote_scan_endpoint: "/webservers/scan",
    remote_kill_endpoint: "/webservers/kill"
  };
}

// Create a RemoteServer instance for localhost, which is assumed to be allways present/available (ID 0 is reserved for localhost)
export const localhost = new RemoteServer(0, "127.0.0.1", "Localhost", "", true, null);
