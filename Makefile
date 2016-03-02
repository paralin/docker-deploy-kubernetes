# `adocker` is alias to `azk docker`
all: build

build:
	adocker build -t paralin/deploy-kubernetes latest

no-cache:
	adocker build --rm --no-cache -t paralin/deploy-kubernetes latest

push:
	adocker push paralin/deploy-kubernetes:latest
