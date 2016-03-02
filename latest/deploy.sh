#!/bin/bash
. ~/.bashrc
shift
shift
echo $@
python3 /azk/deploy/deploy.py $@
