const { Command } = require("discord.js-commando");
const { Message } = require("discord.js");

module.exports = class CreateEmojiCommand extends Command {
	constructor(client) {
		super(client, {
			name: "createemoji", //lowercase
			memberName: "createemoji", //lowercase
			aliases: [],
			group: "util", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, stats, util]
			description: "create a emoji",
			examples: ["avatar"],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
		});
	}

	async createEmoji(guild, msg) {
		var name = await msg.reply(
			"What should the Emoji name?\n 	Respond with ``cancel`` to cancel the command. The command will automatically be cancelled in 30 seconds."
		);
		var collected = await msg.channel
			.awaitMessages((message) => message.author.id === msg.author.id, {
				max: 1,
				time: 1000 * 30,
				errors: ["time"],
			})
			.catch((e) => {
				name.delete();
				throw "Timeout for emoji name exceeded";
			});
		collected = collected.first();
		var emojiName = collected.content;
		if (collected.content === "cancel") {
			return msg.reply("Command Canceled").then((x) => x.delete({ timeout: 3000 }));
		}
		var picture = await msg.reply(
			"Please upload the picture of the emoji\n 	Respond with ``cancel`` to cancel the command. The command will automatically be cancelled in 2 minutes."
		);
		var answer = await msg.channel
			.awaitMessages((message) => message.author.id === msg.author.id, {
				max: 1,
				time: 1000 * 60 * 2,
				errors: ["time"],
			})
			.catch((e) => {
				throw "Timeout for command response exceeded";
			});
		answer = answer.first();
		if (!answer.attachments.size) throw "Please upload a valid image";
		const emojiUrl = answer.attachments.first().proxyURL;
		await guild.emojis.create(emojiUrl, emojiName);
		msg.reply("Emoji created!", { title: "Emoji created!" })
	}

	async run(msg, args) {
		this.createEmoji(msg.guild, msg);


	}
};
