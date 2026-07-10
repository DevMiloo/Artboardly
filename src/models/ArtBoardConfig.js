module.exports = (sequelize, DataTypes) => {
	return sequelize.define("artboardconfig", {
		server_id: { type: DataTypes.STRING, primaryKey: true },
		artleaderboardchannel: { type: DataTypes.STRING },
		emoji: { type: DataTypes.STRING },
		artchannels: { type: DataTypes.JSON, defaultValue: [] },
		delete_previous: { type: DataTypes.BOOLEAN, defaultValue: false },
		post_day: { type: DataTypes.STRING, defaultValue: "Sunday" },
		post_time: { type: DataTypes.STRING, defaultValue: "12:00" },
		post_interval: { type: DataTypes.STRING, defaultValue: "weekly" },
		top3_role: { type: DataTypes.STRING, defaultValue: null },
		n1_role: { type: DataTypes.STRING, defaultValue: null },
		n2_role: { type: DataTypes.STRING, defaultValue: null },
		n3_role: { type: DataTypes.STRING, defaultValue: null },
		last_reset: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
		failed_resets: { type: DataTypes.INTEGER, defaultValue: 0 },
	});
};
