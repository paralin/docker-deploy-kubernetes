FROM azukiapp/deploy:0.0.3
MAINTAINER Christian Stewart (paralin) <christian@paral.in>

WORKDIR /azk/deploy

RUN packages=' \
    g++ \
    py-pip \
    python-dev \
    libffi-dev \
    openssl-dev \
  ' \
  set -x \
  && apk --update add $packages python
RUN pip install ndg-httpsclient pykube
RUN apk del g++ py-pip python-dev libffi-dev openssl-dev \
  && rm -rf /var/cache/apk/*

ADD deploy-kubernetes.sh setup.py log.py ./

ENTRYPOINT ["/azk/deploy/deploy.sh", "--provider", "kubernetes"]
