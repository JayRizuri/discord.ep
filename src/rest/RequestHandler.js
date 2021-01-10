class RequestHandler {
	constructor(manager) {
		this.manager = manager;
		this.queue = new AsyncQueue();
		this.reset = -1;
		this.remaining = -1;
		this.limit = -1;
		this.retryAfter = -1;
	}
}
module.exports = RequestHandler;
