#!/usr/bin/env node
console.log('FFbinaries downloader');
console.log('------------------------------------');

var ffbinaries = require('./ffbinaries-lib');
var _get = require('lodash.get');
var cliArgs = require('clarg')();

function displayHelp () {
  var lines = [
    '',
    'Downloads binaries for ffmpeg, ffprobe, ffplay and ffserver.',
    '',
    'Available platforms:',
    ' ' + ffbinaries.listPlatforms().join(', '),
    '',
    'To see what versions are available type:',
    ' ffbinaries versions',
    '',
    'If no version is specified the latest will be downloaded.',
    'You can specify target directory, defaults to working directory.',
    '',
    'Examples:',
    ' ffbinaries',
    ' ffbinaries linux-64',
    ' ffbinaries linux-64 --version=3.2 --output=/home/user/ffmpeg --quiet'
  ];
  console.log(lines.join('\n'));
}

function displayVersions () {
  ffbinaries.listVersions(function (err, versions) {
    if (versions && Array.isArray(versions)) {
      console.log('Available versions:', versions.join(', '));
    } else {
      console.log('Couldn\'t retrieve list of versions from the server.');
    }
  })
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
    quiet: opts.quiet || false,
    version: opts.version || false
  };

  ffbinaries.downloadFiles(resolved, getOpts, function () {
    console.log('------------------------------------');
    console.log('All files downloaded.');
  });
}


// execute app
var mode = _get(cliArgs, 'args.0');
var opts = {
  output: _get(cliArgs, 'opts.output') || _get(cliArgs, 'opts.o'),
  quiet: _get(cliArgs, 'opts.quiet') || _get(cliArgs, 'opts.q'),
  version: _get(cliArgs, 'opts.version') || _get(cliArgs, 'opts.v')
}

if (mode === 'help' || mode === 'info') {
  return displayHelp();
} else if (mode === 'versions' || mode === 'list') {
  return displayVersions();
} else {
  return download(mode, opts);
}
