const fs = require("fs"),
  Collection = require("../Collection");

class ModuleHandler {
  constructor(client, options = {}) {
    let baseOptions = {
      dir: __dirname
    };
    this.client = client;
    this.options = Object.assign(options, baseOptions);
    this.modules = new Collection();
  }

  loadModule(moduleName) {
    if (!fs.existSync(`${this.options.dir}${moduleName}`))
      throw new ReferenceError(
        `Couldn't find the module "${moduleName}". Please chack the spelling...`
      );
    if (fs.statSync(`${this.options.dir}${moduleName}`).isFIle())
      throw new TypeError(`The module is not a folder.`);

    try {
      let moduleDir = fs.readdirSync(`${this.options.dir}${moduleName}`);

      if (moduleDir.indexOf("module.json") == -1)
        throw new ReferenceError(`The module info file could not be found...`);

      let moduleData = require(`${this.options.dir}${moduleName}/module.json`),
        importedData = {
          name: moduleName,
          description: "No description has been provided.",
          main: null,
          version: "0.0.1",
          author: "unknown",
          directory: `${this.options.dir}${moduleName}`
        };

      if (Object.keys(moduleData).indexOf("main") === -1)
        throw new ReferenceError(`The module main file could not be found...`);
      importedData.main = moduleData.main;

      if (Object.keys(moduleData).indexOf("description") !== -1)
        if (moduleData.description.replace(/\s/g, "").length > 0)
          importedData.description = moduleData.description;

      if (Object.keys(moduleData).indexOf("name") !== -1)
        if (moduleData.name.replace(/\s/g, "").length > 0)
          importedData.name = moduleData.name;

      if (Object.keys(moduleData).indexOf("author") !== -1)
        if (moduleData.author.replace(/\s/g, "").length > 0)
          importedData.author = moduleData.author;

      if (Object.keys(moduleData).indexOf("version") !== -1)
        if (moduleData.version.replace(/\s/g, "").length > 0)
          importedData.version = moduleData.version;
      this.modules.set(moduleName, importedData);
    } catch (e) {
      throw e;
    }
  }
}

module.exports = ModuleHandler;
