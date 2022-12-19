const commando = require("discord.js-commando");
const fetch = require("node-fetch");
const myconfig = require("../../../../config.json");

module.exports = class nsfwCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "nsfw",
			memberName: "nsfw",
			aliases: [],
			group: "nsfw",
			description: "Sends a random nsfw picture",
			examples: ["nsfw"],
			clientPermissions: ["SEND_MESSAGES"],
			nsfw: true,
		});
	}

	async requestRandomPost() {
		let subList = [
			"gonewild",
			"nsfw",
			"RealGirls",
			"NSFW_GIF",
			"holdthemoan",
			"BustyPetite",
			"LegalTeens",
			"cumsluts",
			"PetiteGoneWild",
		];
		let base_url = "https://www.reddit.com";
		var post = null;
		var r;
		try {
			do {
				r = await fetch(
					base_url + `/r/${subList[Math.floor(Math.random() * subList.length)]}/random/.json?limit=100`
				);
				r = await r.text();
				r = JSON.parse(r);
				post = r[0].data.children.find((x) => x.data.is_reddit_media_domain && x.data.url[8] === "i");
				if (!post) {
					post = null;
					continue;
				}

				post = {
					text: post.data.title,
					author: post.data.author,
					timestamp_upload: new Date(post.data.created * 1000),
					pic_link: post.data.url,
					post_link: base_url + post.data.permalink,
					upvotes: post.data.ups,
					sub_reddit: post.data.subreddit_name_prefixed,
				};
			} while (!post);
		} catch (error) {
			throw new Error("Picture not found: " + r);
		}
		return post;
	}

	async run(msg, args) {
		var { client, guild } = msg;
		let redditreq = await this.requestRandomPost();

		await msg.reply({
			title: redditreq.text,
			embed: {
				url: redditreq.post_link,
				footer: {
					text: `${redditreq.sub_reddit} | ${redditreq.author} | ⬆️ ${redditreq.upvotes}`,
				},
				timestamp: redditreq.timestamp_upload,
				image: {
					url: redditreq.pic_link,
				},
			},
		});
	}
};
