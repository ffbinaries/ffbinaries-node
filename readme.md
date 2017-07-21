# ffbinaries downloader

[![NPM Version][npm-img]][npm-url]
[![NPM Downloads][npm-dl-img]][npm-url]
[![Travis build][travis-img]][travis-url]
[![Coveralls coverage][coveralls-img]][coveralls-url]

[npm-url]: https://npmjs.org/package/ffbinaries
[npm-img]: https://img.shields.io/npm/v/ffbinaries.svg
[npm-dl-img]: https://img.shields.io/npm/dm/ffbinaries.svg
[travis-img]: https://img.shields.io/travis/vot/ffbinaries-node.svg
[travis-url]: https://travis-ci.org/vot/ffbinaries-node
[coveralls-img]: https://img.shields.io/coveralls/vot/ffbinaries-node.svg
[coveralls-url]: https://coveralls.io/github/vot/ffbinaries-node


Downloads precompiled **ffmpeg, ffprobe, ffplay and ffserver binaries** from http://ffbinaries.com.


This module is cross-platform and can be used programatically, i.e. as a build step or in a postinstall script.


# New in version 1.0.0

* **Updated syntax (see note below)**
* **Added unit tests (coverage ~80%)**
* Implemented various small fixes and improved error handling


**Version 1.0.1**

* Added linter to ensure consistent code
* Added Coveralls integration
* Increased unit test coverage (~90%)


**Version 1.0.2**

* Improved support for incomplete arguments in downloadFiles
* Added `getBinaryFilename(component, platform)`


## New syntax

*This syntax is introduced in 1.0.0.*

With the new syntax binaries to download are specified first (i.e. ffmpeg or ffplay),
taking place of the platform argument. Platform has now became a flag.

**CLI usage example:**

```
ffbinaries ffmpeg ffplay -p win-64
```

**Programmatical usage example:**

```
ffbinaries.downloadFiles('ffplay', function (err, data) {
  console.log('Downloaded ' + data[0].filename + '.');
});
```

This change applies to both [command line interface](#cli)
and [programmatical usage](#programatically).

<br />

If you're experiencing issues please update to the newest version and run `ffbinaries clearcache`.

You can see the
[previous syntax documented in v0.1.8](https://github.com/vot/ffbinaries-node/blob/ccad244c9fb64e2d90a9c788bf3a726f9df15f10/readme.md#usage).


# Platforms

The following platform codes are available:

## Windows
**windows-32** (aliases: win, windows, win-32), **windows-64** (alias: win-64)

## Linux
**linux-32** (alias: linux), **linux-64**, **linux-armhf** (alias: linux-arm), **linux-armel**

## OS X
**osx-64** (aliases: mac, osx, mac-64)

You can use aliases as your platform code argument in both CLI and programatically.

# Included components

|          | Mac | Linux | Windows |
|----------|-----|-------|---------|
| ffmpeg   | v   | v     | v       |
| ffprobe  | v   | v     | v       |
| ffserver | v   | v     |         |
| ffplay   | v   | v*    | v       |

(* Only linux-32 and linux-64 builds of ffplay are currently available)

# Usage

You can run it from your code or through CLI.

If `output` argument is specified the binary will be placed there.
In CLI it will default to current working directory.
Programatically the default is the also the working directory.

If `platform` argument is missing then the current platform will be autodected and binaries for it will be downloaded.

If `components` argument is missing then binaries of all available components will be downloaded (see [Included components](#included-components) section).


## CLI

When installed globally with `npm i ffbinaries -g` this module will register
itself on command line interface.

### Arguments

CLI uses the following syntax:

`ffbinaries [components] [--platform] [--output] [--quiet] [--version]`

Each flag can also be abbreviated in your scripts with `-p`, `-o`, `-q` and `-v` respectively.

### Examples

**Download all binaries for your platform**

`ffbinaries`


**Download all binaries for a specified platform**

`ffbinaries -p=mac`


**Download only ffplay for 64-bit Windows, quiet output**

`ffbinaries ffplay -p=win-64 --quiet`


**Download only ffmpeg and ffprobe, version 3.2 for 64-bit Linux, quiet output, save binaries in a specified directory**

`ffbinaries ffmpeg ffprobe -p=linux-64 -q -v=3.2 --output=/usr/local/bin`

**Additional commands**

There are also `ffbinaries help`, `ffbinaries versions` and `ffbinaries clearcache`.


## Programatically

### Methods

`ffbinaries` library exports the following methods:

* `downloadFiles(platform, opts, callback)` downloads and extracts the requested binaries.

  The `opts` parameter is an object that can contain these optional parameters:
  * `destination`: the path where the binaries will be downloaded to. If not provided it will default to `.`.
  * `components`: an array of string values that describes which [components](#included-components) to download. If not provided it will default to all components available for the platform.
  * `version`: version of ffmpeg to download
  * `quiet`: suppress verbose logs

* `getVersionData(version, callback)` fetches the full data set without downloading any binaries.

* `listVersions(callback)` returns the list of available versions from the API

* `listPlatforms()` returns the list of available platforms

* `detectPlatform()` returns the platform code of the machine as detected by the module.

* `resolvePlatform(input)` resolves input to a platform code (matches aliases).

* `getBinaryFilename(component, platform)` resolves a filename of a binary
for a given platform (appends ".exe" in Windows).

* `clearCache()` purges local cache


### Examples

**Download all binaries for your platform**

```
var ffbinaries = require('ffbinaries');
var platform = ffbinaries.detectPlatform();

ffbinaries.downloadFiles(function () {
  console.log('Downloaded all binaries for ' + platform + '.');
});
```

**Download only ffplay for your platform**

```
var ffbinaries = require('ffbinaries');
var platform = ffbinaries.detectPlatform();

ffbinaries.downloadFiles('ffplay', function () {
  console.log('Downloaded ffplay binary for ' + platform + '.');
});
```

**Download only ffmpeg and ffprobe, version 3.2 for 64-bit Linux, quiet output, save binaries in a specified**

```
var ffbinaries = require('ffbinaries');
var dest = __dirname + '/binaries';

ffbinaries.downloadFiles(['ffmpeg', 'ffprobe'], {platform: 'linux-64', quiet: true, destination: dest}, function () {
  console.log('Downloaded ffplay and ffprobe binaries for linux-64 to ' + dest + '.');
});
```

## Data source

The API backend is located at http://ffbinaries.com and is powered by this app: https://github.com/vot/ffbinaries-api

The binaries are hosted on GitHub as releases of https://github.com/vot/ffbinaries-prebuilt repo.


## TODO

* global installs (-g to save globally) <!-- Linux/Mac: /usr/local/bin   Win: C:/ffmpeg -->
* add preference to use JSON cache for offline installs (--prefer-cache)
* [help needed] recompile all binaries (all platforms; with and without proprietary codes)
