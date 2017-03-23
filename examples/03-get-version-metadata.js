/**
 * This example will show you how to get the metadata of a specific
 * ffmpeg version.
 */

var ffbinaries = require('..');

ffbinaries.getVersionData('3.2', function (err, data) {
  if (err) {
    return console.log('error', err);
  }

  console.log('data', data);
});
