const commando = require("discord.js-commando");

module.exports = class SetEloCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "fn-set-elo",
			memberName: "fn-set-elo",
			aliases: ["fn-setelo", "fortnite-set-elo", "fortnite-setelo"],
			group: "fortnite",
			description: "1 vs 1 Elo",
			examples: ["Elo"],
			guildOnly: true,
			devOnly: true,
			clientPermissions: ["SEND_MESSAGES"],
			args: [
				{
					key: "user",
					prompt: "Which user?",
					type: "user",
				},
				{
					key: "anzahl",
					prompt: "New Elo",
					type: "integer",
					min: 0,
				},
			],
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;
		const { user, anzahl } = args;
		var users = this.client.provider.get(guild, "users") || [];
		users = users.find((user2) => user2.id === user.id);
		if (!users) return msg.reply("You arent verified.");
		users.elo = anzahl;
		msg.reply(`${user}s new Elo: ${anzahl}`);
	}
};
