const { Command } = require("discord.js-commando");
const Discord = require("discord.js");

module.exports = class XPSystemCommand extends Command {
	constructor(client) {
		super(client, {
			name: "xp-system", //lowercase
			memberName: "xp-system", //lowercase
			aliases: ["setup-xp", "level-system", "xp-setup"],
			autoAliases: true,
			group: "stats", // [audio, bot, dev, economy, fortnite, fun, games, media, minecraft, mod, nsfw, setup, stats, util]
			description: "xp-system",
			examples: ["xp-setup"],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"],
			guildOnly: true,
			args: [
				{
					key: "enable",
					prompt:
						"Do you want to enable the Experience (XP) System?\nThis will allow your users to gain XP and level up.\nYou can change the settings on the webdashboard.",
					type: "boolean",
				},
			],
		});
		this.client.on("message", this.onMessage.bind(this));
	}

	async onMessage(msg) {
		try {
			var { guild, member, webhookID, flags, author, content, channel } = msg;
			if (!guild) return; //exlude dm-channels
			if (webhookID) return; // eclude webhooks
			if (flags.has("IS_CROSSPOST")) return; // exlude message from news channels
			if (flags.has("URGENT")) return; // exclude system messages
			if (author.id === this.client.user.id) return; // exclude the bot itself
			if (author.bot) return; // eclude other bots
			if (!content) return; // exlude empty/embed messages
			if (!this.client.provider.get(guild, "xpSystem")) return; // return if xp System is disabled
			if (content.startsWith(guild.commandPrefix)) return; // dont level commands

			var excludedChannels = this.client.provider.get(guild, "xpExcludedChannels") || [];
			if (excludedChannels.includes(channel.id)) return; // skip excluded channels

			var onlyChannels = this.client.provider.get(guild, "xpOnlyChannels") || [];
			if (onlyChannels.length && !onlyChannels.includes(channel.id)) return; // skip if channel is not in xpOnlyChannels array

			var excludedRoles = this.client.provider.get(guild, "xpExcludedRoles") || [];
			if (excludedRoles.find((x) => x === member.roles.cache.has(x))) return; // skip excluded roles

			await this.processMessage(msg);
		} catch (error) {
			console.error("XP System, message handler:", error);
		}
	}

	xpForLevel(level, countUp = true) {
		var needed = 0;
		for (var i = countUp ? 1 : level; i <= level; i++) {
			needed += i * 100;
		}
		return needed;
	}

	async processMessage(msg) {
		var { guild, member, author, client } = msg;

		var users = this.client.provider.get(guild, "users") || [];
		var user = users.find((x) => x.id === author.id);
		if (!user) user = users[users.push({ id: author.id }) - 1];

		var multiplier = this.client.provider.get(guild, "xpMultiplier") || 1; // leveling difficulty, rate at which members will gain XP

		var xpLevelUpChannel = this.client.provider.get(guild, "xpLevelUpChannel");

		if (!user.xp) user.xp = 0;
		if (!user.xpLevel) user.xpLevel = 1;
		if (!user.xpLastMessage) user.xpLastMessage = 0; // xpLastMessage is the date (epoch) since the user received the last XP

		var diff = (Date.now() - user.xpLastMessage) / 1000;
		if (diff < 60) return; // return if the last XP message is fewer than 60 seconds ago

		user.xpLastMessage = Date.now();
		user.xp += Math.floor((Math.random() * 10 + 15) * multiplier); // randomly gain between 15 and 25 XP

		function end() {
			client.provider.set(guild, "users", users);
		}

		async function sendMessage(channel) {
			var rankcard = await client.registry.commands.get("rank").getRankCard(member, true);
			var xpLevelUpText =
				client.provider.get(guild, "xpLevelText") || `Great {user}, you have reached level {level}`;
			xpLevelUpText = xpLevelUpText.replace("{user}", `${member}`).replace("{level}", user.xpLevel);

			const attachment = new Discord.MessageAttachment(rankcard, "rank.png");

			channel.send(xpLevelUpText, {
				noEmbed: true,
				files: [attachment],
			});

			return end();
		}

		var xpNeeded = this.xpForLevel(user.xpLevel);
		if (xpNeeded > user.xp) return end();

		user.xpLevel++; // level up

		if (xpLevelUpChannel === false) return end();
		else if (xpLevelUpChannel == "dm") return await sendMessage(await member.createDM());
		else return await sendMessage(guild.channels.resolve(xpLevelUpChannel) || msg.channel);
	}

	async run(msg, args) {
		const { client, member, guild } = msg;
		const { enable } = args;
		//rank card here @conner
		this.client.provider.set(guild, "xpSystem", true);
		msg.reply(`XP system was ` + (enable ? "enabled" : "disabled"));
	}
};
