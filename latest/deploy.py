#!/bin/python
# -*- coding: utf-8 -*-

import os
import time
import sys
import operator
import subprocess

import json
import yaml


import logging
import coloredlogs
logger = logging.getLogger('kube')

# don't change this
managed_by_val = "azk-to-kube"

import argparse

from pykube.config import KubeConfig
from kube_http import HTTPClient
from pykube.objects import Pod, Service, ReplicationController

import warnings
from requests.packages.urllib3 import exceptions

warnings.catch_warnings()
warnings.simplefilter("ignore", exceptions.InsecureRequestWarning)

def env(key, default=None):
  try:
    return os.environ[key]
  except:
    return default

# An action applied against the kube API
class KubeAction():
    def __init__(self, apiresource, actionid):
        self.actionid = actionid
        self.resource = apiresource

# An instance of Azkfile.js translated to Kubernetes
class AzkSetup():
    def __init__(self):
        self.services = []
        self.explicit_no_services = []
        self.replication_controllers = []

    def apply_namespace(self, ns):
        for svc in self.services:
            svc.obj["metadata"]["namespace"] = ns
        for svc in self.replication_controllers:
            svc.obj["metadata"]["namespace"] = ns

    def apply_as_original(self):
        for svc in self.services:
            svc._original_obj = svc.obj
        for svc in self.replication_controllers:
            svc._original_obj = svc.obj

    # Load existing resources from a cluster namespace
    def load_from_kube(self, kube):
        pass

    # Parse an ask2json output into kubernetes resources
    def load_from_azk2json(self, data):
        # Keys = azk service names
        for azk_service_name in data:
            azk_service_def = data[azk_service_name]
            # Start drafting the replication controller template
            container_ports = []
            pod_template = {
                "metadata":
                {
                    "labels":
                    {
                        "managed_by": managed_by_val,
                        "azk_service": azk_service_name,
                        "app": azk_service_name
                    }
                },
                "spec":
                {
                    "containers":
                    [{
                        "env": azk_service_def["env"],
                        "image": azk_service_def["image"],
                        "imagePullPolicy": "Always",
                        "name": azk_service_name,
                        "ports": container_ports,
                    }],
                    "dnsPolicy": "ClusterFirst",
                    "restartPolicy": "Always"
                }
            }
            if azk_service_def["cmd"] != None:
                pod_template["spec"]["command"] = azk_service_def["cmd"]
            if azk_service_def["args"] != None:
                pod_template["spec"]["args"] = azk_service_def["args"]
            if azk_service_def["ports"] != None and len(azk_service_def["ports"]) > 0:
                # We have some ports, make a service.
                service_ports = []
                promote_lb = False
                for port in azk_service_def["ports"]:
                    service_ports.append(
                    {
                        "port": port["containerPort"],
                        "targetPort": port["name"],
                        "protocol": port["protocol"]
                    });
                    container_ports.append(
                    {
                        "containerPort": port["containerPort"],
                        "name": port["name"],
                        "protocol": port["protocol"]
                    });
                    if "promoteLoadBalancer" in port and port["promoteLoadBalancer"]:
                        promote_lb = True
                nserv = Service(None,
                        {
                            "apiVersion": "v1",
                            "kind": "Service",
                            "annotations":
                            {
                                "azk_service": azk_service_name
                            },
                            "metadata":
                            {
                                "labels":
                                {
                                    "name": azk_service_name,
                                    "managed_by": managed_by_val,
                                    "azk_service": azk_service_name
                                },
                                "name": azk_service_name
                            },
                            "spec":
                            {
                                "ports": service_ports,
                                "selector":
                                {
                                    "azk_service": azk_service_name
                                },
                                "type": "ClusterIP" if not promote_lb else "LoadBalancer"
                            }
                        })
                logger.debug("== Service ==\n" + yaml.dump(nserv.obj))
                self.services.append(nserv)
            else:
                # delete it if it exists
                self.explicit_no_services.append(azk_service_name)

            # Craft the replication controller
            rc = ReplicationController(None,
                    {
                        "apiVersion": "v1",
                        "kind": "ReplicationController",
                        "metadata":
                        {
                            "labels":
                            {
                                "managed_by": managed_by_val,
                                "name": azk_service_name,
                                "azk_service": azk_service_name
                            },
                            "name": azk_service_name
                        },
                        "spec":
                        {
                            # Consider using existing replica count here.
                            "replicas": azk_service_def["replicas"],
                            "selector":
                            {
                                "managed_by": managed_by_val,
                                "name": azk_service_name,
                                "azk_service": azk_service_name
                            },
                            "template": pod_template
                        }
                    })
            logger.debug("== Replication Controller ==\n" + yaml.dump(rc.obj))
            self.replication_controllers.append(rc)

    # Calculate a list of actions required to get to target state
    def calculate_actuate(self, target_state):
        pass

class KubernetesDeployer():
    def __init__(self):
        parser = argparse.ArgumentParser(
                description="Deploys to kubernetes with azk.io",
                usage='''deploy <command> [<args>]

Commands:
    deploy      Builds and pushes new images, and syncs Kubernetes.
    push        Builds and pushes new images, but doesn't update Kubernetes.
    sync        Creates/updates kubernetes resources, but doesn't build/push anything.
    loadconfig  Just check the kubernetes config and connectivity.
    loadsource  Just check that the project source is mounted properly, and generate proposed Kubernetes resources.
                '''
                )
        parser.add_argument('command', help='Subcommand to run')
        self.target_setup = None
        self.api = None
        args = parser.parse_args(sys.argv[1:])
        coloredlogs.install(level=('DEBUG'), fmt='%(message)s', isatty=True)
        if not hasattr(self, args.command):
            parser.print_help()
            exit(1)
        getattr(self, args.command)()

    def loadconfig(self):
        if not self.api is None:
            return

        logger.debug("Loading kubeconfig...")
        try:
            self.kubeconfig = KubeConfig.from_file(env("LOCAL_KUBECONFIG_PATH", "/azk/deploy/.kube/config"))
            self.api = HTTPClient(self.kubeconfig)
            self.namespace = env("KUBE_NAMESPACE")
            self.context = env("KUBE_CONTEXT")
            if self.context is None:
                if "current-context" in self.kubeconfig.doc:
                    self.context = self.kubeconfig.doc["current-context"]
                else:
                    logger.fatal("KUBE_CONTEXT in env is not set and current-context is not set in kubeconfig.")
                    exit(1)

            if self.context not in self.kubeconfig.contexts:
                logger.fatal("Context '" + str(self.context) + "' is not found in kubeconfig.")
                exit(1)

            self.kubeconfig.set_current_context(self.context)
            logger.debug("Testing connectivity...")
            if self.namespace is None and "namespace" in self.kubeconfig.contexts[self.context]:
                self.namespace = self.kubeconfig.contexts[self.context]["namespace"]
            if self.namespace is None:
                logger.fatal("KUBE_NAMESPACE is not set and there is no namespace set in kubeconfig context " + str(self.kubeconfig.current_context) + ".")
                exit(1)
            pods = Pod.objects(self.api).filter(namespace=self.namespace)
            logger.info("Currently " + str(len(pods)) + " pods in '" + self.namespace + "' namespace, kubernetes connection appears to be working.")
        except Exception as e:
            logger.fatal("Unable to load kubeconfig/connection failed, " + str(e.strerror))
            exit(1)

    def loadsource(self):
        if not self.target_setup is None:
            return

        proj_path = env("LOCAL_PROJECT_PATH", "/azk/deploy/src/")
        if not os.path.isdir(proj_path):
            logger.fatal("Path '" + proj_path + "' does not exist. Check ${LOCAL_PROJECT_PATH}.")
            logger.fatal("Check the 'mounts' setting of the deploy system in your Azkfile.js.")
            exit(1)
        self.root_path = proj_path
        self.azkfile_path = proj_path + "Azkfile.js"

        if not os.path.exists(self.azkfile_path):
            logger.fatal("Path '" + proj_path + "' does not exist.")
            logger.fatal("You need an Azkfile.js in your project root.")
            exit(1)

        # Exec azk2json
        here_dir = os.path.dirname(os.path.abspath(__file__))
        azkjs_p = here_dir + "/azk2json/azk2json.js"
        logger.debug("Evaluating Azkfile.js...")
        data = None
        try:
            outp = subprocess.check_output(["node", azkjs_p, self.azkfile_path]).decode()
            data = json.loads(outp)
        except Exception as ex:
            logger.fatal("Unable to evaluate Azkfile.js.")
            logger.fatal(ex)
            exit(1)

        logger.debug("Evaluated azkfile, found services: " + ", ".join(list(data.keys())))
        self.target_setup = AzkSetup()
        self.target_setup.load_from_azk2json(data)

    def sync(self):
        logger.info("Beginning resources sync...")

        self.loadsource()
        self.loadconfig()

        # Everything was good with the configs, let's figure out the current state.
        azks = AzkSetup()
        azks.load_from_kube(self.api)

        # We know the current state, calculate options to actuate target state
        self.target_setup.apply_namespace(self.namespace)
        self.target_setup.apply_as_original()
        actions = self.target_setup.calculate_actuate(azks)

        # Format and print the steps and ask for confirmation

    # Builds and pushes images
    def push(self):
        self.loadsource()
        self.loadconfig()
        pass

    def deploy(self):
        # Finally, sync kube resources to commit the update
        self.push()
        self.sync()

    # I wish I could remove these, see azukiapp/azk#641
    def full(self):
        self.deploy()

    def fast(self):
        self.sync()

if __name__ == '__main__':
    KubernetesDeployer()
