const commando = require("discord.js-commando");
const fetch = require("node-fetch");
const { UserFlags } = require("discord.js");
const ms = require("parse-ms");

module.exports = class DailyCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "daily",
			memberName: "reward-daily",
			aliases: [],
			group: "economy",
			description: "collect your daily reward",
			examples: ["daily]"],
			clientPermissions: ["SEND_MESSAGES"],
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;
		var user = msg.author;
		let timeout = 86400000;
		let amount = client.provider.get(guild, `dailyamount`) || 10;

		const settings = await client.provider.get(guild, `daily`);
		const currency = client.provider.get(guild, `currency`) || "coins";

		if (settings == false) throw `Daily Reward was deactivated!`;

		var balance = (await this.client.provider.get(guild, "users")) || [];
		var playerbalance = balance.find((x) => x.id === user.id);
		if (!playerbalance) playerbalance = balance[balance.push({ id: user.id, balance: 0 }) - 1];

		let daily = playerbalance.daily;

		if (daily !== null && timeout - (Date.now() - daily) > 0) {
			let time = ms(timeout - (Date.now() - daily));

			throw `You have already picked up your daily reward! \nCan be picked up again in ${time.hours}h ${time.minutes}m`;
		} else {
			playerbalance.balance += amount;
			playerbalance.daily = Date.now();
			await this.client.provider.set(guild, "users", balance);
			return msg.reply(`You successfully picked up your ${amount} ${currency} Reward`);
			/* db.add(`money_${message.guild.id}_${user.id}`, amount)
             db.set(`daily_${message.guild.id}_${user.id}`, Date.now())*/
		}
	}
};
