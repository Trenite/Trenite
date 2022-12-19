const { Command } = require("discord.js-commando");

module.exports = class CurrencyCommand extends Command {
	constructor(client) {
		super(client, {
			name: "set-currency", //lowercase
			memberName: "set-currency", //lowercase
			aliases: ["setcurrency", "currency-set", "currencyset"],
			group: "economy", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, setup, stats, util]
			description: "Set the Currency of your guild",
			examples: ["set-currency $"],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			args: [
				{
					key: "currency",
					prompt: "What should be the new Guild currency?",
					type: "string",
				},
			],
		});
	}

	async run(msg, args, lang) {
		const { client, guild } = msg;
		var { currency } = args;
		lang = this.lang(guild)
		await client.provider.set(guild, `currency`, currency);
		msg.reply(lang.success.replace("{currency}", currency), { title: lang.successTitle });
	}
};
