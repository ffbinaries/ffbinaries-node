/**
 * This example will execute the basic programmatical usage
 * of ffbinaries downloader module.
 */

// in your code you should replace this line with
// var ffbinaries = require('ffbinaries');
var ffbinaries = require('..');

/**
 * Locates ffmpeg, ffplay and ffprobe binaries for the platform on which it's executed.
 *
 * Outputs something like this:
 * {
 *   ffmpeg:
 *    { found: true,
 *      isExecutable: true,
 *      path: '/home/user/ffbinaries-node/examples/ffmpeg',
 *      version: '3.4' },
 *   ffplay:
 *    { found: false,
 *      isExecutable: false,
 *      path: null,
 *      version: null },
 *   ffprobe:
 *    { found: true,
 *      isExecutable: false,
 *      path: '/home/user/ffbinaries-node/examples/ffprobe',
 *      version: 'error' }
 * }
 */

function locate() {
  var results = ffbinaries.locateBinariesSync(['ffmpeg', 'ffplay', 'ffprobe'], { paths: [__dirname], ensureExecutable: true });
  console.log(results);
}

locate();
