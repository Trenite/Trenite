const { oneLine } = require("common-tags");

module.exports = (client) => {
	client.on("commandError", async (cmd, err, msg, args, fromPattern, result) => {
		var channel = msg.channel.type === "dm" ? "DM" : msg.guild.name;
		var author = msg.author.tag;
		var params = client.getArgsFromCollectorResult(result);
		try {
			if (!(err instanceof Error)) throw new Error(err);
		} catch (error) {
			err = error;
		}
		console.debug(
			`[cmd] [${cmd.name}] [${channel}] [${author}] ${params}\n[error]: ${err.stack}`
		);
	});
};
