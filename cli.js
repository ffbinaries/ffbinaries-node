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

function download(components, opts) {
  if (!opts.platform) {
    opts.platform = ffbinaries.detectPlatform();
    console.log('Platform not specified. Downloading binaries for current platform: ' + opts.platform);
  }

  var dlOpts = {
    destination: opts.output || process.cwd(),
    quiet: opts.quiet || false,
    version: opts.version || false,
    platform: ffbinaries.resolvePlatform(opts.platform)
  };

  if (!dlOpts.platform) {
    console.log('Specified platform "' + opts.platform + '" not supported. Type "ffbinaries help" to see the list of available binaries or run "ffbinaries" without -p switch.');
    return process.exit(1);
  }

  if (!components.length) {
    components = null;
  }

  console.log('Components:', Array.isArray(components) ? components.join(', ') : 'all')
  console.log('Platform:', dlOpts.platform);

  ffbinaries.downloadFiles(components, dlOpts, function (err, data) {
    if (err) {
      console.log('------------------------------------');
      console.log('Download failed.');
      return process.exit(1);
    }
    console.log('------------------------------------');
    console.log('All files downloaded.');
  });
}


// execute app
var mode = _.get(cliArgs, 'args.0');
var components = _.get(cliArgs, 'args');

var opts = {
  output: _.get(cliArgs, 'opts.output') || _.get(cliArgs, 'opts.o'),
  quiet: _.get(cliArgs, 'opts.quiet') || _.get(cliArgs, 'opts.q'),
  version: _.get(cliArgs, 'opts.version') || _.get(cliArgs, 'opts.v'),
  platform: (_.get(cliArgs, 'opts.platform') || _.get(cliArgs, 'opts.p'))
}

if (mode === 'help' || mode === 'info') {
  return displayHelp();
} else if (mode === 'clearcache') {
  return ffbinaries.clearCache();
} else if (mode === 'version' || mode === 'versions' || mode === 'list') {
  return displayVersions();
} else {
  return download(components, opts);
}
