const commando = require("discord.js-commando");

module.exports = class ReportCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "report",
			memberName: "report",
			aliases: [],
			group: "mod",
			description: "Report a User.",
			examples: ["report"],
			guildOnly: true,
			clientPermissions: ["SEND_MESSAGES"],
			args: [
				{
					key: "user",
					prompt: "Which user should be reported",
					type: "user",
				},
				{
					key: "reason",
					prompt: "Why should the user be reported?",
					type: "string",
					wait: 120,
				},
			],
		});
		client.on("messageReactionAdd", this.onReact.bind(this));
	}

	async onReact(reaction, user) {
		let msg = reaction.message,
			emoji = reaction.emoji;
		if (user.id === this.client.user.id) return;
		var data = await this.client.provider.get(msg.guild, "warns");
		const guild = msg.guild;
		if (!data) data = [];
		if (emoji.name == "📢") {
			var reports = this.client.provider.get(msg.guild, "reports") || [];
			var report = reports.find((x) => msg.id === x.msgid);
			if (!report) return;
			const reason = "Report";
			const member = msg.guild.members.resolve(report.reporteduser);
			var time = 1;
			var player = data.find((x) => x.id === member.id);
			if (!player) {
				data.push({ id: member.id, warns: 1 });
				this.client.log(guild, `${member} was warned the first time`);
			} else {
				time = player.warns++;
				if (time >= 6) {
					try {
						user.send(
							`You was banned from ${guild.name} because you were warned the ${times}.`
						);
						await user.ban();
						this.client.log(
							`${user} was warned ${times}. times and was banned`
						);
					} catch (error) {
						this.client.log(
							`${user} was warned ${times}. times but couldn't be banned: insufficient permissions`
						);
					}
				} else if (time >= 3) {
					try {
						user.send(
							`You was kicked from ${guild.name} because you were warned the ${times}.}`
						);
						await user.kick();
						this.client.log(
							`${user} was warned ${time}. times and was kicked`
						);
					} catch (error) {
						this.client.log(
							`${user} was warned ${time}. times but couldn't be kicked: insufficient permissions`
						);
					}
				} else {
					this.client.log(guild, `${user} was warned the ${time}. `);
				}
			}
			await this.client.provider.set(guild, "warns", data);
			msg.edit(
				msg.embeds[0].description + "\n\nStatus: User was warned!",
				{ title: "Report" }
			);
			msg.reactions
				.removeAll()
				.catch((error) =>
					console.error("Failed to clear reactions: ", error)
				);
		} else if (emoji.name == "🔨") {
			var reports = this.client.provider.get(msg.guild, "reports") || [];
			var report = reports.find((x) => msg.id === x.msgid);
			if (!report) return;
			const reason = "Report";
			const member = msg.guild.members.resolve(report.reporteduser);
			try {
				await member.ban();
				msg.reply("The user was sucessfully banned!", {
					title: "Banned!",
				});
			} catch (error) {
				return msg.reply("User couldn't be banned!");
			}
			msg.edit(
				msg.embeds[0].description + "\n\nStatus: User was banned!",
				{ title: "Report" }
			);
			msg.reactions
				.removeAll()
				.catch((error) =>
					console.error("Failed to clear reactions: ", error)
				);
		} else if (emoji.name == "👟") {
			var reports = this.client.provider.get(msg.guild, "reports") || [];
			var report = reports.find((x) => msg.id === x.msgid);
			if (!report) return;
			const reason = "Report";
			const member = msg.guild.members.resolve(report.reporteduser);
			try {
				await member.kick();
				msg.reply("The user was sucessfully kicked!", {
					title: "kicked!",
				});
			} catch (error) {
				return msg.reply("User couldn't be kicked!");
			}
			msg.edit(
				msg.embeds[0].description + "\n\nStatus: User was kicked!",
				{ title: "Report" }
			);
			msg.reactions
				.removeAll()
				.catch((error) =>
					console.error("Failed to clear reactions: ", error)
				);
		} else if (emoji.name == "❌") {
			var reports = this.client.provider.get(msg.guild, "reports") || [];
			var report = reports.find((x) => msg.id === x.msgid);
			if (!report) return;
			const reason = "Report";
			const member = msg.guild.members.resolve(report.reporteduser);
			msg.edit(
				msg.embeds[0].description + "\n\nStatus: Report was deleted",
				{ title: "Report" }
			);
			msg.reactions
				.removeAll()
				.catch((error) =>
					console.error("Failed to clear reactions: ", error)
				);
		}
	}

	async run(msg, args) {
		const { guild, channel, client } = msg;
		const { user, reason } = args;
		var length = 0;
		var messages = [];
		try {
			var logMsg = await client.log(
				guild,
				`${user} is reported by ${msg.author} because of ${reason} \n\n🔨 = Ban the User\n📢 = Warn the User\n:athletic_shoe: = Kick the user!\n❌ = Delete Report`,
				{ title: "Report" }
			);
			if (!logMsg) {
				return msg.channel.send("There is no Report Log Channel!");
			}
			msg.reply("This user was sucessfully reported!", {
				title: "Reported",
			});
			logMsg.react("🔨");
			logMsg.react("📢");
			logMsg.react("👟");
			logMsg.react("❌");
			var reports = this.client.provider.get(msg.guild, "reports") || [];
			reports.push({ msgid: logMsg.id, reporteduser: user.id });
			this.client.provider.set(guild, "reports", reports);
		} catch (error) {
			msg.reply(`Error reporting because of: "${error}"`);
		}
	}
};
