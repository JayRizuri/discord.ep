const { endpoints } = require('../client/constants')
class Manager {
	constructor(client) {
		this.client = client;
	}
}
exports.RestManager = Manager;
