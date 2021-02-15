import superagent from "superagent";

import { notNullNorUndefined } from "@/js/utils";
import Backend from "@/js/backend";

/* Server class */
export class Server {
  constructor(port, hostname, serviceName, isHttps = false) {
    this.port = port;
    this.hostname = hostname;
    this.serviceName = serviceName;
    this.isHttps = isHttps;
    this.loading = false;
    this.crashed = false;
    this.failedLoading = false;
    this.errorInfo = null;

    this.info = {
      currentPath: "",
      latestIcon: null,
      latestStatus: null,
      latestPageTitle: null,
      latestThumbnail: null,
      meanSize: null,
      sizeRuningMeanCounter: 0,
      errorLog: []
    };
  }

  get failed() {
    return this.crashed || this.failedLoading;
  }

  get name() {
    return this.info.latestPageTitle ? this.info.latestPageTitle : `"${this.baseURL}"`;
  }

  get sizeMetric() {
    return this.size;
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

  get currentURL() {
    return `${this.baseURL}${this.info.currentPath}`;
  }

  get icon() {
    // TODO: update icon (from v-icon to image or svg one) once loaded if available + fallback to default icon (mdi-web or mdi-web-clock is loading)
    if (notNullNorUndefined(this.info.latestIcon, "string")) {
      return this.info.latestIcon;
    }
    if (this.status !== 200) {
      return "mdi-web"; // mdi-web-clock
    }
    return "mdi-web";
  }

  // updateInfoFromWebViewContent(/*webview*/) {
  //   //const content = webview.getWebContents();
  //   // TODO: fill/update this.info fields from "content"
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

// TODO: remove this (debug without backend API only)
export const DEFAULT_SERVERS = [new Server(8888, "127.0.0.1", ""), new Server(8881, "127.0.0.1", ""), new Server(9001, "127.0.0.1", "")];

export function scanWebservers({ commit, state }) {
  // TODO: if already waiting for a response, queue or ignore other calls
  const scan_promises = [];

  for (let i in state.availableBackends) {
    const backend = state.availableBackends[i];
    if (state.debug) console.log(`Scanning for listening ports on ${backend.hostname} backend`);

    scan_promises.push(
      superagent
        .get(`${backend.hostname}:${Backend.CONSTANTS.backend_port}${Backend.CONSTANTS.backend_scan_endpoint}`)
        .set("accept", "json")
        .then(res => {
          const body = JSON.parse(res.text);
          const servers = body.servers.map(function(srv) {
            return new Server(srv.port, srv.hostname, srv.serviceName, srv.isHttps ? true : false);
          });
          commit("updateServers", servers);
        })
        .catch(err => {
          const errMess = `Error occured when calling "${Backend.CONSTANTS.backend_scan_endpoint}" endpoint on "${backend.hostname}:${
            Backend.CONSTANTS.backend_port
          }". error="${JSON.stringify(err)}"`;
          console.log(JSON.stringify(errMess));
          commit("unexpectedError", errMess);
        })
    );
  }
  return Promise.all(scan_promises);
}
