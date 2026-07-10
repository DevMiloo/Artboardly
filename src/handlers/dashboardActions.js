const {
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	StringSelectMenuBuilder,
	LabelBuilder,
	TextInputStyle,
	MessageFlags,
} = require("discord.js");
const { buildDashboardPage } = require("../ui/dashboardView.js");
const { resetleaderboard } = require("../artleaderboardweek.js");

async function rerender(i, state, config) {
	await i.update({ components: [buildDashboardPage(state.tab, config, i.guild)] });
}

async function handleDashboardComponent(i, state, config, client) {
	switch (i.customId) {
		case "db_navigation":
			state.tab = i.values[0];
			return rerender(i, state, config);

		case "db_set_output":
			await config.update({ artleaderboardchannel: i.values[0] });
			return rerender(i, state, config);

		case "db_set_artchannels":
			await config.update({ artchannels: i.values });
			return rerender(i, state, config);

		case "db_role_top3":
			console.log("Selected top3 role:", i.values[0]);
			await config.update({ top3_role: i.values[0] || null });
			return rerender(i, state, config);

		case "db_role_n1":
			await config.update({ n1_role: i.values[0] || null });
			return rerender(i, state, config);

		case "db_role_n2":
			await config.update({ n2_role: i.values[0] || null });
			return rerender(i, state, config);

		case "db_role_n3":
			await config.update({ n3_role: i.values[0] || null });
			return rerender(i, state, config);

		case "db_toggle_delete":
			await config.update({ delete_previous: !config.delete_previous });
			return rerender(i, state, config);

		case "db_trigger_emoji_modal":
			return openEmojiModal(i, state, config);

		case "db_trigger_schedule_modal":
			return openScheduleModal(i, state, config);

		case "db_force_post":
			resetleaderboard(i.guild, client);
			return i.reply({
				content: "Manually triggered leaderboard",
				flags: MessageFlags.Ephemeral,
			});

		default:
			return;
	}
}

async function openEmojiModal(i, state, config) {
	const modal = new ModalBuilder().setCustomId("m_emoji_raw").setTitle("Set voting emoji");
	const input = new TextInputBuilder()
		.setCustomId("m_emoji_input")
		.setLabel("Emoji (unicode or custom Discord format)")
		.setValue(config.emoji || "⭐")
		.setStyle(TextInputStyle.Short)
		.setRequired(true);

	modal.addComponents(new ActionRowBuilder().addComponents(input));
	await i.showModal(modal);

	const submitted = await i.awaitModalSubmit({ time: 60_000 }).catch(() => null);
	if (!submitted) return;

	await config.update({ emoji: submitted.fields.getTextInputValue("m_emoji_input") });
	await submitted.update({ components: [buildDashboardPage(state.tab, config, submitted.guild)] });
}

async function openScheduleModal(i, state, config) {
	const modal = new ModalBuilder().setCustomId("m_sched_raw").setTitle("Set posting schedule");

	const intervalInput = new StringSelectMenuBuilder()
		.setCustomId("m_int_input")
		.setPlaceholder("Select posting interval")
		.addOptions(
			[
				{ label: "Weekly", value: "weekly" },
				{ label: "Biweekly", value: "biweekly" },
				{ label: "Monthly", value: "monthly" },
			].map((option) => ({
				...option,
				default: option.value === config.post_interval,
			})),
		);

	const selectLabelComponent = new LabelBuilder()
		.setLabel("Interval (e.g. weekly, biweekly, monthly)")
		.setStringSelectMenuComponent(intervalInput);

	const dayInput = new StringSelectMenuBuilder()
		.setCustomId("m_day_input")
		.setPlaceholder("Select day of the week")
		.addOptions(
			["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => ({
				label: day,
				value: day.toLowerCase(),
				default: day.toLowerCase() === config.post_day.toLowerCase(),
			})),
		);

	const selectDayLabelComponent = new LabelBuilder()
		.setLabel("Day of the week for posting")
		.setStringSelectMenuComponent(dayInput);

	const timeInput = new TextInputBuilder()
		.setCustomId("m_time_input")
		.setLabel("UTC Time (24-hour format HH:MM)")
		.setValue(config.post_time)
		.setMaxLength(5)
		.setStyle(TextInputStyle.Short);

	modal.addLabelComponents(selectLabelComponent);
	modal.addLabelComponents(selectDayLabelComponent);
	modal.addComponents(new ActionRowBuilder().addComponents(timeInput));

	await i.showModal(modal);

	const submitted = await i.awaitModalSubmit({ time: 60_000 }).catch(() => null);
	if (!submitted) return;

	await config.update({
		post_interval: submitted.fields.getStringSelectValues("m_int_input")[0],
		post_day: submitted.fields.getStringSelectValues("m_day_input")[0],
		post_time: submitted.fields.getTextInputValue("m_time_input"),
	});
	await submitted.update({ components: [buildDashboardPage(state.tab, config, submitted.guild)] });
}

module.exports = { handleDashboardComponent };
