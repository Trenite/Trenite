const { Command, CommandDispatcher } = require("discord.js-commando");
const { connect } = require("mongoose");
const { Collection, MessageAttachment } = require("discord.js");
const fs = require("fs");

module.exports = class ChatLogCommand extends Command {
	constructor(client) {
		super(client, {
			name: "chatlog", //lowercase
			memberName: "chatlog", //lowercase
			aliases: [],
			group: "util", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "Create a chatlog",
			examples: ["chatlog"],
			userPermissions: ["MANAGE_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "trigger",
					prompt:
						"What do you want to do?\n``list`` if you want to see all created chatlogs\n``create`` if you want to create a chatlog\n``remove`` if you want to remove a chatlog \n``get`` if you want to get a chatlog",
					type: "string",
					validate(text) {
						return ["list", "create", "remove", "get"].includes(text.split(" ")[0]);
					},
				},
			],
		});
	}

	async newChatlog(msg, chatlogs) {
		var { guild } = msg;
		var name = await msg.reply(
			"How many messages do you want to log?\n    Respond with ``cancel`` to cancel the command. The command will automatically be cancelled in 30 seconds.	"
		);
		var collected = await msg.channel
			.awaitMessages((message) => message.author.id === msg.author.id, {
				max: 1,
				time: 1000 * 30,
				errors: ["time"],
			})
			.catch((e) => {
				name.delete();
				throw new Error("Timeout for command name exceeded");
			});
		collected = collected.first();
		name.delete();
		collected.delete();
		var amount = parseInt(collected.content);
		if (isNaN(collected.content)) msg.reply("That's not a valid number");
		if (collected.content === "cancel") {
			return msg.reply("Command Canceled").then((x) => x.delete({ timeout: 3000 }));
		}

		var amountFetch = amount;

		var messages = new Collection();

		do {
			var test = amountFetch > 100 ? 100 : amountFetch;
			var newMsgs = await msg.channel.messages.fetch(
				{ limit: test, before: messages.last() ? messages.last().id : null },
				false
			);
			amountFetch -= test;
			messages = messages.concat(newMsgs);
		} while (newMsgs.size > 0 && amountFetch !== 0);

		const newChatlogMSG = await msg.reply(
			(
				"Do you want to create a chatlog? \n" +
				messages.map((message) => `${message.author.tag}: ${message.content}`).join("\n")
			).slice(0, 2048),
			{
				title: "Chat Log:",
			}
		);
		newChatlogMSG.react("✅");
		newChatlogMSG.react("❌");
		var collected = await newChatlogMSG
			.awaitReactions(
				(reaction, u) =>
					u.id === msg.author.id &&
					(reaction.emoji.name === "✅" || reaction.emoji.name === "❌"),
				{ time: 1000 * 30, errors: ["time"], max: 1 }
			)
			.catch((e) => {
				throw new Error("Timeout exceeded to respond");
			});
		collected = collected.first();
		newChatlogMSG.reactions.removeAll();
		switch (collected.emoji.name) {
			case "✅":
				do {
					var id = Math.random().toString(10).substr(2, 6); //9
				} while (chatlogs.find((x) => x.id === id));

				chatlogs.push({
					id: id,
					content: messages
						.map((message) => `${message.author.tag}: ${message.content}`)
						.join("\n"),
					date: Date.now(),
					author: msg.author.tag,
				});
				this.client.provider.set(guild, "chatlogs", chatlogs);
				newChatlogMSG.edit(
					"Chatlog Created!. \nID: " +
						id +
						" \n" +
						messages
							.map((message) => `${message.author.tag}: ${message.content}`)
							.join("\n"),
					{
						title: "Chatlog",
					}
				);
				break;
			case "❌": {
				newChatlogMSG.edit("Canceld Command");
			}
		}
	}

	async removeChatlog(msg, chatlogs) {
		var { guild } = msg;
		var chatlog = await this.getChatlog(msg, chatlogs);
		chatlogs = chatlogs.filter((x) => x !== chatlog);
		await this.client.provider.set(guild, "chatlogs", chatlogs);
		msg.reply("Chatlog was successfully removed.");
	}

	async listchatlogs(msg, chatlogs) {
		if (!chatlogs) return msg.reply("Your guild doesn't have chatlogs");
		msg.reply(
			chatlogs
				.map(
					(chatlog) =>
						`**Chatlog#${chatlog.id}** \nCreated at: ${new Date(
							chatlog.date
						).toLocaleString()}\nCreated by: ${chatlog.author}`
				)
				.join("\n\n") + "\n"
		);
	}

	async getChatlog(msg, chatlogs) {
		var { guild } = msg;
		var name = await msg.reply(
			"What is the Chatlog id?\nRespond with ``cancel`` to cancel the command. The command will automatically be cancelled in 30 seconds.	"
		);
		var collected = await msg.channel
			.awaitMessages((message) => message.author.id === msg.author.id, {
				max: 1,
				time: 1000 * 60 * 10,
				errors: ["time"],
			})
			.catch((e) => {
				throw new Error("Timeout for command exceeded");
			});
		collected = collected.first();
		var id = collected.content;
		collected.delete();
		name.delete();

		if (collected.content === "cancel") {
			throw "Command Canceled";
		}
		var chatlog = await chatlogs.find((chatlog) => chatlog.id === id);
		if (!chatlog) throw new Error("This chatlog doesn't exist");

		return chatlog;
	}

	async getChatLogByID(msg, chatlogs) {
		var { guild } = msg;
		var name = await msg.reply(
			"Which ID have the chatlog which you want to see?\n    Respond with ``cancel`` to cancel the command. The command will automatically be cancelled in 30 seconds.	"
		);
		var collected = await msg.channel
			.awaitMessages((message) => message.author.id === msg.author.id, {
				max: 1,
				time: 1000 * 30,
				errors: ["time"],
			})
			.catch((e) => {
				name.delete();
				throw new Error("Timeout for command name exceeded");
			});
		collected = collected.first();
		name.delete();
		collected.delete();
		var id = collected.content;
		if (isNaN(collected.content)) msg.reply("That's not a valid number");
		if (collected.content === "cancel") {
			return msg.reply("Command Canceled").then((x) => x.delete({ timeout: 3000 }));
		}
		var chatlog = chatlogs.find((x) => x.id == id);
		if (!chatlog) throw "There is no Chatlog with this id bro!";

		/*msg.reply("```" + chatlog.content + "```", { title: `Chatlog with ID: ${id}`, embed: { timestamp: new Date(chatlog.date).toISOString(), footer: { name: `Created by: ${chatlog.author}` } } })*/
		var messageLog =
			`Chatlog with ID: ${id} \nCreated at: ` +
			new Date(chatlog.date).toLocaleDateString() +
			`\nCreated by ${chatlog.author} \n\nContent: ${chatlog.content}`;
		var buffer = Buffer.from(messageLog, "utf8");
		var attachment = new MessageAttachment(buffer, "chatlog.rtf");

		msg.reply(
			`\nCreated at: ` +
				new Date(chatlog.date).toLocaleDateString() +
				`\nCreated by ${chatlog.author}`,
			{
				title: `Chatlog with ID: ${id}`,
				files: [attachment],
			}
		);
	}

	async run(msg, args) {
		try {
			var { client, guild } = msg;
			var { trigger } = args;
			var chatlogs = this.client.provider.get(guild, "chatlogs") || [];
			if (trigger === "list") return await this.listchatlogs(msg, chatlogs);
			if (trigger === "remove") return await this.removeChatlog(msg, chatlogs);
			if (trigger === "create") return await this.newChatlog(msg, chatlogs);
			if (trigger === "get") return await this.getChatLogByID(msg, chatlogs);
		} catch (error) {
			msg.reply(error.toString());
		}
	}
};
