require("setimmediate");
const eventEmitter = require("events"),
      { DefaultClientOptions } = require("./constants"),
      Utils = require("./Utils"),
      Manager = require("../rest/Manager");

class Base extends eventEmitter {
	constructor(options) {
		super()
		if (typeof options == "undefined")
			options = {};
		this.options = options;
		this._timeouts = new Set();
		this._intervals = new Set();
		this._immediates = new Set();
		this.options = Utils.mergeDefault(DefaultClientOptions, options);
		this.rest = new Manager(this);
	}
}
module.exports = Base;
