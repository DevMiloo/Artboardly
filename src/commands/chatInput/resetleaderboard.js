const { MessageFlags, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const { resetleaderboard } = require("../../artleaderboardweek.js");

module.exports = {
	register_command: new SlashCommandBuilder()
		.setName("resetleaderboard")
		.setDescription("Resets the leaderboard.")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

	async execute({ interaction }) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		const success = await resetleaderboard(interaction.guild, interaction.client);

		if (success) {
			await interaction.editReply({
				content: "Leaderboard has been reset successfully.",
				flags: MessageFlags.Ephemeral,
			});
		} else {
			await interaction.editReply({
				content:
					"Failed to reset the leaderboard. This could be due to not enough submissions, or an internal error. For more information, join the support server.",
				flags: MessageFlags.Ephemeral,
			});
		}
	},
};
