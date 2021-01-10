class DiscordError extends Error {
	constructor(path, error, method, status) {
		super();
		const flattened = this.constructor.flattenErrors(error.errors || error).join('\n');
		this.name = 'DiscordAPIError';
		this.message = error.message && flattened ? `${error.message}\n${flattened}` : error.message || flattened;
		this.method = method;
		this.path = path;
		this.code = error.code;
		this.httpStatus = status;
	}
	static flattenErrors(obj, key = '') {
		let messages = [];
		for (const [k, v] of Object.entries(obj)) {
			if (k === 'message')
				continue;
			const newKey = key ? (isNaN(k) ? `${key}.${k}` : `${key}[${k}]`) : k;
		
			if (v._errors)
				messages.push(`${newKey}: ${v._errors.map(e => e.message).join(' ')}`);
			else if (v.code || v.message)
				messages.push(`${v.code ? `${v.code}: ` : ''}${v.message}`.trim());
			else if (typeof v === 'string')
				messages.push(v);
			else
				messages = messages.concat(this.flattenErrors(v, newKey));
		}
		return messages;
	}
}

module.exports = DiscordError;
