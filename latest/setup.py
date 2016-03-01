# -*- coding: utf-8 -*-

import os
import time
import sys
import log
# import kubernetes

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

# todo: do the thing
