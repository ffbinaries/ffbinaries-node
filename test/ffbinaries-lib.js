var expect = require('chai').expect;
var ffbinaries = require('..');
var os = require('os');
var fs = require('fs-extra');

var LOCAL_CACHE_DIR = os.homedir() + '/.ffbinaries-cache';

describe('ffbinaries library', function() {
  describe('detectPlatform', function() {
    it('should return a string', function() {
      var platform = ffbinaries.detectPlatform();
      expect(typeof platform).to.equal('string');
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
        expect(ffbinaries.resolvePlatform(i)).to.equal(map[i]);
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
  });

  describe('downloadFiles (this can take a moment)', function() {
    it('should download a file', function(done) {
      var dest = __dirname + '/binaries';

      ffbinaries.downloadFiles('ffplay', {platform: 'win-64', quiet: true, destination: dest}, function (err, data) {
        expect(err).to.equal(null);
        expect(data.length).to.equal(1);
        expect(data[0].filename).to.exist;

        return done();
      });
    }).timeout(120000);
  });

  describe('clearCache', function() {
    it('should leave .ffbinaries-cache empty', function() {
      ffbinaries.clearCache();
      var exists = fs.existsSync(LOCAL_CACHE_DIR);
      expect(exists).to.equal(false);
    });
  });
});
