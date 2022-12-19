const commando = require("discord.js-commando");

module.exports = class LogCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "log",
			memberName: "log",
			aliases: ["logs","chanel-logs","log-channel"],
			autoAliases: true,
			group: "mod",
			description: "Set the channel for logs",
			examples: ["log #test"],
			guildOnly: true,
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"],
			args: [
				{
					type: "text-channel",
					key: "channel",
					prompt: "What is the new log channel?\nWrite disabled if you don't want a log channel",
					validate: (text, msg) => {
						if (text === "disabled") {
							return true;
						} else if (msg.client.registry.types.get("text-channel").parse(text, msg)) {
							return true;
						}

						return false;
					},
				},
			],
		});
	}

	async run(msg, args) {
		var { channel } = args;
		var { client, guild } = msg;

		if (channel === "disabled") {
			channel = null;
		}

		if (channel) {
			client.provider.set(guild, "logChannel", channel.id);
			msg.reply(`Log Channel set to ${channel}`);
			client.log(guild, "This is now the log channel");
		} else {
			msg.reply("Log Channel disabled");
			client.log(guild, "This is not longer a log channel");
			client.provider.remove(guild, "logChannel");
		}
	}
};
