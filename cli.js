#!/usr/bin/env node
var ffbinaries = require('./ffbinaries-lib');
var _get = require('lodash.get');
var cliArgs = require('clarg')();

function displayHelp () {
  var lines = [
    '',
    'Available platforms:',
    ffbinaries.listPlatforms().join(', '),
    '',
    'Examples:',
    ' ffbinaries',
    ' ffbinaries linux-64 --output=/home/user/ffmpeg --quiet'
  ];
  console.log(lines.join('\n'));
}

function download(platform, opts) {
  var resolved = ffbinaries.resolvePlatform(platform);

  if (!platform) {
    console.log('Platform not specified. Downloading binaries for current platform: ' + ffbinaries.detectPlatform());
  } else {
    if (!resolved) {
      console.log('Specified platform "' + platform + '" not supported. Type "ffbinaries help" to see the list of available binaries or run "ffbinaries" without -p switch.');
      return process.exit(1);
    }
    console.log('Platform selected:', resolved);
  }

  var getOpts = {
    destination: opts.output || process.cwd(),
    quiet: opts.quiet || false
  };

  ffbinaries.get(resolved, getOpts, function () {
    console.log('All done.');
  });
}


console.log('FFbinaries downloader');
console.log('---------------------');
var mode = _get(cliArgs, 'args.0');
var opts = {
  output: _get(cliArgs, 'opts.output') || _get(cliArgs, 'opts.o'),
  quiet: _get(cliArgs, 'opts.quiet') || _get(cliArgs, 'opts.q')
}

if (mode === 'help' || mode === 'info') {
  return displayHelp();
} else {
  return download(mode, opts);
}
