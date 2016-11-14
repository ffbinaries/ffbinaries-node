# ffbinaries downloader

[![NPM Version][npm-img]][npm-url]
[![NPM Downloads][npm-dl-img]][npm-url]

[npm-url]: https://npmjs.org/package/ffbinaries
[npm-img]: https://img.shields.io/npm/v/ffbinaries.svg
[npm-dl-img]: https://img.shields.io/npm/dm/ffbinaries.svg


Downloads a precompiled ffmpeg binaries from http://ffbinaries.com.

This module is meant to be used programatically, i.e. as a build step.


# Important info: project status

**This project is getting more stable now that it reached 0.1.0. It's the minimum version you should be running.**

In version 0.1.0 the binaries are downloaded, cached and then unzipped to the correct location.

All the features documented should be working at this point.
If you're experiencing issues please update to the newest version and run `ffbinaries clearcache`.

If documentation is slightly inaccurate please refer to the code for more details
and suggest updates to documentation.

Please raise issues or pull requests for features you'd like to see on GitHub: https://github.com/vot/ffbinaries-node.


## ffbinaries.com API

http://ffbinaries.com service isn't mature either so there still may be
some changes in data structure (unlikely but giving you a heads up just in case).

Currently the only version of ffmpeg available is 3.2.

The API service is running this application: https://github.com/vot/ffbinaries-api


# Usage

You can run it from your code or through CLI.

If `output` argument is specified the binary will be placed there.
In CLI it will default to current working directory.
Programatically the default is `bin/{platform}` folder inside of your copy of ffbinaries.

If `platform` argument is missing then binaries for current platform will be downloaded.

If `components` argument is missing then binaries of all available components will be downloaded.


## CLI

When installed globally with `npm i ffbinaries -g` this module will register
itself on command line interface.

### Arguments

CLI uses the following syntax: `ffbinaries [platform] [--components] [--output] [--quiet]`

### Examples

```
ffbinaries
ffbinaries mac
ffbinaries win-64 --quiet --components=ffplay
ffbinaries linux-64 -q --v=3.2 --c=ffmpeg,ffprobe --output=/home/user/ffmpeg
```

There are also `ffbinaries help`, `ffbinaries versions` and `ffbinaries clearcache`.


## Programatically

### Methods

`ffbinaries` library exports the following methods:

* `downloadFiles(platform, output, callback)` downloads and extracts the requested binaries.

* `getVersionData(version, callback)` fetches the full data set without downloading any binaries.

* `listVersions(callback)` returns the list of available versions from the API

* `listPlatforms()` returns the list of available platforms

* `detectPlatform()` returns the platform code of the machine as detected by the module.

* `resolvePlatform(input)` resolves input to a platform code (matches aliases).

* `clearCache()` purges local cache


### Example

```
var ffbinaries = require('ffbinaries');
var platform = ffbinaries.detectPlatform();
var output = __dirname;
ffbinaries.downloadFiles(platform, output, function () {
  console.log('Download complete.');
});
```


# Platforms

Platform is the first argument. The following builds are available.

## Windows
* windows-32 (aliases: win, windows, win-32)
* windows-64 (alias: win-64)

## Linux
* linux-32 (alias: linux)
* linux-64
* linux-armhf (alias: linux-arm)
* linux-armel

## OS X
* osx-64 (aliases: mac, osx, mac-64)


# Components

The components of the ffmpeg suite are: ffmpeg, ffprobe, ffserver and ffplay.

|          | Mac | Linux | Windows |
|----------|-----|-------|---------|
| ffmpeg   | v   | v     | v       |
| ffprobe  | v   | v     | v       |
| ffserver | v   | v     |         |
| ffplay   | v   |       | v       |
