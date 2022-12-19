const { Command } = require("discord.js-commando");

module.exports = class ReactionRolesCommand extends Command {
	constructor(client) {
		super(client, {
			name: "reaction-roles", //lowercase
			memberName: "reaction-roles", //lowercase
			aliases: [],
			group: "setup", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, setup, stats, util]
			description: "create reaction role",
			examples: ["$reaction-roles add"],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "trigger",
					prompt:
						"What do you want to do?\n``add`` if you want to add a reaction role",
					type: "string",
					validate(text) {
						return ["add"].includes(text.split(" ")[0]);
					},
				},
			],
		});
		client.on("messageReactionAdd", this.onReactionAdd.bind(this));
		client.on("messageReactionRemove", this.onReactionRemove.bind(this));
	}

	async onReactionAdd(reaction, user) {
		if (reaction.message.partial) await reaction.message.fetch();
		if (reaction.partial) await reaction.fetch();

		if (user.bot) return;
		if (!reaction.message.guild) return;
		const message = reaction.message;
		const guild = message.guild;
		const reactionroles = this.client.provider.get(guild, "reactionRoles");
		if (!reactionroles) return;
		var reactionrole = await reactionroles.find(rr => rr.messageid === message.id && rr.channelid === message.channel.id && rr.emojiID === reaction.emoji.id);
		if (!reactionrole) return;
		var guildMember = await message.guild.members.fetch(user.id);
		guildMember.roles.add(reactionrole.roleID).then(r => console.log("Role added!"))

	}

	async onReactionRemove(reaction, user) {
		if (reaction.message.partial) await reaction.message.fetch();
		if (reaction.partial) await reaction.fetch();

		if (user.bot) return;
		if (!reaction.message.guild) return;
		const message = reaction.message;
		const guild = message.guild;
		const reactionroles = this.client.provider.get(guild, "reactionRoles");
		if (!reactionroles) return;
		var reactionrole = await reactionroles.find(rr => rr.messageid === message.id && rr.channelid === message.channel.id && rr.emojiID === reaction.emoji.id);
		if (!reactionrole) return;
		var guildMember = await message.guild.members.fetch(user.id);
		guildMember.roles.remove(reactionrole.roleID).then(r => console.log("Role added!"))

	}

	async addReactionRole(msg) {
		const guild = msg.guild;
		//ASK FOR CHANNEL
		var name = await msg.reply(
			"In which channel should the reaction role added? Please mention the channel!\nRespond with ``cancel`` to cancel the command. The command will automatically be cancelled in 30 seconds.	"
		);
		var collected = await msg.channel
			.awaitMessages((message) => message.author.id === msg.author.id, {
				max: 1,
				time: 1000 * 60 * 10,
				errors: ["time"],
			})
			.catch((e) => {
				throw "Timeout for command exceeded";
			});
		var channelMSG = collected.first();
		var mentionedChannel = channelMSG.mentions.channels.first();
		if (!mentionedChannel) throw "Not a valid channel!"
		name.delete();

		if (collected.first().content === "cancel") {
			throw "Command Canceled";
		}

		//ASK FOR EMOJI
		var emojiReply = await msg.reply(
			"Please write the **name of the emoji** which is the trigger, **note that it has to be an emoji from this server**!\nRespond with ``cancel`` to cancel the command. The command will automatically be cancelled in 30 seconds.	"
		);
		var collected = await msg.channel
			.awaitMessages((message) => message.author.id === msg.author.id, {
				max: 1,
				time: 1000 * 60 * 10,
				errors: ["time"],
			})
			.catch((e) => {
				throw "Timeout for command exceeded";
			});
		var emojiMSG = collected.first().content;
		emojiReply.delete();
		const reactionEmoji = msg.guild.emojis.cache.find(emoji => emoji.name === emojiMSG);
		if (!reactionEmoji) throw "Not a valid Emoji name!"

		if (collected.first().content === "cancel") {
			throw "Command Canceled";
		}

		//ASK FOR ROLE
		var roleReply = await msg.reply(
			"Which role should be added to the user?\nRespond with ``cancel`` to cancel the command. The command will automatically be cancelled in 30 seconds.	"
		);
		var collected = await msg.channel
			.awaitMessages((message) => message.author.id === msg.author.id, {
				max: 1,
				time: 1000 * 60 * 10,
				errors: ["time"],
			})
			.catch((e) => {
				throw "Timeout for command exceeded";
			});
		var roleMSG = collected.first();
		var mentionedRole = roleMSG.mentions.roles.first();
		if (!mentionedRole) throw "Not a valid role!"
		roleReply.delete();

		if (collected.first().content === "cancel") {
			throw "Command Canceled";
		}

		//ASK FOR MESSAGE ID
		var messageReply = await msg.reply(
			"For which message should the reaction role be added? (Message id)\nRespond with ``cancel`` to cancel the command. The command will automatically be cancelled in 30 seconds.	"
		);
		var collected = await msg.channel
			.awaitMessages((message) => message.author.id === msg.author.id, {
				max: 1,
				time: 1000 * 60 * 10,
				errors: ["time"],
			})
			.catch((e) => {
				throw "Timeout for command exceeded";
			});
		var messageID = collected.first().content;
		const rolemsgggg = await mentionedChannel.messages.fetch(messageID);
		if (!rolemsgggg) throw "Not a valid message id!"
		messageReply.delete();

		if (collected.first().content === "cancel") {
			throw "Command Canceled";
		}
		const reactionroles = this.client.provider.get(guild, "reactionRoles") || [];
		reactionroles.push({ channelid: mentionedChannel.id, messageid: messageID, roleID: mentionedRole.id, emojiID: reactionEmoji.id });
		await this.client.provider.set(guild, "reactionRoles", reactionroles);
		rolemsgggg.react(reactionEmoji)
			.then(console.log)
			.catch(console.error);
		msg.reply("Done!")

	}

	async run(msg, args, lang) {
		var { client, author } = msg;
		var { trigger } = args;
		if (trigger === "add") {
			this.addReactionRole(msg);
		}
	}
};
