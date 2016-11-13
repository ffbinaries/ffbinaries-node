var os = require('os');
var fse = require('fs-extra');
var path = require('path');
var _get = require('lodash.get');
var _map = require('lodash.map');
var request = require('request');
var async = require('async');

var API_URL = 'http://ffbinaries.com/api';
// var API_URL = 'http://localhost:3000/api';
var LOCAL_BIN = __dirname + '/bin';
var LOCAL_CACHE_DIR = os.homedir() + '/.ffbinaries-cache';
var CWD = process.cwd();
var RUNTIME_CACHE = {};

function _ensureDirSync (dir) {
  try {
    fse.accessSync(dir);
  } catch (e) {
    fse.mkdirSync(dir);
  }
}

_ensureDirSync(LOCAL_BIN);
_ensureDirSync(LOCAL_CACHE_DIR);

/**
 * Resolves the platform key based on input string
 */
function resolvePlatform (input) {
  switch (input) {
    case 'mac':
    case 'osx':
    case 'mac-64':
    case 'osx-64':
        return 'osx-64';
        break;

    case 'linux':
    case 'linux-32':
        return 'linux-32';
        break;

    case 'linux-64':
        return 'linux-64';
        break;

    case 'linux-arm':
    case 'linux-armel':
        return 'linux-armel';
        break;

    case 'linux-armhf':
        return 'linux-armhf';
        break;

    case 'win':
    case 'win-32':
    case 'windows':
    case 'windows-32':
        return 'windows-32';
        break;

    case 'win-64':
    case 'windows-64':
        return 'windows-64';
        break;

    default:
        return null;
  }
}
/**
 * Detects the platform of the machine the script is executed on
 */
function detectPlatform () {
  var type = os.type();
  var arch = os.arch();

  if (type === 'Darwin') {
    return 'osx-64';
  }

  if (type === 'Windows_NT') {
    return arch == 'x64' ? 'windows-64' : 'windows-32';
  }

  if (type === 'Linux') {
    if (arch === 'arm' || arch === 'arm64') {
      return 'linux-armel';
    }
    return arch == 'x64' ? 'linux-64' : 'linux-32';
  }

  return null;
}

function listPlatforms() {
  return ['osx-64', 'linux-32', 'linux-64', 'linux-armel', 'linux-armhf', 'windows-32', 'windows-64'];
}

function listVersions(callback) {
  if (RUNTIME_CACHE['versions']) {
    return callback(null, RUNTIME_CACHE['versions']);
  }
  request({url: API_URL + '/versions'}, function (err, response, body) {
    try {
      var parsed = JSON.parse(body.toString());
      RUNTIME_CACHE['versions'] = Object.keys(parsed);
      return callback(null, Object.keys(parsed));
    } catch (e) {
      console.log(e);
      return process.exit(1);
      // return callback(e);
    }
  });
}
/**
 * Gets full data set from ffbinaries.com
 */
function getVersionData (version, callback) {
  if (RUNTIME_CACHE[version]) {
    return callback(null, RUNTIME_CACHE[version]);
  }

  if (typeof version !== 'string') {
    version = false;
  }

  var url = version ? '/version/' + version : '/latest';

  console.log('Getting version data:', version || 'latest');
  console.log('------------------------------------');

  request({url: API_URL + url}, function (err, response, body) {
    try {
      var parsed = JSON.parse(body.toString());
      RUNTIME_CACHE[version] = parsed;
      return callback(null, parsed);
    } catch (e) {
      console.log(e);
      return process.exit(1);
      // return callback(e);
    }
  });
}

/**
 * Download file(s) and save them in the specified directory
 */
function _downloadUrls (urls, opts, callback) {
  if (typeof urls === 'object') {
    urls = _map(urls, function (v) {return v;})
  } else if (typeof urls === 'string') {
    urls = [urls];
  }

  var destinationDir = opts.destination;
  var cacheDir = LOCAL_CACHE_DIR;

  function _copyFileFromCacheToDestination (filename) {
    var oldpath = LOCAL_CACHE_DIR + '/' + filename;
    var newpath = destinationDir + '/' + filename;

    try {
      fse.copySync(oldpath, newpath);
      console.log('Copied "' + filename + '" to destination')
    } catch (err) {
      console.log('Error copying "' + filename + '" to "' + destinationDir + '"');
      console.error(err);
    }
  }


  async.each(urls, function (url, cb) {
    if (!url) {
      return cb();
    }
    var filename = url.split('/').pop();
    var runningTotal = 0;
    var totalFilesize;

    var interval = setInterval(function () {
      if (totalFilesize && runningTotal == totalFilesize) {
        return clearInterval(interval);
      }
      console.log('\x1b[2m' + filename + ': Received ' + Math.floor(runningTotal/1024/1024*1000)/1000 + 'MB' + '\x1b[0m');
    }, 2000);

    // Check if file already downloaded in target directory
    try {
      fse.accessSync(destinationDir + '/' + filename);
      console.log('File "' + filename + '" already downloaded in ' + destinationDir + '.');
      clearInterval(interval);
      return cb();
    } catch (e) {
      // Check if the file is already cached
      try {
        fse.accessSync(LOCAL_CACHE_DIR + '/' + filename);
        console.log('Found "' + filename + '" in cache.');
        clearInterval(interval);
        _copyFileFromCacheToDestination(filename);
        return cb();
      } catch (e) {
        // Download the file and write in cache
        if (opts.quiet) clearInterval(interval);

        console.log('Downloading', url);
        request({url: url}, function (err, response, body) {
          totalFilesize = response.headers['content-length'];
          console.log('> Download completed: ' + url + ' | Transferred: ', Math.floor(totalFilesize/1024/1024*1000)/1000 + 'MB');

          // fse.writeFileSync(LOCAL_CACHE_DIR + '/' + filename, body);
          // rename from .part to normal
          fse.move(LOCAL_CACHE_DIR + '/' + filename + '.part', LOCAL_CACHE_DIR + '/' + filename);
          _copyFileFromCacheToDestination(filename);
          return cb(err);
        })
        .on('data', function (data) {
          runningTotal += data.length;
        })
        .pipe(fse.createWriteStream(LOCAL_CACHE_DIR + '/' + filename + '.part'));
      }

    }

  }, function () {
    return callback();
  })

}

/**
 * Gets binaries for the platform
 * It will get the data from ffbinaries, pick the correct files
 * and save it to the specified directory
 */
function downloadFiles (platform, opts, callback) {
  console.log('------------------------------------');
  console.log('Directories');
  console.log(' LOCAL_BIN:', LOCAL_BIN);
  console.log(' LOCAL_CACHE_DIR:', LOCAL_CACHE_DIR);
  console.log(' CWD:', CWD);
  console.log('------------------------------------');


  if (!callback) {
    if (!opts && typeof platform === 'function') {
      callback = platform;
      platform = null;
    }
    if (typeof opts === 'function') {
      callback = opts;
      opts = null;
    }
  }

  platform = resolvePlatform(platform) || detectPlatform();
  opts.destination = path.resolve(opts.destination) || (LOCAL_BIN + '/' + platform);

  _ensureDirSync(opts.destination);

  getVersionData(opts.version, function (err, data) {
    var versionUrls = _get(data, 'bin.' + platform);
    if (!versionUrls) {
      return console.log('No versionUrls!');
    }

    _downloadUrls(versionUrls, opts, callback);
  });
}


function clearCache () {
  if (LOCAL_CACHE_DIR.endsWith('.ffbinaries-cache')) {
    fse.removeSync(LOCAL_CACHE_DIR);
    console.log('Cache cleared');
  }
}

module.exports = {
  downloadFiles: downloadFiles,
  getVersionData: getVersionData,
  listVersions: listVersions,
  listPlatforms: listPlatforms,
  detectPlatform: detectPlatform,
  resolvePlatform: resolvePlatform,
  clearCache: clearCache
};
