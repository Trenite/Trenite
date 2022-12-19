const { Command } = require("discord.js-commando");

module.exports = class VoteCommand extends Command {
	constructor(client) {
		super(client, {
			name: "vote", //lowercase
			memberName: "vote", //lowercase
			aliases: [],
			group: "bot", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "Help the developer of the bot and vote for it, thanks 🤝",
			examples: ["https://top.gg/bot/689577516150816866/vote"],
			userPermissions: ["SEND_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: false,
		});

		this.client.once(
			"providerReady",
			(() => {
				if (this.client.trenite) {
					this.client.server.on("vote", this.vote.bind(this));
				}
			}).bind(this)
		);
	}

	async vote(user, doublevote) {
		try {
			var votes = this.client.allUsers.get(user, "votes") || 0;
			this.client.allUsers.set(user, "votes", votes + 1);
			this.client.allUsers.set(user, "lastVote", Date.now());

			user = await this.client.users.fetch(user);
			if (!user) return;

			var lang = this.lang({ lang: this.client.en });

			var description = doublevote
				? lang.doublevote.replace("{user}", user.tag)
				: lang.onevote.replace("{user}", user.tag);

			var msg = {
				title: "Vote",
				embed: {
					description,
					author: null,
					footer: null,
					url: "https://top.gg/bot/689577516150816866/vote",
				},
			};

			this.client.treniteLog(msg.embed.description, { ...msg, channel: "votelog" });
			await user.send(msg);
		} catch (error) {}
	}

	async run(msg, args, lang) {
		msg.reply(lang.vote + `https://top.gg/bot/736330433913946162/vote`);
	}
};
