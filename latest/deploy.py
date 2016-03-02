#!/bin/python
# -*- coding: utf-8 -*-

import os
import time
import sys
import operator
import subprocess
import json

import logging
import coloredlogs
logger = logging.getLogger('kube')

import argparse

from pykube.config import KubeConfig
from kube_http import HTTPClient
from pykube.objects import Pod

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
    pass

# An instance of Azkfile.js translated to Kubernetes
class AzkSetup():
    def __init__(self):
        self.services = []
        self.replication_controllers = []

    # Load existing resources from a cluster namespace
    def load_from_kube(self, kube):
        pass

    # Parse an ask2json output into kubernetes resources
    def load_from_azk2json(self, data):
        pass

    # Calculate a list of actions required to get to target state
    def calculate_actuate(self, target_state):
        pass

class KubernetesDeployer():
    def __init__(self):
        parser = argparse.ArgumentParser(
                description="Deploys to kubernetes with azk.io",
                usage='''deploy <command> [<args>]

Commands:
    full/fast   Creates/updates kubernetes resources.
    loadconfig  Just check the kubernetes config and connectivity.
    loadsource  Just check that the project source is mounted properly.
                '''
                )
        parser.add_argument('command', help='Subcommand to run')
        args = parser.parse_args(sys.argv[1:])
        coloredlogs.install(level=('DEBUG'), fmt='%(message)s', isatty=True)
        if not hasattr(self, args.command):
            parser.print_help()
            exit(1)
        getattr(self, args.command)()

    def loadconfig(self):
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

    def full(self):
        # chekk the source
        self.loadsource()

        logger.info("Beginning full deploy/sync...")

        # check the configs
        self.loadconfig()

        # Everything was good with the configs, let's figure out the current state.
        azks = AzkSetup()
        azks.load_from_kube(self.api)

        # We know the current state, calculate options to actuate target state
        actions = self.target_setup.calculate_actuate(azks)

        # Format and print the steps and ask for confirmation

    def fast(self):
        return self.full()

if __name__ == '__main__':
    KubernetesDeployer()
