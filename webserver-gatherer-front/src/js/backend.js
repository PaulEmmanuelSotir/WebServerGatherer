export default class Backend {
  constructor(name, hostname, sshcreds = null, sshopts = {}) {
    this.name = name;
    this.hostname = hostname;
    this.sshcreds = sshcreds;
    this.sshopts = sshopts;
  }

  static CONSTANTS = {
    // For now, we assume backend API is listening on this port (assumed to be a free and allowed port when deploying backend API on remote server or localhost)
    backend_port: 8546,
    backend_getconfig_endpoint: "/config/get",
    backend_setconfig_endpoint: "/config/set",
    backend_scan_endpoint: "/webservers/scan",
    backend_kill_endpoint: "/webservers/kill"
  };

  get is_localhost() {
    return this.hostname === "localhost" || this.hostname === "127.0.0.1";
  }
}
