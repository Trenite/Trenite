const commando = require("discord.js-commando");
const fetch = require("node-fetch");
const { UserFlags } = require("discord.js");

module.exports = class SetBalanceCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "set-balance",
			memberName: "balance-set",
			aliases: ["setbalance", "balance-set", "balanceset"],
			group: "economy",
			description: "set balance from user",
			examples: ["set-balance [id/@mention]"],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"],
			args: [
				{
					key: "user",
					prompt: "Which user you would set the balance?",
					type: "user",
				},
				{
					key: "amount",
					prompt: "Which amount?",
					type: "integer",
					min: "0",
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

		playerbalance.balance = amount;
		await this.client.provider.set(guild, "users", balance);

		msg.reply(`<@${user.id}> new Balance is ${playerbalance.balance} ${currency}`, { title: `Balance` });
	}
};
