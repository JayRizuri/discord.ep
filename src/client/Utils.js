const fetch = require('node-fetch'),
	  has = (o, k) => Object.prototype.hasOwnProperty.call(o, k),
	  isObject = d => typeof d === 'object' && d !== null;
class Utils {
	constructor() {
		throw new Error(`The ${this.constructor.name} class may not be instantiated.`);
	}
	static flatten(obj, ...props) {
		if (!isObject(obj))
			return obj;
		const objProps = Object.keys(obj)
			.filter(k => !k.startsWith('_'))
			.map(k => ({ [k]: true }));
		props = objProps.length ? Object.assign(...objProps, ...props) : Object.assign({}, ...props);
		const out = {};
		
		for (let [prop, newProp] of Object.entries(props)) {
			if (!newProp)
				continue;
			newProp = newProp === true ? prop : newProp;
			const element = obj[prop],
			      elemIsObj = isObject(element),
			      valueOf = elemIsObj && typeof element.valueOf === 'function' ? element.valueOf() : null;
			if (element instanceof require('@discord.js/Collection'))
				out[newProp] = Array.from(element.keys());
			else if (valueOf instanceof require('./Collection'))
				out[newProp] = Array.from(valueOf.keys());
			else if (Array.isArray(element))
				out[newProp] = element.map(e => Util.flatten(e));
			else if (typeof valueOf !== 'object')
				out[newProp] = valueOf;
			else if (!elemIsObj)
				out[newProp] = element;
		}
		return out;
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
