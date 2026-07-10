const colors = require("colors/safe");

class Logger {
	constructor(origin) {
		this.origin = origin;
	}
	info(message) {
		console.log(`${colors.cyan(`[${this.origin}] [INFO]`)} ${message}`);
	}

	success(message) {
		console.log(`${colors.green(`[${this.origin}] [SUCCESS]`)} ${message}`);
	}

	warn(message) {
		console.warn(`${colors.yellow(`[${this.origin}] [WARN]`)} ${message}`);
	}

	error(...args) {
		const prefix = `${colors.red(`[${this.origin}] [ERROR]`)}`;

		const formattedArgs = args.map((arg) => {
			if (arg instanceof Error) {
				return arg.stack;
			}
			if (typeof arg === "object" && arg !== null) {
				return JSON.stringify(arg, null, 2);
			}
			return arg;
		});

		console.error(prefix, ...formattedArgs);
	}
}

module.exports = Logger;
