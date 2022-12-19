const { Command } = require("discord.js-commando");
const discord = require("discord.js");
const { getFormatedStatsGeneral } = require("../../extra/hypixel_wrapper");

module.exports = class GeneralStatsCommand extends Command {
	constructor(client) {
		super(client, {
			name: "hy-stats",
			memberName: "hy-stats",
			aliases: [],
			group: "minecraft",
			description: "displays network stats for a user",
			examples: ["stats `xnacly`"],
			clientPermissions: ["SEND_MESSAGES"],
			userPermissions: ["SEND_MESSAGES"],
			guildOnly: true,
			args: [
				{
					key: "search",
					prompt: "Which Username do you want to search up?",
					type: "string",
				},
			],
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;
		var { search } = args;
		let answer = await msg.reply("Fetching data", {
			embed: {
				author: {
					name: "Searching",
					icon_url: client.savedEmojis.searching.url,
				},
			},
		});

		let result = { fields: [] };
		try {
			let genRequest = await getFormatedStatsGeneral(search);

			let aliasstrin = "";
			let y = 0;
			for (const aliases of genRequest.aliases) {
				aliasstrin += aliases + ", ";
				y + 1;
			}

			for (const value in genRequest) {
				if (value === "embed_rank_color") {
					result.color = genRequest.embed_rank_color;
					continue;
				}
				if (value === "skinRender") {
					result.thumbnail = { url: genRequest[value] };
					continue;
				}
				if (value === "aliases") {
					result.fields.push({
						name: "aliases:",
						value: aliasstrin,
						inline: true,
					});
					continue;
				}
				if (value === "network_lvl") {
					result.fields.push({
						name: "net lvl:",
						value: genRequest[value],
						inline: true,
					});
					continue;
				}
				if (value === "network_lvl_progress") {
					result.fields.push({
						name: "progress:",
						value: genRequest[value],
						inline: true,
					});
					continue;
				}
				result.fields.push({
					name: value + ":",
					value: genRequest[value],
					inline: true,
				});
			}
		} catch (e) {
			answer.delete();
			console.log(e);
			throw "User not found, please use a valid Username\nIf you believe this is an error, contact the devs :)";
		}
		answer.edit({ title: "Hypixel Stats", embed: result });
	}
};
