#!/usr/bin/env python
# -*- coding: utf-8 -*-
""" REST API endpoints for interaction with WebServer Gatherer backend configuration """
import os
import uuid
import json
import shutil
import logging
from pathlib import Path
from enum import unique, Enum
from typing import Optional, Dict, Any, Union, Tuple, List

from fastapi import FastAPI, Body, status, HTTPException, File, UploadFile
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, ValidationError, conlist, Field, AnyHttpUrl
from pydantic.types import PositiveFloat, PositiveInt

import webservers

__all__ = ['BACKEND_DATA_ROOT', 'CONFIG_PATH', 'Config', 'ConfigEditPolicy', 'write_config', 'read_config', 'define_api']
__author__ = 'Paul-Emmanuel Sotir'

# TODO: make sure this drectory is copied to a unique path for each different backend server or firbid multiple backend servers
BACKEND_DATA_ROOT = Path('./')
CONFIG_PATH = BACKEND_DATA_ROOT / 'config.json'


class StartCommand(BaseModel):
    """ Webserver start command with an optional associated name. Can be used to start webserver(s) from front trhought this backend API. """
    cmd: str
    name: Optional[str] = None
    cwd: Optional[str] = Field(None, description="Optional directory path field in which 'cmd' command will be executed.")


class Config(BaseModel):
    # TODO: implement more validation code here...

    localhostScanRefreshRate: int = 100
    webserverStartCommands: List[StartCommand] = Field([], description="List of webserver start commands which may be used to start a webserver")


# TODO: replace this object instance by a cleaner lifecycle variable
current_config = None


@unique
class ConfigEditPolicy(str, Enum):
    REPLACE = 'REPLACE'
    RESET_TO_DEFAULT = 'RESET_TO_DEFAULT'


def write_config(config: Config, config_path: Path):
    try:
        with open(config_path, 'r+') as file:
            file.seek(0)
            file.write(config.json())
            file.truncate()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail=f"Couldnt write new JSON config due to invalid JSON or failure to open/modify current configuration file ('{config_path}').\nException raised: '{str(e)}'")


def read_config(config_path):
    try:
        return Config.parse_file(config_path)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Failed to read JSON backend config located at '{config_path}'.\nException raised: '{str(e)}'")


def define_api(app: FastAPI):
    try:
        current_config = read_config(CONFIG_PATH)
    except Exception as e:
        current_config = Config()
        write_config(current_config, CONFIG_PATH)
        logging.warn(f'Warning: couldnt read config file located at "{CONFIG_PATH}", created a new/default one. (raised exception: "{e}")')

    @app.get("/config/getConfig", response_model=Config)
    def _get_config():
        current_config = read_config(CONFIG_PATH)
        return current_config

    @app.put("/config/setConfig", response_model=Config)
    def _edit_config(edit_policy: ConfigEditPolicy = ConfigEditPolicy.REPLACE, new_config: Config = None):
        if edit_policy == ConfigEditPolicy.RESET_TO_DEFAULT:
            current_config = Config()
            write_config(current_config, CONFIG_PATH)
        elif new_config is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f'Empty config body isnt allowed, except when "edit_policy" is "{ConfigEditPolicy.RESET_TO_DEFAULT}".')
        elif edit_policy == ConfigEditPolicy.REPLACE:
            current_config = new_config
            write_config(current_config, CONFIG_PATH)
        return jsonable_encoder(current_config)

    return [_get_config, _edit_config]
