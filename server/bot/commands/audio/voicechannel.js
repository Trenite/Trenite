const commando = require("discord.js-commando");
const fetch = require("node-fetch");
var osu = require("node-os-utils");

module.exports = class VoiceCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "voicechannel",
			memberName: "voicechannel",
			aliases: [
				"autovoicechannel",
				"generatevoicechannel",
				"generatechannel",
				"autochannel",
				"join-to-create",
				"join2create",
				"jointocreate",
			],
			group: "audio",
			description:
				"Automatically generates a custom user voice channel, if the user joins a specific auto voicechannel",
			examples: ["voice current"],
			userPermissions: ["MANAGE_CHANNELS"],
			clientPermissions: ["VIEW_CHANNEL", "MANAGE_CHANNELS"],
			args: [
				{
					key: "channel",
					type: "voice-channel",
					prompt:
						"Enter the voicechannel to activate autogenerate (id, voiceChannelName)?\nEnter **``current``** to make the current voice channel you are in, a autovoicechannel\nIf you want to **disable** autogenerate, enter the channel again.",
					validate: (text, msg) => {
						if (text === "current") {
							return true;
						} else if (msg.client.registry.types.get("channel").parse(text, msg)) {
							return true;
						}

						return false;
					},
				},
			],
		});
		this.client.once(
			"providerReady",
			(() => {
				this.client.guilds.cache.forEach(this.statusupdate.bind(this));
				this.client.on("voiceStateUpdate", this.voiceStateUpdate.bind(this));
			}).bind(this)
		);
		this.conf = {};
	}

	async run(msg, args, lang) {
		const { client, guild, member } = msg;
		var { channel } = args;

		if (channel === "current" || channel === null) {
			channel = member.voice.channel;
			if (!channel) return msg.reply(lang.novoice);
		}

		var channels = await client.provider.get(guild, "autovoiceChannels");
		if (!channels) channels = [];

		var i = channels.findIndex((x) => x === channel.id);
		if (i != -1) {
			channels.splice(i, 1);
			msg.reply(lang.removed.replace("{channel}", `${channel}`));
		} else {
			channels.push(channel.id);
			msg.reply(lang.added.replace("{channel}", `${channel}`));
		}

		await client.provider.set(guild, "autovoiceChannels", channels);

		this.statusupdate(guild);
	}

	async voiceStateUpdate(oldState, newState) {
		var guild = oldState.guild || newState.guild;
		if (!this.conf[guild.id]) return;
		var { userChannels, voiceChannels, userChannels } = this.conf[guild.id];
		var client = this.client;

		// if(New.member.user.bot) return;
		// if(Old.member.user.bot) return;
		try {
			if (newState.channel && voiceChannels.find((x) => x === newState.channelID)) {
				var newChannel = await newState.channel.clone({
					name: newState.member.user.username + " VC",
					permissionOverwrites: [
						{
							allow: 53478656,
							id: newState.member.id,
						},
					],
				});
				newState.member.voice.setChannel(newChannel);

				var userChannels = await client.provider.get(guild, "autovoiceUserChannels");
				if (!userChannels) userChannels = [];
				userChannels.push(newChannel.id);
				client.provider.set(guild, "autovoiceUserChannels", userChannels);
			}

			if (oldState.channel && oldState.channel.members.size <= 0 && newState.channelID !== oldState.channelID) {
				var userChannels = await client.provider.get(guild, "autovoiceUserChannels");
				if (!userChannels) userChannels = [];

				if (userChannels.find((x) => x === oldState.channelID)) {
					userChannels = userChannels.filter((x) => x !== oldState.channelID);
					client.provider.set(guild, "autovoiceUserChannels", userChannels);
					oldState.channel.delete();
				}
			}
		} catch (error) {
			console.error(error);
		}
	}

	async statusupdate(guild) {
		var voiceChannels = this.client.provider.get(guild, "autovoiceChannels") || [];
		var userChannels = this.client.provider.get(guild, "autovoiceUserChannels") || [];
		var newUserChannels = [];

		userChannels.forEach((x) => {
			// delete old userchannels from last start, if nobody is in it
			var c = guild.channels.resolve(x);
			if (c && c.members.size <= 0) {
				c.delete();
			} else {
				newUserChannels.push(x);
			}
		});

		if (JSON.stringify(newUserChannels) !== JSON.stringify(userChannels)) {
			userChannels = await this.client.provider.set(guild, "autovoiceUserChannels", newUserChannels);
		}

		this.conf[guild.id] = {
			userChannels,
			voiceChannels,
			userChannels,
		};
	}
};
