const https = require("https"),
	AbortController = require("abort-controller"),
	fetch = require("node-fetch");
class Request {
	constructor(rest, method, path, options) {
		this.rest = rest;
		this.client = rest.client;
		this.method = method;
		this.route = options.route;
		this.options = options;
		this.retries = 0;

		let queryString = "";

		if (options.query)
			queryString = new URLSearchParams(
				Object.entries(options.query)
					.filter(
						([, value]) =>
							![
								null,
								"null",
								"undefined"
							].includes(value) &&
							typeof value !==
								"undefined"
					)
					.flatMap(([key, value]) =>
						Array.isArray(value)
							? value.map((v) => [
									key,
									v
							  ])
							: [[key, value]]
					)
			).toString();

		this.path = `${path}${queryString && `?${queryString}`}`;
	}
	create() {
		const url = `${this.client.options.http.api}/v8${this.path}`;
		let headers = {},
			body;

		if (this.options.auth)
			headers.Authorization = this.rest.getAuth();
		if (this.options.reason)
			headers["X-Audit-Log-Reason"] = encodeURIComponent(
				this.options.reason
			);
		if (this.options.headers)
			headers = Object.assign(headers, this.options.headers);
		if (this.options.files && this.options.files.length) {
			body = new FormData();
			for (const file of this.options.files)
				if (file && file.file)
					body.append(
						file.name,
						file.file,
						file.name
					);
			if (typeof this.options.data !== "undefined")
				body.append(
					"payload_json",
					JSON.stringify(this.options.data)
				);
			headers = Object.assign(headers, body.getHeaders());
		} else if (this.options.data != null)
			body = JSON.stringify(this.options.data);
		headers["Content-Type"] = "application/json";
		const controller = new AbortController(),
			timeout = this.client.setTimeout(
				() => controller.abort(),
				this.client.options.restRequestTimeout
			);
		return fetch(url, {
			method: this.method,
			headers,
			agent,
			body,
			signal: controller.signal
		}).finally(() => this.client.clearTimeout(timeout));
	}
}
module.exports = Request;
