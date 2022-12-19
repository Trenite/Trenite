const { Command } = require("discord.js-commando");
const clearModule = require("clear-module");

module.exports = class RestartCommand extends Command {
	constructor(client) {
		super(client, {
			name: "restart", //lowercase
			memberName: "restart", //lowercase
			aliases: [],
			group: "dev", // [dev, fortnite, fun, mod, audio, util, media]
			description: "Restarts all bots",
			examples: ["restart"],
			devOnly: true,
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;

		await msg.reply(`Restarting ${client.bot.server.bots.bots.length} bots`);

		await client.bot.server.bots.restartAll();
	}
};
