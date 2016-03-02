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
  if (validate.isArray(sys["command"]) || validate.isString(sys["command"])) {
    fsys["args"] = sys["command"];
  }
  fsys["args"] = sys["image"]["command"];

  // Not required: scalable
  fsys["replicas"] = 1;
  if (validate.isObject(sys["scalable"]) && validate.isInteger(sys["scalable"]["default"])) {
    fsys["replicas"] = sys["scalable"]["default"];
  }

  // todo: envs
  // todo: ports
  // todo: mounts
  // todo: provision
  // todo: docker_extra

  _resultant_systems[sid] = fsys;
}

function sync(d) {
  if (!validate.isString(d)) {
    console.log("sync('" + d + "') is invalid.");
    process.exit(1);
  }
  if (d === ".") d = "";
  return "{project_dir}/" + d;
}

function persistent(d) {
  return sync(d);
}

function path(d) {
  return sync(d);
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
