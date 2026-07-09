const { Sequelize, DataTypes } = require("sequelize");
const log = new require("./utils/logger.js");
const logger = new log("Database");

const sequelize = new Sequelize({
	dialect: "sqlite",
	storage: "./database.sqlite",
	logging: false,
});

// Load models
const ArtBoardConfig = require("./models/ArtBoardConfig.js")(sequelize, DataTypes);
const ArtLeaderboard = require("./models/ArtLeaderboard.js")(sequelize, DataTypes);

async function initDatabase() {
	await sequelize
		.sync({ alter: true })
		.then(async () => {
			logger.success("Database synced");
		})
		.catch((error) => {
			logger.error(error);
		});
}

module.exports = {
	initDatabase,
	ArtBoardConfig,
	ArtLeaderboard,
};
