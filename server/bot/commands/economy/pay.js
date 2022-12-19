const commando = require("discord.js-commando");
const fetch = require("node-fetch");
const { UserFlags } = require("discord.js");

module.exports = class PayCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "pay",
			memberName: "pay",
			aliases: ["payment"],
			group: "economy",
			description: "pay to a user",
			examples: ["pay [id/@mention]"],
			clientPermissions: ["SEND_MESSAGES"],
			args: [
				{
					key: "user",
					prompt: "Which user you would like to get the balance of?",
					type: "user",
				},
				{
					key: "amount",
					prompt: "Which amount do you want to pay?",
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

		var playerBalance = balance.find((x) => x.id === msg.author.id);
		if (!playerBalance) playerBalance = { balance: 0 };
		var toPayBalance = balance.find((x) => x.id === user.id);
		if (!toPayBalance) toPayBalance = { balance: 0 };
		if (msg.author.id == user.id) throw `You can't pay yourself!`;
		const settings = await client.provider.get(guild, `payments`);
		if (settings == false) throw `Payments was deactivated!`;
		if (!playerBalance.balance >= amount) {
			throw `You don't have enough ${currency} to pay this amount!`;
		} else {
			playerBalance.balance -= amount;
			toPayBalance.balance += amount;
			await this.client.provider.set(guild, "users", balance);
			return msg.reply(`You've sucessfully payed ${amount} ${currency} to ${user}`);
		}
	}
};
