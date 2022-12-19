const commando = require("discord.js-commando");

module.exports = class unmuteCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "unmute",
			memberName: "unmute",
			aliases: [],
			group: "mod",
			description: "unmutes a user",
			examples: ["unmute @User"],
			guildOnly: true,
			userPermissions: ["MANAGE_ROLES"],
			clientPermissions: ["MANAGE_ROLES"],
			args: [
				{
					key: "member",
					prompt: "Who should be unmuted?\nEnter setup, to setup all unmuted settings",
					type: "member",
					validate: (text, msg) => {
						if (text === "setup") {
							return true;
						} else if (msg.client.registry.types.get("member").parse(text, msg)) {
							return true;
						}

						return false;
					},
				},
				{
					key: "reason",
					prompt: "Why should he be unmuted?",
					type: "string",
					default: "none",
				},
			],
		});
	}

	async getRole(guild) {
		return this.client.registry.commands.get("mute").getRole(guild);
	}

	async run(msg, args) {
		var { member, reason } = args;
		var { guild, client } = msg;
		var role = await this.getRole(guild);
		var alreadySetup = await client.provider.get(guild, "muted");

		if (member.roles.cache.has(role.id)) {
			await member.roles.remove(role, reason);
			msg.reply(`Successfully unmuted ${member}`);
		} else {
			msg.reply("This user is not muted");
		}

		await client.provider.set(guild, "muted", true);
	}
};
