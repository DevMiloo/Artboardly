const {
	MessageFlags,
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");
require("dotenv").config();

module.exports = {
	register_command: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Displays all commands available to you!"),

	async execute({ interaction }) {
		const helpEmbed = new EmbedBuilder()
			.setAuthor({
				name: `${interaction.client.user.username}'s Help command`,
				iconURL: interaction.client.user.displayAvatarURL(),
			})
			.setDescription(
				`The following commands are available to you. For any questions or troubleshooting, feel free to join our [Support server](${process.env.SUPPORT_INVITE})!`,
			)
			.setColor(0x008080)
			.setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
			.addFields(
				{ name: "`/help`", value: "Displays this help message." },
				{ name: "`/dashboard`", value: "Opens the dashboard for configuring the leaderboard." },
				{ name: "`/resetleaderboard`", value: "Resets the leaderboard." },
			);

		const supportButton = new ButtonBuilder()
			.setLabel("Join Support Server")
			.setURL(process.env.SUPPORT_INVITE)
			.setStyle(ButtonStyle.Link)
			.setEmoji("🛠️");

		const row = new ActionRowBuilder().addComponents(supportButton);

		await interaction.reply({
			embeds: [helpEmbed],
			components: [row],
			flags: MessageFlags.Ephemeral,
		});
	},
};
