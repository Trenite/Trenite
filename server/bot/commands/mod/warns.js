const commando = require("discord.js-commando");

module.exports = class WarnsCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "warns",
			memberName: "warns",
			aliases: ["warnings", "infractions"],
			group: "mod",
			description: "get warns of a user",
			examples: ["warns @Wumpus"],
			guildOnly: true,
			userPermissions: ["MANAGE_MESSAGES"],
			clientPermissions: ["MANAGE_MESSAGES"],
			args: [
				{
					key: "member",
					prompt: "Which user do you mean?",
					type: "member",
				},
			],
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;
		const { member } = args;
		var data = await this.client.provider.get(guild, "warns");
		if (!data) data = [];
		var player = data.find((x) => x.id === member.id);
		if (player) {
			msg.reply(`This user have: ${player.warns} warns!`);
		} else {
			msg.reply("This Player has no warns!");
		}
	}
};
