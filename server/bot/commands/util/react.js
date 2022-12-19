const { Command } = require("discord.js-commando");
const { Error } = require("mongoose");

module.exports = class TemplateCommand extends Command {
	constructor(client) {
		super(client, {
			name: "react", //lowercase
			memberName: "react", //lowercase
			aliases: [],
			group: "util", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "React to the message before with an emoji",
			examples: ["react youtube"],
			userPermissions: ["USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"],
			clientPermissions: ["USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "emoji",
					prompt: "Enter the emoji name, I will try to find the emoji in all guilds",
					type: "string",
				},
			],
		});
	}

	async run(msg, args) {
		var { client } = msg;
		var { emoji } = args;
		var last = await msg.channel.messages.fetch({ limit: 2 }, false).catch((e) => {
			throw "Couldn't fetch the last message";
		});
		if (!last.size) throw "Couldn't fetch the last message";
		last = last.filter((x) => !(x.content || "").includes(`react`));
		last = last.first();
		if (!last) throw "Couldn't fetch the last message, make sure it's not a ``react`` message";

		var emojis = client.bot.botmanager.bots
			.map((bot) => {
				return bot.Client.emojis.cache.filter((x) => x.name.toLowerCase() === emoji).array();
			})
			.filter((x) => !!x)
			.flat();

		if (emojis == false) {
			emojis = client.bot.botmanager.bots
				.map((bot) => {
					return bot.Client.emojis.cache.filter((x) => x.name.toLowerCase().includes(emoji)).array();
				})
				.filter((x) => !!x)
				.flat();
		}

		if (emojis == false) {
			await last.react(args.emoji).catch(async (e) => {
				throw "I've tried very hard, but didn't found any emoji with the name: ``" + emoji + "``";
			});
			return;
		}

		emoji = emojis[Math.floor(Math.random() * emojis.length)];
		await last.react(emoji);
	}
};
