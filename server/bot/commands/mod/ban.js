const commando = require("discord.js-commando");

module.exports = class BanCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "ban",
			memberName: "ban",
			aliases: [],
			group: "mod",
			description: "Ban a User.",
			examples: ["ban"],
			guildOnly: true,
			userPermissions: ["BAN_MEMBERS"],
			clientPermissions: ["BAN_MEMBERS"],
			args: [
				{
					key: "member",
					prompt: "Which user should be banned?",
					type: "member",
				},
				{
					key: "reason",
					prompt: "Why should the user be banned?",
					type: "string",
					default: "none",
					wait: 120,
				},
			],
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;
		const { reason, member } = args;

		if (member.id === msg.author.id) throw "You can't ban you.";
		if (msg.guild.owner.id === member.id)
			throw "You can not ban the server owner.";
		if (member.id === this.client.user.id) throw "I can not ban myself.";
		if (!member.bannable)
			throw "I cannot ban this user! Do they have a higher role? ";
		await member.ban(reason);
		await member
			.send(
				`You were banned of ${guild.name} because of ` +
					"``" +
					reason +
					"``",
				{
					title: "Ban",
					embed: { color: "#FF0000	" },
				}
			)
			.catch((e) => {});

		let reply = await msg.reply(
			`Successfully banned ${member}. \n Reason: ` + "``" + reason + "``",
			{ embed: { color: "#FF0000	" } }
		);
	}
};
