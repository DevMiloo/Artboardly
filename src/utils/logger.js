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

	error(message) {
		if (message instanceof Error) {
			console.error(`${colors.red(`[${this.origin}] [ERROR]`)}`, message.stack);
		} else {
			console.error(`${colors.red(`[${this.origin}] [ERROR]`)} ${message}`);
		}
	}
}

module.exports = Logger;
