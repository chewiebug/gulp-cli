'use strict';

var expect = require('expect');
var runner = require('gulp-test-tools').gulpRunner;
var eraseTime = require('gulp-test-tools').eraseTime;
var path = require('path');
var Server = require('proxy-server');

describe('flag: --verify', function() {

  it('dependencies with invalid dependency', function(done) {
    runner({ verbose: false })
      .gulp('--verify invalid-package.json', '--cwd ./test/fixtures/packages/')
      .run(cb);

    function cb(err, stdout, stderr) {
      expect(err).toNotEqual(null);
      expect(stderr).toEqual('');
      stdout = eraseTime(stdout);
      expect(stdout).toEqual(
        'Verifying plugins in ' +
          path.resolve('./test/fixtures/packages/invalid-package.json') +
          '\n' +
        'Blacklisted plugins found in this project:\n' +
        'gulp-blink: deprecated. use `blink` instead.\n' +
        ''
      );
      done();
    }
  });

  it('dependencies with valid dependency', function(done) {
    runner({ verbose: false })
      .gulp('--verify valid-package.json', '--cwd ./test/fixtures/packages/')
      .run(cb);

    function cb(err, stdout, stderr) {
      expect(err).toEqual(null);
      expect(stderr).toEqual('');
      stdout = eraseTime(stdout);
      expect(stdout).toEqual(
        'Verifying plugins in ' +
          path.resolve('./test/fixtures/packages/valid-package.json') +
          '\n' +
        'There are no blacklisted plugins in this project\n' +
        ''
      );
      done(err);
    }
  });

  it('default args with invalid dependency', function(done) {
    runner({ verbose: false })
      .gulp('--verify', '--cwd ./test/fixtures/packages/')
      .run(cb);

    function cb(err, stdout, stderr) {
      expect(err).toNotEqual(null);
      expect(stderr).toEqual('');
      stdout = eraseTime(stdout);
      expect(stdout).toEqual(
        'Verifying plugins in ' +
          path.resolve('./test/fixtures/packages/package.json') + '\n' +
        'Blacklisted plugins found in this project:\n' +
        'gulp-blink: deprecated. use `blink` instead.\n' +
        ''
      );
      done();
    }
  });

  it.only('proxy: dependencies with valid dependency', function(done) {
    this.timeout(5000);
    process.env.NODE_DEBUG = 'tunnel';
    var server = createProxyServer();
    server.on('listening', function (servers) {
      console.log('flags-verify, proxy: inside listening');
      testProxyImplementation(function (err, stdout, stderr) {
        server.close();

        expect(err).toEqual(null);
        expect(stderr).toEqual('');
        stdout = eraseTime(stdout);
        expect(stdout).toEqual(
          'Verifying plugins in ' +
            path.resolve('./test/fixtures/packages/valid-package.json') +
          '\n' +
          'There are no blacklisted plugins in this project\n' +
          ''
        );
        done(err);
      });
      });
  });

  it('proxy: proxy server not reachable', function(done) {
    testProxyImplementation(function (err, stdout, stderr) {
      var errorMessage = eraseTime(err.message);
      console.log('errorMessage', errorMessage);


      stderr = eraseTime(stderr);
      expect(stderr).toEqual('Error: failed to retrieve plugins black-list\n'
        + 'connect ECONNREFUSED 127.0.0.1:8888\n');
      expect(err).toEqual('{ [ "Error. command failed"] }');
      expect(stdout).toEqual('');
      done(err);
    });
  });

  function testProxyImplementation(cb) {
    process.env.http_proxy = 'http://localhost:8888';
    runner({ verbose: false })
      .gulp('--verify valid-package.json', '--cwd ./test/fixtures/packages/')
      .run(cb);
  }

  function createProxyServer() {

    var server = new Server({
      // create-servers options
      http: 8881,
      target: 'https://gulpjs.com'
    });

    // Startup errors from `create-servers`
    server.on('error', function (err) {
      console.error(err);
    });

    server.on('listening', function (servers) {
      console.log('listening!');
    });

    return server;
  }

});
