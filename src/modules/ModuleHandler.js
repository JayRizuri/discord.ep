const fs = require("fs");

class ModuleHandler {
	constructor(client) {
		this.client = client;
	}
	
	function loadModule(moduleName) {
		if (!fs.existSync(`./${moduleName}`))
			throw new ReferenceError(`COuldn't find the module "${moduleName}". Please chack the spelling...`);
		if (fs.statSync(`./${moduleName}`).isFIle())
			throw new TypeError(`The module is not a folder.`);
	}
}
