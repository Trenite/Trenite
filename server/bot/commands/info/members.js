const commando = require("discord.js-commando");

module.exports = class MemberInfoCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "members",
			memberName: "members",
			aliases: ["memberinfo", "member-info", "members-info"],
			group: "info",
			description: "info about the current server members",
			examples: ["$members"],
			clientPermissions: ["SEND_MESSAGES"],
			guildOnly: true,
			clientPermissions: ["SEND_MESSAGES"],
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;
		var bans = await guild.fetchBans();

		function adminString() {
			let adminString = "";
			guild.members.cache.forEach((x) => {
				if (x.hasPermission("ADMINISTRATOR")) {
					if (x.user.bot) {
						adminString += `\n <@${x.user.id}> [BOT]`;
						return;
					} else {
						adminString += `\n <@${x.user.id}>`;
					}
				} else {
					return;
				}
			});
			return adminString;
		}

		function getOnlineString() {
			var onlineCount = guild.members.cache.filter((m) => m.presence.status === "online")
				.size;
			let onlineString = onlineCount + " <:online:747123294024630283>";
			return onlineString;
		}

		function getTotalString() {
			var totalCount = guild.memberCount;
			let totalString = totalCount;
			return totalString;
		}

		function getIdleString() {
			var idleCount = guild.members.cache.filter((m) => m.presence.status === "idle").size;
			let idleString = idleCount + " <:idle:747123305059713044>";
			return idleString;
		}

		function getDNDString() {
			var dndCount = guild.members.cache.filter((m) => m.presence.status === "dnd").size;
			let dndString = dndCount + " <:dnd:747123294238408771>";
			return dndString;
		}

		function getOfflineString() {
			var dndCount = guild.members.cache.filter((m) => m.presence.status === "offline").size;
			let dndString = dndCount + " <:offline:747123294641193120>";
			return dndString;
		}

		var url = guild.iconURL({ dynamic: true, format: "jpg", size: 2048 });

		msg.reply({
			title: "Member Info about " + guild.name,
			embed: {
				url,
				thumbnail: {
					url,
				},
				fields: [
					{
						name: "Normal Users:",
						value: `${
							guild.members.cache.filter((u) => !u.user.bot).size
						} (${Math.floor(
							(guild.members.cache.filter((u) => !u.user.bot).size /
								guild.members.cache.size) *
								100
						)}%)`,
						inline: true,
					},
					{
						name: "Bots",
						value: `${guild.members.cache.filter((u) => u.user.bot).size} (${Math.floor(
							(guild.members.cache.filter((u) => u.user.bot).size /
								guild.members.cache.size) *
								100
						)}%)`,
						inline: true,
					},
					{ name: "Total Members ", value: getTotalString(), inline: true },
					{ name: "Online Members ", value: getOnlineString(), inline: true },
					{ name: "Idle Members ", value: getIdleString(), inline: true },
					{ name: "Do not disturb Members ", value: getDNDString(), inline: true },
					{ name: "Offline Members ", value: getOfflineString(), inline: true },
					{ name: "Banned Members ", value: bans.size, inline: true },
					{ name: "Admins ", value: adminString().slice(0, 1020), inline: false },
				],
			},
		});
	}
};
