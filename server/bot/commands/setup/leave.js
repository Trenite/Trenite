const commando = require("discord.js-commando");

module.exports = class LeaveCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "leave",
			aliases: ["leaves", "left", "goodbye"],
			group: "setup",
			memberName: "leave",
			description: "Set the goodbye Message if a user leaves the Server",
			examples: ["leave #test Goodbye {user}"],
			guildOnly: true,
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"],
			args: [
				{
					key: "channel",
					prompt: "In which channel the message should be sent?\nIf not write disabled",
					type: "text-channel",
					validate: (text, msg) => {
						if (text === "disabled") {
							return true;
						} else if (msg.client.registry.types.get("text-channel").parse(text, msg)) {
							return true;
						}

						return false;
					},
				},
				{
					key: "channelText",
					prompt:
						"How should the user be said goodbye in public channel when he leaves the server?\nIf not write disabled",
					type: "string",
					default: "{user} left us 😢",
					wait: 120,
				},
			],
		});
		client.on("guildMemberRemove", this.guildMemberRemove.bind(this));
	}

	async guildMemberRemove(member) {
		if (member.user.id === this.client.user.id) return;
		try {
			var guild = member.guild;
			var channel = await this.client.provider.get(guild, "leaveChannel");
			var channelText = await this.client.provider.get(guild, "leaveChannelText");

			if (channel) {
				channel = await guild.channels.resolve(channel);
			}

			if (channelText === "disabled") {
				channelText = null;
			}

			if (channel && channelText) {
				channelText = channelText.replace("{user}", `${member.user} (${member.user.tag})`);

				channel.send(channelText, {
					title: "Leave",
					content: "",
				});
			}
		} catch (error) {
			console.error(error);
		}
	}

	async run(msg, args, lang) {
		var client = msg.client;
		var channel = args.channel;
		if (channel === "disabled") {
			channel = null;
		}
		var channelText = args.channelText;
		if (channelText === "disabled") {
			channelText = null;
		}

		lang = this.lang(msg.guild);

		if (channelText && channel) {
			channel = channel.id;

			msg.reply(lang.activated.replace("{channel}", `${channel}`).replace("{text}", channelText));
			client.provider.set(msg.guild, "leaveChannel", channel);
			client.provider.set(msg.guild, "leaveChannelText", channelText);
		} else {
			msg.reply(lang.deactivated);
			client.provider.remove(msg.guild, "leaveChannel");
			client.provider.remove(msg.guild, "leaveChannelText");
		}
	}
};
