const { Command, CommandDispatcher } = require("discord.js-commando");
const { connect } = require("mongoose");

module.exports = class AutoRespondCommand extends Command {
	constructor(client) {
		super(client, {
			name: "autorespond", //lowercase
			memberName: "autorespond", //lowercase
			aliases: ["autoresponder", "auto-respond", "auto-response", "autoresponse", "auto-responder"],
			group: "setup", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "Automatically responds to certain words in a message",
			examples: ["autorespond list", "autorespond create", "autorespond remove"],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "trigger",
					prompt:
						"What do you want to do?\n``list`` if you want to see all the auto responds\n``create`` if you want to create a auto response\n``remove`` if you want to remove a auto response",
					type: "string",
					validate(text) {
						return ["list", "create", "remove"].includes(text);
					},
				},
			],
		});
		client.on("message", this.onMessage.bind(this));
	}

	async onMessage(msg) {
		if (msg.author.id === this.client.user.id) return;
		if (msg.channel.id === 0) return;
		if (!msg.guild) return;
		var commands = this.client.provider.get(msg.guild, "autoResponse") || [];
		var prefix = msg.guild.commandPrefix;
		const args = msg.content;

		var command = commands.find((x) => msg.content.toLowerCase().includes(x.trigger.toLowerCase()));

		if (!command) return;

		msg.channel.send(command.content, {
			noEmbed: true,
		});
	}

	async newAutoRespond(msg, commands) {
		var { guild } = msg;
		var name = await msg.reply(
			"What should the trigger?\n    Respond with ``cancel`` to cancel the command. The command will automatically be cancelled in 30 seconds.	"
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
		var nameText = collected.content;

		if (collected.content === "cancel") {
			return msg.reply("Command Canceled").then((x) => x.delete({ timeout: 3000 }));
		}
		var content = await msg.reply(
			"What should the bot response?\n 	Respond with ``cancel`` to cancel the command. The command will automatically be cancelled in 2 minutes."
		);
		var collected = await msg.channel
			.awaitMessages((message) => message.author.id === msg.author.id, {
				max: 1,
				time: 1000 * 60 * 2,
				errors: ["time"],
			})
			.catch((e) => {
				throw new Error("Timeout for command response exceeded");
			});
		collected = collected.first();

		if (!collected.content) return;
		var contentText = collected.content;
		content.delete();
		collected.delete();

		if (collected.content === "cancel") {
			return msg.reply("Command Canceled").then((x) => x.delete({ timeout: 3000 }));
		}
		if (this.client.registry.commands.find((command) => command.name === nameText))
			return msg.reply("It already has a autoresponse with the trigger ``" + nameText + "``");
		if (this.client.registry.commands.find((command) => command.aliases === nameText))
			return msg.reply("It already has a autoresponse with the trigger ``" + nameText + "``");
		const newcommandmsg = await msg.reply(
			"Do you want to create a autoresponse? \n Trigger:``" + nameText + "`` \n Response:``" + contentText + "``",
			{
				title: "Auto Response:",
			}
		);
		newcommandmsg.react("✅");
		newcommandmsg.react("❌");
		var collected = await newcommandmsg
			.awaitReactions(
				(reaction, u) =>
					u.id === msg.author.id && (reaction.emoji.name === "✅" || reaction.emoji.name === "❌"),
				{ time: 1000 * 30, errors: ["time"], max: 1 }
			)
			.catch((e) => {
				throw new Error("Timeout exceeded to respond");
			});
		collected = collected.first();
		newcommandmsg.reactions.removeAll();
		switch (collected.emoji.name) {
			case "✅":
				commands.push({ trigger: nameText, content: contentText });
				this.client.provider.set(guild, "autoResponse", commands);
				newcommandmsg.edit(
					"Auto Response Created. \n Trigger:``" + nameText + "`` \n Response:``" + contentText + "``",
					{
						title: "Auto Response:",
					}
				);
				break;
			case "❌": {
				newcommandmsg.edit("Canceld Command");
			}
		}
	}

	async removeAutoRespond(msg, commands) {
		var { guild } = msg;
		var prefix = msg.guild.commandPrefix;
		var command = await this.getCommand(msg, commands);
		commands = commands.filter((x) => x !== command);
		await this.client.provider.set(guild, "autoResponse", commands);
		msg.reply("``" + command.trigger + "`` was successfully removed.");
	}

	async listCommands(msg, commands) {
		if (!commands) return msg.reply("Your guild doesn't have auto responders");
		msg.reply(
			commands.map((command) => "``" + `${command.trigger}` + "`` ```" + command.content + "```").join("\n")
		);
	}

	async getCommand(msg, commands) {
		var { guild } = msg;
		var name = await msg.reply(
			"What is the trigger?\nRespond with ``cancel`` to cancel the command. The command will automatically be cancelled in 30 seconds.	"
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
		var nameText = collected.content;
		collected.delete();
		name.delete();

		if (collected.content === "cancel") {
			throw "Command Canceled";
		}
		var command = await commands.find((command) => command.trigger === nameText);
		if (!command) throw new Error("This auto reponse doesn't exist");

		return command;
	}

	async run(msg, args) {
		try {
			var { client, guild } = msg;
			var { trigger } = args;
			var commands = this.client.provider.get(guild, "autoResponse") || [];
			if (trigger === "list") return await this.listCommands(msg, commands);
			if (trigger === "remove") return await this.removeAutoRespond(msg, commands);
			if (trigger === "create") return await this.newAutoRespond(msg, commands);
		} catch (error) {
			msg.reply(error.toString());
		}
	}
};
