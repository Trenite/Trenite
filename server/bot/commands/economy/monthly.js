const commando = require("discord.js-commando");
const fetch = require("node-fetch");
const { UserFlags } = require("discord.js");
const ms = require("parse-ms");

module.exports = class monthlyCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "monthly",
			memberName: "reward-monthly",
			aliases: [],
			group: "economy",
			description: "collect your monthly reward",
			examples: ["monthly]"],
			clientPermissions: ["SEND_MESSAGES"],
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;
		var user = msg.author;
		let timeout = 2628000000;
		let amount = client.provider.get(guild, `monthlyamount`) || 250;

		const settings = await client.provider.get(guild, `monthly`);
		const currency = client.provider.get(guild, `currency`) || "coins";

		if (settings == false) throw `Monthly Reward was deactivated!`;

		var balance = (await this.client.provider.get(guild, "users")) || [];
		var playerbalance = balance.find((x) => x.id === user.id);
		if (!playerbalance) playerbalance = balance[balance.push({ id: user.id, balance: 0 }) - 1];

		let monthly = playerbalance.monthly;

		if (monthly !== null && timeout - (Date.now() - monthly) > 0) {
			let time = ms(timeout - (Date.now() - monthly));

			throw `You have already picked up your monthly reward! \nCan be picked up again in ${time.days}d `;
		} else {
			playerbalance.balance += amount;
			playerbalance.monthly = Date.now();
			await this.client.provider.set(guild, "users", balance);
			return msg.reply(`You successfully picked up your ${amount} ${currency} Reward`);
			/* db.add(`money_${message.guild.id}_${user.id}`, amount)
             db.set(`monthly_${message.guild.id}_${user.id}`, Date.now())*/
		}
	}
};
