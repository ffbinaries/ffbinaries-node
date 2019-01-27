#!/usr/bin/env node
var _ = require('lodash');
var cliArgs = require('clarg')();
var ffbinaries = require('./ffbinaries-lib');
var packageJson = require('./package.json');

// gather info from CLI
var dispatchMode = _.get(cliArgs, 'args.0');
var dispatchComponents = _.get(cliArgs, 'args');

var dispatchOpts = {
  output: _.get(cliArgs, 'opts.output') || _.get(cliArgs, 'opts.o'),
  quiet: _.get(cliArgs, 'opts.quiet') || _.get(cliArgs, 'opts.q'),
  version: _.get(cliArgs, 'opts.version') || _.get(cliArgs, 'opts.v'),
  platform: (_.get(cliArgs, 'opts.platform') || _.get(cliArgs, 'opts.p'))
};

console.log('ffbinaries downloader');
console.log('------------------------------------');

function displayHelp() {
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
    ' ffbinaries ffmpeg',
    ' ffbinaries ffplay --quiet --platform=win-64',
    ' ffbinaries ffmpeg ffprobe -q --v=3.2 --p=linux-64 --output=/usr/local/bin/ffmpeg'
  ];
  console.log(lines.join('\n'));
}

function displayVersions() {
  console.log('ffbinaries downloader version:', packageJson.version);
  ffbinaries.listVersions(function displayVersionsResults(err, versions) {
    if (versions && Array.isArray(versions)) {
      console.log('Available ffmpeg versions:', versions.join(', '));
    } else {
      console.log('Couldn\'t retrieve list of versions from the server.');
    }
  });
}

function displayDownloadFilesResult(err, data) {
  if (err) {
    console.log('------------------------------------');
    console.log('Download failed.');
    console.log('------------------------------------');
    console.log(err);
    return process.exit(1);
  }
  console.log('Destination:', data[0].path);
  console.log('Files downloaded:', _.map(data, 'filename').join(', '));

  console.log('------------------------------------');
  console.log('Binaries downloaded and extracted.');
  console.log('------------------------------------');
}

function clearCache() {
  ffbinaries.clearCache();
  console.log('Cache cleared');
}

function download(components, opts) {
  if (!opts.platform) {
    opts.platform = ffbinaries.detectPlatform();
    console.log('Platform not specified - downloading binaries for current platform.');
  }

  function fnTicker(data) {
    console.log('\x1b[2m' + data.filename + ': Downloading ' + (data.progress * 100).toFixed(1) + '%\x1b[0m');
  }

  var dlOpts = {
    destination: opts.output || process.cwd(),
    version: opts.version || false,
    platform: ffbinaries.resolvePlatform(opts.platform),
    tickerFn: opts.quiet ? null : fnTicker,
    tickerInterval: 2500
  };

  if (!dlOpts.platform) {
    console.log('Specified platform "' + opts.platform + '" not supported. Type "ffbinaries help" to see the list of available binaries or run "ffbinaries" without -p switch.');
    return process.exit(1);
  }

  if (!components.length) {
    components = null;
  }

  console.log('Components:', Array.isArray(components) ? components.join(', ') : 'all');
  console.log('Platform:', dlOpts.platform);
  console.log('ffmpeg version:', dlOpts.version || '(latest)');

  ffbinaries.downloadFiles(components, dlOpts, displayDownloadFilesResult);
}

/**
 * Dispatches to the correct handler based on input from CLI
 */
function dispatch(mode, components, opts) {
  if (mode === 'help' || mode === 'info') {
    return displayHelp();
  }

  if (mode === 'clearcache') {
    return clearCache();
  }

  if (mode === 'version' || mode === 'versions' || mode === 'list') {
    return displayVersions();
  }

  return download(components, opts);
}

dispatch(dispatchMode, dispatchComponents, dispatchOpts);
