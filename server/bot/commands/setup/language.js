const { Command } = require("discord.js-commando");
const language = require("../../language");

module.exports = class LanguageCommand extends Command {
	constructor(client) {
		super(client, {
			name: "language", //lowercase
			memberName: "language", //lowercase
			aliases: [],
			group: "setup", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, setup, stats, util]
			description: "Change the bot language for this server",
			examples: ["language english", "language german"],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "language",
					prompt: "Choose your language:\nAvailable Languages:\n- german\n- english",
					type: "string",
					validate: function (text, msg) {
						return !!client.lang[text];
					},
					default: "none", // standard value, if nothing is given, delete it if the arg is required
				},
			],
		});
	}

	async run(msg, args, lang, invite) {
		var { client, guild, author } = msg;
		var { language } = args;
		var flag;
		var languages = Object.values(client.lang);

		if (language === "none") {
			var question = await msg.reply(lang.choose);
			var flags = languages.map((x) => x.flag);
			for (var flag of flags) {
				question.react(flag);
			}
			flag = await question
				.awaitReactions(
					(reaction, user) =>
						(invite ? user.id !== this.client.user.id : user.id === author.id) &&
						flags.includes(reaction.emoji.name),
					{
						time: 1000 * 60 * 2,
						errors: ["time"],
						max: 1,
					}
				)
				.catch((e) => {
					throw lang.timeout;
				});
			flag = flag.first().emoji.name;
			await question.delete();
			language = languages.find((x) => x.flag === flag).name;
		}

		flag = languages.find((x) => x.name === language).flag;
		await client.provider.set(guild, "language", language);

		guild.lang = this.client.lang[language];
		lang = this.lang(guild);

		await msg.reply(lang.languageset.replace("{language}", guild.lang.language + " " + flag));
	}
};
