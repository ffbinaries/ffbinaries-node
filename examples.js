var ffbinaries = require('./index');

ffbinaries('osx-64.ffplay', function () {
  console.log('Downloaded ffplay for OS X.');
});

ffbinaries('windows-32', function () {
  console.log('Downloaded FFMPEG for Windows (32 bit).');
});
