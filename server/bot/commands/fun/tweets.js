// (`https://nekobot.xyz/api/imagegen?type=trumptweet&text=${text}`)
const { Command } = require("discord.js-commando");
const fetch = require("node-fetch");
module.exports = class FakeTweetCommand extends Command {
	constructor(client) {
		super(client, {
			name: "fake-tweet", //lowercase
			memberName: "fake-tweet", //lowercase
			aliases: [],
			group: "fun", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, setup, stats, util]
			description: "Create a ",
			examples: [""],

			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			devonly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "text",
					prompt: "Your text",
					type: "string",
				},
				{
					key: "username",
					prompt: "Username",
					type: "string",
				},
			],
		});
	}

	async run(msg, args, lang) {
		var { client, author } = msg;
		var { text, username } = args;
		var tweet = await fetch("https://nekobot.xyz/api/imagegen?type=tweet&text=" + text + "&username=" + username);
		tweet = await tweet.json();
		if (!tweet.success) throw "Error, retry please.";
		msg.reply({ embed: { image: { url: tweet.message } } });
	}
};
