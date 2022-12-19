module.exports = (client) => {
	client.on("channelCreate", async (channel) => {
		if (!channel.guild) return;
		client.server.emit("CHANNEL_DELETE", channel.guild, channel);
	});
};
