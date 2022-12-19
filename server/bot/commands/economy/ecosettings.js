const { Command } = require("discord.js-commando");

module.exports = class EcoSettingsCommand extends Command {
	constructor(client) {
		super(client, {
			name: "eco-settings", //lowercase
			memberName: "eco-settings", //lowercase
			aliases: ["setup-eco", "eco-setup", "settings-eco"],
			autoAliases: true,
			group: "economy", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, setup, stats, util]
			description: "Activate or Deactivate Economy Modules",
			examples: ["ecosettings"],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			args: [
				{
					key: "daily",
					prompt: "Should a User can collect a Daily Reward?\ntrue or false",
					type: "boolean",
				},
				{
					key: "dailyamount",
					prompt: "How much should the daily reward amount be?",
					type: "integer",
					min: 0,
				},
				{
					key: "weekly",
					prompt: "Should a User can collect a Weekly Reward?\ntrue or false",
					type: "boolean",
				},
				{
					key: "weeklyamount",
					prompt: "How much should the weekly reward amount be?",
					type: "integer",
					min: 0,
				},
				{
					key: "Monthly",
					prompt: "Should a User can collect a Monthly Reward?\ntrue or false",
					type: "boolean",
				},
				{
					key: "monthlyamount",
					prompt: "How much should the Monthly reward amount be?",
					type: "integer",
					min: 0,
				},
				{
					key: "payments",
					prompt: "Should a User can pay Balance to other user?\ntrue or false",
					type: "boolean",
				},
				{
					key: "Slots",
					prompt: "Should a User can play Casino Slots?\ntrue or false",
					type: "boolean",
				},
				{
					key: "slotsmin",
					prompt: "What should be the minimum bet for the slot machine",
					type: "integer",
					min: 0,
				},
				{
					key: "slotsmax",
					prompt: "What should be the maximum bet for the slot machine",
					type: "integer",
					min: 0,
				},
			],
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;
		var {
			daily,
			dailyamount,
			weekly,
			weeklyamount,
			Monthly,
			monthlyamount,
			payments,
			Slots,
			slotsmin,
			slotsmax,
		} = args;

		const settingsmsg = await msg.reply(
			`Do you want save this settings? \nDaily: ${daily}(${dailyamount})\nWeekly: ${weekly}(${weeklyamount})\nMonthly: ${Monthly}(${monthlyamount})\nSlots: ${Slots} (Min: ${slotsmin} Max: ${slotsmax}) \nPayments: ${payments}`,
			{
				title: "Economy Settings:",
			}
		);
		settingsmsg.react("✅");
		settingsmsg.react("❌");
		var collected = await settingsmsg
			.awaitReactions(
				(reaction, u) =>
					u.id === msg.author.id && (reaction.emoji.name === "✅" || reaction.emoji.name === "❌"),
				{ time: 1000 * 30, errors: ["time"], max: 1 }
			)
			.catch((e) => {
				throw "Timeout exceeded to respond";
			});
		collected = collected.first();
		settingsmsg.reactions.removeAll();
		switch (collected.emoji.name) {
			case "✅":
				await client.provider.set(guild, `daily`, daily);
				await client.provider.set(guild, `weekly`, weekly);
				await client.provider.set(guild, `monthly`, Monthly);
				await client.provider.set(guild, `dailyamount`, dailyamount);
				await client.provider.set(guild, `weeklyamount`, weeklyamount);
				await client.provider.set(guild, `monthlyamount`, monthlyamount);
				await client.provider.set(guild, `payments`, payments);
				await client.provider.set(guild, `slots`, Slots);
				await client.provider.set(guild, `slotsmin`, slotsmin);
				await client.provider.set(guild, `slotsmax`, slotsmax);
				settingsmsg.edit(
					`Settings saved! \nDaily: ${daily}(${dailyamount})\nWeekly: ${weekly}(${weeklyamount})\nMonthly: ${Monthly}(${monthlyamount})\nSlots: ${Slots} (Min: ${slotsmin} Max: ${slotsmax})\nPayments: ${payments}`,
					{
						title: "Economy Settings:",
					}
				);
				break;
			case "❌": {
				newcommandmsg.edit("Canceld Command");
			}
		}
	}
};
