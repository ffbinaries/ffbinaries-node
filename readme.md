[![NPM Version][npm-img]][npm-url]
[![NPM Downloads][npm-dl-img]][npm-url]

[npm-url]: https://npmjs.org/package/ffbinaries
[npm-img]: https://img.shields.io/npm/v/ffbinaries.svg
[npm-dl-img]: https://img.shields.io/npm/dm/ffbinaries.svg


Downloads a precompiled ffmpeg binaries from ffbinaries.com.

This module is meant to be used programatically, i.e. as a build step.


# Usage

You can run it from your code or through CLI.

All binaries will be stored in `node_modules/ffbinaries/bin` folder to allow
for caching the files.

If `output` argument is specified the binary will be copied there.

If `platform` argument is missing the binary for current platform will be downloaded.

Currently only archives with binaries are downloaded without
extracting them yet (this will happen in future versions).


## CLI

When installed globally with `npm i ffbinaries -g` this module will register
itself on command line interface.

Examples:

```
ffbinaries
ffbinaries linux-32 --output=/home/user/ffmpeg
```


## Programatically

`ffbinaries` library exports three methods: `get`, `getData` and `detectPlatform`.

`get(platform, output, callback)` method will download the requested binaries.

`getData(callback)` fetches the full data set without downloading any binaries.

`detectPlatform()` returns the platform code of the machine.

Example:

```
var ffbinaries = require('ffbinaries');
var platform = ffbinaries.detectPlatform();
var output = __dirname;
ffbinaries.get(platform, output, function () {
  console.log('Download complete.');
});
```

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

* osx-64

# Components

The components of the ffmpeg suite are: ffmpeg, ffprobe, ffserver and ffplay.

OS X version ships in individually packaged components, Linux and Windows in bundles.

|          | Mac | Linux | Windows |
|----------|-----|-------|---------|
| ffmpeg   | v   | v     | v       |
| ffprobe  | v   | v     | v       |
| ffserver | v   | v     |         |
| ffplay   | v   |       | v       |


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
