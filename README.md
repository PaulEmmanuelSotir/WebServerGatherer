# Dashboard Web UI Gatherer (Work In Progress)

__Project authored by Paul-Emmanuel SOTIR__ <paulemmanuel.sotir@oultook.com>  
_This project is under Open Source MIT License, see [./LICENSE](./LICENSE) or more details._  

Merges/Gathers multiple web UIs listening on a server or localhost into a simple single Web App. The original goal of this Web UI was to simplify usage of multiple DataScience/ML Web UIs; e.g. Gathering Tensorboard, Jupyter Notbooks, MLFlow Web UI, NNI Web UI, Data Dashboards, ... into a single web app in a simple and generic way.

*More detailed description of this tool*

...

Dashboard Web UI Gatherer is a simple Web app aimed at simplifing data-science/machine-learning experiments by merging and managing all dashboards web servers into a single app (e.g. tensorboard vizualization, local jupyter notebook, MLFlow UI, NNI UI, etc.). DashboardWebUIGatherer can be configured with a 'dashboards.json' config file (or throught settings web view). Dashboard web servers can either be configured mannually in 'dashboard.json' with their respective port(s) or alternatively, DashboardWebUIGaherrer could look for all listenning ports on localhost or distant server for any running web server

## Install instructions

In order to install this Web Application on your server, follow the following steps:

``` shell
git clone https://github.com/PaulEmmanuelSotir/DashboardWebUIGatherer.git
cd ./DashboardWebUIGatherer
npm install
# Once dependencies are installed, you will be able to run Web UI server like so:
# TODO: ...
```

## Configuration and usage

...

## Documentation

For more detailed documentation, see [...TODO...](...)

Feel free to open an issue in this repository if you have any feature/improvement suggestions or if you encountered a bug.
