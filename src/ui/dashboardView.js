const {
	ContainerBuilder,
	SeparatorSpacingSize,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	ChannelSelectMenuBuilder,
	RoleSelectMenuBuilder,
	ChannelType,
} = require("discord.js");

const { getNextResetDate } = require("../handlers/cronJob.js");

const TABS = {
	channels: { label: "Channels & Emoji", emoji: "📍", accent: 0x008080 },
	roles: { label: "Placement Roles", emoji: "🏆", accent: 0xf1c40f },
	schedule: { label: "Schedule & Automation", emoji: "⏰", accent: 0x800076 },
	actions: { label: "Admin Actions", emoji: "⚡", accent: 0xed4245 },
};

function field(label, value) {
	return `**${label}**\n${value}`;
}

function navigationMenu(activeTab) {
	return new StringSelectMenuBuilder()
		.setCustomId("db_navigation")
		.setPlaceholder("Navigate dashboard panels")
		.addOptions(
			Object.entries(TABS).map(([value, meta]) => ({
				label: meta.label,
				value,
				emoji: meta.emoji,
				default: value === activeTab,
			})),
		);
}

function buildHeader(container, guild) {
	container.addTextDisplayComponents((t) =>
		t.setContent(
			`## Artboardly settings for **${guild.name}**\n> *Use the menu below to switch categories.*`,
		),
	);
}

function divider(container) {
	container.addSeparatorComponents((s) =>
		s.setDivider(true).setSpacing(SeparatorSpacingSize.Small),
	);
}

function buildChannelsTab(container, cfg) {
	container.addTextDisplayComponents((t) =>
		t.setContent(
			field(
				"📤 Leaderboard output channel",
				cfg.artleaderboardchannel ? `<#${cfg.artleaderboardchannel}>` : "⚠️ Not configured",
			),
		),
	);
	container.addActionRowComponents((row) =>
		row.setComponents(
			new ChannelSelectMenuBuilder()
				.setCustomId("db_set_output")
				.setPlaceholder("Select the leaderboard output channel")
				.setChannelTypes(ChannelType.GuildText)
				.setDefaultChannels(cfg.artleaderboardchannel ? [cfg.artleaderboardchannel] : []),
		),
	);

	divider(container);

	container.addTextDisplayComponents((t) =>
		t.setContent(
			field(
				"🖼️ Art channels",
				cfg.artchannels?.length
					? cfg.artchannels.map((id) => `<#${id}>`).join(", ")
					: "⚠️ None configured",
			),
		),
	);
	container.addActionRowComponents((row) =>
		row.setComponents(
			new ChannelSelectMenuBuilder()
				.setCustomId("db_set_artchannels")
				.setPlaceholder("Select tracked art channels (up to 5)")
				.setChannelTypes(ChannelType.GuildText)
				.setMinValues(1)
				.setMaxValues(5)
				.addDefaultChannels(cfg.artchannels || []),
		),
	);

	divider(container);

	container.addTextDisplayComponents((t) =>
		t.setContent(
			field(
				"✨ Voting reaction emoji",
				`React to this message with the emoji you want to use!\n\`current emoji:\` ${cfg.emoji}`,
			),
		),
	);
}

function buildRolesTab(container, cfg) {
	container.addTextDisplayComponents((t) =>
		t.setContent("-# Roles are granted automatically when the weekly leaderboard resets."),
	);
	divider(container);

	const roleFields = [
		{
			label: "🏅 Top 3 role",
			role: cfg.top3_role,
			id: "db_role_top3",
			placeholder: "Set the shared top 3 role",
		},
		{
			label: "🥇 1st place role",
			role: cfg.n1_role,
			id: "db_role_n1",
			placeholder: "Set the 1st place role",
		},
		{
			label: "🥈 2nd place role",
			role: cfg.n2_role,
			id: "db_role_n2",
			placeholder: "Set the 2nd place role",
		},
		{
			label: "🥉 3rd place role",
			role: cfg.n3_role,
			id: "db_role_n3",
			placeholder: "Set the 3rd place role",
		},
	];

	for (const r of roleFields) {
		container.addTextDisplayComponents((t) =>
			t.setContent(field(r.label, r.role ? `<@&${r.role}>` : "Not set")),
		);
		container.addActionRowComponents((row) =>
			row.setComponents(
				new RoleSelectMenuBuilder()
					.setCustomId(r.id)
					.setPlaceholder(r.placeholder)
					.setMinValues(0)
					.addDefaultRoles(r.role ? [r.role] : []),
			),
		);
	}
}

function buildScheduleTab(container, cfg) {
	const nextResetDate = getNextResetDate(
		cfg.last_reset,
		cfg.post_interval,
		cfg.post_time,
		cfg.post_day,
		cfg.failed_resets,
	);

	container.addTextDisplayComponents((t) =>
		t.setContent(field("🗓️ Posting interval", `\`${cfg.post_interval}\``)),
	);
	container.addTextDisplayComponents((t) =>
		t.setContent(
			field(
				"⏱️ Posting schedule",
				`**${cfg.post_day}** at **${cfg.post_time}** UTC (local: <t:${nextResetDate.getTime() / 1000}:t>)`,
			),
		),
	);
	container.addTextDisplayComponents((t) =>
		t.setContent(
			field("🕰️ Last reset", `<t:${Math.floor(new Date(cfg.last_reset).getTime() / 1000)}:F>`),
		),
	);
	container.addTextDisplayComponents((t) =>
		t.setContent(field("🕰️ Next scheduled reset", `<t:${nextResetDate.getTime() / 1000}:F>`)),
	);
	container.addTextDisplayComponents((t) =>
		t.setContent(
			field(
				"⚠️ Failed resets",
				`**${cfg.failed_resets || 0}** failed reset${(cfg.failed_resets || 0) === 1 ? "" : "s"} since last successful reset\n-# Usually due to not enough valid entries within the timeslot, can however be a configuration error.`,
			),
		),
	);
	container.addTextDisplayComponents((t) =>
		t.setContent(
			field(
				"🧹 History handling",
				cfg.delete_previous ? "Deleting old leaderboard posts" : "Keeping old leaderboard posts",
			),
		),
	);

	container.addActionRowComponents((row) =>
		row.setComponents(
			new ButtonBuilder()
				.setCustomId("db_trigger_schedule_modal")
				.setLabel("Edit schedule")
				.setEmoji("📆")
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId("db_toggle_delete")
				.setLabel(cfg.delete_previous ? "Keep old posts" : "Delete old posts")
				.setEmoji("🧹")
				.setStyle(cfg.delete_previous ? ButtonStyle.Success : ButtonStyle.Danger),
		),
	);
}

function buildActionsTab(container) {
	container.addTextDisplayComponents((t) =>
		t.setContent("Force a manual leaderboard cycle outside the normal schedule."),
	);
	container.addActionRowComponents((row) =>
		row.setComponents(
			new ButtonBuilder()
				.setCustomId("db_force_post")
				.setLabel("Force post leaderboard now")
				.setStyle(ButtonStyle.Danger),
		),
	);
}

function buildDashboardPage(tab, cfg, guild) {
	const meta = TABS[tab] ?? TABS.channels;
	const container = new ContainerBuilder().setAccentColor(meta.accent);

	buildHeader(container, guild);
	container.addActionRowComponents((row) => row.setComponents(navigationMenu(tab)));
	divider(container);

	if (tab === "channels") buildChannelsTab(container, cfg);
	else if (tab === "roles") buildRolesTab(container, cfg);
	else if (tab === "schedule") buildScheduleTab(container, cfg);
	else if (tab === "actions") buildActionsTab(container);

	divider(container);
	container.addTextDisplayComponents((t) =>
		t.setContent("-# Artboardly • This session closes after 10 minutes of inactivity"),
	);

	return container;
}

module.exports = { buildDashboardPage, TABS };
