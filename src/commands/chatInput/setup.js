const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	MessageFlags,
	TextDisplayBuilder,
} = require("discord.js");
const { ArtBoardConfig } = require("../../dbFunctions.js");
const { buildDashboardPage } = require("../../ui/dashboardView.js");
const { handleDashboardComponent } = require("../../handlers/dashboardActions.js");

module.exports = {
	register_command: new SlashCommandBuilder()
		.setName("dashboard")
		.setDescription("Open the Artboardly settings dashboard")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

	async execute({ interaction, client }) {
		let config = await ArtBoardConfig.findOne({ where: { server_id: interaction.guild.id } });
		if (!config) {
			config = await ArtBoardConfig.create({
				server_id: interaction.guild.id,
				artchannels: [],
				emoji: "⭐",
				delete_previous: false,
				post_interval: "weekly",
				post_day: "Sunday",
				post_time: "12:00",
			});
		}

		const state = { tab: "channels" };

		await interaction.reply({
			components: [buildDashboardPage(state.tab, config, interaction.guild)],
			flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
		});

		const responseMessage = await interaction.fetchReply();

		const collector = responseMessage.createMessageComponentCollector({ time: 600_000 });
		const reactioncollector = responseMessage.createReactionCollector({ time: 600_000 });

		reactioncollector.on("collect", async (reaction, user) => {
			const emoji = reaction.emoji.name;
			await config.update({ emoji: emoji });
			await responseMessage.edit({
				components: [buildDashboardPage(state.tab, config, interaction.guild)],
			});

			await reaction.users.remove(user.id).catch(() => {});
		});

		collector.on("collect", async (i) => {
			try {
				await handleDashboardComponent(i, state, config, client);
			} catch (err) {
				console.error("Dashboard interaction error:", err);
				if (!i.replied && !i.deferred) {
					await i
						.reply({
							content: "Something went wrong updating the dashboard.",
							flags: MessageFlags.Ephemeral,
						})
						.catch(() => {});
				}
			}
		});

		collector.on("end", async () => {
			const expired = new TextDisplayBuilder().setContent(
				"-# This dashboard has expired. Run `/dashboard` again to continue editing.",
			);
			await interaction.editReply({ components: [expired] }).catch(() => null);
		});
	},
};
