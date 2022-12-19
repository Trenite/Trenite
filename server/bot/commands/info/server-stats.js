const { Command } = require("discord.js-commando");

module.exports = class ServerStatsCommand extends Command {
	constructor(client) {
		super(client, {
			name: "server-stats", //lowercase
			memberName: "server-stats", //lowercase
			aliases: ["setup-server-stats"],
			autoAliases: true,
			group: "info", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "You can add channels with the server stats",
			examples: ["-server-stats"],
			userPermissions: ["SEND_MESSAGES", "ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the args object COMPLETLY
		});
		const self = this;

		client.on("providerReady", () => {
			client.guilds.cache.forEach(self.fetch.bind(self));
		});
	}

	async fetch(guild) {
		try {
			var { client } = guild;
			var AllMembersChannel = client.provider.get(guild, "serverStatsMembers");
			AllMembersChannel = guild.channels.resolve(AllMembersChannel);
			if (!AllMembersChannel) return;
			var interval = client.setInterval(() => {
				AllMembersChannel.edit({ name: "All Members: " + guild.memberCount }).catch((e) => {
					client.clearInterval(interval);
				});
			}, 1000 * 60 * 5);

			var OnlineChannel = client.provider.get(guild, "serverStatsOnline");
			OnlineChannel = guild.channels.resolve(OnlineChannel);
			if (!OnlineChannel) return;

			var interval = client.setInterval(async () => {
				try {
					var online = await this.getOnlineCount(guild);

					await OnlineChannel.edit({ name: "Online: " + online });
				} catch (e) {
					client.clearInterval(interval);
				}
			}, 1000 * 60 * 5);
		} catch (e) {}
	}

	async getOnlineCount(guild) {
		var online = "";
		var invite = await guild.fetchInvites();
		if (invite.size) {
			invite = invite.first();
			invite = await guild.client.fetchInvite(invite);
			online = invite.presenceCount;
		} else {
			invite = guild.channels.cache.find((x) => x.type === "text");
			if (!invite) {
				online = "create an invite";
			} else {
				invite = await invite
					.createInvite({
						maxAge: 0,
						reason: "View online members with invite link for server stats",
					})
					.catch((e) => {
						online = "Create an invite";
					});
				online = invite.presenceCount;
			}
		}
		return online;
	}

	async run(msg, args) {
		var { client, guild } = msg;

		var AllMembersChannel = guild.channels.resolve(client.provider.get(guild, "serverStatsMembers"));
		if (AllMembersChannel) AllMembersChannel.delete();

		OnlineChannel = guild.channels.resolve(client.provider.get(guild, "serverStatsOnline"));
		if (OnlineChannel) OnlineChannel.delete();
		if (OnlineChannel && OnlineChannel.parent) OnlineChannel.parent.delete();

		var ServerStats = await msg.guild.channels.create("📊 Server Stats 📊", {
			type: "category",
		});

		var online = await this.getOnlineCount(guild);

		var AllMembersChannel = await msg.guild.channels.create("All Members: " + msg.guild.memberCount, {
			type: "voice",
			parent: ServerStats.id,
			permissionOverwrites: [{ id: msg.guild.roles.everyone, deny: "CONNECT", allow: "VIEW_CHANNEL" }],
		});
		var OnlineChannel = await msg.guild.channels.create("Online: " + online, {
			type: "voice",
			parent: ServerStats.id,
			permissionOverwrites: [{ id: msg.guild.roles.everyone, deny: "CONNECT", allow: "VIEW_CHANNEL" }],
		});

		client.provider.set(guild, "serverStatsMembers", AllMembersChannel.id);
		client.provider.set(guild, "serverStatsOnline", OnlineChannel.id);

		this.fetch(guild);
	}
};
