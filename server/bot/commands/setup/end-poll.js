const { Command } = require("discord.js-commando");

module.exports = class endPollCommand extends Command {
	constructor(client) {
		super(client, {
			name: "end-poll", //lowercase
			memberName: "end poll", //lowercase
			aliases: ["endpoll"],
			group: "setup", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "end a poll",
			examples: ["poll 723591098643251222 "],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "link",
					prompt: "Send the message link",
					type: "string",
					wait: 60,
				},
			],
		});
	}

	async run(msg, args) {
		var message = msg;
		const { client } = msg;
		var link = args.link;
		var argslink = args.link;
		link = link.replace("https://discordapp.com/channels/", "").split("/"); //561235799233003551/569292707504193556/688697243619819520

		try {
			if (link.length != 3) throw "You provided a wrong message link";

			var guild = link[0];
			var channel = link[1];
			var msg = link[2];

			guild = client.guilds.resolve(guild);
			if (!guild) throw "I must be on the guild";

			channel = guild.channels.resolve(channel);
			if (!channel) throw "I can't find the channel";

			try {
				msg = await channel.messages.fetch(msg);
			} catch (error) {
				msg = undefined;
			}
			if (!msg) throw "I can't find the message";

			var polls = await this.client.provider.get(guild, "Polls");

			if (!polls) return msg.reply("You guild doesn't have polls");
			polls = await polls.find((poll) => poll.msgid == msg.id);
			if (!polls) return msg.reply("We didn't find a poll with this message id");

			var pollchannel = polls.channel;
			pollchannel = await guild.channels.resolve(pollchannel);
			if (!pollchannel) return msg.reply("The Channel with the poll was deleted.");
			var pollmsg = polls.msgid;
			pollmsg = await pollchannel.messages.fetch(pollmsg);
			const pollthumbsub = await pollmsg.reactions.cache.find((r) => r.emoji.name === "✅");
			const pollthumbsdown = await pollmsg.reactions.cache.find((r) => r.emoji.name === "🛑");
			var thumbsdowncount = pollthumbsdown.count - 1;
			var thumbsupcount = pollthumbsub.count - 1;

			pollmsg.edit({
				title: "Poll ended",
				embed: {
					description:
						"``" + thumbsupcount + "`` reacted with ✅ \n``" + thumbsdowncount + "`` reacted with 🛑",
				},
			});
			message.reply("Poll was endet, the link to the poll is " + argslink, "End Poll");
			pollmsg.reactions.removeAll();
			var pollsdb = await this.client.provider.get(guild, "Polls");
			pollsdb = await pollsdb.filter((poll) => poll.msgid != msg.id);
			await this.client.provider.set(guild, "Polls", pollsdb);
		} catch (error) {}
	}
};
