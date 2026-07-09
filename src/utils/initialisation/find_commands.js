const fs = require("node:fs");
const path = require("node:path");
const Log = require("../logger.js");
const logger = new Log("Command loader");
const { SlashCommandBuilder, Collection } = require("discord.js");

const path_to_commands = path.resolve(__dirname, "../../commands");

module.exports = (client) => {
	const chatInputPath = path.join(path_to_commands, "chatInput");

	const commands = fs.readdirSync(chatInputPath).filter((file) => file.endsWith(".js"));

	const stack = [];
	client.commands = {};
	client.menus = new Collection();
	client.buttonCommands = new Collection();
	client.modals = new Collection();

	for (const command of commands) {
		const command_loaded = require(path.join(chatInputPath, command));

		if (!command_loaded) {
			logger.error(`${command} not valid`);
			continue;
		}
		if (typeof command_loaded.execute !== "function") {
			logger.error(`${command} does not have the execute function`);
			continue;
		}
		if (!(command_loaded.register_command instanceof SlashCommandBuilder)) {
			logger.error(`${command} does not have the register_command SlashcommandBuilder instance`);
			continue;
		}
		if (Object.keys(client.commands).includes(command_loaded.register_command.name)) {
			logger.warn(`Two or more commands share the name ${command_loaded.register_command.name}`);
			continue;
		}

		client.commands[command_loaded.register_command.name] = command_loaded;
		stack.push(command_loaded.register_command);

		logger.success(`[CHATINPUT] loaded ${command}`);
	}

	const menuDirectory = path.join(path_to_commands, "menu");
	loadFromDirectory(menuDirectory, client.menus, "menu");

	const buttonDirectory = path.join(path_to_commands, "button");
	loadFromDirectory(buttonDirectory, client.buttonCommands, "button");

	const modalDirectory = path.join(path_to_commands, "modal");
	loadFromDirectory(modalDirectory, client.modals, "modal");

	logger.info("Commands loaded");
	return stack;
};

function loadFromDirectory(fullPath, collection, type) {
	try {
		if (!fs.existsSync(fullPath)) {
			logger.warn(`Directory not found: ${fullPath}`);
			return;
		}

		const files = fs
			.readdirSync(fullPath, { withFileTypes: true })
			.filter((dirent) => dirent.isFile() && dirent.name.endsWith(".js"))
			.map((dirent) => dirent.name);

		for (const file of files) {
			try {
				const absolutePath = path.join(fullPath, file);

				const command = require(absolutePath);
				const commandName = path.basename(file, ".js");

				collection.set(commandName, command);
				logger.success(`[${type.toUpperCase()}] loaded: ${commandName}.js`);
			} catch (error) {
				logger.error(`Failed to load ${type} ${file}: ${error.message}`);
			}
		}
	} catch (error) {
		logger.error(`Failed to read directory ${fullPath}: ${error.message}`);
	}
}
