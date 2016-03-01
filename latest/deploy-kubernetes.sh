export LOCAL_KUBECONFIG_PATH=${LOCAL_KUBECONFIG_PATH:-"/azk/deploy/.kube/config"}

python -u setup.py

export REMOTE_HOST=`cat ${REMOTE_HOST_ADDR_FILE}`
