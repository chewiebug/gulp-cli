'use strict';

var https = require('https');

var concat = require('concat-stream');

var HttpsProxyAgent = require('https-proxy-agent');

var url = 'https://gulpjs.com/plugins/blackList.json';

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

function getOptions(proxyUri) {
  var options = {
    method: 'GET',
    host: 'gulpjs.com',
    path: url,
    agent: proxyUri !== undefined ? new HttpsProxyAgent(proxyUri) : undefined,
  };

  return options;
}

// TODO: Test this impl
function getBlacklist(proxyUri, cb) {
  https.get(getOptions(proxyUri), onRequest)
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
