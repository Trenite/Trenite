const {
	GuildMember,
	User,
	Role,
	Channel,
	VoiceChannel,
	TextChannel,
	CategoryChannel,
	Message,
} = require("discord.js");

module.exports = (client) => {
	client.on("commandRun", (command, promise, msg, args, fromPattern, result) => {
		try {
			var channel = msg.channel.type === "dm" ? "DM" : msg.guild.name;
			var author = msg.author.tag;
			var params = client.getArgsFromCollectorResult(result);
			console.debug(`[cmd] [${command.name}] [${channel}] [${author}] ${params}`);
		} catch (error) {
			console.error(error);
		}
	});

	client.getArgsFromCollectorResult = (collector) => {
		if (collector && collector.values) {
			var result = { ...collector.values };
		} else {
			var result = {};
		}
		var string = ["[args]:"];
		Object.keys(result).forEach((key) => {
			var value = result[key];
			if (typeof value === "object") {
				if (value instanceof GuildMember) value = value.user.tag;
				else if (value instanceof User) value = value.tag;
				else if (value instanceof Role) value = "Role: " + value.name;
				else if (value instanceof VoiceChannel) value = "🔊" + value.name;
				else if (value instanceof CategoryChannel) value = "⤵" + value.name;
				else if (value instanceof TextChannel) value = "#" + value.name;
				else if (value instanceof Channel) value = "#" + value.name;
				else if (value instanceof Message) value = "msg: " + value.content;
				else {
					value = JSON.stringify(value);
				}
			}
			string.push(`- ${key}: ${value}`);
		});
		return "\n" + string.join("\n");
	};
};
