const { Command } = require("discord.js-commando");
const mongoose = require("mongoose");
const BotModel = mongoose.model("Bot");

module.exports = class DeleteBotCommand extends Command {
	constructor(client) {
		super(client, {
			name: "deletebot", //lowercase
			memberName: "deletebot", //lowercase
			aliases: ["removebot", "requestdelete", "requestdeletion", "stop"],
			group: "bot", // [dev, fortnite, fun, mod, audio, util, media]
			description: "Deletes your custombot",
			examples: ["deletebot"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			ownerOnly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "sure",
					prompt: "Are you sure you want to delete your custom bot?",
					type: "boolean",
				},
			],
		});
	}

	async run(msg, args, lang) {
		var { client, author } = msg;
		var { sure } = args;
		if (!sure) return msg.reply(lang.aborting);
		msg.reply(lang.success);
		await client.options.owner.sendAll(`Your bot ${client.user} was deleted`);

		await client.user.setPresence({
			status: "dnd",
			activity: {
				name: "DELETED",
				type: "WATCHING",
			},
		});

		return await client.bot.botmanager.delete(client.user.id);
	}
};
