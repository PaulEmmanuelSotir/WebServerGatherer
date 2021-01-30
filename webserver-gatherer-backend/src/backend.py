#!/usr/bin/env python
# -*- coding: utf-8 -*-
""" Main entry-point of WebServer Web UI Gatherer backend server.
As this is a very simple web app, backend is mostly usefull for backend tasks where python is needed or prefered like running mlflow tracking server if needed, running a jupyter notebook or tensorboard server on demand, etc...
"""
import click
from fastapi import FastAPI
from fastapi.responses import ORJSONResponse

import utils
import config
import webservers

__all__ = ['app', 'webserver_endpoints', 'config_endoints']
__author__ = 'Paul-Emmanuel Sotir'

app = FastAPI(default_response_class=ORJSONResponse)


@app.get("/")
def read_root():
    return {"message": "WebServerGathererBackend API root; See https://github.com/PaulEmmanuelSotir/DashboardWebUIGatherer"}


webserver_endpoints = webservers.define_api(app)
config_endoints = config.define_api(app)
# console_endpoints = console.define_    api(app)
