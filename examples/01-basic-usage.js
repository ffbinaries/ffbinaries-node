/**
 * This example will execute the basic programmatical usage
 * of ffbinaries downloader module.
 */

var ffbinaries = require('..');

/**
 * Downloading all binaries for the platform on which the application is executed.
 */
function example1(callback) {
  var platform = ffbinaries.detectPlatform();

  ffbinaries.downloadFiles(function (err, data) {
    console.log('Downloading binaries for ' + platform + ':');
    console.log('err', err);
    console.log('data', data);
  });
}

/**
 * Downloading all binaries for linux to a specified location
 */
function example2(callback) {
  var dest = __dirname + '/binaries';

  ffbinaries.downloadFiles({ destination: dest, platform: 'linux' }, function (err, data) {
    console.log('Downloading binaries for linux:');
    console.log('err', err);
    console.log('data', data);

    callback(err, data);
  });
}

/**
 * Downloading only ffmpeg binary for win-64 to a specified location
 */
function example3(callback) {
  var dest = __dirname + '/binaries';

  ffbinaries.downloadFiles('ffmpeg', { platform: 'win-64', quiet: true, destination: dest }, function (err, data) {
    console.log('Downloading ffmpeg binary for win-64 to ' + dest + '.');
    console.log('err', err);
    console.log('data', data);

    callback(err, data);
  });
}

/**
 * Downloading ffplay and ffprobe binaries for win-64 to a specified location
 */
function example4(callback) {
  var dest = __dirname + '/binaries';

  ffbinaries.downloadFiles(['ffplay', 'ffprobe'], { platform: 'win-64', quiet: true, destination: dest }, function (err, data) {
    console.log('Downloading ffmpeg binary for win-64 to ' + dest + '.');
    console.log('err', err);
    console.log('data', data);

    callback(err, data);
  });
}


/**
 * Here we'll just execute the first example which is the most common scenario.
 * Swap the "example1" here for a different one to see it executed.
 */
example1(function (err, data) {
  if (err) {
    console.log('Downloads failed.');
  }
  console.log('Downloads successful.');
});
