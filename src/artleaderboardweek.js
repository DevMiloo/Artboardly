const { ArtBoardConfig, ArtLeaderboard } = require("./dbFunctions.js");
const Log = require("./utils/logger.js");
const logger = new Log("LeaderBoard");
const CanvasModule = require("canvas");
const { registerFont } = CanvasModule;
const fs = require("node:fs");
const path = require("node:path");

const reactionUpdate = new Map();
const DEBOUNCE_MS = 5000;
const supportedImageTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const sourceUIPath = path.join(__dirname, "leaderboardimages");
const fontsDir = path.join(sourceUIPath, "fonts");
const regular = path.join(fontsDir, "Montserrat-Regular.ttf");
const italic = path.join(fontsDir, "Montserrat-Italic.ttf");

module.exports = async (client) => {
	try {
		if (fs.existsSync(regular)) {
			registerFont(regular, { family: "Montserrat", weight: "normal", style: "normal" });
			logger.success("Registered font: Montserrat-Regular");
		}
		if (fs.existsSync(italic)) {
			registerFont(italic, { family: "Montserrat", weight: "normal", style: "italic" });
			logger.success("Registered font: Montserrat-Italic");
		}

		if (!fs.existsSync(regular) && !fs.existsSync(italic))
			logger.error("Montserrat font files not found.");
	} catch (err) {
		logger.error("Canvas font registration failed!", err?.message || err);
	}

	client.on("messageReactionAdd", await debounceUpdate);
	client.on("messageReactionRemove", await debounceUpdate);
};

async function resetleaderboard(guild, client) {
	let canvas, ctx, gold, silver, bronze;

	const config = await ArtBoardConfig.findOne({ where: { server_id: guild.id } });

	if (!config?.artchannels || !config.artleaderboardchannel) {
		logger.error("Missing config data");
		return false;
	}

	const artchannels = Array.isArray(config.artchannels) ? config.artchannels : [config.artchannels];
	const channeltosendid = config.artleaderboardchannel;

	if (!artchannels || !channeltosendid) return false;

	const channeltosend = client.channels.cache.get(channeltosendid);

	try {
		const leaderboard = await ArtLeaderboard.findOne({ where: { server_id: guild.id } });

		if (!leaderboard?.JSON) {
			logger.error("No leaderboard data found");
			return false;
		}

		const values = Object.entries(leaderboard.JSON)?.map(([messageId, data]) => ({
			id: messageId,
			...data,
		}));

		const sortedValues = values.sort((a, b) => b.reactions - a.reactions);

		let topPlaces = [];
		for (let i = 0; i < sortedValues.length && topPlaces.length < 3; i++) {
			if (!sortedValues[i].id) {
				logger.error("Missing message ID for entry:", sortedValues[i]);
				continue;
			}

			const isDuplicate = topPlaces.some((place) => place.author === sortedValues[i].author);
			if (isDuplicate) {
				logger.info(`Skipping duplicate author: ${sortedValues[i].author}`);
				continue;
			}

			const image = await fetchImage(artchannels, sortedValues[i].id, client);
			if (image) topPlaces.push({ ...sortedValues[i], image });

			// Delay to not get ratelimited
			if (topPlaces.length < 3) await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		if (topPlaces.length < 3) {
			console.error("Not enough valid entries found");
			return false;
		}

		const Canvas = require("canvas");
		canvas = Canvas.createCanvas(1920, 1080);
		ctx = canvas.getContext("2d");
		const background = await Canvas.loadImage(path.join(sourceUIPath, "gallery2.png"));

		const [n1, n2, n3] = await Promise.all(
			topPlaces.map((p) => Canvas.loadImage(p.image.url.toString())),
		);

		frame = await Canvas.loadImage(path.join(sourceUIPath, "artframe.png"));
		gold = await Canvas.loadImage(path.join(sourceUIPath, "gold2.png"));
		silver = await Canvas.loadImage(path.join(sourceUIPath, "silver2.png"));
		bronze = await Canvas.loadImage(path.join(sourceUIPath, "bronze2.png"));
		const [artist1, artist2, artist3] = await Promise.all(
			topPlaces.map((p) => client.users.fetch(p.author)),
		);

		topPlaces = [];

		ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

		const pixlinks = 600;
		const verklein = 5;
		const verhouding = 1.35;
		const medalx = -15;
		const medaly = -2;
		const medalverklein = 3.5;
		const omhoog = 150;

		const wrh1 = n1.width / n1.height;
		const wrh2 = n2.width / n2.height;
		const wrh3 = n3.width / n3.height;

		let newWidth1 = canvas.width / verklein;
		let newHeight1 = newWidth1 / wrh1;
		if (newHeight1 > canvas.height) {
			newHeight1 = canvas.height;
			newWidth1 = newHeight1 * wrh1;
		}

		let newWidth2 = canvas.width / verklein;
		let newHeight2 = newWidth2 / wrh2;
		if (newHeight2 > canvas.height) {
			newHeight2 = canvas.height;
			newWidth2 = newHeight2 * wrh2;
		}

		let newWidth3 = canvas.width / verklein;
		let newHeight3 = newWidth3 / wrh3;
		if (newHeight3 > canvas.height) {
			newHeight3 = canvas.height;
			newWidth3 = newHeight3 * wrh3;
		}

		const xOffset1 = newWidth1 < canvas.width ? (canvas.width - newWidth1) / 2 - pixlinks : 0;
		const yOffset1 = newHeight1 < canvas.height ? (canvas.height - newHeight1) / 2 - omhoog : 0;

		const xOffset2 = newWidth2 < canvas.width ? (canvas.width - newWidth2) / 2 : 0;
		const yOffset2 = newHeight2 < canvas.height ? (canvas.height - newHeight2) / 2 - omhoog : 0;

		const xOffset3 = newWidth3 < canvas.width ? (canvas.width - newWidth3) / 2 + pixlinks : 0;
		const yOffset3 = newHeight3 < canvas.height ? (canvas.height - newHeight3) / 2 - omhoog : 0;

		drawPodiumEntry(ctx, {
			image: n1,
			medal: gold,
			x: xOffset1,
			y: yOffset1,
			width: newWidth1,
			height: newHeight1,
			verhouding,
			medalOffset: { x: medalx, y: medaly },
			medalScale: medalverklein,
		});
		drawPodiumEntry(ctx, {
			image: n2,
			medal: silver,
			x: xOffset2,
			y: yOffset2,
			width: newWidth2,
			height: newHeight2,
			verhouding,
			medalOffset: { x: medalx, y: medaly },
			medalScale: medalverklein,
		});
		drawPodiumEntry(ctx, {
			image: n3,
			medal: bronze,
			x: xOffset3,
			y: yOffset3,
			width: newWidth3,
			height: newHeight3,
			verhouding,
			medalOffset: { x: medalx, y: medaly },
			medalScale: medalverklein,
		});

		ctx.font = 'italic 60px "Montserrat", sans-serif';
		ctx.fillStyle = "#ffffff";
		ctx.textAlign = "center";

		const nameMaxWidth = newWidth1 * 0.9;

		drawWrappedText(
			ctx,
			getDisplayName(artist1),
			canvas.width / 2 - pixlinks,
			yOffset1 + newHeight1 + 90 + 75 / wrh1,
			nameMaxWidth,
		);

		drawWrappedText(
			ctx,
			getDisplayName(artist2),
			canvas.width / 2,
			yOffset2 + newHeight2 + 90 + 75 / wrh2,
			nameMaxWidth,
		);

		drawWrappedText(
			ctx,
			getDisplayName(artist3),
			canvas.width / 2 + pixlinks,
			yOffset3 + newHeight3 + 90 + 75 / wrh3,
			nameMaxWidth,
		);

		const final = canvas.toBuffer();

		//delete the previous art
		if (config.delete_previous === true) {
			const messages = await channeltosend.messages
				.fetch({ limit: 10 })
				.catch((e) => logger.error(e));

			const message = messages.find(
				(msg) => msg.author.id === client.user.id && msg.attachments.size > 0,
			);
			if (message) await message.delete();
		}

		//send the new art leaderboard
		await channeltosend.send({
			files: [{ attachment: final }],
		});

		config.last_reset = new Date();
		config.failed_resets = 0;
		await config.save();
		await ArtLeaderboard.destroy({ where: { server_id: guild.id } });

		//assign the roles to the winners
		const top3RoleId = config.top3_role;
		const n1RoleId = config.n1_role;
		const n2RoleId = config.n2_role;
		const n3RoleId = config.n3_role;

		if (top3RoleId) {
			const top3Artists = [artist1, artist2, artist3];
			await assignRoles(guild, top3Artists, top3RoleId);
		}
		if (n1RoleId) await assignRoles(guild, [artist1], n1RoleId);
		if (n2RoleId) await assignRoles(guild, [artist2], n2RoleId);
		if (n3RoleId) await assignRoles(guild, [artist3], n3RoleId);

		return true;
	} catch (error) {
		channeltosend.send(
			String(
				"An error occurred while resetting the leaderboard. Please contact the bot dev with the following error message:\n```\n",
			)
				.concat(error)
				.concat("\n```"),
		);
		logger.error("Error resetting leaderboard:", error);
	}
}

async function assignRoles(guild, artists, roleId) {
	const role = guild.roles.cache.get(roleId);
	if (!role) return;

	for (const artist of artists) {
		const member = guild.members.cache.get(artist.id);
		if (member) {
			await member.roles.add(role).catch(logger.error);
		}
	}
}
async function fetchImage(artchannels, messageId, client) {
	for (const channelId of artchannels) {
		try {
			const channel = await client.channels.fetch(channelId, { force: true });
			if (!channel) {
				logger.error(`Channel ID ${channelId} not found`);
				continue;
			}
			await channel.messages.cache.delete(messageId);
			const msg = await channel.messages.fetch(messageId, { force: true });
			if (msg) {
				const attachment = msg.attachments.first();
				if (attachment && supportedImageTypes.includes(attachment.contentType)) {
					try {
						const response = await fetch(attachment.url, { method: "HEAD" });
						if (!response.ok)
							logger.error(`Attachment URL invalid: ${attachment.url} (${response.status})`);
						return attachment;
					} catch (urlError) {
						logger.error(`Failed to validate URL: ${attachment.url}`, urlError);
					}
				} else {
					logger.error(`Unsupported type: ${attachment.contentType} for msg ${messageId}`);
				}
			}
		} catch (error) {
			logger.error(`Error in channel ${channelId}, msg ${messageId}:`, error);
		}
	}
	return null;
}

function drawPodiumEntry(
	ctx,
	{ image, medal, x, y, width, height, verhouding, medalOffset, medalScale },
) {
	const testX = (width * verhouding - width) / 2;
	const testY = (height * verhouding - height) / 2;

	ctx.fillStyle = "#FFFFFF";
	ctx.drawImage(frame, x - testX, y - testY, width * verhouding, height * verhouding);
	ctx.fillRect(x, y, width, height);
	ctx.drawImage(image, x, y, width, height);
	ctx.drawImage(
		medal,
		x - testX + medalOffset.x,
		y - testY + medalOffset.y,
		medal.width / medalScale,
		medal.height / medalScale,
	);
}

function getDisplayName(user) {
	if (!user.globalName) return user.username;

	// biome-ignore lint/suspicious/noControlCharactersInRegex: Was ignored by eslint prior(???)
	const specialchar = /[^\x00-\x7F]/.test(user.globalName);
	if (specialchar) return user.username;
	else return user.globalName;
}

// Wrap text
function wrapText(ctx, text, maxWidth) {
	const words = text.split(" ");
	const lines = [];
	let currentLine = words[0];

	for (let i = 1; i < words.length; i++) {
		const word = words[i];
		const width = ctx.measureText(String(currentLine).concat(" ").concat(word)).width;

		if (width < maxWidth) {
			currentLine += String(" ").concat(word);
		} else {
			lines.push(currentLine);
			currentLine = word;
		}
	}
	lines.push(currentLine);
	return lines;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight = 70) {
	const lines = wrapText(ctx, text, maxWidth);

	const totalHeight = lines.length * lineHeight;
	const startY = y - totalHeight / 2 + lineHeight / 2;

	lines.forEach((line, index) => void ctx.fillText(line, x, startY + index * lineHeight));
}

async function debounceUpdate(reaction, user) {
	const key = reaction.message.id;
	if (reactionUpdate.has(key)) clearTimeout(reactionUpdate.get(key));
	reactionUpdate.set(
		key,
		setTimeout(async () => {
			reactionUpdate.delete(key);
			await updatedb(reaction, user);
		}, DEBOUNCE_MS),
	);
}

async function updatedb(reaction, user) {
	if (reaction.partial) {
		try {
			await reaction.fetch().catch(() => {});
		} catch (error) {
			logger.error("Something went wrong when fetching the message:", error);
			return;
		}
	}

	if (
		reaction.message?.channel?.isDMBased() ||
		!reaction.message?.author ||
		reaction.message?.author.bot ||
		user.bot
	) {
		return;
	}

	const config = await ArtBoardConfig.findOne({
		where: { server_id: reaction.message.guild.id },
	});
	if (!config?.artchannels) return;

	const channels = config.artchannels;
	if (!channels?.includes(reaction.message.channel.id)) return;
	if (reaction.message.attachments.size === 0) return;

	let reactedemoji;

	if (reaction.emoji.id === null) reactedemoji = reaction.emoji.name;
	else if (reaction.emoji.animated === true)
		reactedemoji = `<a:${reaction.emoji.name}:${reaction.emoji.id}>`;
	else reactedemoji = `<:${reaction.emoji.name}:${reaction.emoji.id}>`;

	if (reactedemoji !== config.emoji) return;

	const lastReset = new Date(config.last_reset);

	if (reaction.message.createdTimestamp < lastReset.getTime()) return;

	const reactionCount = reaction.count - 1; // Subtract 1 to exclude the bot's own reaction

	const [leaderboard] = await ArtLeaderboard.findOrCreate({
		where: { server_id: reaction.message.guild.id },
		defaults: { JSON: {} },
	});

	const currentData = leaderboard.JSON || {};

	if (reactionCount <= 0) {
		delete currentData[reaction.message.id];
	} else {
		currentData[reaction.message.id] = {
			reactions: reactionCount,
			author: reaction.message.author.id,
		};
	}

	leaderboard.JSON = currentData;
	leaderboard.changed("JSON", true);
	await leaderboard.save();
}

module.exports.resetleaderboard = resetleaderboard;
