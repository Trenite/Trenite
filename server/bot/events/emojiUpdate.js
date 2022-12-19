module.exports = (client) => {
	client.on("emojiUpdate", async (emoji) => {
		client.server.emit("EMOJI_UPDATE", emoji.guild, emoji);
	});
};
