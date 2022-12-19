const commando = require("discord.js-commando");
const fetch = require("node-fetch");

module.exports = class FortniteStatsCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "fn-stats",
			memberName: "fn-stats",
			aliases: ["fnstats", "fortnite-stats", "fortnitestats"],
			group: "fortnite",
			description: "Fortnite Stats",
			examples: ["stats"],

			clientPermissions: ["SEND_MESSAGES"],
			args: [
				{
					key: "user",
					prompt: "Wich user? You can also write your epic Name.",
					type: "string",
				},
			],
		});
	}

	async getStats(msg, id) {
		var statsmsg = await msg.reply(
			"React with:\n 🌐 : for global Stats \n ⌨️ : for keyboard stats \n 📱 : for mobile stats \n 🎮 : for Console Stats	",
			"Fortnite Stats"
		);
		statsmsg.react("🌐");
		statsmsg.react("⌨️");
		statsmsg.react("📱");
		statsmsg.react("🎮");
		const filter = (reaction, user) => {
			return ["🌐", "⌨️", "📱", "🎮"].includes(reaction.emoji.name) && user.id === msg.author.id;
		};
		const collector = statsmsg.createReactionCollector(filter, {
			max: "1",
		});
		collector.on("collect", async (reaction, user) => {
			if (user.bot) return;
			var statsemoji = "undefinied";
			if (reaction.emoji.name === "🌐") {
				var stats = await fetch("https://fortnite-api.com/v1/stats/br/v2/" + id + "?image=all");

				stats = await stats.json();
				if (stats.status === 400) return msg.reply("You provide an invalid Epic Games Name.");
				var level = stats.data.battlePass ? stats.data.battlePass.level : 0;
				msg.reply({
					embed: {
						image: { url: stats.data.image },
						title: "Global Stats of ``" + stats.data.account.name + "`` (" + level + ")",
					},
				});
			} else if (reaction.emoji.name === "⌨️") {
				var stats = await fetch("https://fortnite-api.com/v1/stats/br/v2/" + id + "?image=keyboardMouse");

				stats = await stats.json();
				if (stats.status === 400) return msg.reply("You provide an invalid Epic Games Name.");
				var level = stats.data.battlePass ? stats.data.battlePass.level : 0;
				msg.reply({
					embed: {
						image: { url: stats.data.image },
						title: "Keyboard Stats of ``" + stats.data.account.name + "`` (" + level + ")",
					},
				});
			} else if (reaction.emoji.name === "📱") {
				var stats = await fetch("https://fortnite-api.com/v1/stats/br/v2/" + id + "?image=touch");

				stats = await stats.json();
				if (stats.status === 400) return msg.reply("You provide an invalid Epic Games Name.");
				var level = stats.data.battlePass ? stats.data.battlePass.level : 0;
				msg.reply({
					embed: {
						image: { url: stats.data.image },
						title: "Mobile Stats of ``" + stats.data.account.name + "`` (" + level + ")",
					},
				});
			} else if (reaction.emoji.name === "🎮") {
				var stats = await fetch("https://fortnite-api.com/v1/stats/br/v2/" + id + "?image=gamepad");

				stats = await stats.json();
				if (stats.status === 400) return msg.reply("You provide an invalid Epic Games Name.");
				var level = stats.data.battlePass ? stats.data.battlePass.level : 0;
				msg.reply({
					embed: {
						image: { url: stats.data.image },
						title: "Console Stats of ``" + stats.data.account.name + "`` (" + level + ")",
					},
				});
			}
		});
	}

	async run(msg, args) {
		const { client, guild } = msg;
		const { user } = args;

		const mentionedUser = msg.mentions.users.first();
		const epicGames = await this.client.bot.botmanager.fnbot;

		var users = this.client.provider.get(guild, "users");
		if (!users) users = [];

		var fnUserId;

		if (mentionedUser) {
			var userdb = users.find((user2) => user2.id === mentionedUser.id);
			if (!userdb) {
				return msg.reply("User is not verified and therefore his epic games name is not saved");
			}
			fnUserId = userdb.fn_id;
		} else {
			try {
				var account = await epicGames.getProfile(user);
			} catch (error) {
				return msg.reply("User not found");
			}
			fnUserId = account.id;
		}

		this.getStats(msg, fnUserId);
	}
};
