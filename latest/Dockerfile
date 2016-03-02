FROM phusion/baseimage:0.9.18
MAINTAINER Christian Stewart (paralin) <christian@paral.in>

WORKDIR /azk/deploy

RUN apt-get update && apt-get install -y build-essential python3-pip libssl-dev libffi-dev
RUN pip3 install --upgrade ndg-httpsclient pykube arghandler coloredlogs
RUN apt-get clean

# Install nvm
RUN echo "" > ~/.bashrc && curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh | bash
# Install node
RUN . ~/.bashrc && nvm install v5.7.0

ADD deploy.py kube_http.py deploy.sh ./
ADD azk2json ./azk2json
RUN . ~/.bashrc && cd azk2json && npm install

ENTRYPOINT ["/azk/deploy/deploy.sh"]
CMD ["/azk/deploy/deploy.sh"]
