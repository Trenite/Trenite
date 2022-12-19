const { Command } = require("discord.js-commando");
const fetch = require("node-fetch");
module.exports = class AutoPublishommand extends Command {
	constructor(client) {
		super(client, {
			name: "auto-publish", //lowercase
			memberName: "auto-publish", //lowercase
			aliases: [],
			group: "mod", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, setup, stats, util]
			description: "set up autopublish",
			examples: ["auto-publish #status"],
			userPermissions: ["MANAGE_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "channel",
					prompt: "For which channel do you want to disable/enable auto publish?",
					type: "channel",
				},
			],
		});

		client.on("message", async (message) => {
			if (!message.guild) return;
			var channels = this.client.provider.get(message.guild.id, "Auto-publish") || [];
			var channel = channels.find((x) => x.channel === message.channel.id);
			if (!channel) return;
			channel = message.guild.channels.resolve(channel.channel);
			if (!channel) return;
			if (channel.type !== "news") return;
			await message.publish();
		});
	}

	async run(msg, args, lang) {
		var { client, author } = msg;
		var { channel } = args;

		var channels = (await this.client.provider.get(msg.guild, "Auto-publish")) || [];
		if (channel.type != "news")
			throw "<#" + channel.id + "> isn't a news channel. Publish is only available for news channels.";

		if (channels.find((x) => x.channel === channel.id)) {
			channels = channels.filter((x) => x.channel != channel.id);
			msg.reply("Succesfully deactivated auto publish for <#" + channel.id + ">");
		} else {
			channels.push({ channel: channel.id });
			msg.reply("Succesfully activated auto publish for <#" + channel.id + ">");
		}

		this.client.provider.set(msg.guild, "Auto-publish", channels);
	}
};
