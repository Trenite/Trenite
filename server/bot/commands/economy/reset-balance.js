const commando = require("discord.js-commando");
const fetch = require("node-fetch");
const { UserFlags } = require("discord.js");

module.exports = class ResetBalanceCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "reset-balance",
			memberName: "balance-reset",
			aliases: ["resetbalance", "balance-reset", "balancereset"],
			group: "economy",
			description: "reset balance from user",
			examples: ["reset-balance [id/@mention]"],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"],
			args: [
				{
					key: "user",
					prompt: "Which user you would like to reset the balance?",
					type: "user",
				},
			],
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;
		var { user } = args;
		const currency = client.provider.get(guild, `currency`) || "coins";

		var balance = (await this.client.provider.get(guild, "users")) || [];
		var playerbalance = balance.find((x) => x.id === user.id);
		if (!playerbalance) playerbalance = balance[balance.push({ id: user.id, balance: 0 }) - 1];

		playerbalance.balance = 0;
		await this.client.provider.set(guild, "users", balance);

		msg.reply(`<@${user.id}> new Balance is ${playerbalance.balance} ${currency}`, { title: `Balance Reset` });
	}
};
