const { Command } = require("discord.js-commando");

module.exports = class AntiGhostPing extends Command {
	constructor(client) {
		super(client, {
			name: "antighostping",
			memberName: "antighostping",
			aliases: [],
			group: "setup",
			guildOnly: true,
			description:
				"automatically warns users if they ping a role and shortly thereafter deletes the message",
			examples: ["antighostping enable/disable"],
			userPermissions: ["MANAGE_ROLES"],
			clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "MENTION_EVERYONE"],
			args: [
				{
					key: "enabled",
					prompt: "do you want to enable the antighostping?",
					type: "boolean",
				},
			],
		});

		this.possibleGhostpings = [];

		client.on("message", this.onMessage.bind(this));
		client.on("messageDelete", this.onMessageDelete.bind(this));
	}

	async onMessageDelete(msg) {
		msg = this.possibleGhostpings.find((pingMsg) => pingMsg.id === msg.id);
		if (!msg) return;

		if (!this.client.provider.get(msg.guild, "ghostping")) return;
		let logs = await msg.guild.fetchAuditLogs({ type: 72, limit: 1 });
		let entry = logs.entries.first();
		if (!entry) return;
		if (entry.target.bot) return;
		var target = msg.guild.member(entry.target);
		if (!target) return;
		if (target.hasPermission("ADMINISTRATOR")) return;

		let seconds = (new Date() - msg.createdTimestamp) / 1000;
		if (seconds < 30) {
			let mentions = this.convertCollectionToMention(
				msg.mentions.users.concat(msg.mentions.roles)
			);
			msg.channel.send(
				`${ping.author} do not ping users/roles (${mentions}) and delete the message afterwards!`,
				{ title: "Ghostping Warning" }
			);
			this.possibleGhostpings = this.possibleGhostpings.filter((x) => x !== msg);
		}
	}

	convertCollectionToMention(collection) {
		return collection.map((x) => `${x}`);
	}

	// TODO on message edit

	async onMessage(msg) {
		if (!msg.guild) return;
		if (!msg.author) return;
		if (msg.author.bot) return;
		if (!this.client.provider.get(msg.guild, "ghostping")) return;
		if (msg.member.hasPermission("ADMINISTRATOR")) return;

		if (msg.mentions.users.first() || msg.mentions.roles.first()) {
			var index = this.possibleGhostpings.push(msg);

			setTimeout(
				(m) => {
					this.possibleGhostpings = this.possibleGhostpings.filter((x) => x !== m);
				},
				1000 * 60 * 5,
				msg
			);
		}
	}

	async run(msg, args) {
		var { client, guild } = msg;
		var { enabled } = args;

		await client.provider.set(guild, "ghostping", enabled);

		if (enabled) {
			msg.reply("Ghostping command was activated");
		} else {
			msg.reply("Ghostping command was disabled");
		}
	}
};
