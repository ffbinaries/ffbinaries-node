var expect = require('chai').expect;
var spawn = require('child_process').spawn;
var os = require('os');
var fs = require('fs-extra');

var LOCAL_CACHE_DIR = os.homedir() + '/.ffbinaries-cache';


describe('ffbinaries CLI', function() {
  describe('commands', function() {
    it('help works', function(done) {
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
  });
});
