var os = require('os');
var ffbinaries = require('./index');

var platform = ffbinaries.detectPlatform();
var dest = os.tmpdir() + '/ffbinaries-test';
console.log('Detected platform:', platform);

ffbinaries.downloadFiles({components: ['ffplay'], quiet: true}, function () {
  console.log('all done');
});

ffbinaries.downloadFiles({components: ['ffmpeg'], quiet: true, destination: dest}, function () {
  console.log('all done');
});

ffbinaries.downloadFiles('win-64', {components: ['ffprobe'], quiet: true, destination: dest}, function () {
  console.log('all done');
});
