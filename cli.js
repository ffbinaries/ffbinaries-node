#!/usr/bin/env node
console.log('ffbinaries downloader');
console.log('------------------------------------');

var ffbinaries = require('./ffbinaries-lib');
var packageJson = require('./package.json');
var _ = require('lodash');
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
    'To clear cache type:',
    ' ffbinaries clearcache',
    '',
    'If no version is specified the latest will be downloaded.',
    'You can specify target directory, defaults to working directory.',
    '',
    'Examples:',
    ' ffbinaries',
    ' ffbinaries mac',
    ' ffbinaries win-64 --quiet --components=ffplay',
    ' ffbinaries linux-64 -q --v=3.2 --c=ffmpeg,ffprobe --output=/home/user/ffmpeg'
  ];
  console.log(lines.join('\n'));
}

function displayVersions () {
  console.log('ffbinaries downloader version:', packageJson.version);
  ffbinaries.listVersions(function (err, versions) {
    if (versions && Array.isArray(versions)) {
      console.log('Available ffmpeg versions:', versions.join(', '));
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
    version: opts.version || false,
    components: opts.components || opts.c || false
  };

  ffbinaries.downloadFiles(resolved, getOpts, function () {
    console.log('------------------------------------');
    console.log('All files downloaded.');
  });
}


// execute app
var mode = _.get(cliArgs, 'args.0');

var opts = {
  output: _.get(cliArgs, 'opts.output') || _.get(cliArgs, 'opts.o'),
  quiet: _.get(cliArgs, 'opts.quiet') || _.get(cliArgs, 'opts.q'),
  version: _.get(cliArgs, 'opts.version') || _.get(cliArgs, 'opts.v'),
  components: (_.get(cliArgs, 'opts.components') || _.get(cliArgs, 'opts.c'))
}

if (typeof opts.components === 'string') {
  opts.components = opts.components.split(',');
} else {
  opts.components = undefined;
}

if (mode === 'help' || mode === 'info') {
  return displayHelp();
} else if (mode === 'clearcache') {
  return ffbinaries.clearCache();
} else if (mode === 'version' || mode === 'versions' || mode === 'list') {
  return displayVersions();
} else {
  return download(mode, opts);
}
