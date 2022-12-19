const commando = require("discord.js-commando");
const fetch = require("node-fetch");
const { UserFlags } = require("discord.js");

module.exports = class BalanceCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "balance",
			memberName: "balance",
			aliases: ["money", "credits", "bal"],
			group: "economy",
			description: "shows stats about a user",
			examples: ["balance [id/@mention/leaveBlank]"],
			clientPermissions: ["SEND_MESSAGES"],
			args: [
				{
					key: "user",
					prompt: "Which user you would like to get the balance of?",
					type: "user",
					default: "none",
				},
			],
		});
	}

	async run(msg, args, lang) {
		var { client, guild } = msg;
		var { user } = args;
		if (!user || user == "none") {
			user = msg.author;
		}
		lang = this.lang(guild)
		const currency = client.provider.get(guild, `currency`) || "coins";

		var balance = (await this.client.provider.get(guild, "users")) || [];
		var playerbalance = balance.find((x) => x.id === user.id);
		if (!playerbalance) playerbalance = { balance: 0 };
		msg.reply(lang.balanceMessage.replace("{user}", user).replace("{balance}", playerbalance.balance).replace("{currency}", currency), { title: `Balance` })
	}
};
