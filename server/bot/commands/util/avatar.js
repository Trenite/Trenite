const { Command } = require("discord.js-commando");
const { Message } = require("discord.js");

module.exports = class avatarCommand extends Command {
	constructor(client) {
		super(client, {
			name: "avatar", //lowercase
			memberName: "avatar", //lowercase
			aliases: [],
			group: "util", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, stats, util]
			description: "gets the avatar of a user",
			examples: ["avatar"],
			userPermissions: ["SEND_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "user",
					prompt: "Your user",
					type: "user",
					default: "none",
				},
			],
		});
	}

	async run(msg, args) {
		var { user } = args;
		if (user === "none") user = msg.author;

		msg.reply(`Avatar of ${user}`, {
			embed: {
				image: {
					url: user.displayAvatarURL({ dynamic: true, size: 2048, format: "png" }),
				},
			},
		});
	}
};
