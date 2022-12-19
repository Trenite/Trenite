module.exports = (client) => {
	client.on("emojiCreate", async (emoji) => {
		client.server.emit("EMOJI_CREATE", emoji.guild, emoji);
	});
};
