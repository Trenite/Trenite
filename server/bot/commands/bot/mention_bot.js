const { Command } = require("discord.js-commando");

module.exports = class MentionBotCommand extends Command {
	constructor(client) {
		super(client, {
			name: "",
			memberName: "",
			aliases: [],
			group: "bot",
			description: "",
			examples: [""],
			userPermissions: ["SEND_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES"],
		});
		client.on("message", this.onMessage.bind(this));
	}

	async onMessage(msg) {
		let { guild } = msg;
		if (msg.author.id === this.client.user.id) return; //check if userauthor is bot
		if (msg.content === `<@!${this.client.user.id}>`) {
			msg.reply({
				title: `${"Prefix: " + guild.commandPrefix || "no prefix required for dm's"}`,
			});
		} //check if message only mentions bot (prop better way --> research)
	}
};
