module.exports = (client) => {
	client.on("emojiDelete", async (emoji) => {
		client.server.emit("EMOJI_DELETE", emoji.guild, emoji);
	});
};
