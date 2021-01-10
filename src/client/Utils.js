const fetch = require('node-fetch'),
	  has = (o, k) => Object.prototype.hasOwnProperty.call(o, k),
	  isObject = d => typeof d === 'object' && d !== null;
class Utils {
	constructor() {
		throw new Error(`The ${this.constructor.name} class may not be instantiated.`);
	}
	
	
	static mergeDefault(def, given) {
		if (!given)
			return def;
		for (const key in def) 
			if (!has(given, key) || given[key] === undefined)
				given[key] = def[key];
			else if (given[key] === Object(given[key]))
				given[key] = Util.mergeDefault(def[key], given[key]);
		return given;
	}
	
	static wait(ms) {
    		return new Promise(resolve => {
			setTimeout(resolve, ms);
		});
	}
}
module.exports = Utils;
