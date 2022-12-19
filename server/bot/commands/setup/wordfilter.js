const { Command, CommandDispatcher } = require("discord.js-commando");
// const { swearwords } = require("./../../ressources/wordsToFilter.json");
const { connect } = require("mongoose");
// var ActivityFlag = false;

module.exports = class BlackwordCommand extends Command {
	constructor(client) {
		super(client, {
			name: "wordfilter", //lowercase
			memberName: "wordfilter", //lowercase
			aliases: [
				"word-filter",
				"wordsfilter",
				"words-filter",
				"filter-word",
				"filter-words",
				"filterword",
				"filterwords",
				"sweardwords",
				"swear-words",
				"swear-word",
				"blackword",
				"black-word",
				"black-words",
				"blackwords",
				"word-black",
				"ban-words",
			],
			group: "setup", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "",
			examples: [""],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "trigger",
					prompt:
						"What did you want to do?\n``list`` if you want to see all the banned words\n``create`` if you want to add a banned word\n``remove`` if you want to remove a banned word",
					type: "string",
					validate(text) {
						return ["list", "create", "remove"].includes(text.split(" ")[0]);
					},
				},
			],
		});
		client.on("message", this.onMessage.bind(this));
	}

	async onMessage(msg) {
		if (!msg) return;
		if (msg.author.id === this.client.user.id) return;
		if (msg.channel.id === 0) return;
		if (!msg.guild) return;
		if (!msg.member) return;
		const lang = this.lang(msg.guild);
		//linkbuster = words.match(/(http|https):\/\/.+..+/g)
		var words = this.client.provider.get(msg.guild, "blackwords") || [];
		// if (!ActivityFlag) return;
		if (words.length == 0) return;
		// words = words.concat(swearwords);
		if (!msg.member.hasPermission("ADMINISTRATOR")) {
			let word = words.find((word) => msg.content.toLowerCase().includes(word.toLowerCase()));
			if (word) {
				msg.delete();
				msg.member.send(lang.wordisblocked.replace("{word}", word));
			}
		}
	}

	async newWord(msg, words, lang) {
		var { guild } = msg;
		var name = await msg.reply(lang.whichword);
		var collected = await msg.channel
			.awaitMessages((message) => message.author.id === msg.author.id, {
				max: 1,
				time: 1000 * 60,
				errors: ["time"],
			})
			.catch((e) => {
				throw lang.timeout;
			});
		collected = collected.first();
		name = collected.content;

		if (collected.content === "cancel") {
			return msg.reply(lang.commandcanceld);
		}
		const newWordmsg = await msg.reply(lang.doyouwantcreate.replace("{word}", name), {
			embed: {
				title: "Wordfilter",
			},
		});
		newWordmsg.react("✅");
		newWordmsg.react("❌");
		var collected = await newWordmsg
			.awaitReactions(
				(reaction, u) =>
					u.id === msg.author.id && (reaction.emoji.name === "✅" || reaction.emoji.name === "❌"),
				{ time: 1000 * 30, errors: ["time"], max: 1 }
			)
			.catch((e) => {
				throw lang.timeout;
			});
		collected = collected.first();
		newWordmsg.reactions.removeAll();
		switch (collected.emoji.name) {
			case "✅":
				{
					words.push(name);
					this.client.provider.set(guild, "blackwords", words);
					await newWordmsg.edit(lang.created.replace("{word}", name), {
						title: "Banned-Words",
					});
				}
				break;
			case "❌": {
				newWordmsg.edit(lang.commandcanceld);
			}
		}
	}

	async removeWord(msg, words, lang) {
		var guild = msg.guild;
		var blackword = await this.getWord(msg);
		words = words.filter((word) => word !== blackword);
		await this.client.provider.set(guild, "blackwords", words);
		msg.reply(lang.wordremoved);
	}

	async listwords(msg, words) {
		var guild = msg.guild;
		var words = this.client.provider.get(guild, "blackwords") || [];
		if (!words) return msg.reply(lang.nowords);
		msg.reply(words.map((blackword) => "" + `${blackword}`).join("\n"));
	}

	async getWord(msg, words, lang) {
		var guild = msg.guild;
		var words = this.client.provider.get(guild, "blackwords") || [];
		var name = await msg.reply(lang.whichword);
		var collected = await msg.channel
			.awaitMessages((message) => message.author.id === msg.author.id, {
				max: 1,
				time: 1000 * 60 * 10,
				errors: ["time"],
			})
			.catch((e) => {
				throw lang.timeout;
			});
		collected = collected.first();
		name = collected.content;

		if (collected.content === "cancel") {
			throw lang.commandcanceld;
		}
		var blackword = await words.find((blackword) => blackword === name);
		if (!blackword) throw lang.wordnotexists;

		return blackword;
	}

	async run(msg, args, lang) {
		var { client, guild } = msg;
		var { trigger } = args;
		trigger = trigger.split(" ")[0];
		var words = this.client.provider.get(guild, "blackwords") || [];
		lang = this.lang(guild);
		if (trigger === "list") return await this.listwords(msg, words, lang);
		if (trigger === "remove") return await this.removeWord(msg, words, lang);
		if (trigger === "create") return await this.newWord(msg, words, lang);
	}
};
