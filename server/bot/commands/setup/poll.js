const { Command } = require("discord.js-commando");

module.exports = class PollCommand extends Command {
	constructor(client) {
		super(client, {
			name: "poll", //lowercase
			memberName: "poll", //lowercase
			aliases: ["abstimmung", "voting"],
			group: "setup", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "create a poll",
			examples: ["poll Do you like the bot?"],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "title",
					prompt: "What is the title of the poll?",
					type: "string",
				},
				{
					key: "question",
					prompt: "What is your question?",
					type: "string",
					wait: 120,
				},
			],
		});
	}

	async run(msg, args, lang) {
		const { client, guild } = msg,
			{ title, question } = args;
		lang = this.lang(guild);
		const pollmsg = await msg.reply(question, {
			embed: { title: title, footer: { text: lang.howtoend } },
		});

		pollmsg.react("✅");
		pollmsg.react("🛑");

		var polls = await this.client.provider.get(guild, "Polls");
		if (!polls) polls = [];
		polls.push({
			author: msg.author.id,
			channel: msg.channel.id,
			msgid: pollmsg.id,
			question: question,
			title: title,
		});

		this.client.provider.set(guild, "Polls", polls);
	}
};
