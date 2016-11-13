#!/usr/bin/env node
var ffbinaries = require('./ffbinaries-lib');
var _get = require('lodash.get');
var cliArgs = require('clarg')();

function displayHelp () {
  var lines = [
    '',
    'Available platforms:',
    platforms.join(', '),
    '',
    'Examples:',
    'ffbinaries',
    'ffbinaries linux-32 --output=/home/user/ffmpeg'
  ];
  console.log(lines.join('\n'));
}

function download(platform, output) {
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

  var destination = output || process.cwd();

  ffbinaries.get(resolved, {destination: destination}, function () {
    console.log('All done.');
  });
}


console.log('FFbinaries downloader');
console.log('---------------------');
var mode = _get(cliArgs, 'args.0');
var output = _get(cliArgs, 'opts.output') || _get(cliArgs, 'opts.o');

if (mode === 'help' || mode === 'info') {
  return displayHelp();
} else {
  return download(mode, output);
}
