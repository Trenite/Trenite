module.exports = (client) => {
	client.on("channelUpdate", async (oldchannel, newchannel) => {
		if (!newchannel.guild) return;
		client.server.emit("CHANNEL_UPDATE", newchannel.guild, newchannel);
	});
};
