var os = require('os');
var fse = require('fs-extra');
var path = require('path');
var _ = require('lodash');
var request = require('request');
var async = require('async');
var extractZip = require('extract-zip');

var API_URL = 'http://ffbinaries.com/api/v1';

var LOCAL_CACHE_DIR = os.homedir() + '/.ffbinaries-cache';
var RUNTIME_CACHE = {};
var errorMsgs = {
  connectionIssues: 'Couldn\'t connect to ffbinaries.com API. Check your Internet connection.',
  parsingVersionData: 'Couldn\'t parse retrieved version data. Try "ffbinaries clearcache".',
  parsingVersionList: 'Couldn\'t parse the list of available versions. Try "ffbinaries clearcache".',
  notFound: 'Requested data not found.',
  incorrectVersionParam: '"version" parameter must be a string.'
};

function _ensureDirSync (dir) {
  try {
    fse.accessSync(dir);
  } catch (e) {
    fse.mkdirSync(dir);
  }
}

_ensureDirSync(LOCAL_CACHE_DIR);

/**
 * Resolves the platform key based on input string
 */
function resolvePlatform (input) {
  var rtn = null;

  switch (input) {
    case 'mac':
    case 'osx':
    case 'mac-64':
    case 'osx-64':
        rtn = 'osx-64';
        break;

    case 'linux':
    case 'linux-32':
        rtn = 'linux-32';
        break;

    case 'linux-64':
        rtn = 'linux-64';
        break;

    case 'linux-arm':
    case 'linux-armel':
        rtn = 'linux-armel';
        break;

    case 'linux-armhf':
        rtn = 'linux-armhf';
        break;

    case 'win':
    case 'win-32':
    case 'windows':
    case 'windows-32':
        rtn = 'windows-32';
        break;

    case 'win-64':
    case 'windows-64':
        rtn = 'windows-64';
        break;

    default:
        rtn = null;
    }
    return rtn;
}
/**
 * Detects the platform of the machine the script is executed on.
 * Object can be provided to detect platform from info derived elsewhere.
 *
 * @param {object} osinfo Contains "type" and "arch" properties
 */
function detectPlatform (osinfo) {
  var inputIsValid = typeof osinfo === 'object' && typeof osinfo.type === 'string' && typeof osinfo.arch === 'string';
  var type = (inputIsValid ? osinfo.type : os.type()).toLowerCase();
  var arch = (inputIsValid ? osinfo.arch : os.arch()).toLowerCase();

  if (type === 'darwin') {
    return 'osx-64';
  }

  if (type === 'windows_nt') {
    return arch == 'x64' ? 'windows-64' : 'windows-32';
  }

  if (type === 'linux') {
    if (arch === 'arm' || arch === 'arm64') {
      return 'linux-armel';
    }
    return arch == 'x64' ? 'linux-64' : 'linux-32';
  }

  return null;
}
/**
 * Gets the binary filename (appends exe in Windows)
 *
 * @param {string} component "ffmpeg", "ffplay", "ffprobe" or "ffserver"
 * @param {platform} platform "ffmpeg", "ffplay", "ffprobe" or "ffserver"
 */
function getBinaryFilename (component, platform) {
  var platformCode = resolvePlatform(platform);
  if (platformCode === 'windows-32' || platformCode === 'windows-64') {
    return component + '.exe';
  }
  return component;
}

function listPlatforms() {
  return ['osx-64', 'linux-32', 'linux-64', 'linux-armel', 'linux-armhf', 'windows-32', 'windows-64'];
}

function listVersions(callback) {
  if (RUNTIME_CACHE['versions']) {
    return callback(null, RUNTIME_CACHE['versionsAll']);
  }
  request({url: API_URL}, function (err, response, body) {
    if (err) {
      return callback(errorMsgs.connectionIssues);
    }

    try {
      var parsed = JSON.parse(body.toString());
    } catch (e) {
      return callback(errorMsgs.parsingVersionList);
    }

    var versionsAll = Object.keys(parsed.versions);
    RUNTIME_CACHE['versionsAll'] = versionsAll;
    return callback(null, versionsAll);
  });
}
/**
 * Gets full data set from ffbinaries.com
 */
function getVersionData (version, callback) {
  if (RUNTIME_CACHE[version]) {
    return callback(null, RUNTIME_CACHE[version]);
  }

  if (version && typeof version !== 'string') {
    return callback(errorMsgs.incorrectVersionParam);
  }

  var url = version ? '/version/' + version : '/latest';

  request({url: API_URL + url}, function (err, response, body) {
    if (err) {
      return callback(errorMsgs.connectionIssues);
    }

    if (body === '404') {
      return callback(errorMsgs.notFound);
    }

    try {
      var parsed = JSON.parse(body.toString());
    } catch (e) {
      return callback(errorMsgs.parsingVersionData);
    }

    RUNTIME_CACHE[version] = parsed;
    return callback(null, parsed);
  });
}

/**
 * Download file(s) and save them in the specified directory
 */
function _downloadUrls (components, urls, opts, callback) {
  if (components && !Array.isArray(components)) {
    components = [components];
  }

  if (typeof urls === 'object') {
    urls = _.map(urls, function (v, k) {
      return (!components || components && !Array.isArray(components) || components && Array.isArray(components) && components.indexOf(k) !== -1) ? v : null;
    });
    urls = _.uniq(urls);
  }

  var destinationDir = opts.destination;
  var cacheDir = LOCAL_CACHE_DIR;

  function _extractZipToDestination (filename, cb) {
    var oldpath = LOCAL_CACHE_DIR + '/' + filename;
    extractZip(oldpath, { dir: destinationDir, defaultFileMode: parseInt('744', 8) }, cb);
  }

  var results = [];

  async.each(urls, function (url, cb) {
    if (!url) {
      return cb();
    }
    var filename = url.split('/').pop();
    var runningTotal = 0;
    var totalFilesize;

    if (typeof opts.tickerFn === 'function') {
      opts.tickerInterval = parseInt(opts.tickerInterval, 10);
      var tickerInterval = (typeof opts.tickerInterval !== NaN) ? opts.tickerInterval : 1000;
      var tickData = { filename: filename, progress: 0 };

      // Schedule next ticks
      var interval = setInterval(function () {
        if (totalFilesize && runningTotal == totalFilesize) {
          return clearInterval(interval);
        }
        tickData.progress = runningTotal;

        opts.tickerFn(tickData);
      }, tickerInterval);
    }

    // Check if file already downloaded in target directory
    try {
      fse.accessSync(destinationDir + '/' + filename);
      results.push({
        filename: filename,
        path: destinationDir,
        status: 'File exists'
      });
      clearInterval(interval);
      return cb();
    } catch (e) {
      // Check if the file is already cached
      try {
        fse.accessSync(LOCAL_CACHE_DIR + '/' + filename);
        results.push({
          filename: filename,
          path: destinationDir,
          status: 'File extracted to destination (archive found in cache)'
        });
        clearInterval(interval);
        return _extractZipToDestination(filename, cb);
      } catch (e) {
        // Download the file and write in cache
        if (opts.quiet) clearInterval(interval);

        request({url: url}, function (err, response, body) {
          totalFilesize = response.headers['content-length'];
          results.push({
            filename: filename,
            path: destinationDir,
            size: Math.floor(totalFilesize/1024/1024*1000)/1000 + 'MB',
            status: 'File extracted to destination (downloaded from "' + url + '")'
          });

          _extractZipToDestination(filename, cb);
        })
        .on('data', function (data) {
          runningTotal += data.length;
        })
        .pipe(fse.createWriteStream(LOCAL_CACHE_DIR + '/' + filename/* + '.part'*/));
      }

    }

  }, function () {
    return callback(null, results);
  });

}

/**
 * Gets binaries for the platform
 * It will get the data from ffbinaries, pick the correct files
 * and save it to the specified directory
 *
 * @param {string|array} components
 * @param {object}   opts
 * @param {function} callback
 */
function downloadFiles (components, opts, callback) {
  // only callback provided: assign blank components and opts
  if (!callback && !opts && typeof components === 'function') {
    callback = components;
    components = null;
    opts = {};
  }

  if (!callback && typeof opts === 'function') {
    callback = opts;

    if (typeof components === 'object' && !Array.isArray(components)) {
      // first argument is an object: use as opts and assign blank components
      opts = components;
      components = null;
    } else {
      // leave first argument intact, assign blank opts
      opts = {};
    }
  }

  var platform = resolvePlatform(opts.platform) || detectPlatform();

  opts.destination = path.resolve(opts.destination || '.');
  _ensureDirSync(opts.destination);

  getVersionData(opts.version, function (err, data) {
    var urls = _.get(data, 'bin.' + platform);
    if (err || !urls) {
      return callback(err || 'No URLs!');
    }

    _downloadUrls(components, urls, opts, callback);
  });
}


function clearCache () {
  fse.removeSync(LOCAL_CACHE_DIR);
}

module.exports = {
  downloadFiles: downloadFiles,
  getVersionData: getVersionData,
  listVersions: listVersions,
  listPlatforms: listPlatforms,
  detectPlatform: detectPlatform,
  resolvePlatform: resolvePlatform,
  getBinaryFilename: getBinaryFilename,
  clearCache: clearCache
};
