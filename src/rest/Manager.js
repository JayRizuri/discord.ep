const { endpoints } = require('../client/constants'),
      Request = require('Request')
class Manager {
	constructor(client) {
		this.client = client;
	}
	request(method, url, options = {}) {
		const apiRequest = new Request(this, method, url, options);
	}
}
exports.RestManager = Manager;
