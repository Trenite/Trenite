const commando = require("discord.js-commando");
const fetch = require("node-fetch");
const { UserFlags } = require("discord.js");
const ms = require("parse-ms");

module.exports = class weeklyCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "weekly",
			memberName: "reward-weekly",
			aliases: [],
			group: "economy",
			description: "collect your weekly reward",
			examples: ["weekly]"],
			clientPermissions: ["SEND_MESSAGES"],
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;
		var user = msg.author;
		let timeout = 604800000;
		let amount = client.provider.get(guild, `weeklyamount`) || 50;

		const settings = await client.provider.get(guild, `weekly`);
		const currency = client.provider.get(guild, `currency`) || "coins";
		if (settings == false) throw `Weekly Reward was deactivated!`;

		var balance = (await this.client.provider.get(guild, "users")) || [];
		var playerbalance = balance.find((x) => x.id === user.id);
		if (!playerbalance) playerbalance = balance[balance.push({ id: user.id, balance: 0 }) - 1];

		let weekly = playerbalance.weekly;

		if (weekly !== null && timeout - (Date.now() - weekly) > 0) {
			let time = ms(timeout - (Date.now() - weekly));

			throw `You have already picked up your weekly reward! \nCan be picked up again in ${time.days}d ${time.hours}h`;
		} else {
			playerbalance.balance += amount;
			playerbalance.weekly = Date.now();
			await this.client.provider.set(guild, "users", balance);
			return msg.reply(`You successfully picked up your ${amount} ${currency} Reward`);
			/* db.add(`money_${message.guild.id}_${user.id}`, amount)
             db.set(`weekly_${message.guild.id}_${user.id}`, Date.now())*/
		}
	}
};
