# -*- coding: utf-8 -*-

import os
import time
import sys
import log
import operator

from pykube.config import KubeConfig
from pykube.http import HTTPClient
from pykube.objects import Pod

def env(key, default=None):
  try:
    return os.environ[key]
  except:
    return default

def wait(action, desciption=None, step=2000, timeout=300000):
  if action is None:
    raise RuntimeError(log.err('Cannot wait for an empty action.'))
  if desciption is None:
    desciption = action.type
  start_time = time.time()
  while (time.time() - start_time)*1000 < timeout:
    action.load()
    if action.status == 'completed':
      return
    elif action.status == 'errored':
      raise RuntimeError(log.err(str(desciption)))
    time.sleep(step/1000)
  if (time.time() - start_time)*1000 >= timeout:
    raise RuntimeError(log.err(str(desciption) + ' Timeout (' + str(timeout) + 'ms)', 'timeout'))

# Check the kubeconfig
# Check connectivity (verify the namespace exists)
# Generate a planned layout (services, pods) and verify with user changes
# Apply changes
# Completed
