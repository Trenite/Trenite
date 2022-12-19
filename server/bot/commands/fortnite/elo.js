const commando = require("discord.js-commando");

module.exports = class EloCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "fn-elo",
			memberName: "fn-elo",
			aliases: ["fnelo", "fortnite-elo", "fortniteelo"],
			group: "fortnite",
			description: "1 vs 1 Elo",
			examples: ["fn-elo @User"],
			guildOnly: true,
			devOnly: true,
			clientPermissions: ["SEND_MESSAGES"],
			args: [
				{
					key: "user",
					prompt: "Which user?",
					type: "user",
				},
			],
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;
		const user = args.user;
		var users1 = this.client.provider.get(guild, "users");
		users1 = users1.find((user2) => user2.id === user.id);
		var elo = users1.elo;
		msg.reply(`${user}s Elo: ${elo}`);
	}
};
