const fetch = require('node-fetch'),
	  has = (o, k) => Object.prototype.hasOwnProperty.call(o, k),
	  isObject = d => typeof d === 'object' && d !== null;
class Utils {
	constructor() {
		throw new Error(`The ${this.constructor.name} class may not be instantiated.`);
	}
	static delayFor(ms) {
    	return new Promise(resolve => {
			setTimeout(resolve, ms);
		});
	}
}
module.exports = Utils;
