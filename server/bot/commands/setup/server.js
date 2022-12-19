const { Command } = require("discord.js-commando");

module.exports = class ServerCommand extends Command {
	constructor(client) {
		super(client, {
			name: "server", //lowercase
			memberName: "server", //lowercase
			aliases: ["server-list", "guild", "guild-list"],
			autoAliases: true,
			group: "setup", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, stats, util]
			description: "",
			examples: [""],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES", "CREATE_INSTANT_INVITE"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "action",
					prompt:
						"Discord Server List\nEnter the action here:\n``list`` to list random servers\n``add`` to add your server to the list\n``remove`` to remove your server from the list\n``promote`` to highlight your server on the list\n``info`` to see your current settings\n``edit`` to edit your server description or tag",
					type: "string",
					validate(text) {
						return ["list", "add", "remove", "edit", "promote", "info"].includes(text.split(" ")[0]);
					},
				},
			],
		});
	}

	async addServers(msg, args) {
		let DBdescription = this.client.provider.get(msg.guild, "serverListDescription");
		if (!DBdescription) {
			let description = await this.getQuestion("What description should the server have ?", msg);
			if (description.length > 202) {
				description = description.slice(0, 202) + " ...";
			}
			var textchannel = msg.guild.channels.cache.find((x) => x.type === "text");
			var invite = await textchannel.createInvite({
				temporary: false,
				maxAge: 0,
				maxUses: 0,
				unique: false,
				reason: "Discord Server List",
			});
			this.client.provider.set(msg.guild, "serverListInvite", invite.code);
			this.client.provider.set(msg.guild, "serverListDescription", description);
			this.client.provider.set(msg.guild, "serverListPromote", false);
			this.client.provider.set(msg.guild, "serverListDate", Date.now());
			msg.reply("Your server was add to the server list");
		} else {
			msg.reply("Your server was already add to the server list");
		}
	}

	async removeServers(msg, args) {
		let description = await this.client.provider.get(msg.guild, "serverListDescription");
		if (description) {
			this.client.provider.remove(msg.guild, "serverListDescription");
			msg.reply("Your server was removed from the server list");
		} else {
			msg.reply("Your server was`t add to the server list");
		}
	}

	async infoServers(msg, args) {
		let description = await this.client.provider.get(msg.guild, "serverListDescription");
		if (description) {
			msg.reply("serverListDescription: " + description);
		} else {
			msg.reply("Your server was`t add to the server list");
		}
	}

	async editServers(msg, args) {
		let description = await this.client.provider.get(msg.guild, "serverListDescription");
		if (description) {
			let description = await this.getQuestion("What new description should the server have ?", msg);
			if (description.length > 202) {
				description = description.slice(0, 202) + " ...";
			}
			var textchannel = msg.guild.channels.cache.find((x) => x.type === "text");
			var invite = await textchannel.createInvite({
				temporary: false,
				maxAge: 0,
				maxUses: 0,
				unique: false,
				reason: "Discord Server List",
			});
			this.client.provider.set(msg.guild, "serverListInvite", invite.code);
			this.client.provider.set(msg.guild, "serverListDescription", description);
			msg.reply("Your server description was edited");
		} else {
			msg.reply("Your server was`t add to the server list");
		}
	}

	listServers(msg, args) {
		let mString = "";
		let filter;
		if (!args[0]) args[0] = "random";
		switch (args[0]) {
			case "top":
				filter = (a, b) => {
					var guildA = this.client.guilds.resolve(a.id);
					var guildB = this.client.guilds.resolve(b.id);

					return guildB.memberCount - guildA.memberCount;
				};
				break;
			case "new":
				filter = (a, b) => {
					return b.serverListDate - a.serverListDate;
				};
				break;
			case "random":
				break;
			default:
				throw "Invalid filter option!\nAvailable filters: ``top``, ``new``, ``random``";
		}

		var arr = Array.from(this.client.provider.settings.entries())
			.map((a) => ({ id: a[0], ...a[1] }))
			.filter((x) => x.serverListDescription && this.client.guilds.resolve(x.id));

		args[0] === "random" ? shuffle(arr) : (arr = arr.sort(filter));

		arr.slice(0, 10).forEach((x) => {
			var guild = this.client.guilds.resolve(x.id);
			var { name } = guild;
			var { serverListDescription, serverListInvite } = x;
			var n = `[**${name}**](https://discord.gg/${serverListInvite})\n`;
			mString += (n + serverListDescription).slice(0, 203) + "\n\n";
		});

		msg.channel.send(mString, { error: false, title: "Server List" });
	}

	promoteServers(msg, args) {
		msg.reply("This Command is not ready to use");
	}

	async getQuestion(question, msg) {
		var quest = await msg.reply(question);
		var answer = await msg.channel.awaitMessages((m) => m.author === msg.author, { time: 1000 * 30, max: 1 });
		quest.delete();
		var content = answer.first().content;
		answer.first().delete();
		return content;
	}

	async run(msg, args) {
		const { action } = args,
			arg = action.split(" ").slice(1);

		switch (action.split(" ")[0]) {
			case "add":
				return this.addServers(msg, arg);
				break;
			case "remove":
				return this.removeServers(msg, arg);
				break;
			case "info":
				return this.infoServers(msg, arg);
				break;
			case "edit":
				return this.editServers(msg, arg);
				break;
			case "list":
				return this.listServers(msg, arg);
				break;
			case "promote":
				return this.promoteServers(msg, arg);
		}
	}
};

function shuffle(array) {
	var currentIndex = array.length,
		temporaryValue,
		randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}
