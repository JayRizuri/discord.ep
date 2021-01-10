require("setimmediate");
const eventEmitter = require("events"),
	{ DefaultClientOptions } = require("./constants");

class Base extends eventEmitter {
	constructor() {
	
	}
}
module.exports = Base;
