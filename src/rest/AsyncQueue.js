class AsyncQueue {
	constructor() {
    	this.promises = [];
	}
	get remaining() {
		return this.promises.length;
	}
	wait() {
		const next = this.promises.length ? this.promises[this.promises.length - 1].promise : Promise.resolve();
		let resolve;
		const promise = new Promise(res => {
			resolve = res;
		});
		this.promises.push({
			resolve,
			promise,
		});
		return next;
	}
	shift() {
		const deferred = this.promises.shift();
		if (typeof deferred !== 'undefined') deferred.resolve();
	}
}

module.exports = AsyncQueue;
