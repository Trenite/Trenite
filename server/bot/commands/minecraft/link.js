const { Command } = require("discord.js-commando");
const { checkKey, requestName } = require("../../extra/hypixel_wrapper");

module.exports = class MClinkCommand extends Command {
	constructor(client) {
		super(client, {
			name: "mc-link", //lowercase
			memberName: "mc-link", //lowercase
			aliases: [],
			group: "minecraft", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, setup, stats, util]
			description: "links discord to minecraft account",
			examples: [""],
			userPermissions: ["SEND_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: false,
			args: [
				{
					key: "apikey",
					prompt: "Your api-key, go onto mc.hypixel.net and type /api, after that copy and paste the key here",
					type: "string",
				},
			],
		});
	}

	async run(msg, args) {
		var { author } = msg;
		var { apikey } = args;
		let keyinfo = await checkKey(apikey);
		if (!keyinfo) { throw "Key not valid or internal Error"; }
		let userinfo = await requestName(keyinfo);
		if (!userinfo) { throw "Key not valid or internal Error"; }
		let userstring = `linked ${msg.author.tag}\n to: \n${userinfo.name} | ${userinfo.id}`;
		this.client.allUsers.set(author, "mc-uuid", userinfo.id);
		return msg.reply(userstring);
	}
};
