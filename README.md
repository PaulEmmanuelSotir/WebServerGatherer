# WebServer UI Gatherer (Work In Progress)

__Project authored by Paul-Emmanuel SOTIR__ <paulemmanuel.sotir@oultook.com>  
_This project is under Open Source MIT License, see [./LICENSE](./LICENSE) or more details._  

__Merges/Gathers__ and __manages__ multiple __web-server UIs into a simple single electron app__ listening on localhost or remote server(s). The initial aim of this electron app is to __simplify DataScience/MachineLearning experiments by merging and managing all your web servers into a single app__ (e.g. tensorboard, jupyter notebook, MLFlow UI, NNI UI, etc.). WebServer Gatherer is composed of an __electron/vue web application__ and a __Python backend REST API__.  

Some features of WebServer UI Gatherer are:

- __Discovers all listening webservers automatically__ by looking for opened TCP ports with _[nmap](https://nmap.org/)_ fron backend API(s). All web-servers discovered this way, serving a web page, will then be gathered in electron front application  
- __Web-Servers management__: Discovered webservers can be __killed from front__ throught backend API. Moreover, if a WebServer profile is defined throught settings view, this webserver can also be started or restarted from front.
- __[WIP] Simple/automatic Backend API deployement__: Backend API is __automatically deployed on localhost and each of your configured remote server throught SSH__: setup your remote SSH credentials in settings view  

-

## Install instructions (WIP)

In order to install this Web Application on your server, follow the following steps:

``` shell
git clone https://github.com/PaulEmmanuelSotir/DashboardWebUIGatherer.git
cd ./DashboardWebUIGatherer/webserver-gatherer-front
npm install
npm run build
# Once dependencies are installed, you will be able to run electron app like so:
npm run start


```

## Configuration and usage

...

## Documentation

For more detailed documentation, see [...TODO...](...)

Feel free to open an issue in this repository if you have any feature/improvement suggestions or if you encountered a bug.

## 📝TODO List

__>__ WebServer Gatherer __features__ and __code refactoring__ to-do List
_**legend**: ♻ = WIP; 💤: TODO; 💥 = IMPORTANT; 👍 = DONE (doesn't lists all implemented features);_

- 👍 Implement webserver scanning backend API
- 👍 Implement webserver killing backend API
- 👍 Implement config (get/set) backend API
- 👍 Implement electron front app webserver views (using electron's 'WebView')
- 👍 Implement regular calls to backend API from front to update webservers with port scan (nmap)
- 👍 Implement call to backend API from front to kill webserver
- ♻ Fix navigation drawer buttons
- ♻ Implement backend API calls Mutex (forbid multiple calls from the same front instance at once) and record mean response delay for webservers/scans
- ♻ Gather webservers and backend settings view by remote server to which their repective backend API belongs to
- ♻ Allow webservers webview browsing without openning a new BrowserWindow (e.g. Jupyter notebook shouldn't open a new BrowserWindow when openning a notebook) + show webserver URL on app bar
- ♻ Rename all remaning occurences of "Dashboard Gatherer" into "WebServer Gatherer"
- ♻ Allow user to ignore some port(s) or webserver service name(s) from backend settings view or directly from a webserver view
- ♻ Implement needed checks and error handling to ensure a webserver discovered by backend API ports scanning is actually returning a valid webpage (backend API only scans for any open TCP ports)
- ♻ Local/Front settings view
- ♻ Implement webserver start backend API (runs pre-registered commands)
- ♻ Implement console view allowing to run a terminal on remote server(s) or localhost from front app (using xterm)
- 💤 Implement webservers tile view in front app
- 💤 Implement remote server SSH connection setup and secure SSH credentials storage with 2FA and/or allow to connect to an existing SSH agent  
- 💤 Implement automatic Python backend API deployement throught SSH tunnel to configured remote server(s)

(☞ﾟヮﾟ)☞
