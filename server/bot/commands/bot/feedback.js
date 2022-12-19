const commando = require("discord.js-commando");

module.exports = class FeedbackCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "feedback",
			memberName: "feedback",
			aliases: [
				"bug",
				"bugreport",
				"feature",
				"feature-request",
				"request-feature",
				"featurerequest",
				"requestfeature",
			],
			group: "bot",
			description: "Send a feedback to the bot.",
			examples: [
				"feedback The feedback cmd has a bug",
				`If you want to report a join our support server: https://support.${client.bot.config.api.domain}`,
			],
			guildOnly: false,
			throttling: {
				usages: 1,
				duration: 5,
			},
			args: [
				{
					key: "feedback",
					prompt: "What is your feedback?",
					type: "string",
					wait: 120,
				},
			],
		});
	}

	async run(msg, args) {
		const { channel, client, author } = msg;
		const { feedback } = args;

		try {
			await client.treniteLog(feedback, {
				channel: "feedback",
				title: `Feedback von ${author.tag}`,
			});
			msg.reply(`Thanks for your feedback.`);
		} catch (error) {
			msg.reply(`Error sending feedback because of ${error}`);
		}
	}
};
