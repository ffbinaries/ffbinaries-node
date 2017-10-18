# ffbinaries downloader

[![NPM Version][npm-img]][npm-url]
[![NPM Downloads][npm-dl-img]][npm-url]
[![Build status][circle-img]][circle-url]
[![Coveralls coverage][coveralls-img]][coveralls-url]

[npm-url]: https://npmjs.org/package/ffbinaries
[npm-img]: https://img.shields.io/npm/v/ffbinaries.svg
[npm-dl-img]: https://img.shields.io/npm/dm/ffbinaries.svg
[circle-img]: https://img.shields.io/circleci/project/github/vot/ffbinaries-node/master.svg
[circle-url]: https://circleci.com/gh/vot/ffbinaries-node/tree/master
[coveralls-img]: https://img.shields.io/coveralls/vot/ffbinaries-node.svg
[coveralls-url]: https://coveralls.io/github/vot/ffbinaries-node


Downloads precompiled **ffmpeg, ffprobe, ffplay and ffserver binaries**
from [ffbinaries.com](http://ffbinaries.com).

This module is cross-platform and can be used through CLI or as a Node module,
(either as a build step or in a postinstall script).


**Version 1.0.0**

* Updated syntax
* Added unit tests
* Improved error handling
* Various small fixes


**Version 1.0.1**

* Added linter to ensure consistent code
* Added Coveralls integration
* Increased unit test coverage


**Version 1.0.2**

* Improved support for incomplete arguments in downloadFiles
* Added `getBinaryFilename(component, platform)`


**Version 1.0.3**

* Preventing storage of incomplete archives in cache
* Added status codes in `downloadFiles` method result


## Reporting issues

If you're experiencing issues please update to the newest version and run `ffbinaries clearcache`.

If that doesn't resolve it simply
[raise an issue on GitHub](https://github.com/vot/ffbinaries-node/issues).

Make sure to include the information about which version you're using,
platform, the exact commands you're trying to execute and the output.


## New syntax

*New syntax got introduced in 1.0.0.*

With the new syntax binaries to download are specified first (i.e. `ffmpeg` or `ffplay`).
Platform is now a flag.

This change applies to both [command line interface](#cli)
and [programmatical usage](#programmatically).

You can see the
[old syntax documented in v0.1.8](https://github.com/vot/ffbinaries-node/blob/ccad244c9fb64e2d90a9c788bf3a726f9df15f10/readme.md#usage).


# Usage

You can run it from your code or through CLI.

If `output` argument is specified the binary will be placed there.
It will default to current working directory.

If `platform` argument is missing then the current platform will be automatically
detected and binaries for it will be downloaded.

If `components` argument is missing then binaries of all available components
will be downloaded (see [Included components](#included-components) section).


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


## Programmatically

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

ffbinaries.downloadFiles(function () {
  console.log('Downloaded all binaries for current platform.');
});
```

**Download only ffmpeg and ffprobe, version 3.2 for 64-bit Linux, quiet output, save binaries in a specified location**

```
var ffbinaries = require('ffbinaries');
var dest = __dirname + '/binaries';

ffbinaries.downloadFiles(['ffmpeg', 'ffprobe'], {platform: 'linux-64', quiet: true, destination: dest}, function () {
  console.log('Downloaded ffplay and ffprobe binaries for linux-64 to ' + dest + '.');
});
```

[See more examples](https://github.com/vot/ffbinaries-node/tree/master/examples).


# Platforms

The following platform codes are available:

**windows-32** (aliases: win, windows, win-32), **windows-64** (alias: win-64)

**linux-32** (alias: linux), **linux-64**, **linux-armhf** (alias: linux-arm), **linux-armel**

**osx-64** (aliases: mac, osx, mac-64)

You can use aliases as your platform code argument in both CLI and programmatically.


# Included components

|          | Mac | Linux | Windows |
|----------|-----|-------|---------|
| ffmpeg   | v   | v     | v       |
| ffprobe  | v   | v     | v       |
| ffserver | v   | v     |         |
| ffplay   | v   | v*    | v       |

(* Only linux-32 and linux-64 builds of ffplay are currently available)


## Source of binaries

The API providing data to the module is located at [ffbinaries.com](http://ffbinaries.com).
The code is located in [ffbinaries-api repo](https://github.com/vot/ffbinaries-api).

The binaries are hosted on GitHub as releases of [ffbinaries-prebuilt repo](https://github.com/vot/ffbinaries-prebuilt/releases).


## Contributing

If you'd like to contribute to this project have a look at
[contributing.md file](https://github.com/vot/ffbinaries-node/blob/master/contributing.md)
for more information (including basic guidelines and a list of TODOs).
