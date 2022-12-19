const { Command } = require("discord.js-commando");

module.exports = class DescriptionCommand extends Command {
	constructor(client) {
		super(client, {
			name: "setdescription", //lowercase
			memberName: "setdescription", //lowercase
			aliases: [],
			group: "setup", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "set your userinfo description",
			examples: ["setdescription Hello! I am Conner!"],
			userPermissions: ["SEND_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "description",
					prompt: "What should be your description?",
					type: "string",
					wait: 120,
				},
			],
		});
	}

	async run(msg, args, lang) {
		const { client, guild } = msg;
		var { description } = args;
		lang = this.lang(guild);
		msg.reply(lang.sucessfullyset);
		client.allUsers.set(msg.author, "description", description);
	}
};
