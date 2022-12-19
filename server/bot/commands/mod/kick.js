const commando = require("discord.js-commando");

module.exports = class KickCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "kick",
			memberName: "kick",
			aliases: [],
			group: "mod",
			description: "Kick a User.",
			examples: ["kick"],
			guildOnly: true,
			userPermissions: ["KICK_MEMBERS"],
			clientPermissions: ["KICK_MEMBERS"],
			args: [
				{
					key: "member",
					prompt: "Which user should be kicked?",
					type: "member",
				},
				{
					key: "reason",
					prompt: "Why should the user be kicked?",
					type: "string",
					default: "none",
					wait: 120,
				},
			],
		});
	}

	async run(msg, args) {
		const { guild, channel } = msg;
		const { member, reason } = args;

		var length = 0;
		var messages = [];

		member.send(`You were kicked from ${guild.name} because of ${reason}`).catch((e) => {});
		await member.kick(reason);
		var reply = await msg.reply(`Successfully kicked ${member} because of ${reason} `);
		reply.delete({ timeout: 4000 });
	}
};
