var expect = require('chai').expect;
var os = require('os');
var path = require('path');
var fs = require('fs-extra');
var glob = require('glob');
var childProcess = require('child_process');
var _ = require('lodash');

var ffbinaries = require('..');

var LOCAL_CACHE_DIR = os.homedir() + '/.ffbinaries-cache';

function noop() {}

describe('ffbinaries library', function () {
  describe('detectPlatform', function () {
    it('should autodetect platform successfully', function () {
      var platform = ffbinaries.detectPlatform();
      expect(typeof platform).to.equal('string');
    });

    it('should return null when no matches found', function () {
      var osinfo = { type: 'potato', arch: 'golden' };
      var platform = ffbinaries.detectPlatform(osinfo);
      expect(platform).to.equal(null);
    });

    it('should detect Mac OS X (64 bit)', function () {
      var osinfo = { type: 'darwin', arch: 'x64' };
      var platform = ffbinaries.detectPlatform(osinfo);
      expect(platform).to.equal('osx-64');
    });

    it('should detect Windows (32 bit)', function () {
      var osinfo = { type: 'windows_nt', arch: 'anything' };
      var platform = ffbinaries.detectPlatform(osinfo);
      expect(platform).to.equal('windows-32');
    });

    it('should detect Windows (64 bit)', function () {
      var osinfo = { type: 'windows_nt', arch: 'x64' };
      var platform = ffbinaries.detectPlatform(osinfo);
      expect(platform).to.equal('windows-64');
    });

    it('should detect Linux (32 bit)', function () {
      var osinfo = { type: 'linux', arch: 'anything' };
      var platform = ffbinaries.detectPlatform(osinfo);
      expect(platform).to.equal('linux-32');
    });

    it('should detect Linux (64 bit)', function () {
      var osinfo = { type: 'linux', arch: 'x64' };
      var platform = ffbinaries.detectPlatform(osinfo);
      expect(platform).to.equal('linux-64');
    });

    it('should detect Linux (ARM)', function () {
      var osinfo = { type: 'linux', arch: 'arm' };
      var platform = ffbinaries.detectPlatform(osinfo);
      expect(platform).to.equal('linux-armel');
    });

    it('should detect Linux (ARM64)', function () {
      var osinfo = { type: 'linux', arch: 'arm64' };
      var platform = ffbinaries.detectPlatform(osinfo);
      expect(platform).to.equal('linux-arm64');
    });
  });

  describe('resolvePlatform', function () {
    it('empty platform should return null', function () {
      var resolved = ffbinaries.resolvePlatform();
      expect(resolved).to.deep.equal(null);
    });

    it('should resolve all aliases', function () {
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
        'linux-arm64': 'linux-arm64',
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

  describe('getBinaryFilename', function () {
    it('should add ".exe" in windows-32', function () {
      var result = ffbinaries.getBinaryFilename('ffmpeg', 'windows-32');
      expect(result).to.equal('ffmpeg.exe');
    });

    it('should add ".exe" in windows-64', function () {
      var result = ffbinaries.getBinaryFilename('ffserver', 'windows-64');
      expect(result).to.equal('ffserver.exe');
    });

    it('should not add extension in linux', function () {
      var result = ffbinaries.getBinaryFilename('ffprobe', 'linux');
      expect(result).to.equal('ffprobe');
    });

    it('should not add extension in mac', function () {
      var result = ffbinaries.getBinaryFilename('ffplay', 'mac');
      expect(result).to.equal('ffplay');
    });
  });

  describe('listPlatforms', function () {
    it('should return 8 platforms in an array', function () {
      var platforms = ffbinaries.listPlatforms();
      expect(Array.isArray(platforms)).to.equal(true);
      expect(platforms.length).to.equal(8);
    });
  });

  describe('listVersions', function () {
    it('should return at least "latest" and "3.2"', function (done) {
      ffbinaries.listVersions(function (err, data) {
        expect(data.indexOf('latest') === -1).to.equal(false);
        expect(data.indexOf('3.2') === -1).to.equal(false);
        return done();
      });
    });
  });

  describe('getVersionData', function () {
    it('should return a correct response for "latest"', function (done) {
      ffbinaries.getVersionData('latest', function (err, data) {
        expect(data.version).to.exist;
        expect(data.permalink).to.exist;
        expect(Object.keys(data.bin)).to.not.be.empty;

        return done();
      });
    });

    it('should throw an error for non-existent versions', function (done) {
      ffbinaries.getVersionData('potato', function (err) {
        expect(err).to.not.be.null;

        return done();
      });
    });

    it('should throw an error for non-string values', function (done) {
      ffbinaries.getVersionData([1, null, {}], function (err) {
        expect(err).to.be.ok;

        return done();
      });
    });
  });

  describe('clearCache', function () {
    it('should remove contents of ~/.ffbinaries-cache directory', function () {
      ffbinaries.clearCache();
      var dirExists = fs.existsSync(LOCAL_CACHE_DIR);
      var dirContents = glob.sync(LOCAL_CACHE_DIR + '/*.zip');
      expect(dirExists).to.equal(true);
      expect(dirContents.length).to.equal(0);
    });
  });

  describe('downloadBinaries (each test will take a while or time out after 2 minutes)', function () {
    it('should download a single file (ffmpeg@3.2, win-64) with options provided', function (done) {
      this.timeout(120000);
      var dest = path.join(__dirname, '/binaries');

      var options = {
        version: '3.2',
        platform: 'win-64',
        quiet: true,
        destination: dest,
        tickerFn: noop,
        tickerInterval: noop
      };

      ffbinaries.downloadBinaries('ffmpeg', options, function (err, data) {
        expect(err).to.equal(null);
        expect(data.length).to.equal(1);
        expect(data[0].filename).to.exist;

        return done();
      });
    });

    it('should download multiple components without options provided', function (done) {
      this.timeout(120000);
      ffbinaries.downloadBinaries(['ffmpeg', 'ffprobe'], function (err, data) {
        expect(err).to.equal(null);
        expect(data.length).to.equal(2);
        expect(data[0].filename).to.exist;
        expect(data[1].filename).to.exist;

        return done();
      });
    });

    it('should download all components if none are specified', function (done) {
      this.timeout(120000);
      ffbinaries.downloadBinaries(function (err, data) {
        expect(err).to.equal(null);
        expect(data.length).to.be.at.least(2);
        expect(data[0].filename).to.exist;
        expect(data[1].filename).to.exist;

        return done();
      });
    });

    it('should download all components if none are specified and options are provided as first argument', function (done) {
      this.timeout(120000);
      var dest = path.join(__dirname, '/binaries');

      ffbinaries.downloadBinaries({ destination: dest }, function (err, data) {
        expect(err).to.equal(null);
        expect(data.length).to.be.at.least(2);
        expect(data[0].filename).to.exist;
        expect(data[1].filename).to.exist;

        return done();
      });
    });

    it('should use cache for repeat requests', function (done) {
      this.timeout(3000);
      var dest = path.join(__dirname, '/binaries');

      // remove the binaries from earlier tests to fall back to cache
      // target directory will get recreated every time you execute downloadBinaries
      // so it's safe to just remove it
      fs.removeSync(dest);

      ffbinaries.downloadBinaries('ffmpeg', { quiet: true, destination: dest }, function (err, data) {
        expect(err).to.equal(null);
        expect(data.length).to.equal(1);
        expect(data[0].filename).to.exist;
        expect(data[0].code).to.equal('DONE_FROM_CACHE');

        return done();
      });
    });

    it('should indicate an existing file and not do anything', function (done) {
      this.timeout(3000);
      var dest = path.join(__dirname, '/binaries');

      ffbinaries.downloadBinaries('ffmpeg', { quiet: true, destination: dest }, function (err, data) {
        expect(err).to.equal(null);
        expect(data.length).to.equal(1);
        expect(data[0].filename).to.exist;
        expect(data[0].code).to.exist;
        expect(data[0].code).to.equal('FILE_EXISTS');

        return done();
      });
    });

    it('should ignore existing binaries with force option provided', function (done) {
      this.timeout(5000);
      ffbinaries.downloadBinaries('ffmpeg', { force: true }, function (err, data) {
        expect(err).to.equal(null);
        expect(data.length).to.equal(1);
        expect(data[0].filename).to.exist;
        expect(data[0].code).to.exist;
        expect(data[0].code).to.equal('DONE_FROM_CACHE');

        return done();
      });
    });
  });


  describe('locateBinariesSync', function () {
    it('should locate ffmpeg binary in the current dir', function () {
      var result = ffbinaries.locateBinariesSync('ffmpeg', { paths: process.cwd() });
      expect(result.ffmpeg).to.exist;
      expect(result.ffmpeg.found).to.equal(true);
    });

    it('should return version as "error" for a non-executable file', function () {
      if (ffbinaries.detectPlatform().indexOf('windows-') === 0) {
        return;
      }

      childProcess.execSync('chmod -x ' + process.cwd() + '/ffmpeg');

      var result = ffbinaries.locateBinariesSync('ffmpeg', { paths: process.cwd() });
      expect(result.ffmpeg).to.exist;
      expect(result.ffmpeg.found).to.equal(true);
      expect(result.ffmpeg.isExecutable).to.equal(false);
      expect(result.ffmpeg.path).to.exist;
      expect(result.ffmpeg.version).to.equal('error');
    });

    it('should set chmod +x when "ensureExecutable" option is provided', function () {
      // every .exe file is executable on windows
      if (ffbinaries.detectPlatform().indexOf('windows-') === 0) {
        return;
      }

      childProcess.execSync('chmod -x ' + process.cwd() + '/ffmpeg');

      var result = ffbinaries.locateBinariesSync('ffmpeg', { paths: [process.cwd()], ensureExecutable: true });
      expect(result.ffmpeg).to.exist;
      expect(result.ffmpeg.found).to.equal(true);
      expect(result.ffmpeg.isExecutable).to.equal(true);
      expect(result.ffmpeg.path).to.exist;
      expect(result.ffmpeg.version).to.not.equal('error');
    });

    it('should return missing binaries correctly', function () {
      var ffplayPath = path.join(process.cwd(), '/ffplay');

      fs.removeSync(ffplayPath);
      fs.removeSync(ffplayPath + '.exe');

      var result = ffbinaries.locateBinariesSync(['ffmpeg', 'ffplay'], { paths: process.cwd() });
      expect(result.ffmpeg).to.exist;

      if (!result.ffplay.isSystem) {
        expect(result.ffplay).to.exist;
        expect(result.ffplay.found).to.equal(false);
        expect(result.ffplay.isExecutable).to.equal(false);
        expect(result.ffplay.path).to.equal(null);
        expect(result.ffplay.version).to.equal(null);
      }
    });
  });


  after(function () {
    console.log('\nRemoving binaries downloaded by tests...');
    // remove test/binaries directory
    var dest = path.join(__dirname, '/binaries');
    console.log('\x1b[2m- Removing ' + dest + '\x1b[0m');
    fs.removeSync(dest);

    // remove binaries in current working dir
    var removalList = [
      'ffmpeg', 'ffplay', 'ffprobe', 'ffserver',
      'ffmpeg.exe', 'ffplay.exe', 'ffprobe.exe', 'ffserver.exe'
    ];

    _.each(removalList, function (filename) {
      var binPath = path.join(process.cwd(), filename);

      console.log('\x1b[2m- Removing ' + binPath + '\x1b[0m');
      fs.removeSync(binPath);
    });
  });
});
