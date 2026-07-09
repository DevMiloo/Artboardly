const { MessageFlags, SlashCommandBuilder } = require("discord.js");

module.exports = {
	register_command: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Displays all commands available to you!"),
	async execute({ interaction }) {
		return interaction.reply({
			content: `This is still a work in progress!`,
			flags: MessageFlags.Ephemeral,
		});
	},
};
