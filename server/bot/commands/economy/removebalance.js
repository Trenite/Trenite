const commando = require("discord.js-commando");
const fetch = require("node-fetch");
const { UserFlags } = require("discord.js");

module.exports = class RemoveBalanceCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "remove-balance",
			memberName: "balance-remove",
			aliases: ["removebalance", "balance-remove", "removebalance"],
			group: "economy",
			description: "remove balance from user",
			examples: ["removebalance [id/@mention]"],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"],
			args: [
				{
					key: "user",
					prompt: "Which user you would like to remove balance?",
					type: "user",
				},
				{
					key: "amount",
					prompt: "Which amount do you want to remove?",
					type: "integer",
					min: "1",
				},
			],
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;
		var { user, amount } = args;
		const currency = client.provider.get(guild, `currency`) || "coins";

		var balance = (await this.client.provider.get(guild, "users")) || [];
		var playerbalance = balance.find((x) => x.id === user.id);
		if (!playerbalance) playerbalance = balance[balance.push({ id: user.id, balance: 0 }) - 1];

		if (playerbalance.balance - amount < 0)
			throw `${user} doesn't have enough ${playerbalance.balance} ${currency}!`;
		playerbalance.balance -= amount;
		await this.client.provider.set(guild, "users", balance);
		msg.reply(`${user} new Balance is ${playerbalance.balance} ${currency}`, {
			title: `Removed Balance! 💸`,
		});
	}
};
