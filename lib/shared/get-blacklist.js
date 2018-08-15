'use strict';

var https = require('https');

var concat = require('concat-stream');

var ProxyAgent = require('proxy-agent');

// HTTP, HTTPS, or SOCKS proxy to use
var proxyUri = process.env.http_proxy || process.env.https_proxy;

var url = 'https://gulpjs.com/plugins/blackList.json';

var opts = {
  method: 'GET',
  host: 'gulpjs.com',
  path: url,
  // this is the important part!
  agent: proxyUri !== undefined ? new ProxyAgent(proxyUri) : undefined,
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
  console.log('get-blacklist, getBlacklist, starting');
  https.get(opts, onRequest)
    .on('error', function(error) {
      console.log('get-blacklist, getBlacklist, onError', error);
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
