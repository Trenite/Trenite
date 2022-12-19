const commando = require("discord.js-commando");

module.exports = class WarnCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "warn",
			memberName: "warn",
			aliases: [],
			group: "mod",
			description: "Warn a user.",
			examples: ["warn"],
			guildOnly: true,
			userPermissions: ["KICK_MEMBERS", "MANAGE_ROLES"],
			clientPermissions: ["MANAGE_MESSAGES", "KICK_MEMBERS"],
			args: [
				{
					key: "user",
					prompt: "Which user should be warned?",
					type: "member",
				},
				{
					key: "reason",
					prompt: "Why should the user be warned?",
					type: "string",
					default: "none",
					wait: 120,
				},
			],
		});
	}

	async run(msg, args) {
		const { user, reason } = args;
		const { channel, guild } = msg;

		var data = await this.client.provider.get(guild, "warns");
		if (!data) data = [];

		var player = data.find((x) => x.id === user.id);
		var times = 1;
		if (!player) {
			data.push({ id: user.id, warns: 1 });
			this.client.log(guild, `${user} was warned the first time because of ${reason}`);
		} else {
			times = player.warns++;
			if (times >= 6) {
				try {
					user.send(
						`You was banned from ${guild.name} because you were warned the ${times}. time because of ${reason}`
					);
					await user.ban();
					this.client.log(`${user} was warned ${times}. times and was banned because of ${reason}`);
				} catch (error) {
					this.client.log(
						`${user} was warned ${times}. times because of ${reason} but couldn't be banned: insufficient permissions`
					);
				}
			} else if (times >= 3) {
				try {
					user.send(
						`You was kicked from ${guild.name} because you were warned the ${times}. time because of ${reason}`
					);
					await user.kick();
					this.client.log(`${user} was warned ${times}. times and was kicked because of ${reason}`);
				} catch (error) {
					this.client.log(
						`${user} was warned ${times}. times because of ${reason} but couldn't be kicked: insufficient permissions`
					);
				}
			} else {
				this.client.log(guild, `${user} was warned the ${times}. time because of ${reason}`);
			}
		}

		await this.client.provider.set(guild, "warns", data);

		var reply = await msg.reply(`Successfully warned ${user} the ${times}. time because of ${reason} `);
	}
};
