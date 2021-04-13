import superagent from "superagent";

import RemoteServer from "@/js/remoteServer";
import { notNullNorUndefined, messageTypes } from "@/js/utils";
import { cloneObj } from "./utils";

export class WebServerTab {
  constructor(
    id,
    server,
    remote,
    currentPath = "",
    latestIcon = null,
    latestStatus = null,
    latestPageTitle = null,
    latestThumbnail = null,
    meanSize = null,
    sizeRuningMeanCounter = 0,
    errorLog = []
  ) {
    this.id = id;
    this.server = server;
    this.remote = remote;
    this.currentPath = currentPath;
    this.latestIcon = latestIcon;
    this.latestStatus = latestStatus;
    this.latestPageTitle = latestPageTitle;
    this.latestThumbnail = latestThumbnail;
    this.meanSize = meanSize;
    this.sizeRuningMeanCounter = sizeRuningMeanCounter;
    this.errorLog = errorLog;

    this.webcontent = null;
    this.webviewError = false;
    this.webviewErrorInfo = "";
    this.webviewCrashed = false;
    this.webviewIsLoading = false;
  }

  get name() {
    return this.latestPageTitle ? this.latestPageTitle : this.server.baseURL;
  }

  get currentURL() {
    return `${this.server.baseURL}${this.currentPath}`;
  }

  get sizeMetric() {
    return this.size;
  }

  get icon() {
    // TODO: update icon (from v-icon to image or svg one) once loaded if available + fallback to default icon (mdi-web or mdi-web-clock is loading)
    if (notNullNorUndefined(this.latestIcon, "string")) {
      return this.latestIcon;
    }
    // TODO: return  ' mdi-server-network-off' if server failed loading or webview crashed
    return "mdi-web";
  }

  // updateInfoFromWebViewContent(webview) {
  //   const content = webview.getWebContents();
  //   content.
  //   // TODO: fill/update fields from "content"
  //   // ...
  // }

  // updateSizeMetric(latestSize) {
  //   // Update running mean of page size (size metric used for having an approximate idea of page size)
  //   this.sizeRuningMeanCounter += 1;
  //   if (this.meanSize === null)
  //    this.meanSize = 0.
  //   this.size =
  //     this.meanSize * (this.sizeRuningMeanCounter - 1) + latestSize / this.sizeRuningMeanCounter;
  // }
}

export function updateWebServerTabStatus(
  { commit },
  webserverTab,
  webcontent = null,
  webviewError = null,
  webviewErrorInfo = null,
  webviewCrashed = null,
  webviewIsLoading = null
) {
  const srvTab = cloneObj(webserverTab);
  srvTab.webcontent = webcontent;
  if (webviewError != null) this.serverTab.webviewError = webviewError;
  if (webviewErrorInfo != null) this.serverTab.webviewErrorInfo = webviewErrorInfo;
  if (webviewCrashed != null) this.serverTab.webviewCrashed = webviewCrashed;
  if (webviewIsLoading != null) this.serverTab.webviewIsLoading = webviewIsLoading;
  commit("updateWebServerTab", webserverTab);
}

export class Server {
  constructor(port, hostname, serviceName, isHttps = false) {
    this.port = port;
    this.hostname = hostname;
    this.serviceName = serviceName;
    this.isHttps = isHttps;
  }

  get isLocalhost() {
    // TODO: not as robust/reliable as intended: Remove this property if possible
    return this.hostname === "localhost" || this.hostname === "127.0.0.1";
  }

  get baseURL() {
    const hostname = this.hostname === "localhost" ? "127.0.0.1" : this.hostname;
    const port = this.port ? `:${this.port}` : "";
    return `${this.isHttps ? "https" : "http"}://${hostname}${port}/`;
  }

  isSame(other) {
    return this.serviceName === other.serviceName && this.port === other.port && this.hostname === other.hostname;
  }
}

export function scanWebservers({ commit, dispatch, state }) {
  // TODO: if already waiting for a response, queue or ignore other calls
  const scan_promises = [];

  for (let i in state.availableRemoteServers) {
    const remote = state.availableRemoteServers[i];
    if (state.debug) console.log(`Scanning for listening ports on ${remote.hostname} remote server`);

    const host = remote.isLocalhost ? "localhost" : remote.hostname;
    const promise = superagent
      .get(`http://${host}:${RemoteServer.CONSTANTS.api_port}${RemoteServer.CONSTANTS.remote_scan_endpoint}`)
      //c.trustLocalhost()
      .set("accept", "json")
      .then(res => {
        const body = JSON.parse(res.text);
        const servers = body.servers.map(srv => new Server(srv.port, srv.hostname, srv.service_name, srv.isHttps ? true : false));
        commit("updateServers", servers);
      })
      .catch(err => {
        const errMess = `Error occured when calling "${RemoteServer.CONSTANTS.remote_scan_endpoint}" endpoint at "${remote.hostname}:${
          RemoteServer.CONSTANTS.api_port
        }". error="${JSON.stringify(err)}"`;
        console.log(JSON.stringify(errMess));
        dispatch("showMessage", {
          type: messageTypes.ERROR,
          details: errMess
        });
      });

    scan_promises.push(promise);
  }
  return Promise.all(scan_promises);
}

export function killWebserver({ commit, dispatch, state }, server) {
  // TODO: take servers array instead and group kill queries by remote (server.hostname for now) (see groupby https://gist.github.com/ramsunvtech/102ac0267d33c2cc1ccdf9158d0f7fca)
  if (state.debug) console.log(`About to kill webserver located at "${server.currentURL}"...`);

  superagent
    .post(`${server.hostname}:${RemoteServer.CONSTANTS.api_port}${RemoteServer.CONSTANTS.remote_kill_endpoint}`)
    .send([server.port])
    .set("accept", "json")
    .then(res => {
      const body = JSON.parse(res.text);
      const kill_rslt = body[0];
      const cmd_results = kill_rslt.cmd_results;
      const pids_results = kill_rslt.pids_from_ports_cmd_result;
      if (cmd_results.length > 0 && cmd_results[0].success) {
        // Immediatlely perform a new webserver scan (refresh webserver list) and notify user that webserver(s) have been successfully killed
        // TODO: cancel any ongoing webserver scan before starting a new one?
        dispatch("scanWebservers");
        commit("showMessage", {
          type: messageTypes.SUCCESS,
          title: `Webserver(s) successfully killed`,
          details: `Webserver(s) listening on "${server.port}" have been successfully killed.
                    ${kill_rslt.pids.length} process(es) have been terminated (PIDs: "${kill_rslt.pids}")`
        });
      } else if (!pids_results.success) {
        // Commit error message for failed retreival of PIDs from given port(s)
        dispatch("showMessage", {
          type: messageTypes.ERROR,
          details: `Couldn't find ProcessID(s) from "${server.port}" port (server(s) no longer be listening?). Info="${pids_results}"`
        });
      } else {
        // Commit error message for failed kill command(s)
        dispatch("showMessage", {
          type: messageTypes.ERROR,
          details: `Couldn't kill "${kill_rslt.pids}" process(es) listening on "${server.port}" port. Info="${kill_rslt.cmd_results}"`
        });
      }
    })
    .catch(err => {
      const errMess = `Error occured when calling "${RemoteServer.CONSTANTS.remote_kill_endpoint}" endpoint
                       at "${server.hostname}" remote server. error="${JSON.stringify(err)}"`;
      console.log(JSON.stringify(errMess));
      dispatch("showMessage", { type: messageTypes.ERROR, details: errMess });
    });
}
