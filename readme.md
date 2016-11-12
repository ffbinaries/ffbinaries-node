Downloads a precompiled binaries from ffmpeg suite for target platform.

This is meant to be used programatically.

# Usage

``
var ffbinaries = require('ffbinaries');

ffbinaries('windows-64', function () {
  console.log('Download complete.');
});
``

# Platforms

The first argument is platform/package to download. OS X suite is available
in individually packaged components which currently require downloading
each needed component separately.

* windows-32
* windows-64
* linux-32
* linux-64
* linux-armhf
* linux-armel
* osx-64.ffmpeg
* osx-64.ffprobe
* osx-64.ffserver
* osx-64.ffplay

# Components

The components of the ffmpeg suite are: ffmpeg, ffprobe, ffserver and ffplay.

OS X version ships in individually packaged components. Linux and Windows ship in bundles.

## Linux bundle contents

* ffmpeg
* ffprobe
* ffserver

## Windows bundle contents

* ffmpeg
* ffprobe
* ffplay

# Credits

Binaries compiled by:

* OS X version: [https://evermeet.cx/ffmpeg/](https://evermeet.cx/ffmpeg/)
* Linux version: [http://johnvansickle.com/ffmpeg/](http://johnvansickle.com/ffmpeg/)
* Windows version: [http://ffmpeg.zeranoe.com/builds/](http://ffmpeg.zeranoe.com/builds/)

# Online documentation

* [ffmpeg](http://ffmpeg.org/ffmpeg.html)
* [ffplay](http://ffmpeg.org/ffplay.html)
* [ffprobe](http://ffmpeg.org/ffprobe.html)
* [ffserver](http://ffmpeg.org/ffserver.html)
