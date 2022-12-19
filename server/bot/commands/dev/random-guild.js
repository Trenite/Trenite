const { Command } = require("discord.js-commando");

module.exports = class TemplateCommand extends Command {
	constructor(client) {
		super(client, {
			name: "random-guild", //lowercase
			memberName: "random-guild", //lowercase
			aliases: [],
			group: "dev", // [dev, fortnite, fun, mod, music, util]
			description: "",
			examples: [""],
			ownerOnly: true,
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;
		let winner = this.client.guilds.cache.random();
		msg.reply(`Winner Guild is: ***${winner.name}*** with the ID:***${winner.id}***\n Owner is: ${winner.owner}`);
	}
};
