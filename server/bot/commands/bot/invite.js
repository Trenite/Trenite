const { Command } = require("discord.js-commando");

module.exports = class InviteCommand extends Command {
	constructor(client) {
		super(client, {
			name: "invite", //lowercase
			memberName: "invite", //lowercase
			aliases: [],
			group: "bot", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "Sends the invite link for this bot",
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
		});
	}

	async run(msg, args, lang) {
		var { client } = msg;
		msg.reply(
			lang.inviteme +
				`[Invite](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot)`
		);
	}
};
