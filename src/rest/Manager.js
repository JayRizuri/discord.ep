const { endpoints } = require('../client/constants'),
      Request = require('./Request'),
      RequestHandler = require('./RequestHandler'),
      Collection = require('@discordjs/collection'),
      router = require('./Router');
class Manager {
	constructor(client) {
		this.client = client;
		this.handlers = new Collection();
		this.hasVersion = true;
		this.globalTimeout = null;
		if (client.options.restSweepInterval > 0)
			client.setInterval(() => {
				this.handlers.sweep(handler => handler._inactive);
			}, client.options.restSweepInterval * 1000);
	}
	get api() {
		return router(this);
	}
	
	getAuth() {
		const token = this.client.token || this.client.accessToken;
		if (token)
			return `BOT ${token}`; // --- Only Accept Bot Tokens (self-botting is bad)
		throw new Error('TOKEN_MISSING');
	}
	
	get cdn() {
		return endpoints.CDN(this.client.options.http.cdn);
	}
	
	request(method, url, options = {}) {
		const request = new Request(this, method, url, options);
		let handler = (this.handlers.has(request.route)) ? this.handlers.get(request.route) : new RequestHandler(this);
		
		if (!handler)
			this.handlers.set(request.route, handler);
		
		return handler.push(request);
	}
	
	get endpoint() {
		return this.client.options.http.api;
	}

	set endpoint(endpoint) {
		this.client.options.http.api = endpoint;
	}
}
exports.RestManager = Manager;
