require("setimmediate");
const eventEmitter = require("events"),
	{ DefaultClientOptions } = require("./constants");

class Base extends eventEmitter {
	constructor(options) {
		super()
		if (typeof options == "undefined")
			options = {};
		this.options = options;
	}
}
module.exports = Base;
