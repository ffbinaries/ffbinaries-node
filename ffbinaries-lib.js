var os = require('os');
var fse = require('fs-extra');
var path = require('path');
var _ = require('lodash');
var request = require('request');
var async = require('async');
var childProcess = require('child_process');
var extractZip = require('extract-zip');

var API_URL = 'https://ffbinaries.com/api/v1';

var LOCAL_CACHE_DIR = path.join(os.homedir() + '/.ffbinaries-cache');
var RUNTIME_CACHE = {};
var errorMsgs = {
  connectionIssues: 'Couldn\'t connect to ffbinaries.com API. Check your Internet connection.',
  parsingVersionData: 'Couldn\'t parse retrieved version data. Try "ffbinaries clearcache".',
  parsingVersionList: 'Couldn\'t parse the list of available versions. Try "ffbinaries clearcache".',
  notFound: 'Requested data not found.',
  incorrectVersionParam: '"version" parameter must be a string.'
};

function ensureDirSync(dir) {
  try {
    fse.accessSync(dir);
  } catch (e) {
    fse.mkdirSync(dir);
  }
}

ensureDirSync(LOCAL_CACHE_DIR);

/**
 * Resolves the platform key based on input string
 */
function resolvePlatform(input) {
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
function detectPlatform(osinfo) {
  var inputIsValid = typeof osinfo === 'object' && typeof osinfo.type === 'string' && typeof osinfo.arch === 'string';
  var type = (inputIsValid ? osinfo.type : os.type()).toLowerCase();
  var arch = (inputIsValid ? osinfo.arch : os.arch()).toLowerCase();

  if (type === 'darwin') {
    return 'osx-64';
  }

  if (type === 'windows_nt') {
    return arch === 'x64' ? 'windows-64' : 'windows-32';
  }

  if (type === 'linux') {
    if (arch === 'arm' || arch === 'arm64') {
      return 'linux-armel';
    }
    return arch === 'x64' ? 'linux-64' : 'linux-32';
  }

  return null;
}
/**
 * Gets the binary filename (appends exe in Windows)
 *
 * @param {string} component "ffmpeg", "ffplay", "ffprobe" or "ffserver"
 * @param {platform} platform "ffmpeg", "ffplay", "ffprobe" or "ffserver"
 */
function getBinaryFilename(component, platform) {
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
  if (RUNTIME_CACHE.versionsAll) {
    return callback(null, RUNTIME_CACHE.versionsAll);
  }
  request({ url: API_URL }, function (err, response, body) {
    if (err) {
      return callback(errorMsgs.connectionIssues);
    }

    var parsed;

    try {
      parsed = JSON.parse(body.toString());
    } catch (e) {
      return callback(errorMsgs.parsingVersionList);
    }

    var versionsAll = Object.keys(parsed.versions);
    RUNTIME_CACHE.versionsAll = versionsAll;
    return callback(null, versionsAll);
  });
}
/**
 * Gets full data set from ffbinaries.com
 */
function getVersionData(version, callback) {
  if (RUNTIME_CACHE[version]) {
    return callback(null, RUNTIME_CACHE[version]);
  }

  if (version && typeof version !== 'string') {
    return callback(errorMsgs.incorrectVersionParam);
  }

  var url = version ? '/version/' + version : '/latest';

  request({ url: API_URL + url }, function (err, response, body) {
    if (err) {
      return callback(errorMsgs.connectionIssues);
    }

    if (body === '404') {
      return callback(errorMsgs.notFound);
    }

    var parsed;

    try {
      parsed = JSON.parse(body.toString());
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
function downloadUrls(components, urls, opts, callback) {
  var destinationDir = opts.destination;
  var results = [];
  var remappedUrls;

  if (components && !Array.isArray(components)) {
    components = [components];
  }

  // returns an array of objects like this: {component: 'ffmpeg', url: 'https://...'}
  if (typeof urls === 'object') {
    remappedUrls = _.map(urls, function (v, k) {
      return (!components || components && !Array.isArray(components) || components && Array.isArray(components) && components.indexOf(k) !== -1) ? { component: k, url: v } : null;
    });
    remappedUrls = _.compact(remappedUrls);
  }


  function extractZipToDestination(zipFilename, cb) {
    var oldpath = path.join(LOCAL_CACHE_DIR, zipFilename);
    extractZip(oldpath, { dir: destinationDir, defaultFileMode: parseInt('744', 8) }, cb);
  }


  async.each(remappedUrls, function (urlObject, cb) {
    if (!urlObject || !urlObject.url || !urlObject.component) {
      return cb();
    }

    var url = urlObject.url;

    var zipFilename = url.split('/').pop();
    var binFilenameBase = urlObject.component;
    var binFilename = getBinaryFilename(binFilenameBase, opts.platform || detectPlatform());
    var runningTotal = 0;
    var totalFilesize;
    var interval;

    if (typeof opts.tickerFn === 'function') {
      opts.tickerInterval = parseInt(opts.tickerInterval, 10);
      var tickerInterval = (!Number.isNaN(opts.tickerInterval)) ? opts.tickerInterval : 1000;
      var tickData = { filename: zipFilename, progress: 0 };

      // Schedule next ticks
      interval = setInterval(function () {
        if (totalFilesize && runningTotal == totalFilesize) {
          return clearInterval(interval);
        }
        tickData.progress = totalFilesize > -1 ? runningTotal / totalFilesize : 0;

        opts.tickerFn(tickData);
      }, tickerInterval);
    }

    try {
      if (opts.force) {
        throw new Error('Force mode specified - will overwrite existing binaries in target location');
      }

      // Check if file already exists in target directory
      var binPath = path.join(destinationDir, binFilename);
      fse.accessSync(binPath);
      // if the accessSync method doesn't throw we know the binary already exists
      results.push({
        filename: binFilename,
        path: destinationDir,
        status: 'File exists',
        code: 'FILE_EXISTS'
      });
      clearInterval(interval);
      return cb();
    } catch (errBinExists) {
      var zipPath = path.join(LOCAL_CACHE_DIR, zipFilename);

      // If there's no binary then check if the zip file is already in cache
      try {
        fse.accessSync(zipPath);
        results.push({
          filename: binFilename,
          path: destinationDir,
          status: 'File extracted to destination (archive found in cache)',
          code: 'DONE_FROM_CACHE'
        });
        clearInterval(interval);
        return extractZipToDestination(zipFilename, cb);
      } catch (errZipExists) {
        // If zip is not cached then download it and store in cache
        if (opts.quiet) clearInterval(interval);

        var cacheFileTempName = zipPath + '.part';
        var cacheFileFinalName = zipPath;

        request({ url: url }, function () {
          results.push({
            filename: binFilename,
            path: destinationDir,
            size: Math.floor(totalFilesize / 1024 / 1024 * 1000) / 1000 + 'MB',
            status: 'File extracted to destination (downloaded from "' + url + '")',
            code: 'DONE_CLEAN'
          });

          fse.renameSync(cacheFileTempName, cacheFileFinalName);
          extractZipToDestination(zipFilename, cb);
        })
          .on('response', function (response) {
            totalFilesize = response.headers['content-length'];
          })
          .on('data', function (data) {
            runningTotal += data.length;
          })
          .pipe(fse.createWriteStream(cacheFileTempName));
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
function downloadBinaries(components, opts, callback) {
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
  ensureDirSync(opts.destination);

  getVersionData(opts.version, function (err, data) {
    var urls = _.get(data, 'bin.' + platform);
    if (err || !urls) {
      return callback(err || 'No URLs!');
    }

    downloadUrls(components, urls, opts, callback);
  });
}

/**
 * Checks the specified directory for existing copies of requested binaries.
 * Also checks in PATH in case the binaries are already available on the machine.
 *
 * Returns the first match - provided paths will take precedence over env paths.
 * Setting ensureExecutable option to true will run "chmod +x" on the file if needed.
 *
 * @param {array} components Components to look for (ffmpeg/ffplay/ffprobe/ffserver)
 * @param {object} opts { paths: [], ensureExecutable: bool }
 */
function locateBinariesSync(components, opts) {
  if (typeof components === 'string') {
    components = [components];
  }

  opts = opts || {};

  if (typeof opts.paths === 'string') {
    opts.paths = [opts.paths];
  }

  if (!Array.isArray(opts.paths)) {
    opts.paths = [];
  }

  var rtn = {};
  var suggestedPaths = opts.paths;
  var systemPaths = process.env.PATH.split(path.delimiter);
  var allPaths = _.concat(suggestedPaths, systemPaths);

  _.each(components, function (comp) {
    var binaryFilename = getBinaryFilename(comp, detectPlatform());
    // look for component's filename in each path

    var result = {
      found: false,
      isExecutable: false,
      isSystem: false,
      path: null,
      version: null
    };

    // scan paths to find the currently checked component
    _.each(allPaths, function (currentPath) {
      if (!result.found) {
        var pathToTest = path.join(currentPath, binaryFilename);

        if (fse.existsSync(pathToTest)) {
          result.found = true;
          result.path = pathToTest;

          var isOneOfSuggested = suggestedPaths.some(p => p === currentPath);

          if (!isOneOfSuggested) {
            result.isSystem = true;
          }

          // check if file is executable
          try {
            fse.accessSync(pathToTest, fse.constants.X_OK);
            result.isExecutable = true;
          } catch (err) {
            result.isExecutable = false;
            result.version = 'error';
          }
        }
      }
    });

    // isExecutable will always be true on Windows
    if (result.found && !result.isExecutable && opts.ensureExecutable) {
      try {
        childProcess.execSync('chmod +x ' + result.path);
        result.isExecutable = true;
      } catch (err) {}
    }

    // check version
    if (result.found && result.isExecutable) {
      var stdout = childProcess.spawnSync(result.path, ['-version']).stdout;
      // if stdout.length === 0, then we must have stderr instead
      if (stdout && stdout.length) {
        result.version = stdout.toString().split(' ')[2];
      }
    }

    rtn[comp] = result;
  });

  return rtn;
}

function clearCache() {
  fse.emptyDirSync(LOCAL_CACHE_DIR);
}

module.exports = {
  downloadBinaries: downloadBinaries,
  downloadFiles: downloadBinaries,
  locateBinariesSync: locateBinariesSync,
  getVersionData: getVersionData,
  listVersions: listVersions,
  listPlatforms: listPlatforms,
  detectPlatform: detectPlatform,
  resolvePlatform: resolvePlatform,
  getBinaryFilename: getBinaryFilename,
  clearCache: clearCache
};
