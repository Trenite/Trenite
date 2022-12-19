const { Command } = require("discord.js-commando");
const fetch = require("node-fetch");
var key = "Basic eXRzYzpiZWk2emVleGFlMGFlaGFlMkhlZXcyZWVt";
const yts = require("yt-search");

module.exports = class YtSubsCommand extends Command {
	constructor(client) {
		super(client, {
			name: "yt-subs", //lowercase
			memberName: "yt-subs", //lowercase
			aliases: ["youtube-subs", "yt-subcount"],
			group: "media", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, setup, stats, util]
			description: "Display youtube subs on a channel.",
			examples: ["yt-subs create"],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "info",
					prompt:
						"What did you want to do?\n``list`` if you want to see all the yt subs counts\n``create`` if you want to create a sub count\n``remove`` if you want to remove a sub count.",
					type: "string",
					validate(text) {
						return ["list", "create", "remove"].includes(text);
					},
				},
			],
		});
		this.client.once(
			"providerReady",
			(() => {
				this.updateChannel.bind(this)();
			}).bind(this)
		);
	}

	async updateChannel() {
		var interval = this.client.setInterval(
			async function () {
				this.client.guilds.cache.forEach((guild) => {
					var ytdb = this.client.provider.get(guild, "YoutubeSubs");
					if (!ytdb) return;
					ytdb.forEach(async (ytdb) => {
						var channel = this.client.channels.resolve(ytdb.dcchannel);
						if (!channel) return;
						var subs = await this.getStats(ytdb.ytid);
						channel.edit({ name: ytdb.text + " " + subs });
					});
				});
			}.bind(this),
			1000 * 60 * 5 // 5 mins
		);
	}
	async ask(question, msg) {
		var name = await msg.reply(
			question +
				"\nRespond with ``cancel`` to cancel the command. The command will automatically be cancelled in 60 seconds."
		);
		var collected = await msg.channel
			.awaitMessages((message) => message.author.id === msg.author.id, {
				max: 1,
				time: 1000 * 60,
				errors: ["time"],
			})
			.catch((e) => {
				throw "Timeout for command name exceeded";
			});
		collected = collected.first();
		collected.delete();
		name.delete();
		name = collected.content;

		return name;
	}
	async getStats(user) {
		let f1 = await fetch("https://api.subcount.app/channel/search/" + user, {
			headers: {
				authorization: key,
				origin: "https://subscribercounter.com",
			},
		});
		f1 = await f1.json();
		var id = f1.data[0].id.channelId;
		let f2 = await fetch("https://api.subcount.app/channel/info/" + id, {
			headers: {
				authorization: key,
				origin: "https://subscribercounter.com",
			},
		});
		f2 = await f2.json();

		var subs = f2.data.items[0].statistics.subscriberCount;
		return subs;
	}
	async run(msg, args) {
		var { client, author } = msg;
		var { info } = args;
		var ytdb = this.client.provider.get(msg.guild, "YoutubeSubs");
		if (!ytdb) ytdb = [];
		if (info == "create") {
			var channel = await this.ask("The youtube channel id or youtube link.", msg).then(
				async (channel) => {
					if (channel == "cancel")
						return msg
							.reply("Command Canceled")
							.then((x) => x.delete({ timeout: 3000 }));
					var yt = await yts(channel);

					var user = yt.channels || yt.accounts;
					if (user.length === 0)
						throw "We didn't found a youtube channel with this name/id/link.";
					let u = user[0];
					yt = u.id;
					channel = yt;
					if (ytdb.find((x) => x.ytid === channel))
						return msg.reply("You already have a subcount with this youtube id.");

					var dcchannel = this.ask("Discord channel id:", msg).then(async (dcchannel) => {
						if (dcchannel == "cancel")
							return msg
								.reply("Command Canceled")
								.then((x) => x.delete({ timeout: 3000 }));
						if (ytdb.find((x) => x.dcchannel === dcchannel))
							return msg.reply(
								"You already have a subcount at this discord channel."
							);

						var text = this.ask(
							"What should be the channel name, we will add the subcount at the end: for example: subcount",
							msg
						).then(async (text) => {
							if (text == "cancel")
								return msg
									.reply("Command Canceled")
									.then((x) => x.delete({ timeout: 3000 }));

							ytdb.push({
								dcchannel: dcchannel,
								text: text,
								ytid: channel,
							});
							this.client.provider.set(msg.guild, "YoutubeSubs", ytdb);
							dcchannel = this.client.channels.resolve(dcchannel);
							var test = await this.getStats(yt);
							dcchannel.edit({
								name: text + " " + test,
							});
						});
					});
				}
			);
		}
		if (info == "remove") {
			this.ask("Which youtube id do you want to remove?", msg).then(async (ytid) => {
				var yt = await yts(ytid);

				if (yt.channels.size === 0) throw "We didn't found a youtube channel with this id.";
				var user = yt.channels || yt.accounts;
				let u = user[0];
				yt = u.id;
				channel = yt;
				var test = await ytdb.find((x) => x.ytid === channel);
				if (!test) throw "It doesnt have a sub count with this youtube id.";
				ytdb = ytdb.filter((x) => x.ytid !== test.ytid);

				msg.reply("``" + ytid + "`` was succesfully removed.");
				this.client.provider.set(msg.guild, "YoutubeSubs", ytdb);
			});
		}
		if (info == "list") {
			if (ytdb.size === 0) return msg.reply("Your guild doesnt have yt subs counts.");
			msg.reply(
				ytdb.map(
					(x) => "Discord Channel: ``" + x.dcchannel + "`` YT-ID: ``" + x.ytid + "``"
				)
			);
		}
	}
};
