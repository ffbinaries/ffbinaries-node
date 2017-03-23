/**
 * This example will show you how to get the available versions
 * of ffmpeg components available through the API.
 */

var ffbinaries = require('..');

ffbinaries.listVersions(function (err, data) {
  if (err) {
    return console.log('error', err);
  }

  console.log('data', data);
});
