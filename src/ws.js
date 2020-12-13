'use strict';

const { browser } = require('./utils/c'),
      e = require('erlpack');

var erl,
    decoder;
if (!e.pack) e = null;

if (browser) {
  decoder = window.TextDecoder;
  exports.ws = window.ws;
} else {
  decoder = require('util').TextDecoder;
  exports.ws = require('ws');
}

const ab = new decoder();

exports.encoding = e ? 'etf' : 'json';

exports.pack = e ? e.pack : JSON.stringify;

exports.unpack = (data, type) => {
  if (exports.encoding === 'json' || type === 'json') {
    if (typeof data !== 'string') data = ab.decode(data);
    return JSON.parse(data);
  }
  if (!Buffer.isBuffer(data)) data = Buffer.from(new Uint8Array(data));
  return e.unpack(data);
};

exports.create = (gateway, query = {}, ...args) => {
  const [g, q] = gateway.split('?');
  query.encoding = exports.encoding;
  query = new URLSearchParams(query);
  if (q) new URLSearchParams(q).forEach((v, k) => query.set(k, v));
  
  const socket = new exports.ws(`${g}?${query}`, ...args);
  
  if (browser) socket.binaryType = 'arraybuffer';
  return socket;
};

for (const state of ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED']) {
  exports[state] = exports.ws[state];
}
