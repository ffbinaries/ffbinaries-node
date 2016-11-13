#!/usr/bin/env node
var ffbinaries = require('./ffbinaries-lib');
var _get = require('lodash.get');
var cliArgs = require('clarg')();

var platforms = ['windows-32', 'windows-64', 'linux-32', 'linux-64', 'linux-armhf', 'linux-armel', 'osx-64'];

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
  if (!platform) {
    console.log('Platform not specified. Downloading binaries for current platform.');
  } else {
    if (platforms.indexOf(platform) === -1) {
      console.log('Specified platform "' + platform + '" not supported. Type "ffbinaries help" to see the list of available binaries or run "ffbinaries" without -p switch.');
      return process.exit(1);
    }
    console.log('Platform selected:', platform);
  }

  var destination = output || process.cwd();

  ffbinaries.get(platform, destination, function () {
    console.log('All done.');
  })

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
