[paralin/deploy-kubernetes](http://images.azk.io/#/deploy-kubernetes)
==================

Base docker image to deploy an app into Kubernetes using [`azk`](http://azk.io)

Initial Considerations
---
This is heavily experimental, but I plan to use this in production, so it *will* reach a stable state soon enough.

Versions (tags)
---

<versions>
- [`latest, 0.0.1`](https://github.com/paralin/docker-deploy-kubernetes/blob/master/latest/Dockerfile)
</versions>

Image content:
---

- Ubuntu 14.04 (v0.0.1) or Alpine Linux (v0.0.2 or later)
- [kubelet](https://github.com/kubernetes/kubernetes)

### Configuration
The following environment variables are available for configuring the deployment using this image:

- **KUBE_NAMESPACE** (*optional, default: active context namespace*): Namespace to deploy into.
- **LOCAL_PROJECT_PATH** (*optional, default: /azk/deploy/src*): Project source code path;
- **LOCAL_KUBECONFIG_PATH**(*optional, default: /azk/deploy/.kube/config*): Path to kubeconfig. If no path is given, a local Vagrant kubernetes setup is expected.
- **KUBE_CONTEXT** (*optional, default: default*): Kube context to use from the kubeconfig file. Uses the active context on default.
- **GIT_REF** (*optional, default: master*): Git reference (branch, commit SHA1 or tag) to be deployed;
- **RUN_SETUP** (*optional, default: true*): Boolean variable that defines if the remote server setup step should be run;
- **RUN_CONFIGURE** (*optional, default: true*): Boolean variable that defines if the remote server configuration should be run;
- **RUN_DEPLOY** (*optional, default: true*): Boolean variable that defines if the deploy step should be run;
- **DISABLE_ANALYTICS_TRACKER** (*optional, default: false*): Boolean variable that defines either azk should track deploy anonymous data or not;

#### Usage

Consider you want to deploy your app into a remote Kubernetes cluster and your local kubeconfig is placed at `LOCAL_KUBECONFIG_PATH` (usually this path is `$HOME`/.kube/config).

#### Usage with `azk`

Example of using this image with [azk](http://azk.io):

- Add the `deploy` system to your Azkfile.js:

```js
/**
 * Documentation: http://docs.azk.io/Azkfile.js
 */

// Adds the systems that shape your system
systems({
  // ...

  deploy: {
    image: {"docker": "paralin/deploy-kubernetes"},
    mounts: {
      "/azk/deploy/src":     path("."),
      "/azk/deploy/.kube":    path("#{env.HOME}/.kube"),
    },
    scalable: {"default": 0, "limit": 0},
  },
});
```

```js
/**
 * Documentation: http://docs.azk.io/Azkfile.js
 */

// Adds the systems that shape your system
systems({
  example: {
    // ...
    http: {
      domains: [
        // ...
        "#{env.HOST_DOMAIN}",
        "#{env.HOST_IP}"
      ]
    },
  },

  // ...
});
```

- Run:
```bash
$ azk deploy
```

#### Usage with `docker`

To create the image `paralin/deploy-kubernetes`, execute the following command on the deploy-kubernetes image folder:

```sh
$ docker build -t paralin/deploy-kubernetes latest
```

To run the image:

```sh
$ docker run --rm --name deploy-kubernetes-run \
  -v $(pwd):/azk/deploy/src \
  -v $HOME/.kube:/azk/deploy/.kube \
  paralin/deploy-kubernetes
```
## License

My Dockerfiles distributed under the [Apache License](https://github.com/azukiapp/docker-deploy-digitalocean/blob/master/LICENSE).
