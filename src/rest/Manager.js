const { endpoints } = require('../client/constants'),
      Request = require('Request'),
      RequestHandler = require('RequestHandler'),
      Collection = require('@discordjs/collection');
class Manager {
	constructor(client) {
		this.client = client;
		this.handlers = new Collection();
	}
	request(method, url, options = {}) {
		const request = new Request(this, method, url, options);
		let handler = (this.handlers.has(request.route)) ? this.handlers.get(request.route) : new RequestHandler(this);
		
		if (!handler)
			this.handlers.set(request.route, handler);
		
		return handler.push(request);
	}
}
exports.RestManager = Manager;
