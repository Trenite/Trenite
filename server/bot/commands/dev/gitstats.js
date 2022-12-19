const { Command } = require("discord.js-commando");
var { exec } = require("child_process");
const util = require("util");
exec = util.promisify(exec);

module.exports = class TemplateCommand extends Command {
	constructor(client) {
		super(client, {
			name: "git-stats", //lowercase
			memberName: "git-stats", //lowercase
			aliases: ["code-stats", "gitstats", "codestats"],
			group: "dev", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, setup, stats, util]
			description: `Regenerates the Git stats online at: https://${client.bot.config.api.domain}/stats/`,
			examples: [`https://${client.bot.config.api.domain}/stats/`],
			devOnly: true,
		});
	}

	async run(msg, args) {
		var { client } = msg;
		var answer = await msg.reply("Generating", {
			embed: {
				author: {
					name: "Generating",
					icon_url: client.savedEmojis.searching.url,
				},
			},
		});
		await exec(`cd ${__dirname}/../../../../ && git_stats generate -o stats/`);
		answer.edit("Generated", {
			embed: {
				author: {
					name: "Finished",
					icon_url: client.savedEmojis.success.url,
				},
			},
		});
	}
};
