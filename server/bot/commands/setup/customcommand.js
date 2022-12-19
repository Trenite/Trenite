const { Command, CommandDispatcher } = require("discord.js-commando");
const { connect } = require("mongoose");

module.exports = class CustomCommandCommand extends Command {
	constructor(client) {
		super(client, {
			name: "custom-command", //lowercase
			memberName: "custom-command", //lowercase
			aliases: [
				"custom-command",
				"custom-commands",
				"custom-cmd",
				"cmd–custom",
				"costom-command",
				"costom-commands",
				"costom-cmd",
			],
			autoAliases: true,
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
						"What do you want to do?\n``list`` if you want to see all the custom commands\n``create`` if you want to create a custom command\n``remove`` if you want to remove a custom command",
					type: "string",
					validate(text) {
						return ["list", "create", "remove"].includes(text.split(" ")[0]);
					},
					sub: {
						list: [],
						create: [
							{
								key: "name",
								prompt: "What is the command name?",
								type: "string",
							},
							{
								key: "name",
								prompt: "What should the bot respond?",
								type: "string",
							},
						],
						remove: [
							{
								key: "name",
								prompt: "What is the command name?",
								type: "string",
							},
						],
					},
				},
			],
		});
		client.on("message", this.onMessage.bind(this));
	}

	async onMessage(msg) {
		if (msg.author.id === this.client.user.id) return;
		if (msg.channel.id === 0) return;
		var prefix;
		if (msg.guild) {
			var commands = this.client.provider.get(msg.guild, "customCommands") || [];

			prefix = msg.guild.commandPrefix;
			const args = msg.content.slice(prefix.length).split(" ");
			var command = await commands.find((x) => x.trigger === args[0]);
			if (!command) return;
			if (msg.content.startsWith(prefix + command.trigger)) {
				msg.channel.send(command.content, {
					noEmbed: true,
				});
			}

		}

		if (msg.channel.type == "dm") {
			var guilds = this.client.guilds.cache.filter(x => x.member(msg.author.id));
			var commands = guilds.map(guild => this.client.provider.get(guild, "customCommands") || []) || []

			command = commands.flat().filter((x) => x.trigger === msg.content).forEach(command => {
				if (!command) return;
				if (!command.dmExecutable) return;
				if (command.dmExecutable.toLowerCase() === "true") {
					if (msg.content.startsWith(command.trigger)) {
						msg.author.send(command.content, {
							noEmbed: true,
						});
					}
				}
			});
		}

	}

	async newCommand(msg, commands, lang) {
		var { guild } = msg;

		var name = await msg.reply(lang.whatshouldcommandname);
		var collected = await msg.channel
			.awaitMessages((message) => message.author.id === msg.author.id, {
				max: 1,
				time: 1000 * 30,
				errors: ["time"],
			})
			.catch((e) => {
				name.delete();
				throw lang.timeout;
			});
		collected = collected.first();
		name.delete();
		collected.delete();
		var nameText = collected.content;

		if (collected.content === "cancel") {
			return msg.reply(lang.commandcanceld).then((x) => x.delete({ timeout: 3000 }));
		}
		var content = await msg.reply(lang.whatshouldbotresponse);
		var collected = await msg.channel
			.awaitMessages((message) => message.author.id === msg.author.id, {
				max: 1,
				time: 1000 * 60 * 2,
				errors: ["time"],
			})
			.catch((e) => {
				throw lang.timeout;
			});
		collected = collected.first();

		if (!collected.content) return;
		var contentText = collected.content;
		content.delete();
		collected.delete();

		if (collected.content === "cancel") {
			return msg.reply(lang.commandcanceld).then((x) => x.delete({ timeout: 3000 }));
		}

		//DM EXECUTABLE
		var dmexe = await msg.reply(lang.shouldDMExecutable);
		var collected = await msg.channel
			.awaitMessages((message) => message.author.id === msg.author.id, {
				max: 1,
				time: 1000 * 60 * 2,
				errors: ["time"],
			})
			.catch((e) => {
				throw lang.timeout;
			});
		collected = collected.first();

		if (!collected.content) return;
		var dmExecutable = collected.content;
		dmexe.delete();
		collected.delete();

		if (collected.content === "cancel") {
			return msg.reply(lang.commandcanceld).then((x) => x.delete({ timeout: 3000 }));
		}

		if (collected.content == "true" || "false".toLowerCase()) {
			if (this.client.registry.commands.find((command) => command.name === nameText))
				return msg.reply(lang.alreadyexists.replace("{commandName}", nameText));
			if (this.client.registry.commands.find((command) => command.aliases === nameText))
				return msg.reply(lang.alreadyexists.replace("{commandName}", nameText));
			if (commands.find(command => command.trigger === nameText)) return msg.reply(lang.alreadyexists.replace("{commandname}", nameText));
			const newcommandmsg = await msg.reply(
				lang.doyouwantcreate.replace("{guildPrefix}", guild.commandPrefix).replace("{commadname}", nameText).replace("{commandContent}", contentText).replace("{dm}", dmExecutable),
				{
					title: "Custom Command:",
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
					throw lang.timeout;
				});
			collected = collected.first();
			newcommandmsg.reactions.removeAll();
			switch (collected.emoji.name) {
				case "✅":
					commands.push({ trigger: nameText, content: contentText, dmExecutable: dmExecutable });
					this.client.provider.set(guild, "customCommands", commands);
					newcommandmsg.edit(lang.commandcreated.replace("{guildPrefix}", guild.commandPrefix).replace("{commadname}", nameText).replace("{commandContent}", contentText).replace("{dm}", dmExecutable),
						{
							title: "Custom Command:",
						}
					);
					break;
				case "❌": {
					newcommandmsg.edit(lang.commandcanceld);
				}
			}

		} else {
			return msg.reply(lang.notbooelan).then((x) => x.delete({ timeout: 3000 }));
		}


	}

	async removeCommand(msg, commands, lang) {
		var { guild } = msg;
		var prefix = msg.guild.commandPrefix;
		var command = await this.getCommand(msg, commands);
		commands = commands.filter((x) => x !== command);
		await this.client.provider.set(guild, "customCommands", commands);
		msg.reply(lang.commandremoved.replace("{guildPrefix}", prefix).replace("{commadname}", command.trigger));
	}

	async listCommands(msg, commands, lang) {
		if (!commands) return msg.reply(lang.nocommands);
		var prefix = msg.guild.commandPrefix;
		msg.reply(
			commands
				.map((command) => "``" + `${prefix}${command.trigger}` + "`` ```" + command.content + "```")
				.join("\n")
		);
	}

	async getCommand(msg, commands, lang) {
		var { guild } = msg;
		var prefix = guild.commandPrefix;
		var name = await msg.reply(lang.whatshouldcommandname);
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
		var nameText = collected.content;
		collected.delete();
		name.delete();

		if (collected.content === "cancel") {
			throw lang.commandcanceld;
		}
		var command = await commands.find((command) => command.trigger === nameText);
		if (!command) throw lang.commanddontexists;

		return command;
	}

	async run(msg, args, lang) {
		var { client, guild } = msg;
		var { trigger } = args;
		lang = this.lang(guild);
		var commands = this.client.provider.get(guild, "customCommands") || [];
		if (trigger === "list") return await this.listCommands(msg, commands, lang);
		if (trigger === "remove") return await this.removeCommand(msg, commands, lang);
		if (trigger === "create") return await this.newCommand(msg, commands, lang);
	}
};
