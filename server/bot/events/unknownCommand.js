module.exports = (client) => {
	client.on("unknownCommand", (cmdMsg) => {
		try {
			var channel = cmdMsg.channel.type === "dm" ? "DM" : cmdMsg.guild.name;
			var author = cmdMsg.author.tag;
			console.debug(`[cmd] [unkown] [${channel}] [${author}]: ${cmdMsg.content}`);
		} catch (error) {}
	});
};
