const { Client, GatewayIntentBits, Partials, Events } = require("discord.js");
require("dotenv").config();
const assert = require("node:assert");
const find_events = require("./utils/initialisation/find_events");
const find_commands = require("./utils/initialisation/find_commands");
const register_commands = require("./utils/initialisation/register_commands");
const artleaderboardweek = require("./artleaderboardweek.js"); // Component : Art leaderboard.
const { startCron } = require("./handlers/cronJob.js"); // Component : Cron job for resetting the leaderboard.

assert(
	process.env.TOKEN,
	"A Discord Token for your bot is required! Please fill in your discord token in the .env file.",
);

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions,
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

find_events(client);

const commands = find_commands(client);

// initialise the artleaderboard
artleaderboardweek(client);

//initialise cron job for resetting the leaderboard
startCron(client);

client.login(process.env.TOKEN);

client.once(Events.ClientReady, (client) => {
	register_commands(client, commands);
});
