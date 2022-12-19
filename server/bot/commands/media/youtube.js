const { Command } = require("discord.js-commando");
const searchYoutube = require("youtube-api-v3-search");

module.exports = class YoutubeCommand extends Command {
	constructor(client) {
		super(client, {
			name: "youtube", //lowercase
			memberName: "youtube", //lowercase
			aliases: ["yt"],
			group: "media", // [dev, fortnite, fun, mod, audio, util]
			description: "Enable channel notifications on new YouTube videos",
			examples: ["youtube list", "youtube pewdiepie"],
			userPermissions: ["MANAGE_WEBHOOKS"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			args: [
				{
					key: "user",
					prompt:
						"Enter the youtube username/link\nOr enter list, if you want see all current subscriptions for this channel",
					type: "string",
					wait: 60,
				},
			],
		});
		var self = this;
		client.once("providerReady", async () => {
			client.server.on("youtube", self.newVideo.bind(this));
			self.subscriptions = (await client.provider.get("global", "youtube")) || [];
			client.setInterval(() => {
				self.renewSubscriptions.call(self);
			}, 1000 * 60 * 5);
			self.renewSubscriptions.call(self);
		});
	}

	async renewSubscriptions() {
		this.subscriptions = this.subscriptions.map((subscription) => {
			if (subscription.expires < Date.now()) {
				this.client.server.emit("subscribe#youtube", subscription);
				subscription.expires = Date.now() + 431000 * 1000;
			}
			return subscription;
		});
		await this.client.provider.set("global", "youtube", this.subscriptions);
	}

	async newVideo(video) {
		const subscriptions = this.subscriptions;
		const author = video["yt:channelId"];

		var activeSubscription = subscriptions.find((x) => x.id === author);
		if (activeSubscription) {
			const channel = this.client.channels.resolve(activeSubscription.channel);
			if (channel) {
				channel.send(`**${video.author.name}** just posted a video!\n${video.link}`, {
					noEmbed: true,
				});
			}
		}
	}

	randomKey() {
		var keys = this.client.config.google.youtube;
		return keys[Math.floor(Math.random() * keys.length)];
	}

	async subscriptionManager({ msg, args, answer }) {
		const { client, guild, member } = msg;
		const { user } = args;

		var result = await searchYoutube(this.randomKey(), {
			q: user,
			type: "channel",
			part: "snippet",
		});
		if (result.error || !result.items.length) {
			throw "User not found: **``" + user + "``**";
		}
		var channel = result.items[0].snippet;
		channel.url = `https://youtube.com/channel/${channel.channelId}`;
		channel.type = "channel";

		var subscriptions = this.subscriptions;
		const userLink = `[${channel.channelTitle}](${channel.url})`;
		const alreadySubscribed = subscriptions.find((x) => x.id === channel.channelId);
		const action = alreadySubscribed ? "DISABLE" : "ENABLE";

		answer.edit(
			`Do you want to **${action}** channel notifcations for ${userLink}, 
				if he posts a new video or goes live?
			`,
			{
				title: "YouTube Channel Notifications",
				embed: {
					url: channel.url,
					image: {
						url: channel.thumbnails.high.url,
					},
				},
			}
		);
		answer.react("✅");
		answer.react("❌");
		var collected = await answer
			.awaitReactions(
				(reaction, u) => u.id === member.id && (reaction.emoji.name === "✅" || reaction.emoji.name === "❌"),
				{ time: 1000 * 30, errors: ["time"], max: 1 }
			)
			.catch((e) => {
				throw "Timeout exceeded to respond";
			});
		collected = collected.first();
		answer.reactions.removeAll();
		switch (collected.emoji.name) {
			case "✅":
				if (alreadySubscribed) {
					client.server.emit("unsubscribe#youtube", { id: channel.channelId, type: channel.type });
					answer.edit(`You **UNSUBSCRIBED** from ${userLink} and WON'T get notified!`, {
						title: "YouTube Channel Notifications disabled",
						embed: {
							author: {
								name: "Success",
								icon_url: client.savedEmojis.success.url,
							},
						},
					});
					this.subscriptions = this.subscriptions.filter((x) => x.id !== channel.channelId);
				} else {
					client.server.emit("subscribe#youtube", { id: channel.channelId, type: channel.type });
					answer.edit(
						`You will be notified in ${msg.channel}, if ${userLink} posts a new video or goes live!`,
						{
							title: "YouTube Channel Notifications enabled",
							embed: {
								author: {
									name: "Success",
									icon_url: client.savedEmojis.success.url,
								},
							},
						}
					);
					this.subscriptions.push({
						channel: msg.channel.id,
						id: channel.channelId,
						name: channel.channelTitle,
						type: channel.type,
						expires: Date.now() + 431000 * 1000,
					});
				}
				await client.provider.set("global", "youtube", this.subscriptions);
				break;
			case "❌":
				throw "YouTube Channel Notifications aborted";
			default:
				throw "Unkown Emoji";
		}
	}

	async listSubscriptions({ msg, args }) {
		const { client, guild, member, channel } = msg;
		const { user } = args;

		var subscriptions = this.subscriptions.filter((x) => x.channel === channel.id);
		if (!subscriptions.length) return await msg.reply("You have no subscription in this channel");

		await msg.reply(
			`You have currently have ${subscriptions.length} active subscription/s:\n${subscriptions
				.map(
					(sub) =>
						`- [${sub.name}](https://www.youtube.com/${sub.type === "channel" ? "channel_id" : sub.type}/${
							sub.id
						})`
				)
				.join("\n")}`,
			{ title: "YouTube Notification list" }
		);
	}

	async run(msg, args) {
		const { client, guild, member } = msg;
		const { user } = args;

		if (user === "list") return await this.listSubscriptions({ msg, args });

		var answer = await msg.reply("Searching for **``" + user + "``**", {
			embed: {
				author: {
					name: "Searching ...",
					icon_url: client.savedEmojis.searching.url,
				},
			},
		});

		await this.subscriptionManager({ msg, args, answer });
	}
};
