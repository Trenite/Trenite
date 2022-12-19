const commando = require("discord.js-commando"),
	fetch = require("node-fetch"),
	fontList = require("font-list"),
	fs = require("fs"),
	{ Collection, MessageAttachment } = require("discord.js");

const { generate } = require("image-manipulation-api/fetch");

module.exports = class WelcomeCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "welcome",
			aliases: [],
			group: "setup",
			memberName: "welcome",
			description: "Set the Welcome Message if a user joins the Server",
			examples: ["welcome"],
			guildOnly: true,
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"],
			args: [
				{
					key: "private",
					prompt: "Should the User be greeted in Private Chat?\n``yes`` or ``no``",
					type: "boolean",
				},
				{
					key: "channel",
					prompt: "In what channel should the User be greeted?\nIf not write ``none``",
					type: "text-channel",
					validate: (text, msg) => {
						if (text === "none") {
							return true;
						} else if (msg.client.registry.types.get("text-channel").parse(text, msg)) {
							return true;
						}

						return false;
					},
				},
			],
		});
		client.on("guildMemberAdd", this.guildMemberAdd.bind(this));
		this.invites = {};
		client.on("providerReady", async () => {
			for (const guild of client.guilds.cache.array()) {
				var guildInvites = this.client.provider.get(guild, "invites");
				if (!guildInvites) continue;
				this.invites[guild.id] = new Collection(guildInvites.map((x) => [x.code, x]));
			}

			for (const guild of client.guilds.cache.array()) {
				try {
					const guildInvites = await guild.fetchInvites();
					this.invites[guild.id] = guildInvites;
					this.client.provider.set(
						guild,
						"invites",
						guildInvites.map((x) => ({
							code: x.code,
							uses: x.uses,
						}))
					);
				} catch (error) {}
			}
		});
	}

	async guildMemberAdd(member) {
		try {
			var guild = member.guild;
			var channel = this.client.provider.get(guild, "welcomeChannel");
			var text = this.client.provider.get(guild, "welcomeText");
			if (!text && text !== false) text = `Hey {user}, welcome to **{server}**`;
			var privateBool = this.client.provider.get(guild, "welcomePrivate");
			var roles = this.client.provider.get(guild, "welcomeRoles") || [];

			if (!text) text = "";
			text = text.replace("{user}", `${member.user}`).replace("{server}", guild.name);

			if (channel) {
				channel = await guild.channels.resolve(channel);
				if (channel) {
					this.sendImage({ member, channel, text });
				}
			}

			if (privateBool) {
				const dm = await member.createDM();
				this.sendImage({ member, channel: dm, text });
			}

			if (roles.length > 0) {
				await member.roles
					.add(roles, "Member joined and role on join is active. Change the settings on the dashboard")
					.catch((e) => {});
			}
		} catch (error) {
			console.error(error);
		}
	}

	async sendImage({ member, channel, text }) {
		var { guild } = member;

		const old = this.invites[channel.guild.id]; // save old invites

		var guildInvites = await channel.guild.fetchInvites(); // fetch new invites for server
		this.client.provider.set(
			channel.guild,
			"invites",
			guildInvites.map((x) => ({ code: x.code, uses: x.uses }))
		);
		this.invites[channel.guild.id] = guildInvites; // save new invites

		const invite = guildInvites.find((i) => {
			var oldInvite = old.get(i.code);
			if (!oldInvite) oldInvite = { uses: 0 };
			return oldInvite.uses < i.uses;
		}); // find invite code

		var { createdTimestamp } = member.user;
		var differenceDays = Math.floor((Date.now() - createdTimestamp) / (1000 * 60 * 60 * 24));

		var description = `Created ${differenceDays} days ago | `;
		if (invite) {
			const inviter = await this.client.users.fetch(invite.inviter.id);
			description += `Inviter ${inviter} (**${invite.uses}** [uses](https://discord.gg/${invite.code}))`;
		} else if (member.user.bot) {
			description += `Bot added`;
		} else {
			description += `Unkown invite`;
		}

		var url = generate("/setup/welcome", {
			user_tag: member.user.tag,
			user_avatar: member.user.avatar,
			user_id: member.user.id,
			guild_id: guild.id,
			guild_avatar: guild.icon,
			guild_name: guild.name,
			member_count: guild.memberCount,
			background: "discord",
			status: member.presence.status,
		});

		await channel.send(text, {
			noEmbed: true,
			embed: {
				color: 3553598,
				description: channel.type !== "dm" && description,
				image: {
					url,
				},
			},
		});
	}

	async run(msg, args) {
		var { channel, client } = msg;
		var channel = args.channel;
		var privateBool = args.private;

		var answer = "";

		if (channel) {
			answer += `Welcome on join activated for channel: ${channel}\n`;
			client.provider.set(msg.guild, "welcomeChannel", channel.id);
		} else {
			answer += "Welcome on join deactivated for Channel\n";
			client.provider.remove(msg.guild, "welcomeChannel");
		}

		if (privateBool) {
			answer += "Welcome on join activated for DM";
			client.provider.set(msg.guild, "welcomePrivate", true);
		} else {
			answer += "Welcome on join deactivated for DM";
			client.provider.remove(msg.guild, "welcomePrivate");
		}

		return msg.reply(answer);
	}
};
