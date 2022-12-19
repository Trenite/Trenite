const commando = require("discord.js-commando");
const { RichEmbed } = require("discord.js");

module.exports = class CustomsCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "fn-customs",
			memberName: "fn-customs",
			aliases: ["fncustoms", "fortnitecustoms", "fortnite-customs"],
			group: "fortnite",
			description: "1 vs 1 Elo",
			examples: ["fn-customs #channel solo"],
			devOnly: true,
			clientPermissions: ["SEND_MESSAGES"],
			args: [
				{
					key: "channel",
					prompt: "In what the channel should the customs be send?",
					type: "text-channel",
				},
				{
					key: "modus",
					prompt: "Which modus? \n options are solo, duo or squad",
					type: "string",

					validate: (text, msg) => {
						if (text === "solo") {
							return true;
						} else if (text === "duo") {
							return true;
						} else if (text === "squad") {
							return true;
						} else {
							return false;
						}
					},
				},
			],
		});

		this.emoji = "✅";
	} /*
	async removeWaiting(guild, id) {
		var waiting = this.getWaiting(guild);
		waiting = waiting.filter((wait) => wait.user != id);
		this.client.provider.set(guild, "customs", waiting);
		var queue = await this.getQueue(guild);
		if (queue) {
			try {
				queue.edit("", await this.createMessage(guild));
			} catch (error) {}
			var reaction = queue.reactions.get(this.emoji);
			if (reaction) {
				reaction.remove(id);
			}
		}
		return waiting;
	}*/

	async createMessage(guild, modus) {
		var waiting = this.getWaiting(guild);
		var fields = [];

		waiting.forEach((user) => {
			var member = guild.member(user.user);
		});

		return commando.createMessage(
			guild,
			"A new custom match has been opened. Please click on ✅ to get in the queue for the customs. \n \n Game Mod: \n ***Solo*** \n \n Status: ***Registration open!`",
			{
				title: "Custom Games",
				split: true,
				embed: {
					fields: [
						{ name: "Game Mode:", value: modus },
						{ name: "Game Mode:", value: modus },
						{ name: "Players:", value: modus },
					],
				},
			}
		).options;
	}

	async getQueue(guild) {
		var queueMsg = await this.client.provider.get(guild.id, "customMsg");
		var queueChannel = await this.client.provider.get(guild.id, "customChannel");

		if (queueMsg && queueChannel) {
			queueChannel = guild.channels.resolve(queueChannel);
			if (queueChannel) {
				return queueChannel.messages.fetch(queueMsg);
			}
		}
	}

	async fetch(guild) {
		try {
			var queue = await this.getQueue(guild);
			if (!queue) return;
			var botId = this.client.user.id;
			var emoji = this.emoji;
			var myElo;

			var collector = queue.createReactionCollector((reaction, user) => {
				return reaction.emoji.name === emoji && user.id != botId;
			}, {});

			//this.match(guild);

			collector.on("collect", (reaction, user) => {
				//var waiting = this.getWaiting(guild);
				//if (!waiting.find((x) => x.user == user.id)) {
				//waiting.push({ user: user.id, });
				//	this.client.provider.set(guild, "customs", waiting);
				//	this.match(guild);
				//} else {
				//}
				user.send("Nice");
			});

			collector.on("remove", async (reaction, user) => {
				if (!user) return;
				//	await this.removeWaiting(guild, user.id);
				//this.match(guild);
				user.send(".....");
			});
		} catch (error) {}
	}
	/*
	getWaiting(guild) {
		var waiting = this.client.provider.get(guild, "customs");
		if (!waiting) {
			this.client.provider.set(guild, "customs", []);
			waiting = [];
		} else {
		}
		// waiting.sort((a, b) => a.elo - b.elo - myElo);
		return waiting;
	}*/

	async run(msg, args) {
		var { client, guild } = msg;
		const { channel, modus } = args;
		const epicGames2 = this.client.bot.botmanager.fnbot2;
		var code = Math.floor(Math.random() * 900000 + 10000);

		var queueMsg = await this.client.provider.get(guild.id, "customMsg");
		var queueChannel = await this.client.provider.get(guild.id, "customChannel");

		if (queueMsg && queueChannel) {
			queueChannel = guild.channels.resolve(queueChannel);
			if (queueChannel) {
				queueChannel.messages
					.fetch(queueMsg)
					.then((queueMsg) => {
						queueMsg.delete();
					})
					.catch(() => {});
			}
		}

		// channel.send(`${code}`)
		msg.author.send(`${code}`, { title: "Code" });
		//var waiting = this.getWaiting(guild);
		/*const custommsg = await commando.createMessage(
			guild,
			"A new custom match has been opened. Please click on ✅ to get in the queue for the customs. \n \n Game Mod: \n ***Solo*** \n \n Status: ***Registration open!`",
			{
				title: "Custom Games",
				split: true,
				embed: {
					fields: [
						{ name: "Game Mode:", value: modus },
						{ name: "Game Mode:", value: modus },
						{ name: "Players:", value: 0 },
					],
				},
			}
		).options;*/
		const customs = await channel.send({
			title: "Custom Games",
			embed: {
				description:
					"A new custom match has been opened. Please click on ✅ to get in the queue for the customs. \n \n Game Mod: \n ***Solo*** \n \n Status: ***Registration open!",
				fields: [
					{ name: "Game Mode:", value: modus },
					{ name: "Game Mode:", value: modus },
					{ name: "Players:", value: 0 },
				],
			},
		});
		customs.react("✅");
		this.client.provider.set(guild.id, "customMsg", customs.id);
		this.client.provider.set(guild.id, "customChannel", channel.id);

		const custommsgdm = await msg.author.send({
			embed: {
				title: "Custom Games",
				split: true,
				embed: {
					fields: [
						{ name: "Game Mode:", value: modus },
						{ name: "Game Mode:", value: modus },
						{ name: "Players:", value: modus },
						{ name: "Dispatch:", value: "Click on ✅" },
						{ name: "Cancel:", value: "Click on ❌" },
					],
				},
			},
		});
		custommsgdm.react("❌");
		custommsgdm.react("✅");
		//var customs = await channel.send(custommsg);
		let customsfilter = async (reaction, user) => {
			const user1 = user;
			//const users = user.cache.forEach();

			const reaction1 = reaction;

			const filter = (reaction, user) => {
				return ["❌", "✅"].includes(reaction.emoji.name) && user.id === user1.id;
			};
			const collector = custommsgdm.createReactionCollector(filter, {});

			collector.on("collect", async (reaction, user) => {
				if (user.bot) return;
				//	if (user.id != this.client.id) {
				if (reaction.emoji.name === "❌") {
					user.send("Vorgang wurde abgebrochen.");

					//const reaction = collected.first();
					//	if (reaction.reaction.name === "❌") {
					customs.delete();
					msg.author.send(`<@${user.id}> canceld customs`);
					//	}
				} else if (reaction.emoji.name === "✅") {
					//customs.
					customs.delete();
					const dispatchmsg = await channel.send("Dispatch läuft ....", {
						title: "Fortnite Customs Dispatch",
					});
					const customsreactions = await customs.reactions.cache.find((r) => r.emoji.name === "✅");
					//	customsreactions.users.cache.fetch().then(async (user) => {
					customsreactions.users.cache.forEach(async (user) => {
						var users1 = this.client.provider.get(guild, "users");

						users1 = users1.find((user2) => user2.id === user.id);
						if (!users1) return user.send("You arent verified.");
						const fnid = users1.fn_id;
						const account = await epicGames2.getProfile(fnid);
						var { id, name } = account;
						epicGames2.addFriend(id);
						user.send(
							"You should get a fornite friend request from ``" + epicGames2.account.displayName + "``"
						);
						if (!(await epicGames2.friends.some(id))) {
							const event = await epicGames2.waitForEvent(`friend#${id}:added`, 120000);
						}
						user.send(
							"Please invite ``" + epicGames2.account.displayName + "`` and promote him to leader."
						);

						const inv = await epicGames2.waitForEvent("party:invitation", 30000);
						await inv.accept();
						await epicGames2.waitForEvent(`party:member#${epicGames2.account.id}:promoted`, 30000);
						epicGames2.party.setCustomKey(code);

						epicGames2.party.setPlaylist(epicGames2.Enums.Playlist.SOLO, epicGames2.Enums.Region.EUROPE);
						epicGames2.removeFriend(id);

						//	client.allusers.get(user, "fnid");
					});
				}
				this.client.provider.set(guild, "customDM", custommsgdm.id);
				//} else {
				//	}
			});
		};
		let customscollector = customs.createReactionCollector(customsfilter);

		this.fetch(customs);
	}
};
