const { Command } = require("discord.js-commando");
const fetch = require("node-fetch");

module.exports = class MojangStatusCommand extends Command {
	constructor(client) {
		super(client, {
			name: "mojang-stats", //lowercase
			memberName: "mojang-stats", //lowercase
			aliases: ["mojang-stats", "mojangstats"],
			group: "minecraft", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, stats, util]
			description: "displays ",
			examples: ["mojang-stats"],
			userPermissions: ["SEND_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
		});
	}

	async run(msg, args) {
		let embed = { fields: [] };
		let request = await fetch("https://api.mojang.com/orders/statistics", {
			method: "POST",
			body: JSON.stringify({ metricKeys: ["item_sold_minecraft"] }),
			headers: { "Content-Type": "application/json" },
		});
		request = await request.json();
		// {'total': 31720009, 'last24h': 13426, 'saleVelocityPerSeconds': 0.20333333}
		let y;
		let z;
		let cost = 26.8695;
		for (const x in request) {
			if (x == "saleVelocityPerSeconds") {
				z = request[x] * 60 * 60;
				embed.fields.push({
					name: "Games bought per hour:",
					value: `${z.toLocaleString()} \n\n${Number((z * cost).toFixed()).toLocaleString()} $\n`,
					inline: true,
				});
				continue;
			}
			switch (x) {
				case "total":
					y = "Total bought games:";
					z = request[x];
					embed.fields.push({
						name: y,
						value: `${z.toLocaleString()} \n\n${Math.round(Number(z * cost)).toLocaleString()} $\n`,
						inline: true,
					});
					continue;
				case "last24h":
					y = "Total bought games (24h):";
					z = request[x];
					embed.fields.push({
						name: y,
						value: `${z.toLocaleString()} \n\n${Math.round(Number(z * cost)).toLocaleString()} $\n`,
						inline: true,
					});
					continue;
			}
		}
		return msg.channel.send({ title: "Mojang-Stats", embed });
	}
};
