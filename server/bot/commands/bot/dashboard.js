const { Command } = require("discord.js-commando");

module.exports = class DashboardCommand extends Command {
	constructor(client) {
		super(client, {
			name: "dashboard", //lowercase
			memberName: "dashboard", //lowercase
			aliases: ["website"],
			group: "bot", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "Sends the dashboard link for this bot",
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
		});
	}

	async run(msg, args) {
		var { client } = msg;

		msg.reply(
			`You can manage all settings and setup the bot on the web dashboard:\nhttps://${client.bot.config.api.domain}`
		);
	}
};
