const commando = require("discord.js-commando");
const fetch = require("node-fetch");
const { UserFlags } = require("discord.js");

module.exports = class UserinfoCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "user-info",
			memberName: "info",
			aliases: ["user", "userinfo", "who-is"],
			autoAliases: true,
			group: "info",
			description: "shows stats about a user",
			examples: ["$userinfo [id/@mention/leaveBlank]"],
			clientPermissions: ["SEND_MESSAGES"],
			args: [
				{
					key: "user",
					prompt: "Which user you would like to get the info?",
					type: "user",
					default: "none",
				},
			],
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;
		var { user } = args;
		if (!user || user == "none") {
			user = msg.author;
		}

		function roleString() {
			let roleString = "";
			member.roles.cache.forEach((x) => {
				if (x.name === "@everyone") {
					return;
				}
				roleString += `\n <@&${x.id}>`;
			});
			return roleString;
		}

		if (guild)
			var member = await guild.members
				.fetch({
					user,
					cache: true,
					withPresences: true,
				})
				.catch((e) => {});
		if (member && !member.user && !member.size) member = null;

		var presence = member
			? member.presence
			: {
					activities: [],
			  };

		var avatar = user.displayAvatarURL({
			format: "png",
			dynamic: true,
			size: 2048,
		});
		var userdescription = client.allUsers.get(user, "description");
		var devices = {
			web: "💻",
			desktop: "🖥️",
			mobile: "📱",
		};
		var app = Object.keys(presence.clientStatus || {})
			.map((x) => devices[x])
			.join(" ");
		var online = {
			online: "<:online:747123294024630283>",
			idle: "<:idle:747123305059713044>",
			offline: "<:offline:747123294641193120>",
			dnd: "<:dnd:747123294238408771>",
		}[presence.status];
		var activity = presence.activities[0];
		if (activity) {
			if (activity.type === "CUSTOM_STATUS") activity = activity.state;
			else activity = activity.name;
			var activity = activity || presence.status;
			var status = `${online} ${app} ${activity}`;
		}

		var flags = await user.fetchFlags();
		var FLAGS =
			Object.keys(UserFlags.FLAGS)
				.filter((x) => flags.has(x))
				.map((x) => x.replace(/[_]/g, "").toLowerCase())
				.filter((x) => client.savedEmojis[x])
				.map((x) => `<:${x}:${client.savedEmojis[x].id}>`)
				.join(" ") || "-";

		msg.reply({
			title: `Info about \`${user.username}\``,
			embed: {
				url: avatar,
				color: member ? member.displayColor : null,
				thumbnail: {
					//image?
					url: avatar,
				},
				fields: [
					{
						name: "Tag:",
						value: user.tag,
						inline: true,
					},
					{
						name: "Nickname:",
						value: member ? member.nickname || user.tag : user.tag,
						inline: true,
					},
					{
						name: "Id:",
						value: user.id,
						inline: true,
					},
					member
						? {
								name: "Admin:",
								value: member.hasPermission("ADMINISTRATOR"),
								inline: true,
						  }
						: null,
					status
						? {
								name: "Status:",
								value: status,
								inline: true,
						  }
						: null,
					member
						? {
								name: "Roles:",
								value: roleString() || "-",
								inline: true,
						  }
						: null,
					member
						? {
								name: "Joined:",
								value: member.joinedAt.toLocaleString(),
								inline: true,
						  }
						: null,
					{
						name: "Created:",
						value: user.createdAt.toLocaleString(),
						inline: true,
					},
					{
						name: "Badges:",
						value: FLAGS,
						inline: true,
					},
					{
						name: "Description:",
						value: userdescription ? `${userdescription}` : "-",
						inline: true,
					},
					this.client.allUsers.get(member, "mc-uuid")
						? {
								name: "linked minecraft uuid",
								value: this.client.allUsers.get(member, "mc-uuid"),
						  }
						: null,
				],
			},
		});
	}
};
