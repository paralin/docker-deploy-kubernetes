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
  && apk --update add $packages \
  && pip install ndg-httpsclient \
# install python-kubernetes (to be developed)
  && apk del g++ py-pip python-dev libffi-dev openssl-dev \
  && apk add python \
  && rm -rf /var/cache/apk/*

COPY deploy-kubernetes.sh setup.py log.py ./

ENTRYPOINT ["/azk/deploy/deploy.sh", "--provider", "kubernetes"]
