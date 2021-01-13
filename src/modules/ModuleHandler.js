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
		
		try {
			let moduleDir = fs.readdirSync(`${this.options.dir}${moduleName}`);
			
			if (moduleDir.indexOf("module.json") == -1)
				throw new ReferenceError(`The module info file could not be found...`);
			
		}
	}
}
