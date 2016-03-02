#!/bin/python
# -*- coding: utf-8 -*-

import os
import time
import sys
import operator

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

# An instance of an Azk system in Kubernetes format
# Includes services, replication controllers, pods, etc...
class AzkKubeSystem():
    pass

# An instance of Azkfile.js translated to Kubernetes
class AzkSetup():
    pass

class KubernetesDeployer():
    def __init__(self):
        parser = argparse.ArgumentParser(
                description="Deploys to kubernetes with azk.io",
                usage='''deploy -c <command> [<args>]

Commands:
    full/fast   Creates/updates kubernetes resources.
    loadconfig  Just check the kubernetes config and connectivity.
    loadsource  Just check that the project source is mounted properly.
                '''
                )
        parser.add_argument('command', help='Subcommand to run')
        args = parser.parse_args(sys.argv[3:])
        coloredlogs.install(level=('DEBUG'), fmt='%(message)s')
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

            logger.debug("Testing connectivity...")
            if self.namespace is None:
                self.namespace = self.kubeconfig.contexts[self.kubeconfig.current_context]["namespace"]
            if self.namespace is None:
                logger.fatal("KUBE_NAMESPACE is not set and there is no namespace set in kubeconfig context " + str(self.current_context) + ".")
                exit(1)
            pods = Pod.objects(self.api).filter(namespace=self.namespace)
            logger.info("Currently " + str(len(pods)) + " pods in '" + self.namespace + "' namespace, kubernetes connection appears to be working.")
        except Exception as e:
            logger.fatal("Unable to load kubeconfig/connection failed, " + e.strerror)
            exit(1)

    def loadsource(self):
        proj_path = env("LOCAL_PROJECT_PATH", "/azk/deploy/src/")
        if not os.path.isdir(proj_path):
            logger.fatal("Path '" + proj_path + "' does not exist. Check ${LOCAL_PROJECT_PATH}.")
            logger.fatal("Check the 'mounts' setting of the deploy system in your Azkfile.js.")
            exit(1)


    def full(self):
        # check the source
        self.loadsource()

        logger.info("Beginning full deploy...")

        # check the configs
        self.loadconfig()

        # Everything was good with the configs, let's figure out the current state.
        azks = AzkSetup()


    def fast(self):
        return self.full()

if __name__ == '__main__':
    KubernetesDeployer()
