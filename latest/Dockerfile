FROM phusion/baseimage:0.9.18
MAINTAINER Christian Stewart (paralin) <christian@paral.in>

WORKDIR /azk/deploy

RUN apt-get update && apt-get install -y build-essential python3-pip libssl-dev libffi-dev
RUN pip3 install --upgrade ndg-httpsclient pykube arghandler colorlog
RUN apt-get clean

ADD deploy.py kube_http.py ./

ENTRYPOINT ["/azk/deploy/deploy.py"]
