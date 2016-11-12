var os = require('os');
var fs = require('fs');
var _get = require('lodash.get');
var request = require('request');

var DATA_URL = 'http://ffbinaries.com/';
var DESTINATION = __dirname + '/bin';
var DATA_CACHE;

function ensureDirSync (dir) {
  try {
    fs.accessSync(dir);
  } catch (e) {
    fs.mkdirSync(dir);
  }
}

ensureDirSync(DESTINATION);

/**
 * Platforms
 * windows-32, windows-64, linux-32, linux-64, linux-armhf, linux-armel, osx-64
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

  return;
}

function getData (callback) {
  if (DATA_CACHE) {
    return callback(null, DATA_CACHE);
  }

  request({url: DATA_URL}, function (err, response, body) {
    try {
      var parsed = JSON.parse(body.toString());
      DATA_CACHE = parsed;
      return callback(null, parsed);
    } catch (e) {
      console.log(e);
      return process.exit(1);
      // return callback(e);
    }
  });
}

function downloadFile (url, destination, callback) {
  var filename = url.split('/').pop();
  var runningTotal = 0;
  var totalFilesize;
  var percentage = 0;

  var interval = setInterval(function () {
    if (totalFilesize && runningTotal == totalFilesize) {
      return clearInterval(interval);
    }
    console.log('Received ' + Math.floor(runningTotal/1024*100)/100 + 'KB');

  }, 2000);

  // check if file already exists
  try {
    fs.accessSync(destination + '/' + filename);
    console.log('File already downloaded.');
    clearInterval(interval);
  } catch (e) {
    console.log(e);
    console.log('Downloading', filename, 'to', destination);
    request({url: url}, function (err, response, body) {
      totalFilesize = response.headers['content-length'];
      console.log('Data received. Total filesize: ', Math.floor(totalFilesize/1024*100)/100 + 'KB');

      fs.writeFileSync(destination + '/' + filename, body);
      return callback(err, body);
    })
    .on('data', function (data) {
      runningTotal += data.length;
    });
  }
}

function getBinary (platform, callback) {
  if (!callback && typeof platform === 'function') {
    callback = platform;
    platform = null;
  }

  platform = platform || detectPlatform();

  getData(function (err, data) {
    var dest = DESTINATION + '/' + platform;
    var binaryURL = _get(data, 'bin.' + platform);

    if (!binaryURL) {
      return console.log('No binaryURL!');
    }
    ensureDirSync(dest);
    downloadFile(binaryURL, dest, callback)
  });
}

module.exports = getBinary;
