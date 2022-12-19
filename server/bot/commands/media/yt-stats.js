const { Command } = require("discord.js-commando");
const yts = require("yt-search");
const fetch = require("node-fetch");

module.exports = class YTstatsCommand extends Command {
	constructor(client) {
		super(client, {
			name: "yt-stats", //lowercase
			memberName: "yt-stats", //lowercase
			aliases: [],
			group: "media", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, setup, stats, util]
			description: "displays general info about the given youtube channel",
			examples: ["yt-stats xnacly"],
			userPermissions: ["SEND_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			args: [
				{
					key: "search",
					prompt: "Your youtube channel to display stats for",
					type: "string",
				},
			],
		});
	}

	async getStats(user) {
		let usser = user;
		let yt = await yts(user);
		user = yt.channels || yt.accounts;
		let u = user[0];
		if (!u) {
			throw "User not found";
		}
		yt = {
			name: u.name,
			des: u.description,
			id: u.id,
			idInt: "",
			url: u.url,
			pp_url: u.image,
			vidCount: u.videoCount,
			subs: "",
			views: "",
		};
		var key = "Basic eXRzYzpiZWk2emVleGFlMGFlaGFlMkhlZXcyZWVt";
		let f1 = await fetch("https://api.subcount.app/channel/search/" + usser, {
			headers: { authorization: key, origin: "https://subscribercounter.com" },
		});
		f1 = await f1.json();
		yt.idInt = f1.data[0].id.channelId;
		let f2 = await fetch("https://api.subcount.app/channel/info/" + yt.idInt, {
			headers: { authorization: key, origin: "https://subscribercounter.com" },
		});
		f2 = await f2.json();
		yt.subs = f2.data.items[0].statistics.subscriberCount;
		yt.views = f2.data.items[0].statistics.viewCount;
		return yt;
	}

	async run(msg, args) {
		var { search } = args;
		var { client, guild } = msg;
		var ytUser = await this.getStats(search);

		msg.channel.send({
			title: `Info about \`${ytUser.name}\``,
			embed: {
				url: ytUser.url,
				color: "#ff0000",
				description: ytUser.des,
				thumbnail: {
					url: ytUser.pp_url,
				},
				fields: [
					{
						name: "id",
						value: ytUser.id,
						inline: false,
					},
					{
						name: "total videos",
						value: ytUser.vidCount.toLocaleString(),
						inline: false,
					},
					{
						name: "total subs",
						value: Number(ytUser.subs).toLocaleString(),
						inline: false,
					},
					{
						name: "total views",
						value: Number(ytUser.views).toLocaleString(),
						inline: false,
					},
				],
			},
		});
	}
};
