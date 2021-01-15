const Base = require("./Base");
class Client extends Base {
	constructor(options) {
		if (typeof options === "undefined") options = {};
		super(options);
		let ProcessData = process.env;
		try {
			let data =
				require("worker_threads").workerData ||
				ProcessData;
		} catch (e) {
			console.error(e);
		}
	}
}
module.exports = Client;
