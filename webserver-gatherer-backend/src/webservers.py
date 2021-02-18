#!/usr/bin/env python
# -*- coding: utf-8 -*-
""" REST API Interacting with WebServer Gatherer front-end """
import re
import os
import sys
import logging
import subprocess
from enum import Enum, unique
from typing import List, Optional, Dict, Any, Union, Tuple

import nmap3
from fastapi import FastAPI, Body, status, HTTPException
from pydantic import BaseModel, ValidationError, IPvAnyAddress, PositiveInt, conint, conlist, validator, ConstrainedStr, Field

__all__ = ['WebServer', 'PortRange', 'ScanResults', 'KillResults', 'scan_ports', 'get_webserver_pid', 'kill_webservers', 'define_api']
__author__ = 'Paul-Emmanuel Sotir'


class WebServer(BaseModel):
    """ A web server is, here, assumed to be a listenning/open port which uses TCP protocol """
    port: PositiveInt
    hostname: str = 'localhost'
    """ Service name obtained from nmap scan process (NOTE: May not be adequate for user to be able identify a web server easily """
    service_name: Optional[str] = None


class PortRange(BaseModel):
    lower: PositiveInt
    upper: PositiveInt

    @validator('upper')
    def lower_than_upper(cls, v, values, **kwargs):
        if 'lower' in values and v <= values['lower']:
            raise ValueError(f'"upper" must be greater or equal to "lower", got "upper={v}", "lower={values["lower"]}"')
        return v


class ScanResults(BaseModel):
    servers: conlist(WebServer)
    elapsed_seconds: float
    cmd: str
    raw_nmap_result: Dict[str, Any]


class KillResults(BaseModel):
    class CmdReturnCode(BaseModel):
        return_code: int
        success: bool
        info: str
    ports: Union[PositiveInt, PortRange]
    cmd_results: Dict[str, CmdReturnCode] = Field(..., description="A dict which summarizes kill command(s) by mapping each process id (pid(s) in string format to allow JSON serialization) "
                                                                   "with its respective kill CmdReturnCode (return code and success boolean).")
    pids_from_ports_cmd_result: CmdReturnCode = Field(..., description="Contain informations about pid(s) retreival from given port(s). "
                                                      "underlying command may return non-zero code or fail to find any process).")
    pids: conlist(int)


def scan_ports(ip: Union[str, IPvAnyAddress]) -> ScanResults:
    """ Scan for listening ports on given IP address and return all WebServers found, mapped with their respective port.
    In order to detect web servers, listening ports are filtered by protocol: http(s).
    TODO: Perform a GET request to each listening ports which uses http(s) in order to make sure they return a web page??
    TODO: Implement support for port(s) filtering (ports range or list)
    """
    if ip == 'localhost':
        ip = '127.0.0.1'
    ip = str(ip)

    nmap = nmap3.NmapScanTechniques()
    scan_result = nmap.nmap_tcp_scan(ip, args='-p0-')
    ports = scan_result[ip]['ports']

    # TODO: TEMP: Remove this line, debug only:
    not_opened_servers = [WebServer(port=p['portid'], hostname=ip, service_name=p['service']['name'] if 'service' in p else None) for p in ports if p['state'] != 'open']
    if(len(not_opened_servers) > 0):
        print(f'WebServer found from scan which are not in "open" state:\n\t"{not_opened_servers}"')

    servers = [WebServer(port=p['portid'], hostname=ip, service_name=p['service']['name'] if 'service' in p else None) for p in ports if p['state'] == 'open']

    return ScanResults(servers=servers,
                       elapsed_seconds=float(scan_result['runtime']['elapsed']),  # Seconds
                       cmd=scan_result["stats"]["args"],  # nmap command runned for tcp scan
                       raw_nmap_result=scan_result)


def get_webserver_pid(ports) -> Tuple[Optional[List[int]], Optional[KillResults.CmdReturnCode]]:
    if sys.platform == 'linux' or sys.platform == 'linux2' or sys.platform == 'darwin':
        # Find any process listening on given port by parsing lsof output
        # NOTE: lsof can support up to 100 addresses following -i option at one, i.e. 100 ports in this case. (ports may also be specified as a range; e.g.: TCP:1000-2000)
        # NOTE: Also note service name can be used to retreive process instead of port number: May be more reliable?
        address_filters = f'TCP:{ports.lower}-{ports.upper}' if isinstance(ports, PortRange) else f'TCP:{ports}'
        sub = subprocess.run(['lsof', '+M', '-P', '-w', '-n', '-Fpc', '-i', address_filters], stdout=subprocess.PIPE, universal_newlines=True, check=False)
        if sub.returncode == os.EX_OK:
            pids = re.findall('p([0-9]+)\r?\n', sub.stdout, re.MULTILINE)
            return pids, KillResults.CmdReturnCode(return_code=sub.returncode, success=True, info=f'Sucessfully retreived "{pids}" pid(s) from "{ports}" ports.')
        else:
            # Return an error string if lsof command failed (probably due to no more listenning servers at given port(s))
            err_message = f'Couldn\'t retreive process id (pid) of any server listening at "{ports}" port(s) using lsof command (stderr="{sub.stderr}"; returncode="{sub.returncode}").'
            return None, KillResults.CmdReturnCode(return_code=sub.returncode, success=False, info=err_message)
    else:
        raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED,
                            f'Cant kill webserver on "{sys.platform}" OS platform; Not yet implemented: relies on `lsof` and `kill` Unix commands.')


def kill_webservers(pids) -> Dict[str, KillResults.CmdReturnCode]:
    results = {}

    # Stop any process which is listening on given port by killing its process(es)
    if sys.platform == 'linux' or sys.platform == 'linux2' or sys.platform == 'darwin':
        for server_pid in pids:
            sub = subprocess.run(['kill', '-9', f'{server_pid}'], capture_output=True, universal_newlines=True, check=False)
            if sub.returncode == os.EX_OK:
                info = f'Sucessfully terminated webserver with "{server_pid}" process id.'
                logging.info(info)
            else:
                info = f'Warning: Failed to stop webserver with "{server_pid}" process id.'
                f'`kill -9 {server_pid}` returned non-zero code "{sub.returncode}", `stderr="{sub.stderr}"`.'
                logging.warn(info)
            results[str(server_pid)] = KillResults.CmdReturnCode(success=sub.returncode == os.EX_OK, return_code=sub.returncode, info=info)
    else:
        raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED,
                            f'Cant kill webserver on "{sys.platform}" OS platform; Not yet implemented: relies on `lsof` and `kill` Unix commands.')
    return results


# def restart_webserver(pids: List[int]) -> Dict[str, Any]:
#     kill_results = kill_webservers(pids)
#     raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, 'Server restart not implemented yet. Killed server.', headers={'kill_results': kill_results})
#     # TODO: modify get_webserver_pid in order to capture command(s) in order to allow to restart those?
#     # TODO: + also allow to specify command to run in post request
#     # restart_results = ...
#     # results = [r1 + r2 for r1, r2 in zip(kill_results, restart_results)]
#     # return {'': result['kill_confirmed'], 'restart_confirmed': True}


def define_api(app: FastAPI):

    @app.get('/webservers/scan', response_model=ScanResults)
    def _scan_webservers(ip: IPvAnyAddress = '127.0.0.1'):
        try:
            result = scan_ports(ip)
            return result
        except Exception as e:
            error_message = f'Error: Exception raised while performing nmap scan of open TCP ports on "{ip}" host: "{str(e)}"'
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_message)

    @app.post('/webservers/kill', response_model=conlist(KillResults))
    def _kill_webserver(ports_to_kill: conlist(Union[PositiveInt, PortRange], min_items=1)):
        results = list()
        for ports in ports_to_kill:
            pids, lsof_cmd_result = get_webserver_pid(ports)
            if pids is not None:
                tasks_results = kill_webservers(pids)
            else:
                tasks_results, pids = dict(), list()
            results.append(KillResults(ports=ports, cmd_results=tasks_results,
                                       pids_from_ports_cmd_result=lsof_cmd_result, pids=pids))
        return results

    return [_scan_webservers, _kill_webserver]
