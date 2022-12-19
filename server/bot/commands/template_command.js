const { Command } = require("discord.js-commando");

module.exports = class TemplateCommand extends Command {
	constructor(client) {
		super(client, {
			name: "", //lowercase
			memberName: "", //lowercase
			aliases: [],
			autoAliases: true,
			group: "", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, setup, stats, info, util, eco]
			description: "",
			examples: [""],
			userPermissions: [""],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "search",
					prompt: "Your search query or URL",
					type: "string",
					default: "chill music", // standard value, if nothing is given, delete it if the arg is required
				},
			],
		});
	}

	async run(msg, args, lang) {
		var { client, author } = msg;
	}
};
