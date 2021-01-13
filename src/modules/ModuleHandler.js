const fs = require("fs");

class ModuleHandler {
	constructor(client, options = {}) {
		let baseOptions = {
			dir: "./"
		};
		this.client = client;
		this.options = Object.assign(options, baseOptions);
	}
	
	function loadModule(moduleName) {
		if (!fs.existSync(`${this.options.dir}${moduleName}`))
			throw new ReferenceError(`COuldn't find the module "${moduleName}". Please chack the spelling...`);
		if (fs.statSync(`${this.options.dir}${moduleName}`).isFIle())
			throw new TypeError(`The module is not a folder.`);
	}
}
