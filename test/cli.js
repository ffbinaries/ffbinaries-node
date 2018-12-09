var expect = require('chai').expect;
var spawn = require('child_process').spawn;
var os = require('os');
var fs = require('fs-extra');
var glob = require('glob');

var LOCAL_CACHE_DIR = os.homedir() + '/.ffbinaries-cache';


describe('ffbinaries CLI', function () {
  describe('commands', function () {
    it('help works', function (done) {
      var ls = spawn('node', ['./cli.js', 'help']);
      var stdout = [];
      var stderr = [];

      ls.stdout.on('data', (data) => {
        stdout.push(data);
      });

      ls.stderr.on('data', (data) => {
        stderr.push(data);
      });

      ls.on('close', (code) => {
        stdout = stdout.toString();
        expect(stdout).to.be.ok;
        expect(stderr).to.be.empty;
        expect(code).to.equal(0);
        done();
      });
    });

    it('clearcache works', function (done) {
      var ls = spawn('node', ['./cli.js', 'clearcache']);
      var stdout = [];
      var stderr = [];

      ls.stdout.on('data', (data) => {
        stdout.push(data);
      });

      ls.stderr.on('data', (data) => {
        stderr.push(data);
      });

      ls.on('close', (code) => {
        expect(stdout).to.be.ok;
        expect(stderr).to.be.empty;
        expect(code).to.equal(0);

        var dirExists = fs.existsSync(LOCAL_CACHE_DIR);
        var dirContents = glob.sync(LOCAL_CACHE_DIR + '/*.zip');
        expect(dirExists).to.equal(true);
        expect(dirContents.length).to.equal(0);

        done();
      });
    });
  });
});
