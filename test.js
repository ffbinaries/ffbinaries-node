var unzip = require('unzip');
var os = require('os');
var fse = require('fs-extra');
var request = require('request');

var TESTDIR = os.homedir() + '/.ffbinaries-cache/test';
var url = 'https://github.com/vot/ffbinaries-prebuilt/releases/download/3.2/ffmpeg-3.2-osx-64.zip';
var archive = TESTDIR + '/ffmpeg-3.2-osx-64.zip';
var dest = TESTDIR;

function _ensureDirSync (dir) {
  try {
    fse.accessSync(dir);
  } catch (e) {
    fse.mkdirSync(dir);
  }
}

_ensureDirSync(TESTDIR);


/***/
function testDownload() {
  request(url).pipe(fse.createWriteStream(archive));
}

/***/
function testUnzip() {

  console.log('Extracting ' + archive + ' to ' + dest);

  var readStream = fse.createReadStream(archive);
  var extractor = unzip.Extract({path: dest});

  extractor.on('close', function () {
    console.log('Finished extracting');
  });

  readStream.pipe(extractor);
}

/**
 * Uncomment tests to execute them.
 * It manually recreates a couple of simple scenarios to troubleshoot problems.
 * First run download and then unzip, one at a time.
 */


// testDownload();
// testUnzip();
