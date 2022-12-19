const commando = require("discord.js-commando");
const fetch = require("node-fetch");
const fs = require("fs");
module.exports = class NewsCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "fn-news",
			memberName: "fn-news",
			aliases: ["fnnews", "fortnitenews", "fortnite-news"],
			group: "fortnite",
			description: "Display the fortnite news",
			examples: ["fn-news #news"],
			clientPermissions: ["SEND_MESSAGES"],
			args: [
				{
					key: "channel",
					default: "none",
					prompt: "In what the channel should the fortnite news be send?\nEnter disabled for none",
					type: "text-channel",
					validate: (text, msg) => {
						if (text === "disabled") {
							return true;
						} else if (msg.client.registry.types.get("text-channel").parse(text, msg)) {
							return true;
						}

						return false;
					},
				},
			],
		});
		this.client.on("providerReady", () => {
			this.generateNewsShop();
		});
		this.news = __dirname + "/../../ressources/fortnite/news/";
	}

	async generateNewsShop() {
		var interval = this.client.setInterval(
			async function () {
				try {
					try {
						var newsText = fs.readFileSync(this.news + "news.json", {
							encoding: "utf-8",
						});
					} catch (error) {
						var newsText = "{}";
						console.error("fn-news", error);
					}
					var news = await fetch("https://fortnite-api.com/v2/news/br");
					news = await news.json();
					var equal = newsText === JSON.stringify(news);
					//equal = false;

					if (!equal) {
						fs.writeFileSync(this.news + "news.json", JSON.stringify(news), {
							encoding: "utf-8",
						});
						if (!news.data.image) return console.log("Es gibt kein Image Bild für fn-news");
						this.client.guilds.cache.forEach(async (guild) => {
							var newschannel = await this.client.provider.get(guild, "fnnews");

							if (!newschannel) return;
							newschannel = await this.client.channels.resolve(newschannel);

							var datum = new Date();
							const tag = datum.getDate();
							datum = tag + "." + (datum.getMonth() + 1) + "." + datum.getFullYear();
							datum = new Date().toDateString();
							newschannel.send({
								title: "Fortnite News of " + datum,
								embed: {
									image: {
										url: news.data.image,
									},
								},
							});
						});
					} else {
						//News sind gleich
					}
				} catch (error) {}
			}.bind(this),
			60 * 1000 * 10
		);
	}

	async run(msg, args) {
		var { client, guild, channel } = msg;
		var channelArgs = args.channel;
		var news = await fetch("https://fortnite-api.com/v2/news/br");
		news = await news.json();
		var datum = new Date();
		const tag = datum.getDate();
		datum = tag + "." + (datum.getMonth() + 1) + "." + datum.getFullYear();
		datum = new Date().toDateString();
		//	datum = new Date(Date.now()).toLocaleString();
		channel.send({
			title: "Fortnite News of " + datum,
			embed: {
				image: {
					url: news.data.image,
				},
			},
		});
		//msg.reply({ embed: { image: { url: news.data.image } } });
		const member = guild.members.cache.find((user1) => user1.id === msg.author.id);
		if (channelArgs !== "disabled" && channelArgs !== "none" && channelArgs) {
			if (!member.permissions.has("MANAGE_GUILD"))
				return msg.reply(
					"The ``fortnite-news`` command requires you to have the " + `"manage server` + `" permission.`
				);
			const fnchannel = await this.client.channels.resolve(channelArgs);
			client.provider.set(guild, "fnnews", fnchannel.id);
			msg.reply("Fortnite News Channel set to " + fnchannel);

			fnchannel.send("This is now the fortnite News channel", {
				title: "Fortnite News",
			});
		} else {
			if (channelArgs === "none") return;
			if (!member.permissions.has("MANAGE_GUILD"))
				return msg.reply(
					"The ``fortnite-news`` command requires you to have the " + `"manage server` + `" permission.`
				);
			msg.reply("Fortnite Shop Channel disabled");
			var channeldb = await client.provider.get(guild, "fnnews");
			const channel1 = await client.channels.resolve(channeldb);
			channel1.send("This is not longer the fortnite news channel", {
				title: "Fortnite News",
			});
			client.provider.remove(guild, "fnnews");
		}
	}
};
