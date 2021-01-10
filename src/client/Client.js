const Base = require("./Base")
class Client extends Base {
	constructor(options) {
		if (typeof options == "undefined")
			options = {};
		super(options);
		let ProcessData = process.env;
		try {
			data = require('worker_threads').workerData || data;
		} catch {};
	};
}
