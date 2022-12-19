const commando = require("discord.js-commando");

module.exports = class MuteCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "mute",
			memberName: "mute",
			aliases: [],
			group: "mod",
			description: "Mutes a user",
			examples: ["mute @User"],
			guildOnly: true,
			userPermissions: ["MANAGE_ROLES"],
			clientPermissions: ["MANAGE_ROLES"],
			args: [
				{
					key: "member",
					prompt: "Who should be muted?",
					type: "member",
				},
				{
					key: "reason",
					prompt: "Why should he be muted?",
					type: "string",
					default: "none",
				},
			],
		});
		client.on("channelCreated", this.channelCreated.bind(this));
	}

	async getRole(guild) {
		return this.client.getRole(guild, "muted", {
			name: "Muted",
			position: 0,
			permissions: 1115200,
		});
	}

	async channelCreated(channel) {
		try {
			var { guild } = channel;
			if (!(await client.provider.get(guild, "muted"))) return;
			var role = await this.getRole(guild);
			await channel.updateOverwrite(role, { SEND_MESSAGES: false, SPEAK: false });
		} catch (error) {
			console.error(error);
		}
	}

	async mute(member, msg, reason) {
		var { guild } = msg;
		var alreadySetup = this.client.provider.get(guild, "rolemuted");
		var role = await this.getRole(guild);

		if (!alreadySetup) {
			if (msg) var answer = await msg.reply(`Overwriting all permissions for role ${role} ...`);

			await Promise.all(
				guild.channels.cache.map(async (channel) => {
					await channel.updateOverwrite(role, { SEND_MESSAGES: false, SPEAK: false });
				})
			);

			if (answer)
				answer.edit(`Muted ${role} role successfully setup.\nChannel permissions successfully overwritten`, {
					title: "Mute",
				});
		}

		if (member.roles.cache.has(role.id)) {
			throw `${member} is already muted`;
		} else {
			await member.roles.add(role, reason);
			if (msg) msg.reply(`Successfully muted ${member}`);
		}
	}

	async run(msg, args) {
		var { member, reason } = args;

		await this.mute(member, msg, reason);
	}
};
