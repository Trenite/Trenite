const { Command } = require("discord.js-commando");
const { mem } = require("node-os-utils");

module.exports = class SupportSystemCommand extends Command {
	constructor(client) {
		super(client, {
			name: "support", //lowercase
			memberName: "support", //lowercase
			aliases: ["support-system"],
			group: "setup", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "Create your own support system to help your users",
			examples: ["support"],
			userPermissions: ["MANAGE_CHANNELS", "MANAGE_ROLES", "MANAGE_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES", "MANAGE_CHANNELS"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
		});

		var self = this;

		this.client.on("providerReady", () => {
			self.client.guilds.cache.forEach(self.fetch.bind(this));
		});
	}
	async getRole(guild) {
		return this.client.getRole(guild, "Ticket-Support", {
			name: "Ticket-Support",
			position: 0,
		});
	}
	async fetch(guild) {
		var lang = this.lang(guild);
		var msg = this.client.provider.get(guild, "supportSystemMsg");
		var channel = this.client.provider.get(guild, "supportSystemChannel");
		channel = this.client.channels.resolve(channel);
		if (!channel) return;
		msg = await channel.messages.fetch(msg);
		if (!msg) return;

		var self = this;
		var support = this.client.provider.get(guild, "supportChannels") || [];

		const filter = (reaction, user) =>
			reaction.emoji.name === "❔" && user.id !== this.client.user.id;

		for (const s of support) {
			var ticketChannel = guild.channels.resolve(s.channel);

			if (!ticketChannel) {
				support = support.filter((x) => x.channel !== s.channel);
				continue;
			}
			var ticket = await ticketChannel.messages.fetch(s.message);

			if (!ticket) break;

			ticket = ticket;
			var onClose = ticket.createReactionCollector(
				(reaction, user) => reaction.emoji.name === "🗑️"
			);
			onClose.on("collect", async (reaction, user) => {
				support = support.filter((s) => s.channel != ticketChannel.id);
				await ticketChannel.delete();
			});
		}

		self.client.provider.set(guild, "supportChannels", support);

		const collector = msg.createReactionCollector(filter);
		collector.on("collect", async (r, user) => {
			r.users.remove(user);

			var alreadySupport = support.find((x) => x.user === user.id);
			if (alreadySupport) {
				var c = alreadySupport.channel;
				c = guild.channels.resolve(c);
				if (c) {
					return await user.send(lang.alreadyticket);
				} else {
					support = support.filter((x) => x.user !== user.id);
					self.client.provider.set(guild, "supportChannels", support);
				}
			}
			var role = await this.getRole(guild);
			var ticketChannel = await msg.guild.channels.create(
				"Support - " + user.username,
				{
					topic: lang.open.replace("{datum}", new Date().toLocaleString()),
					parent: channel.parent,
					position: channel.position + 1,
					permissionOverwrites: [
						{ id: guild.roles.everyone, deny: "VIEW_CHANNEL" },
						{
							id: user.id,
							allow: ["SEND_MESSAGES", "VIEW_CHANNEL"],
						},
						{
							id: role.id,
							allow: ["SEND_MESSAGES", "VIEW_CHANNEL"],
						},
					],
				}
			);
			var ticket = await ticketChannel.send(lang.yoursupport, {
				title: "Support Channel",
			});
			await ticket.react("🗑️");

			var onClose = ticket.createReactionCollector(
				(reaction, user) =>
					reaction.emoji.name === "🗑️" && user.id !== self.client.user.id
			);
			onClose.on("collect", async (reaction, user) => {
				support = support.filter((s) => s.channel !== ticketChannel.id);
				await ticketChannel.delete();
			});

			support.push({
				user: user.id,
				channel: ticketChannel.id,
				message: ticket.id,
			});
			self.client.provider.set(guild, "supportChannels", support);
		});
	}

	async run(msg, args) {
		var { client, guild, channel, member } = msg;
		var lang = this.lang(guild);
		// Delete the old Support System message
		var oldmsg = this.client.provider.get(guild, "supportSystemMsg");
		var oldchannel = this.client.provider.get(guild, "supportSystemChannel");

		if (oldchannel) {
			oldchannel = this.client.channels.resolve(channel);
			var oldmsg = await channel.messages.fetch(oldmsg).catch((e) => {});
			if (oldmsg) oldmsg.delete();
		}

		// Create a new support system
		var supportMsg = await msg.reply(lang.reactmsg);
		await supportMsg.react("❔");
		await client.provider.set(guild, "supportSystemMsg", supportMsg.id);
		await client.provider.set(guild, "supportSystemChannel", channel.id);

		client.log(
			guild,
			lang.created.replace("{member}", member).replace("{channel}", msg.channel)
		);

		await this.fetch(guild);
	}
};
