const { Events, MessageFlags } = require("discord.js");
const log = new require("../utils/logger.js");
const logger = new log("interactionCreate");

module.exports = {
	event: Events.InteractionCreate,
	type: "on",
	async call(client, interaction) {
		logger.info(
			`Interaction received: ${interaction.type} - ${interaction.customId || interaction.commandName}`,
		);
		const [command, ...context] = interaction.customId?.split("_") || [];
		const data = { client, interaction, context };

		if (interaction.isChatInputCommand()) {
			if (!Object.keys(client.commands).includes(interaction.commandName)) {
				logger.warn(`Command ${interaction.commandName} not found or loaded`);
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: `Command not found please report this!`,
				});
			}
			const command = client.commands[interaction.commandName];
			try {
				return await command.execute(data);
			} catch (error) {
				logger.error(error);
				return interaction
					.reply({
						flags: MessageFlags.Ephemeral,
						content: `Error executing command! Please try again, if error persists please report to a developer`,
					})
					.catch(() => "");
			}
		} else if (interaction.isButton())
			await handleInteraction(command, data, interaction, "buttonCommands", true);
		else if (isSelectMenu(interaction))
			await handleInteraction(command, data, interaction, "menus", true);
		else if (interaction.isModalSubmit())
			await handleInteraction(command, data, interaction, "modals", false);
	},
};

function isSelectMenu(interaction) {
	//return (interaction.isStringSelectMenu() || interaction.isChannelSelectMenu() || interaction.isRoleSelectMenu());
	return (
		interaction.isStringSelectMenu() ||
		interaction.isChannelSelectMenu() ||
		interaction.isRoleSelectMenu()
	);
}

async function handleInteraction(
	command,
	data,
	interaction,
	collectionName,
	checkOwnership = true,
) {
	try {
		if (
			checkOwnership &&
			interaction.message?.interaction !== null &&
			interaction.user.id !== interaction.message.interaction?.user?.id
		) {
			return interaction.reply({
				content: `Hey! This is someone else's command!`,
				flags: MessageFlags.Ephemeral,
			});
		}

		const handler = data.client[collectionName].get(command);
		if (!handler) return;

		await handler(data);
	} catch (error) {
		logger.error(error);
		return interaction
			.reply({
				flags: MessageFlags.Ephemeral,
				content: `Error executing command! Please try again, if error persists please report to a developer`,
			})
			.catch(() => "");
	}
}
