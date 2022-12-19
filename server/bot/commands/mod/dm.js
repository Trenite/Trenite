const commando = require("discord.js-commando");

module.exports = class DMCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "dm",
			memberName: "dm",
			aliases: ["direktnachricht",
				"directmessage"],
			group: "util",
			description: "send a direct message to a user",
			examples: ["dm"],
			ownerOnly: true,
			userPermissions: ["MANAGE_MESSAGES"],
			clientPermissions: ["MANAGE_MESSAGES"],
			args: [
				{
					key: "user",
					prompt: "Which user should received a message?",
					type: "user",
				},
				{
					key: "dmmessage",
					prompt: "Which message should he receive?",
					type: "string",
					wait: 120,
				},
			],
		});
	}

	async run(msg, args, lang) {
		var { client, guild } = msg;
		const { dmmessage, user } = args;
		lang = this.lang(guild)
		await user
			.send(dmmessage, {
				title: " ",
				embed: {
					footer: {
						icon_url: msg.guild.iconURL({ format: "jpg" }),
						text: msg.guild.name,
					},
					author: {
						name: msg.author.tag,
						icon_url: msg.author.displayAvatarURL({ format: "jpg" }),
					},
				},
			})
			.catch((error) => {
				throw lang.dmClosed;
			});

		let reply = await msg.reply(lang.success);
	}
};
