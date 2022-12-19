const { Command } = require("discord.js-commando");
const Discord = require("discord.js");
const fetch = require("node-fetch");
const mongoose = require("mongoose");
const OAuth2 = mongoose.model("OAuth2");
const _ = require("lodash");

module.exports = class TrelloCommand extends Command {
	constructor(client) {
		super(client, {
			name: "trello", //lowercase
			memberName: "trello", //lowercase
			aliases: [],
			group: "media", // [dev, fortnite, fun, mod, audio, util, media]
			description: "Automatically informs you, if you update your trello board",
			examples: ["trello"],
			userPermissions: ["MANAGE_WEBHOOKS"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
		});
		client.once(
			"providerReady",
			(async () => {
				client.server.on("trello", this.newAction.bind(this));
				client.server.on("oauth2#trello", this.login.bind(this));
				this.subscriptions = (await client.provider.get("global", "trello")) || [];
			}).bind(this)
		);
	}

	async login(oauth2) {
		const { discord, error } = oauth2;
		const user = this.client.users.resolve(discord);
		if (!user) return;
		user.send("", {
			title: "Trello Authorization",
			embed: {
				author: {
					name: error ? `Error: ${error.toString()}` : "Success",
					icon_url: this.client.savedEmojis[error ? "error" : "success"].url,
				},
			},
		});
	}

	async newAction(trello) {
		const subscriptions = this.subscriptions;
		const { model, action } = trello;
		const { type, date, data, memberCreator } = action;
		const { board, card } = data;

		var activeSubscription = subscriptions.find((x) => x.board === board.id);
		if (activeSubscription) {
			const channel = this.client.channels.resolve(activeSubscription.channel);
			if (channel) {
				var msg = await channel.messages.fetch(activeSubscription.msg).catch((e) => {});
				var oauth2 = await OAuth2.findOne({
					discord: activeSubscription.discord,
					provider: "trello",
				}).exec();
				const attachment = new Discord.MessageAttachment(
					await this.client.server.browser.trello.getImage({
						token: oauth2.access_token,
						id: board.id,
						card,
					}),
					"trello.png"
				);

				var answer = await channel.send({
					title: board.name,
					embed: {
						description: type,
						url: board.shortUrl,
						timestamp: date,
						image: {
							url: "attachment://trello.png",
						},
						author: {
							name: memberCreator.fullName,
							icon_url: memberCreator.avatarUrl
								? `${memberCreator.avatarUrl}/170.png`
								: this.client.user.displayAvatarURL({ size: 1024 }),
						},
					},
					files: [attachment],
				});
				if (msg) msg.delete();
				activeSubscription.msg = answer.id;
				await this.client.provider.set("global", "trello", this.subscriptions);
			}
		}
	}

	async run(msg, args) {
		const { client, guild, member, author, channel } = msg;

		const key = client.server.config.trello.key;
		const trello = await OAuth2.findOne({ discord: author.id, provider: "trello" }).exec();
		const redirect = `https://${client.bot.config.api.domain}/api/redirect/trello/${author.id}`;
		if (!trello) {
			member.send(`Connect your trello account:\n${redirect}`, { title: "Trello Connect" });
			return;
		}

		var boards = await fetch(
			`https://api.trello.com/1/members/me/boards?token=${trello.access_token}&key=${key}&fields=id,name,shortUrl,prefs&prefs_fields=backgroundImage`
		);
		boards = await boards.json().catch((e) => {
			throw "Access expired\nPlease login again: \n" + redirect;
		});

		if (!boards.length) throw "You have no boards, please create one and try again";

		const availableBoards = boards
			.map((board, index) => `${index + 1}. [${board.name}](${board.shortUrl})`)
			.join("\n");

		var waitfor = await msg.reply(
			`Enter your board number:\nAvailable boards:\n${availableBoards}`,
			{
				title: "Trello notification",
			}
		);
		var collected = await channel
			.awaitMessages((message) => message.author.id === author.id, {
				max: 1,
				time: 60000,
				errors: ["time"],
			})
			.catch((e) => {
				waitfor.delete();
				throw "Timeout exceeded";
			});
		collected = collected.first();
		waitfor.delete();
		collected.delete();

		const number = parseInt(collected.content) - 1;
		if (isNaN(number) || !boards[number]) return msg.reply("You entered a invalid number");

		var waiting = msg.reply("Generating Image ...", {
			embed: { author: { name: "Generating", icon_url: client.savedEmojis.searching.url } },
		});

		const board = boards[number];

		const image = await client.server.browser.trello.getImage({
			id: board.id,
			token: trello.access_token,
		});
		const attachment = new Discord.MessageAttachment(image, "image.png");
		waiting = await waiting;
		waiting.edit("Uploading Image ...", {
			title: "Trello",
			embed: { author: { name: "Uploading", icon_url: client.savedEmojis.searching.url } },
		});

		var subscriptions = this.subscriptions;
		const alreadySubscribed = subscriptions.find((x) => x.board === board.id);
		const action = alreadySubscribed ? "DISABLE" : "ENABLE";

		var answer = await msg.reply({
			embed: {
				title: board.name,
				description: `Do you want to **${action}** trello notifications?`,
				url: board.shortUrl,
				image: {
					url: "attachment://image.png",
				},
			},
			files: [attachment],
		});

		waiting.delete();

		await answer.react("✅");
		await answer.react("❌");

		var collected = await answer
			.awaitReactions(
				(reaction, u) =>
					u.id === member.id &&
					(reaction.emoji.name === "✅" || reaction.emoji.name === "❌"),
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
					client.server.emit("unsubscribe#trello", { token: trello.access_token, board });
					answer.edit(`You **UNSUBSCRIBED** and WON'T get notified!`, {
						title: "Trello Notifications disabled",
						embed: {
							url: board.shortUrl,
							image: {
								url: "attachment://image.png",
							},
							author: {
								name: "Success",
								icon_url: client.savedEmojis.success.url,
							},
						},
					});
					this.subscriptions = this.subscriptions.filter((x) => x.board !== board.id);
				} else {
					client.server.emit("subscribe#trello", { token: trello.access_token, board });
					answer.edit(
						`You will be notified in ${channel}, if something changes in you trello board!`,
						{
							title: "Trello Notifications enabled",
							embed: {
								url: board.shortUrl,
								image: {
									url: "attachment://image.png",
								},
								author: {
									name: "Success",
									icon_url: client.savedEmojis.success.url,
								},
							},
						}
					);
					this.subscriptions.push({
						discord: member.id,
						board: board.id,
						name: board.name,
						url: board.shortUrl,
						channel: channel.id,
						msg: answer.id,
					});
				}
				await client.provider.set("global", "trello", this.subscriptions);
				break;
			case "❌":
				throw "Trello Notifications aborted";
			default:
				throw "Unkown Emoji";
		}
	}
};
