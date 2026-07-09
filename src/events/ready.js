const { Events } = require("discord.js");
const { initDatabase } = require("../dbFunctions.js");
const log = new require("../utils/logger.js");
const logger = new log("ready");
module.exports = {
	event: Events.ClientReady,
	type: "once",
	async call(client) {
		await initDatabase();
		logger.success(`Ready! Logged in as ${client.user.tag}`);
	},
};
