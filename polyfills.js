'use strict';

require('es6-object-assign/auto');
var SaferBuffer = require('safer-buffer').Buffer;

if (!Buffer.from) {
  Buffer.from = SaferBuffer.from;
}

