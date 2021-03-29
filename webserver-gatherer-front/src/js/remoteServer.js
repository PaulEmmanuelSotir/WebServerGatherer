export default class RemoteServer {
  constructor(id, hostname = "", displayName = null, sshopts = "", enabled = true, port = 22) {
    this.id = id;
    this.displayName = displayName;
    this.hostname = hostname;
    this.sshopts = sshopts;
    this.enabled = enabled;
    this.port = port;
  }

  get name() {
    if (this.displayName) return this.displayName;
    return this.isLocalhost ? "localhost" : this.hostname;
  }

  get isLocalhost() {
    return this.hostname === "localhost" || this.hostname === "127.0.0.1";
  }

  static CONSTANTS = {
    // For now, we assume remote API is listening on this port (assumed to be a free and allowed port when deploying remote API on remote server or localhost)
    remote_port: 8546,
    remote_getconfig_endpoint: "/config/get",
    remote_setconfig_endpoint: "/config/set",
    remote_scan_endpoint: "/webservers/scan",
    remote_kill_endpoint: "/webservers/kill"
  };
}
