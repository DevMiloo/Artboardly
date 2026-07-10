const cron = require("node-cron");
const { resetleaderboard } = require("../artleaderboardweek.js");
const { ArtBoardConfig } = require("../dbFunctions.js");
const Log = require("../utils/logger.js");
const logger = new Log("cronJob");

function getNextResetDate(lastReset, postInterval, postTime, postDay, failedResets) {
	const [hours, minutes] = postTime.split(":").map(Number);

	const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
	const targetDayIndex = daysOfWeek.indexOf(postDay.toLowerCase());
	if (targetDayIndex === -1) throw new Error(`Invalid post_day value: ${postDay}`);

	let stepDays = 7;
	if (postInterval === "biweekly") stepDays = 14;
	if (postInterval === "monthly") stepDays = 28;

	const stepMs = (stepDays - stepDays / 7) * 24 * 60 * 60 * 1000;
	const bufferMs = 60000; //otherwise if cron execution is slightly off, it might skip to the next week.

	const lastResetTime = lastReset ? new Date(lastReset).getTime() : Date.now() - stepMs;

	const earliestAllowed = lastResetTime - bufferMs + stepMs;
	const earliestAllowedDate = new Date(earliestAllowed);

	const nextReset = new Date(
		Date.UTC(
			earliestAllowedDate.getUTCFullYear(),
			earliestAllowedDate.getUTCMonth(),
			earliestAllowedDate.getUTCDate(),
			hours,
			minutes,
			0,
			0,
		),
	);

	const diff = (targetDayIndex - nextReset.getUTCDay() + 7) % 7;
	nextReset.setUTCDate(nextReset.getUTCDate() + diff);

	if (nextReset.getTime() < earliestAllowed) {
		nextReset.setUTCDate(nextReset.getUTCDate() + 7);
	}

	nextReset.setUTCDate(nextReset.getUTCDate() + (failedResets || 0) * stepDays);

	return nextReset;
}

function startCron(client) {
	cron.schedule("* * * * *", async () => {
		try {
			const allConfigs = await ArtBoardConfig.findAll();
			const now = Date.now();
			for (const config of allConfigs) {
				try {
					const nextReset = getNextResetDate(
						config.last_reset,
						config.post_interval,
						config.post_time,
						config.post_day,
						config.failed_resets,
					);

					// console.log(`[Cron Check]`);
					// console.log(`  Current UTC: ${new Date(now).toISOString()}`);
					// console.log(`  Target UTC : ${nextReset.toISOString()}`);
					// console.log(`  Trigger?   : ${now >= nextReset.getTime()}`);

					if (now >= nextReset.getTime()) {
						const guild = await client.guilds.fetch(config.server_id);
						const success = await resetleaderboard(guild, client);

						if (!success) {
							config.failed_resets = (config.failed_resets || 0) + 1;
							await config.save();
						}
					}
				} catch (configError) {
					logger.error(`at ${config.server_id}:`, configError);
				}
			}
		} catch (error) {
			logger.error("During reset check:", error);
		}
	});

	logger.success("Cron has started!");
}

module.exports = { startCron, getNextResetDate };
