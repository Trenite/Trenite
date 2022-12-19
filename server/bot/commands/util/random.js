const { Command } = require("discord.js-commando");

module.exports = class RandomCommand extends Command {
	constructor(client) {
		super(client, {
			name: "random",
			memberName: "random",
			aliases: [],
			group: "util",
			description: "select randomly from roles/members/channels",
			examples: ["random member"],
			userPermissions: ["SEND_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES"],
			guildOnly: true,
			args: [
				{
					key: "type",
					prompt: "role/member/channel to be select in a random way from",
					type: "string",
				},
			],
		});
	}

	async run(msg, args, lang) {
		var { type } = args;
		switch (type) {
			case "member":
				msg.reply({
					title: "Random member:",
					embed: { description: `${msg.guild.members.cache.random()}` },
				});
				break;
			case "channel":
				msg.reply({
					title: "Random Channel:",
					embed: { description: `<#${msg.guild.channels.cache.random().id}>` },
				});
				break;
			case "role":
				msg.reply({ title: "Random Role:", embed: { description: `${msg.guild.roles.cache.random()}` } });
				break;
		}
	}
};
