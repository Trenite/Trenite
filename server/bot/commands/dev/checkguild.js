const commando = require("discord.js-commando");
const { oneLine, stripIndents } = require("common-tags");
module.exports = class CheckGuildCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "checkguild",
			memberName: "checkguild",
			aliases: [],
			group: "dev",
			description: "Check a guild.",
			examples: ["guilds"],
			devOnly: true,
			args: [
				{
					key: "guildid",
					prompt: "Please send the guild id.",
					type: "string",
				},
			],
		});
	}

	async run(msg, args) {
		const { client } = msg;
		const guildid = args.guildid;
		const guild = this.client.guilds.get(guildid);
		var premium = client.allUsers.get(guild.id, "premium");
		const channel =
			(await guild.channels.find("name", "general")) ||
			guild.channels.find("name", "chat") ||
			guild.channels.find("name", "test");
		if (!premium) {
			premium = "Kein Premium";
		}

		const invite = await channel.createInvite();
		msg.reply(stripIndents`Guild: ${guild.id}
      Name: ${guild.name}
      Owner: <@${guild.owner.id}> (${guild.owner.id})
	Premium: ${premium}
	Invite: ${invite}
      Members: ${guild.members.cache.size}
      Humans: ${guild.members.cache.filter((u) => !u.user.bot).size} (${Math.floor(
			(guild.members.cache.filter((u) => !u.user.bot).size / guild.members.cache.size) * 100
		)}%)
      Bots: ${guild.members.cache.filter((u) => u.user.bot).size} (${Math.floor(
			(guild.members.cache.filter((u) => u.user.bot).size / guild.members.cache.size) * 100
		)}%)`);
	}
};
