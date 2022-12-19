const { Command } = require("discord.js-commando");

module.exports = class SayCommand extends Command {
	constructor(client) {
		super(client, {
			name: "say", //lowercase
			memberName: "say", //lowercase
			aliases: ["announce"],
			group: "util", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "send a message from the bot with your specified message",
			examples: ['say "Welcome" "This is a example message"'],
			userPermissions: ["MANAGE_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "description",
					prompt: "What should I say?",
					type: "string",
					wait: 120,
				},
			],
		});
	}

	async run(msg, args) {
		const { client, guild } = msg;
		var { description } = args;

		msg.channel.send("", {
			noEmbed: true,
			embed: {
				color: 3553598,
				author: {
					name: guild.name,
					icon_url: guild.iconURL({ type: "jpg" }),
				},
				description,
			},
		});
	}
};
