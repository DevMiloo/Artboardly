const { Events } = require("discord.js");
const { ArtBoardConfig } = require("../dbFunctions.js");

module.exports = {
	event: Events.MessageCreate,
	type: "on",
	async call(_client, message) {
		if (message.attachments.size === 0) return;

		if (message.author.bot) return;

		if (!message.guild) return;

		const config = await ArtBoardConfig.findOne({ where: { server_id: message.guild.id } });
		if (!config?.artchannels) return;

		const channels = config.artchannels;
		if (!channels?.includes(message.channel.id)) return;

		if (config?.emoji) await message.react(config.emoji);
	},
};
