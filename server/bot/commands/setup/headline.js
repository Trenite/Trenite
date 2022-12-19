const { Command } = require("discord.js-commando");
const Canvas = require("canvas");
const { stripIndents } = require("common-tags");
const { generate } = require("image-manipulation-api/fetch");

module.exports = class CreateImageCommand extends Command {
	constructor(client) {
		super(client, {
			name: "headline", //lowercase
			memberName: "headline", //lowercase
			aliases: [
				"createimage",
				"imagecreate",
				"create-picture",
				"createpicture",
				"picture-create",
				"picturecreate",
				"headline",
				"header",
				"text2image",
				"texttoimage",
				"text2picture",
				"texttopicture",
				"profilepicture",
				"pb",
				"pp",
				"picture",
			],
			group: "setup", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "Creates a image headline of your text",
			examples: ["headline Rules"],
			userPermissions: ["SEND_MESSAGES"],
			clientPermissions: ["MANAGE_MESSAGES", "ADD_REACTIONS", "EMBED_LINKS"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "text",
					prompt: "Enter the text you want to create a headline of",
					type: "string",
					wait: 60,
				},
			],
		});
	}

	createImage(args) {
		return generate("/setup/headline", { ...args });
	}

	async onReaction(author, collector, lang, reaction, user) {
		try {
			const { message: msg, users } = reaction;
			users.remove(user);
			const { options } = msg;

			var question;
			switch (reaction.emoji.name) {
				case "🖼":
					question = lang.pleaseuploadimage;
					break;
				case "🇾":
					question = lang.enterY;
					break;
				case "🇽":
					question = lang.enterX;
					break;
				case "📝":
					question = lang.enterText.replace("{text}", options.text);
					break;
				case "🔤":
					question = lang.enterFont + "``" + font + "``";
					break;
				case "🎚️":
					question = lang.enterSize;
					break;
				case "🎨":
					question = lang.enterColor.replace("{color}", options.color);
					break;
				case "✅":
					var url = this.createImage(options);
					await msg.edit("", { noEmbed: true, embed: { color: "#2f3136", image: { url } } });
					await msg.reactions.removeAll();
					collector.stop();
					return;
			}
			var question = await msg.edit(question, {
				title: "Headline",
				embed: {
					image: {
						url: msg.embeds[0].image.url,
					},
				},
			});
			var answer = await msg.channel
				.awaitMessages((m) => m.author.id === author.id, { max: 1, time: 1000 * 60, errors: ["time"] })
				.catch((e) => {
					throw "";
				});
			answer = answer.first();
			answer.delete();

			switch (reaction.emoji.name) {
				case "🖼":
					if (answer.attachments.size) {
						options.background = answer.attachments.first().proxyURL;
					} else if (answer.content.startsWith("http")) {
						options.background = answer.content;
					} else {
						throw lang.pleaseUploadValidImage;
					}

					break;
				case "🇾":
					if (isNaN(parseInt(answer.content))) throw lang.notavalidnumber;
					options.y = parseInt(answer.content);
					break;
				case "🇽":
					if (isNaN(parseInt(answer.content))) throw lang.notavalidnumber;
					options.x = parseInt(answer.content);
					break;
				case "📝":
					options.text = answer.content;
					break;
				case "🔤":
					options.font = answer.content;
					break;
				case "🎚️":
					if (isNaN(parseInt(answer.content))) throw lang.notavalidnumber;
					options.size = answer.content;
					break;
				case "🎨":
					options.color = answer.content;
					break;
			}

			var url = this.createImage(options);
			await msg.edit(lang.embedDescription, {
				title: "Headline",
				embed: { image: { url } },
			});
		} catch (error) {
			var url = this.createImage(reaction.message.options);
			await reaction.message.edit(lang.embedDescription, {
				title: "Headline",
				embed: {
					image: { url },
					author: {
						name: "Error: " + error.toString(),
						icon_url: this.client.savedEmojis.error.url,
					},
				},
			});
		}
	}

	async editingMode(author, msg, lang) {
		const filter = (reaction, user) => user.id === author.id && reactions.includes(reaction.emoji.name);
		var reactions = ["🖼", "🔤", "🎚️", "🎨", "📝", "🇾", "🇽", "✅"];

		await msg.edit(lang.embedDescription, {
			title: "Headline",
			embed: {
				image: {
					url: msg.embeds[0].image.url,
				},
			},
		});
		const collector = msg.createReactionCollector(filter);
		collector.on("collect", this.onReaction.bind(this, author, collector, lang));
		for (var reaction of reactions) {
			await msg.react(reaction);
		}
		return reactions;
	}

	async sendImage(channel, image) {
		return channel.send("", {
			noEmbed: true,
			embed: {
				image: {
					url: image,
				},
			},
		});
	}

	async run(msg, args, lang) {
		var { client, channel, author, guild } = msg;
		const { text } = args;
		var options = {
			text,
		};
		var image = this.createImage(options);

		var headline = await this.sendImage(channel, image);
		headline.options = options;

		var reactions = ["🔧"];
		for (var reaction of reactions) {
			await headline.react(reaction);
		}

		const filter = (reaction, user) => user.id === author.id && reactions.includes(reaction.emoji.name);
		headline
			.awaitReactions(filter, {
				time: 15000,
				errors: ["time"],
				max: 1,
			})
			.then(async () => {
				await this.editingMode(author, headline, lang);
			})
			.catch(async (e) => {
				await headline.reactions.removeAll();
			});
	}
};
