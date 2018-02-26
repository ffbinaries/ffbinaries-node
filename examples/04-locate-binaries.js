/**
 * This example will execute the basic programmatical usage
 * of ffbinaries downloader module.
 */

var ffbinaries = require('..');

/**
 * Downloading all binaries for the platform on which the application is executed.
 */
function locate() {
  var results = ffbinaries.locateBinaries(['ffmpeg', 'ffplay', 'ffprobe'], {additionalPaths: [__dirname, __dirname + '/bin'] });
  console.log(results);
}

locate();
