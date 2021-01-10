const { WSEvents } = require('../../../client/constants'),
	handlers = {};

for (const name of Object.keys(WSEvents))
	try {
		handlers[name] = require(`./${name}.js`);
	} catch {}

module.exports = handlers;
