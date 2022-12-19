const { Command } = require("discord.js-commando");

module.exports = class GuildSetCommand extends Command {
	constructor(client) {
		super(client, {
			name: "guild-set", //lowercase
			memberName: "guild-set", //lowercase
			aliases: ["set"],
			autoAliases: true,
			group: "dev", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, setup, stats, info, util, eco]
			description: "Manually sets a database entry for a server",
			examples: ["set xpMultiplier 2"],
			userPermissions: ["SEND_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			devOnly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "key",
					prompt: "What is the database server key",
					type: "string",
				},
				{
					key: "value",
					prompt: "What is the database server value",
					type: "string",
				},
			],
		});
	}

	async run(msg, args, lang) {
		var { client, guild } = msg;
		const { key, value } = args;

		var old = client.provider.get(guild, key);
		await client.provider.set(guild, key, value);
		return msg.reply(`Successfully set \`\`${key}\`\` to \`\`${value}\`\`\nOld value: \`\`${old}\`\``);
	}
};
