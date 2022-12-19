const commando = require("discord.js-commando");
const { stripIndent, oneLine } = require("common-tags");

module.exports = class AboutCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "about",
			memberName: "about",
			aliases: ["info"],
			group: "bot",
			description: "Info about the bot",
			examples: ["about"],
			clientPermissions: ["SEND_MESSAGES"],
		});
	}

	message(client, guild) {
		var prefix = guild.commandPrefix;

		var lang = this.lang(guild);

		return lang.about
			.replace(
				"{developer}",
				"Flam3rboy#3490, xnacly#6370, T Embolo#7574, Stefan#3460, EXCEPTION#1949, Timo#1000"
			)
			.replace(/{prefix}/g, prefix)
			.replace("{commands}", client.registry.commands.size)
			.replace("{mention}", `${client.user}`)
			.replace(
				"{invite}",
				`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`
			)
			.replace("{support}", "https://discord.gg/uP2yEqv")
			.replace("{help}", guild.lang.commands.bot.help.name);
	}

	async run(msg, args) {
		var { client, guild } = msg;

		msg.reply(this.message(client, guild));
	}
};
