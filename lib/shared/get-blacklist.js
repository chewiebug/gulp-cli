'use strict';

var https = require('https');

var concat = require('concat-stream');

var tunnel = require('tunnel-agent');

var tunnelingAgent = tunnel.httpsOverHttp({
  proxy: {
    host: '127.0.0.1',
    port: 8888,
  }
});

var proxyUri = process.env.http_proxy || process.env.https_proxy;

var url = 'https://gulpjs.com/plugins/blackList.json';

var opts = {
  method: 'GET',
  host: 'gulpjs.com',
  path: url,
  // agent: proxyUri !== undefined ? tunnelingAgent : undefined,
  agent: tunnelingAgent,
};

function collect(stream, cb) {
  stream.on('error', cb);
  stream.pipe(concat(onSuccess));

  function onSuccess(result) {
    cb(null, result);
  }
}

function parse(str, cb) {
  try {
    cb(null, JSON.parse(str));
  } catch (err) {
    cb(new Error('Invalid Blacklist JSON.'));
  }
}

// TODO: Test this impl
function getBlacklist(cb) {
  https.get(opts, onRequest)
    .on('error', function(error) {
      cb(error);
    });

  function onRequest(res) {
    if (res.statusCode !== 200) {
      // TODO: Test different status codes
      return cb(new Error('Request failed. Status Code: ' + res.statusCode));
    }

    res.setEncoding('utf8');

    collect(res, onCollect);
  }

  function onCollect(err, result) {
    if (err) {
      return cb(err);
    }

    parse(result, onParse);
  }

  function onParse(err, blacklist) {
    if (err) {
      return cb(err);
    }

    cb(null, blacklist);
  }
}

module.exports = getBlacklist;
