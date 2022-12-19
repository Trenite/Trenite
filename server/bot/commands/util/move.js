const { client, Command } = require("discord.js-commando");

module.exports = class MoveCommand extends Command {
	constructor(client) {
		super(client, {
			name: "move", //lowercase
			memberName: "move", //lowercase
			aliases: [],
			group: "util", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, stats, util]
			description: "Move all members from one channel in one other",
			examples: ["move"],
			userPermissions: ["MOVE_MEMBERS"],
			clientPermissions: ["MOVE_MEMBERS"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
		});

		this.client.once(
			"providerReady",
			(() => {
				this.client.on("voiceStateUpdate", this.onVoiceStateUpdate.bind(this));
			}).bind(this)
		);

		this.waiting = [];
	}

	async onVoiceStateUpdate(oldVoiceState, newVoiceState) {
		for (const x of this.waiting) {
			if (x.member === newVoiceState.id && x.channel.id !== newVoiceState.channelID && newVoiceState.channelID) {
				if (x.channel.id === oldVoiceState.channelID) {
					var channels = newVoiceState.guild.channels.cache,
						Fchannel = x.channel,
						Tchannel = newVoiceState.channelID;

					for (const member of Fchannel.members.array()) {
						try {
							await member.voice.setChannel(Tchannel);
						} catch (e) {}
					}
				}

				x.answer.delete();

				this.waiting = this.waiting.filter((waiting) => waiting !== x);
			}
		}
	}

	async run(msg, args) {
		var { member } = msg;

		if (member.voice && member.voice.channel) {
			var answer = await msg.reply("join the channel where the members should be moved to");

			this.waiting.push({
				channel: member.voice.channel,
				member: member.id,
				answer,
			});
		} else {
			msg.reply("You must first join a voice channel");
		}
	}
};
