const commando = require("discord.js-commando");
const fetch = require("node-fetch");
const { UserFlags } = require("discord.js");

module.exports = class AddBalanceCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "add-balance",
			memberName: "add-balance",
			aliases: ["addbalance", "balance-add", "balanceadd"],
			group: "economy",
			description: "add balance to user",
			examples: ["addbalance [id/@mention]"],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"],
			guildOnly: true,
			args: [
				{
					key: "user",
					prompt: "Which user you would like to add balance?",
					type: "user",
				},
				{
					key: "amount",
					prompt: "Which amount do you want to add?",
					type: "integer",
					min: "1",
				},
			],
		});
	}

	async run(msg, args, lang) {
		var { client, guild } = msg;
		var { user, amount } = args;
		lang = this.lang(guild)
		const currency = client.provider.get(guild, `currency`) || "coins";

		var balance = (await this.client.provider.get(guild, "users")) || [];
		var playerbalance = balance.find((x) => x.id === user.id);
		if (!playerbalance) playerbalance = balance[balance.push({ id: user.id, balance: 0 }) - 1];

		playerbalance.balance += amount;
		await this.client.provider.set(guild, "users", balance);
		msg.reply(lang.addedMessage.replace("{user}", user).replace("{balance}", playerbalance.balance).replace("{currency}", currency), { title: lang.addedMessageTitle });

	}
};
