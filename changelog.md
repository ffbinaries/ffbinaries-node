# ffbinaries changelog

**Version 1.1.5**

* Fixed an issue with paths construction (cross-platform support - thanks to @shpingalet007 for the fix)


**Version 1.1.4**

* Fixed vulnerabilities by updating dependencies
* Updated documentation slightly and moved changelog to a separate file


**Version 1.1.3**

* Updated package dependencies


**Version 1.1.2**

* Updated package metadata


**Version 1.1.1**

* Fixed vulnerabilities by updating dependencies


**Version 1.1.0**

* `tickerFn` returns percentage instead of bytes and is documented


**Version 1.0.9**

* Switched implementation of version checker (`spawn` instead of `exec`)


**Version 1.0.8**

* Added force mode to `downloadBinaries` method
* Returning full version of components in `locateBinariesSync` method


**Version 1.0.7**

* Looking for correct filename in `locateBinariesSync` on Windows
* Fault tolerance + more precise conditions in `locateBinariesSync`


**Version 1.0.6**

* Added `locateBinariesSync` method to look for binaries and check their version
* Changed HTTP to HTTPS in links in readme


**Version 1.0.5**

* Updated dependencies
* Switched API endpoints to HTTPS protocol
* Fixed detection of binaries already existing in destination directory
* Added clean up phase after tests


**Version 1.0.4**

* Fixed `clearCache` method to empty the cache directory instead of removing it
(it used to cause a `ENOENT` error when executed before downloading binaries)


**Version 1.0.3**

* Preventing storage of incomplete archives in cache
* Added status codes in `downloadBinaries` method result


**Version 1.0.2**

* Improved support for incomplete arguments in downloadBinaries
* Added `getBinaryFilename(component, platform)`


**Version 1.0.1**

* Added linter to ensure consistent code
* Added Coveralls integration
* Increased unit test coverage


**Version 1.0.0**

* Updated syntax
* Added unit tests
* Improved error handling
* Various small fixes
