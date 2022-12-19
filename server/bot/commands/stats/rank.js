const { Command } = require("discord.js-commando");
const Discord = require("discord.js");
const { generate, fetch } = require("image-manipulation-api/fetch");

module.exports = class RankCommand extends Command {
	constructor(client) {
		super(client, {
			name: "rank", //lowercase
			memberName: "rank", //lowercase
			aliases: ["rank-card", "stats-rank", "xp"],
			autoAliases: true,
			group: "stats", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, setup, stats, util]
			description: "Display",
			examples: ["rank", "rank @User"],
			userPermissions: ["SEND_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "user",
					prompt: "Enter the user you want to see the rank card",
					type: "member",
					default: "none", // standard value, if nothing is given, delete it if the arg is required
				},
			],
		});
	}

	getRankCard(member, doFetch = true) {
		if (!member) throw "please specify a message";
		const { guild } = member;

		if (!this.client.provider.get(guild, "xpSystem")) throw "XP System is not enabled";
		if (member.user.bot) throw "Bots can't use the XP-System";

		var users = this.client.provider.get(guild, "users") || [];
		var leaderboard = users
			.sort((a, b) => (b.xp || 0) - (a.xp || 0))
			.sort((a, b) => (b.xpLevel || 0) - (a.xpLevel || 0));

		var user = users.find((x) => x.id === member.id);
		if (!user) user = { id: member.id };

		var rank = leaderboard.findIndex((x) => x.id === member.id);
		if (rank === -1) rank = leaderboard.length;
		else rank++;

		if (!user.xp) user.xp = 0;
		if (!user.xpLevel) user.xpLevel = 1;

		var { xpForLevel } = this.client.registry.commands.get("xp-system");

		var needed = xpForLevel(user.xpLevel, false);
		var has = user.xp - xpForLevel(user.xpLevel - 1, true);

		var func = doFetch ? fetch : generate;

		return func("/stats/rank", {
			mode: "center",
			rank,
			level: user.xpLevel,
			xp: has,
			status: member.presence.status,
			max: needed,
			shadow: 50,
			background: "discord_basic",
			user_id: member.id,
			user_tag: member.user.tag,
			user_avatar: member.user.avatar,
		});
	}

	async run(msg, args, lang) {
		const { client, author, member } = msg;
		var { user } = args;
		if (user === "none") user = member;

		var rank = await this.getRankCard(user, true);

		const attachment = new Discord.MessageAttachment(rank, "rank.png");

		msg.reply("", {
			noEmbed: true,
			files: [attachment],
		});
	}
};
