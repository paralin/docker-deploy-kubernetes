// Converts an Azkfile.js to somewhat sensible json for the kubernetes deployer

var _resultant_systems = {};
var path_to_azkjs = process.argv[2];
var validate = require('validate.js');
var fs = require('fs');

function processSystem(sid, sys) {
  if (sid === "deploy") return;
  if (!validate.isObject(sys)) {
    console.log("system " + sid + " isn't an object.");
    process.exit(1);
  }

  var fsys = {};

  // Required: image
  if (!validate.isObject(sys["image"]) || !validate.isString(sys["image"]["docker"])) {
    console.log("system " + sid + " missing image.docker.");
    process.exit(1);
  }
  fsys["image"] = sys["image"]["docker"];

  // Not required: command
  if (validate.isArray(sys["command"])) {
    fsys["args"] = sys["command"];
  }

  if (validate.isString(sys["command"])) {
    fsys["args"] = sys["command"].split(' ');
  }

  // Not required: shell
  if (validate.isArray(sys["shell"])) {
    fsys["cmd"] = sys["shell"];
  }

  if (validate.isString(sys["shell"])) {
    fsys["cmd"] = sys["shell"].split(' ');
  }

  // Not required: scalable
  fsys["replicas"] = 1;
  if (validate.isObject(sys["scalable"]) && validate.isInteger(sys["scalable"]["default"])) {
    fsys["replicas"] = sys["scalable"]["default"];
  }

  // Not required: envs
  var tenvs = fsys["env"] = [];
  if (validate.isObject(sys["envs"])) {
    var envs = sys["envs"];
    for (var key in envs) {
      tenvs.push({
        "name": key,
        "value": envs[key]
      });
    }
  }

  // Not required: ports
  var portRe = /^(\d+)(\/)(tcp|udp)$/;
  var portReNoProto = /^(\d+)$/;
  if (validate.isObject(sys["ports"])) {
    var fpts = fsys["ports"] = []
    var pn;
    for (pn in sys["ports"]) {
      var pv = sys["ports"][pn];
      if (!portRe.test(pv)) {
        if (portReNoProto.test(pv)) {
          pv += "/tcp";
        } else {
          console.log("Invalid port value: " + pv);
          process.exit(1);
        }
      }
      var r = portRe.exec(pv);
      var port = r[1];
      var tcpu = r[3];
      fpts.push({
        containerPort: parseInt(port),
        name: pn.toLowerCase(),
        protocol: tcpu.toUpperCase()
      });
    }
  }

  // Not required: mounts
  if (validate.isObject(sys["mounts"])) {
    var volumes = fsys["volumes"] = [];
    var cpth;
    for (cpth in sys["mounts"]) {
      var mnt = sys["mounts"][cpth];
      if (!validate.isObject(mnt)) {
        console.log("Invalid mount: " + mnt);
        console.exit(1);
      }
      mnt["containerPath"] = cpth;
      volumes.push(mnt);
    }
  }

  // Not required: provision
  if (validate.isArray(sys["provision"]))
    fsys["setup_cmds"] = sys["provision"];

  // Not required: workdir
  if (validate.isString(sys["workdir"])) {
    fsys["workdir"] = sys["workdir"];
  }

  // Not required: docker_extra (some things supported)
  if (validate.isObject(sys["docker_extra"])) {
    var ext = sys["docker_extra"];

    // Not required: HostConfig
    if (validate.isObject(ext["HostConfig"])) {
      var hostc = ext["HostConfig"];

      // Not required: PortBindings
      // kubernetes supports 1 protocol type per loadbalancer
      if (validate.isObject(hostc["PortBindings"]) && fsys["ports"]) {
        var pbd = hostc["PortBindings"];
        var pb;
        for (pb in pbd) {
          var pbv = pbd[pb];
          var pp = pb.split('/');
          var port = parseInt(pp[0]);
          if (!validate.isArray(pbv) || !validate.isObject(pbv[0]) || !validate.isString(pbv[0]["HostPort"]))
            continue;
          // Find the port in the existing ports
          for (var pex in fsys["ports"]) {
            var pe = fsys["ports"][pex];
            if (pe.containerPort === port) {
              // promote it to a loadbalancer
              pe["promoteLoadBalancer"] = true;
              break;
            }
          }
        }
      }
    }
  }

  _resultant_systems[sid] = fsys;
}

// Just copy using ADD, but with some extra params
function sync(d, opts) {
  opts = opts || {};
  if (!validate.isString(d)) {
    console.log("sync('" + d + "') is invalid.");
    process.exit(1);
  }
  return {type: "ADD", "path": d, exclude: opts["exclude"] || []};
}

// Persistent will use a kubernetes volume, on default a host volume.
// Todo: add an option to pass a kubernetes volume type
function persistent(d) {
  return {type: "VOLUME", "path": d, "volumeType": "host"};
}

// Path will just copy in the build phase with ADD
function path(d) {
  return {"type": "ADD", "path": d, "exclude": []};
}

// Input: object with azk config
function systems(j) {
  if (!validate.isObject(j)) {
    console.log("systems() called without object as param.");
    process.exit(1);
  }

  var sid;
  for (sid in j) {
    var sys = j[sid];
    processSystem(sid, sys);
  }
}

// Eval the file
eval(fs.readFileSync(path_to_azkjs, "utf8"));

// Print
console.log(JSON.stringify(_resultant_systems));
