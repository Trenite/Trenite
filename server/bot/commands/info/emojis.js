const commando = require("discord.js-commando");

module.exports = class EmojiInfoCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "emojis",
			memberName: "emojis",
			aliases: ["emojis-info", "emoji-info"],
			autoAliases: true,
			group: "info",
			description: "list the current server emojis",
			examples: ["$emojis"],
			clientPermissions: ["SEND_MESSAGES"],
			guildOnly: true,
			clientPermissions: ["SEND_MESSAGES"],
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;
		var prem = client.allUsers.get(guild.id, "premium");
		if (!prem) {
			prem = "No";
		}

		function getEmojiList() {
			var temp = guild.emojis.cache.map((emoji) => emoji).join(" ");
			return temp;
		}

		var url = guild.iconURL({ dynamic: true, format: "jpg", size: 2048 });

		msg.reply({
			title: "Emojis from " + guild.name,
			embed: {
				thumbnail: {
					url,
				},
				description: getEmojiList(),
			},
		});
	}
};
