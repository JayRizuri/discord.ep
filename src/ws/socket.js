
exports.WebSocket = (exports.browser = typeof window !== 'undefined') ? window.WebSocket : require('ws');
