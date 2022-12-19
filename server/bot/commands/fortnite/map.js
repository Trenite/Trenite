const Commando = require("discord.js-commando");

module.exports = class TemplateCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: "fn-map", //lowercase
			memberName: "fn-map", //lowercase
			aliases: ["fn-map", "fortnite-map", "fnmap", "fortnitemap"],
			group: "fortnite", // [dev, fortnite, fun, mod, music, util]
			description: "Send the current fortnite map.",
			examples: ["fortnite-map"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;

		msg.reply({
			embed: {
				image: {
					url: "https://media.fortniteapi.io/images/map.png?showPOI=true",
				},
			},
		});
	}
};
