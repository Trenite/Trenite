const { Command } = require("discord.js-commando");

module.exports = class TemplateCommand extends Command {
	constructor(client) {
		super(client, {
			name: "slowmode", //lowercase
			memberName: "slowmode", //lowercase
			aliases: ["slow"],
			group: "mod", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "set the slowmode of a channel, in seconds please!",
			examples: ["slowmode 10"],
			userPermissions: ["MANAGE_CHANNELS"],
			clientPermissions: ["MANAGE_CHANNELS"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			args: [
				{
					key: "amount",
					prompt: "How many seconds slowmode",
					type: "integer",
					min: 1,
					max: 21600,
					validate(text) {
						return !isNaN(Number(text)) || text === "off";
					},
				},
			],
		});
	}

	async run(msg, args) {
		var { amount } = args;
		if (isNaN(amount)) amount = 0;
		msg.channel.setRateLimitPerUser(amount);
		msg.reply("Slowmode for this channel was set to **" + amount + " seconds**!");
	}
};
