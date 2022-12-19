const { Command } = require("discord.js-commando");

module.exports = class RemindCommand extends Command {
	constructor(client) {
		super(client, {
			name: "remind", //lowercase
			memberName: "remind", //lowercase
			aliases: ["reminder"],
			group: "util", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, setup, stats, util]
			description: "reminds the user after the given time",
			examples: ["remind [time][s/m/h]"],
			userPermissions: ["SEND_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			devOnly: true,
			args: [
				{
					key: "text",
					prompt: "What should I remind you of?",
					type: "string",
					wait: 180,
				},
				{
					key: "time",
					prompt: "When should I remind you?\n30s = 30 seconds\n5m = 5minutes\n2h = 2 hours",
					type: "string",
				},
			],
		});
		client.on("providerReady", () => {
			this.reminders = client.provider.get("global", "reminders") || [];
			this.reminders.forEach(this.timeout.bind(this));
		});
	}

	timeout(reminder) {
		var { timestamp, user, text } = reminder;
		let time = Date.now();

		this.client.setTimeout(async () => {
			user = this.client.users.resolve(user);
			if (user) {
				await user.send(text, { title: "Reminder" }).catch((e) => {});
			}
			this.reminders = this.reminders.filter((x) => x !== reminder);
			this.client.provider.set("global", "reminders", this.reminders);
		}, timestamp - time);
	}

	async run(msg, args, lang) {
		var { client, author } = msg;
		var { time, text } = args;

		let type = time.match(/[smhd]/g)[0];
		if (!type.length) throw "Time is invalid";

		var hasOpenDM = await author
			.send("Okay I'll remind you in ``" + time + "`` about ``" + text + "``", { title: "Reminder" })
			.catch(() => (hasOpenDM = false));
		if (!hasOpenDM) throw "You need to open your DM";

		time = Number(time.match(/\d+/g)[0]);
		let t;

		switch (type) {
			case "s":
				t = time * 1000;
				break;
			case "m":
				t = time * 1000;
				t = t * 60;
				break;
			case "h":
				t = time * 1000;
				t = t * 60;
				t = t * 60;
				break;
		}

		if (t > 2147483647) throw "Date is too far in the future";

		var timestamp = Date.now() + t;
		var reminder = { timestamp, user: author.id, text };

		this.timeout(reminder);

		this.reminders.push(reminder);
		client.provider.set("global", "reminders", this.reminders);
	}
};
