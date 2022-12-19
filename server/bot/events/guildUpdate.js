module.exports = (client) => {
	client.on("guildUpdate", async (guild) => {
		client.server.emit("GUILD_UPDATE", client, guild);
	});
};
