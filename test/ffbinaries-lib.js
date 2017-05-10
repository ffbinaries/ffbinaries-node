var expect = require('chai').expect;
var ffbinaries = require('..');
var os = require('os');
var fs = require('fs-extra');

var LOCAL_CACHE_DIR = os.homedir() + '/.ffbinaries-cache';

describe('ffbinaries library', function() {
  describe('detectPlatform', function() {
    it('should autodetect platform successfully', function() {
      var platform = ffbinaries.detectPlatform();
      expect(typeof platform).to.equal('string');
    });

    it('should return null when no matches found', function() {
      var osinfo = {type: 'potato', arch: 'golden'}
      var platform = ffbinaries.detectPlatform(osinfo);
      expect(platform).to.equal(null);
    });

    it('should detect Mac OS X (64 bit)', function() {
      var osinfo = {type: 'darwin', arch: 'x64'}
      var platform = ffbinaries.detectPlatform(osinfo);
      expect(platform).to.equal('osx-64');
    });

    it('should detect Windows (32 bit)', function() {
      var osinfo = {type: 'windows_nt', arch: 'anything'}
      var platform = ffbinaries.detectPlatform(osinfo);
      expect(platform).to.equal('windows-32');
    });

    it('should detect Windows (64 bit)', function() {
      var osinfo = {type: 'windows_nt', arch: 'x64'}
      var platform = ffbinaries.detectPlatform(osinfo);
      expect(platform).to.equal('windows-64');
    });

    it('should detect Linux (32 bit)', function() {
      var osinfo = {type: 'linux', arch: 'anything'}
      var platform = ffbinaries.detectPlatform(osinfo);
      expect(platform).to.equal('linux-32');
    });

    it('should detect Linux (64 bit)', function() {
      var osinfo = {type: 'linux', arch: 'x64'}
      var platform = ffbinaries.detectPlatform(osinfo);
      expect(platform).to.equal('linux-64');
    });

    it('should detect Linux (ARM)', function() {
      var osinfo = {type: 'linux', arch: 'arm'}
      var platform = ffbinaries.detectPlatform(osinfo);
      expect(platform).to.equal('linux-armel');
    });
  });

  describe('resolvePlatform', function() {
    it('empty platform should return null', function() {
      var resolved = ffbinaries.resolvePlatform();
      expect(resolved).to.deep.equal(null);
    });

    it('should resolve all aliases', function() {
      var map = {
        'mac': 'osx-64',
        'osx': 'osx-64',
        'mac-64': 'osx-64',
        'osx-64': 'osx-64',
        'linux': 'linux-32',
        'linux-32': 'linux-32',
        'linux-64': 'linux-64',
        'linux-arm': 'linux-armel',
        'linux-armel': 'linux-armel',
        'linux-armhf': 'linux-armhf',
        'win': 'windows-32',
        'win-32': 'windows-32',
        'windows': 'windows-32',
        'windows-32': 'windows-32',
        'win-64': 'windows-64',
        'windows-64': 'windows-64'
      };

      Object.keys(map).forEach(function (i) {
        if (i) {
          expect(ffbinaries.resolvePlatform(i)).to.equal(map[i]);
        }
      });
    });
  });

  describe('listPlatforms', function() {
    it('should return 7 platforms in an array', function() {
      var platforms = ffbinaries.listPlatforms();
      expect(Array.isArray(platforms)).to.equal(true);
      expect(platforms.length).to.equal(7);
    });
  });

  describe('listVersions', function() {
    it('should return at least "latest" and "3.2"', function(done) {
      ffbinaries.listVersions(function (err, data) {
        expect(data.indexOf('latest') === -1).to.equal(false);
        expect(data.indexOf('3.2') === -1).to.equal(false);
        return done();
      });
    });
  });

  describe('getVersionData', function() {
    it('should return a correct response for "latest"', function(done) {
      ffbinaries.getVersionData('latest', function (err, data) {
        expect(data.version).to.exist;
        expect(data.permalink).to.exist;
        expect(Object.keys(data.bin)).to.not.be.empty;

        return done();
      });
    });

    it('should throw an error for non-existent versions', function(done) {
      ffbinaries.getVersionData('potato', function (err, data) {
        expect(err).to.be.ok;

        return done();
      });
    });

    it('should throw an error for non-string values', function(done) {
      ffbinaries.getVersionData(false, function (err, data) {
        expect(err).to.be.ok;

        return done();
      });
    });
  });

  describe('downloadFiles (this will take a while)', function() {
    // beforeEach(function wait(done){
    //   this.timeout(5000);
    //   console.log('      (waiting for 3 seconds before a download call)');
    //   setTimeout(function () {
    //     done();
    //   }, 3000);
    // });

    it('should download a single file', function(done) {
      this.timeout(120000);
      var dest = __dirname + '/binaries';
      var tickerFn = function () {};
      var tickerInterval = function () {};

      ffbinaries.downloadFiles('ffplay', {platform: ffbinaries.detectPlatform(), quiet: true, destination: dest, tickerFn: tickerFn, tickerInterval: tickerInterval}, function (err, data) {
        expect(err).to.equal(null);
        expect(data.length).to.equal(1);
        expect(data[0].filename).to.exist;

        return done();
      });
    });

    it('should download multiple components', function(done) {
      this.timeout(120000);
      ffbinaries.downloadFiles(['ffplay', 'ffprobe'], function (err, data) {
        expect(err).to.equal(null);
        expect(data.length).to.equal(2);
        expect(data[0].filename).to.exist;
        expect(data[1].filename).to.exist;

        return done();
      });
    });

    it('should download all components if none are specified', function(done) {
      this.timeout(120000);
      ffbinaries.downloadFiles(function (err, data) {
        expect(err).to.equal(null);
        expect(data.length).to.be.at.least(3);
        expect(data[0].filename).to.exist;
        expect(data[1].filename).to.exist;
        expect(data[2].filename).to.exist;

        return done();
      });
    });

    it('should use cache for repeat requests', function(done) {
      this.timeout(3000);
      var dest = __dirname + '/binaries';

      ffbinaries.downloadFiles('ffprobe', {quiet: true, destination: dest}, function (err, data) {
        expect(err).to.equal(null);
        expect(data.length).to.equal(1);
        expect(data[0].filename).to.exist;
        expect(data[0].status.endsWith('(archive found in cache)')).to.be.ok;

        return done();
      });
    });

    // it('should inform of existing file', function(done) {
    //   this.timeout(3000);
    //   var dest = __dirname + '/binaries';
    //
    //   ffbinaries.downloadFiles('ffplay', {quiet: true, destination: dest}, function (err, data) {
    //     expect(err).to.equal(null);
    //     expect(data.length).to.equal(1);
    //     expect(data[0].filename).to.exist;
    //     expect(data[0].status.endsWith('exists')).to.be.ok;
    //
    //     return done();
    //   });
    // });


  });

  describe('clearCache', function() {
    it('should leave .ffbinaries-cache empty', function() {
      ffbinaries.clearCache();
      var exists = fs.existsSync(LOCAL_CACHE_DIR);
      expect(exists).to.equal(false);
    });
  });
});
