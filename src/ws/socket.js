exports.WebSocket = (exports.browser = typeof window !== 'undefined') ? window.WebSocket : require('ws');

exports.create = (gateway, query = {}, ...args) => {
  const [
    g,
    q
  ] = gateway.split('?');
  
  query.encoding = exports.encoding;
  query = new URLSearchParams(query);
  
  if (q) new URLSearchParams(q)
    .forEach(
      (v, k) => query.set(k, v));
  
  const ws = new exports.WebSocket(`${g}?${query}`, ...args);
  if (browser) ws.binaryType = 'arraybuffer';
  return ws;
};

for (const state of [
  'CONNECTING',
  'OPEN',
  'CLOSING',
  'CLOSED'])
  exports[
    state
  ] = exports.WebSocket[
    state
  ];
