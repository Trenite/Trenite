const commando = require("discord.js-commando");

module.exports = class ClearCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "clear",
			memberName: "clear",
			aliases: [
				"purge",
				"purge-messages",
				"purge-message",
				"delete",
				"delete-messages",
				"delete-message",
				"clear-messages",
				"clear-message",
				"prune",
				"prune-message",
				"prune-messages",
			],
			autoAliases: true,
			group: "mod",
			description: "Clears an amount of messages in a channel",
			examples: ["clear 10"],
			guildOnly: true,
			userPermissions: ["MANAGE_MESSAGES"],
			clientPermissions: ["MANAGE_MESSAGES"],
			args: [
				{
					key: "amount",
					prompt: "How many (2 - ∞) messages should be deleted?",
					type: "integer",
					min: 2,
				},
			],
		});
	}

	async run(msg, args) {
		const { client, channel, guild, member, author } = msg;
		var { amount } = args;

		var length = 0;
		var maxbulkDiscordApi = 100;
		var messages = [];
		var starttime = Date.now();
		function timeout(secs) {
			return Date.now() - starttime > 1000 * secs; // process takes longer than 60secs
		}

		do {
			if (amount <= maxbulkDiscordApi) {
				messages = await channel.bulkDelete(amount, true);
				amount -= amount;
			} else {
				messages = await channel.bulkDelete(maxbulkDiscordApi, true);
				amount -= maxbulkDiscordApi;
			}
			length += messages.size;
			if (messages.size <= 0 || amount <= 0 || timeout(30)) {
				break;
			}
		} while (true);
		var reply = await msg.reply(`Successfully deleted ${length} messages newer then 14 days`);
		reply.delete({ timeout: 4000 });

		if (length < args.amount) {
			amount = args.amount - length;
			length = 0;
			var newestMsgs = await channel.messages.fetch({ limit: 2 });
			if (!newestMsgs || newestMsgs.size <= 1) return;
			msg.reply(
				`Continue deleting ${amount} messages older than 14 days\nThis will take a **long** time`
			).then((x) => x.delete({ timeout: 4000 }));

			do {
				await channel.messages.fetch({ limit: 1 });
				var newestMsg = channel.messages.cache.last();
				if (!newestMsg) break;
				var msgs = await channel.messages.fetch({ limit: 100, before: newestMsg.id }, false);

				for (var message of msgs.array()) {
					length++;
					amount--;
					await message.delete();

					if (timeout(60) || amount <= 0) {
						break;
					}
				}

				if (timeout(60)) {
					msg.reply("Clear process took to long").then((x) => x.delete({ timeout: 4000 }));
					break;
				}
				if (amount <= 0) {
					break;
				}
			} while (true);

			var reply = await msg.reply(`Successfully deleted ${length} messages older then 14 days`);
			reply.delete({ timeout: 4000 });
		}
	}
};
