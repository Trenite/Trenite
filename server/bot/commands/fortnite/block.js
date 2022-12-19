const { Command } = require("discord.js-commando");

module.exports = class BlockCommand extends Command {
	constructor(client) {
		super(client, {
			name: "fn-block", //lowercase
			memberName: "fn-block", //lowercase
			aliases: [
				"fnblock",
				"fortnite-block",
				"fortniteblock",
				"fnlock",
				"fn-lock",
				"fortnite-lock",
				"fortnitelock",
			],
			group: "fortnite", // [dev, fortnite, fun, mod, music, util]
			description: "Blocks or unblocks a user",
			examples: ["fn-block @User"],
			devOnly: true,
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			userPermissions: ["BAN_MEMBERS"],
			args: [
				{
					key: "user",
					prompt: "Which user should be blocked?",
					type: "user",
				},
				{
					key: "reason",
					prompt: "Why should the user be blocked?",
					type: "string",
				},
			],
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;
		const { user, reason } = args;

		var channel = await this.client.provider.get(guild, "logChannel");
		channel = guild.channels.resolve(channel);
		if (!channel) return;

		var users = this.client.provider.get(guild, "users") || [];
		users = users.find((user2) => user2.id === user.id);
		if (!users) return msg.reply(`${user} isnt linked.`);

		const epicGames = this.client.bot.botmanager.fnbot;
		const account = await epicGames.getProfile(users.fn_id);
		var { id, displayName: name } = account;

		if (users.blocked === false) {
			users.blocked = true;

			msg.reply(`${user} is now blocked because of ${reason}`);
			channel.send(
				`**__${user}__** with the Epic Account(***${name}***)is now blocked because of` + "``" + reason + "``",
				{ title: "Blocked" }
			);
		} else {
			users.blocked = false;
			msg.reply(`***__${user}__*** is now unblocked.`);
			channel.send(`***__${user}__*** is now unblocked.`, { title: "Unblock" });
		}

		await this.client.provider.get(guild, "users", users);
	}
};
