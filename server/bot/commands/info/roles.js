const commando = require("discord.js-commando");

module.exports = class RoleInfoCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "roles",
			memberName: "roles",
			aliases: ["role-info", "roles-info", "info-roles", "role"],
			autoAliases: true,
			group: "info",
			description: "info about the current server roles",
			examples: ["$roleinfo"],
			clientPermissions: ["SEND_MESSAGES"],
			guildOnly: true,
			clientPermissions: ["SEND_MESSAGES"],
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;
		var prem = client.allUsers.get(guild.id, "premium");
		if (!prem) {
			prem = "not yet determined";
		}

		function roleString() {
			let roleString = "";
			guild.roles.cache.forEach((x) => {
				if (x.name === "@everyone") {
					return;
				}
				roleString += `\n <@&${x.id}> [${x.members.size}]`;
			});
			return roleString;
		}

		var url = guild.iconURL({ dynamic: true, format: "jpg", size: 2048 });

		msg.reply({
			title: "Roles from " + guild.name,
			embed: {
				thumbnail: {
					url,
				},
				fields: [{ name: "Roles:", value: roleString().slice(0, 1020), inline: true }],
			},
		});
	}
};
