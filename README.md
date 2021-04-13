# WebServer UI Gatherer (Work In Progress)

__Project authored by Paul-Emmanuel SOTIR__ <paulemmanuel.sotir@oultook.com>  
_This project is under Open Source MIT License, see [./LICENSE](./LICENSE) or more details._  

__Merges/Gathers__ and __manages__ multiple __web-server UIs into a simple single electron app__ listening on localhost or remote server(s). The initial aim of this electron app is to __simplify DataScience/MachineLearning experiments by merging and managing all your web servers into a single app__ (e.g. tensorboard, jupyter notebook, MLFlow UI, NNI UI, etc.). WebServer Gatherer is composed of an __electron/vue web application__ and a __Python backend REST API__ (Python backend will be soon deprecated and replaced by direct calls from electron application throught SSH connection).  

Some features of WebServer UI Gatherer are:

- __Discovers all listening webservers automatically__ by looking for opened TCP ports on localhost or on any configured remote host throught its SSH connection. All web-servers discovered this way, which serves a web page, will then be displayed in the same electron app, grouped by host  
- __Ease of use and simple configuration of SSH connection to your remote servers__: __[WIP]__ Application looks for any SSH configuration file and allow you to connect to any of your remotes easily
- For each connected remote hosts and localhost, a __"web-server tiles view"__ (displays thumbnails of every discovered web-servers for this host) and a __"console view"__ (CLI based on xterm) are available
- __Allows Web-Servers management__: Discovered webservers can be __killed from UI interface__. Moreover, custom commands can be configured to be able to start a webserver quickly from application UI __[WIP]__  (may also be done manually throught console view)

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

## Contribution Guide

**... to be defined ...**

## 📝 Features and refactoring TODO List

__>__ WebServer Gatherer __features__ and __code refactoring__ to-do List
_**legend**: ♻ = WIP; 💤: TODO; 💥 = IMPORTANT; 👍 = DONE (doesn't lists all implemented features);_

- 👍 Implement webserver scanning backend API
- 👍 Implement webserver killing backend API
- 👍 Implement config (get/set) backend API
- 👍 Implement electron front app webserver views (using electron's 'WebView')
- 👍 Implement regular calls to backend API from front to update webservers with port scan (nmap)
- 👍 Implement call to backend API from front to kill webserver
- 👍 Gather/group webservers and backend settings views by remote server
- 👍 Rename all remaning occurences of "Dashboard Gatherer" into "WebServer Gatherer"
- ♻ Fix navigation drawer buttons
- ♻ Surround SSH commands to remote with a Mutex/semaphore to avoid multiple calls at once and record average response delay for webservers/scans
- ♻ Better URL textfield allowing to browse to any URL within webserver domain and binded to webview's current URL + retrun actual webserver loading progress in "webserverProgress" getter
- ♻ Allow webservers webview browsing without openning a new BrowserWindow (e.g. Jupyter notebook shouldn't open a new BrowserWindow when openning a notebook)
- ♻ Allow user to ignore some port(s) or webserver service name(s) from settings view or directly from a webserver view (ignore button)
- ♻ Implement needed checks and error handling to ensure a webserver discovered by backend API ports scanning is actually returning a valid webpage
- ♻ Refactor front to replace API calls to Python backend(s) with direct calls to commands throught SSH: remove all Python backend from project which is no longer needed. WebServer Gatherer is now only an electron/vue app without python deps (makes project way easier to deploy, maintain and develop)
- ♻ Fully implement local settings view
- ♻ plug SSH or localhost CLI backend to xterm console view
- ♻ Implement command prompt utilities to Xterm console view (+ fix xterm size to fit all available space)
- ♻ Implement webserver start backend API (runs pre-registered commands throught SSH and allow to run or add them from console view)
- ♻ Implement console view allowing to run a terminal on remote server(s) or localhost from front app (using xterm)
- 💤 Review performance issues with lighthouse + replace md-icons font download by a static style file + allow render framerates higher than 60fps
- 💤 Add github CI/CL hooks/actions to compile and test new releases and make it available for electron updater
- 💤 Screen capture showcasing application usage and main features (and add it to readme.md as a GIF for better communication on application usage/goal/target)  
- 💤 Fix retry button on webview error
- 💤 Implement webservers tile view in front app
- 💤 Implement remote server SSH connection setup (retreive profiles from a SSH configuration)
- 💤 secure SSH credentials storage with 2FA and/or allow to connect to an existing SSH agent  

(☞ﾟヮﾟ)☞
