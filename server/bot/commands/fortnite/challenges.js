const FortniteAPI = require("fortnite-api-io");

// Instantiate with API Credentials
const fortniteAPI = new FortniteAPI("f6fce57c-e09f7d37-9051f5b9-8c57160e");
const { Command } = require("discord.js-commando");
const fetch = require("node-fetch");
const Discord = require("discord.js");

module.exports = class ChallangesCommand extends Command {
	constructor(client) {
		super(client, {
			name: "fn-challenges", //lowercase
			memberName: "fn-challenges", //lowercase
			aliases: ["fnchallenges", "fortnitechallenges", "fortnite-challenges"],
			group: "fortnite", // [dev, fortnite, fun, mod, music, util]
			description: "Send the current challenges.",
			examples: ["fn-challenges"],
			devOnly: true,
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;

		const embed = new Discord.MessageEmbed()

			.setTitle("Fortnite Challenges")
			.setAuthor(msg.guild.name, msg.guild.iconURL({ dynamic: true, size: 256 }))
			.setColor(7506394)
			.setFooter(
				`${this.client.user.tag} | By: ${this.client.owners.map((x) => x.tag).join(", ")}`,
				this.client.user.displayAvatarURL({
					dynamic: true,
					size: 256,
					format: "jpg",
				})
			);
		const challenges = await fortniteAPI.listChallenges("current");
		const tournaments = await fortniteAPI.getTournaments();
		msg.channel.send({ embed }, { title: "Challenges" });
	}
};
