const { Command } = require("discord.js-commando");
const fetch = require("node-fetch");

module.exports = class TwitchCommand extends Command {
	constructor(client) {
		super(client, {
			name: "twitch", //lowercase
			memberName: "twitch", //lowercase
			aliases: ["twitch-notification", "twitchnotification"],
			group: "media", // [dev, fortnite, fun, mod, audio, util, media]
			description: "Manages twitch notifications",
			examples: ["twitch"],
			userPermissions: ["MANAGE_WEBHOOKS"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the object COMPLETLY
			args: [
				{
					key: "user",
					prompt:
						"Enter the twitch username/link\nOr enter list, if you want see all current subscriptions for this channel",
					type: "string",
					wait: 60,
				},
			],
		});
		client.once(
			"providerReady",
			(async () => {
				client.server.on("twitch", this.onLive.bind(this));
				this.subscriptions = (await client.provider.get("global", "twitch")) || [];
			}).bind(this)
		);
	}

	async onLive(stream) {
		const subscriptions = this.subscriptions;

		var activeSubscription = subscriptions.find((x) => x.id === stream.user_id);
		if (activeSubscription) {
			const channel = await this.client.channels.fetch(activeSubscription.channel).catch((e) => {});
			if (channel) {
				channel.send(`**${stream.user_name}** is online:\nhttps://twitch.tv/${stream.user_name}`, {
					noEmbed: true,
				});
			}
		}
	}

	async subscriptionManager({ msg, args, answer }) {
		const { client, guild, member, channel } = msg;
		var { user } = args;

		if (user.startsWith("http")) {
			user = user.slice(user.lastIndexOf("/") + 1);
		}

		user = await (
			await fetch(`https://api.twitch.tv/helix/users?login=${user}`, {
				headers: {
					"Client-ID": client.config.twitch.clientID,
					Authorization: `Bearer ${client.config.twitch.token}`,
				},
			})
		).json();
		if (!user || user.error || !user.data.length) throw "User not found";
		user = user.data[0];
		user.url = `https://twitch.tv/${user.login}`;

		var subscriptions = this.subscriptions;
		const userLink = `[${user.display_name}](${user.url})`;
		const alreadySubscribed = subscriptions.find((x) => x.id === user.id);
		const action = alreadySubscribed ? "DISABLE" : "ENABLE";

		answer.edit(
			`Do you want to **${action}** channel notifcations for ${userLink}, 
				if he goes live?
			`,
			{
				title: "Twitch Channel Notifications",
				embed: {
					url: user.url,
					image: {
						url: user.profile_image_url,
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
					client.server.emit("unsubscribe#twitch", { id: user.id });
					answer.edit(`You **UNSUBSCRIBED** from ${userLink} and WON'T get notified!`, {
						title: "Twitch Channel Notifications disabled",
						embed: {
							author: {
								name: "Success",
								icon_url: client.savedEmojis.success.url,
							},
						},
					});
					this.subscriptions = this.subscriptions.filter((x) => x.id !== user.id);
				} else {
					client.server.emit("subscribe#twitch", { id: user.id });
					answer.edit(`You will be notified in ${channel}, if ${userLink} posts a new video or goes live!`, {
						title: "Twitch Channel Notifications enabled",
						embed: {
							author: {
								name: "Success",
								icon_url: client.savedEmojis.success.url,
							},
						},
					});
					this.subscriptions.push({
						channel: msg.channel.id,
						id: user.id,
						name: user.display_name,
					});
				}
				await client.provider.set("global", "twitch", this.subscriptions);
				break;
			case "❌":
				throw "Twitch Channel Notifications aborted";
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
				.map((sub) => `- [${sub.name}](https://twitch.tv/${sub.name})`)
				.join("\n")}`,
			{ title: "Twitch Notification list" }
		);
	}

	async run(msg, args) {
		const { client, guild, member, author, channel } = msg;
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
