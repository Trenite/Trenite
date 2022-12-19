const { Command } = require("discord.js-commando");
const fetch = require("node-fetch");

module.exports = class TemplateCommand extends Command {
	constructor(client) {
		super(client, {
			name: "template", //lowercase
			memberName: "template", //lowercase
			aliases: ["restore"],
			group: "setup", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "Restores a server template",
			examples: ["template https://discord.new/uTzsfWZ2JKF6"],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["ADMINISTRATOR"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			args: [
				{
					key: "code",
					prompt: "Enter your server template link/code",
					type: "string",
					wait: 60,
				},
			],
			throttling: {
				duration: 10,
				usages: 1,
			},
		});
	}

	async run(msg, args) {
		const { client, guild, author, member } = msg;
		var { code } = args;
		code = code.replace(/https?:\/\/(www.)?discord(app)?.(com|new)\/(template\/)?/g, "");
		var template = await (await fetch(`https://discord.com/api/v6/guilds/templates/${code}`)).json();
		if (template.message) throw template.message;
		var tempGuild = template.serialized_source_guild;
		var { creator, name, description } = template;

		var fields = [];
		var { channels, roles } = tempGuild;
		channels = channels.map((x) => {
			var type = "text";
			switch (x.type) {
				case 2:
					type = "voice";
					break;
				case 4:
					type = "category";
					break;
				case 5:
					type = "news";
					break;
				case 6:
					type = "store";
					break;
			}
			x.type = type;
			return x;
		});
		roles = roles.slice(1);

		var categories = channels.filter((x) => x.type === "category");
		categories.push({ id: null, name: "*none*" });
		categories.forEach((category) => {
			var otherChannels = channels
				.filter((channel) => channel.parent_id === category.id && channel.type !== "category")
				.map((x) => {
					var type = "#";
					if (x.type === "voice") type = "🔊 ";
					return type + x.name;
				});
			if (!otherChannels.length) return;
			fields.push({ name: category.name, value: otherChannels.join("\n") || "-" });
		});

		fields.push({
			name: "Roles",
			value: roles.map((x) => x.name).join("\n") || "-",
		});

		var confirm = await msg.reply({
			title: `Do you really want to restore this server template?\nAll current channels and roles will be deleted forever\n**Make sure the Bot Role is at the top of the role list**`,
			embed: {
				description,
				fields: fields,
				author: {
					name: tempGuild.name,
					icon_url: guild.iconURL({ type: "jpg", dynamic: true }),
				},
				footer: {
					text: `By: ${creator.username}#${creator.discriminator}`,
					icon_url: `https://cdn.discordapp.com/avatars/${creator.id}/${creator.avatar}.jpg?size=256`,
				},
			},
		});
		confirm.react("✅");
		confirm.react("❌");

		var reaction = await confirm
			.awaitReactions((reaction, user) => ["✅", "❌"].includes(reaction.emoji.name) && user.id === author.id, {
				max: 1,
				errors: ["time"],
				time: 1000 * 30,
			})
			.catch((e) => {
				confirm.edit("Template restoration aborted");
				confirm.delete({ timeout: 4000 });
				throw "";
			});
		reaction = reaction.first();
		if (reaction.emoji.name === "❌")
			return confirm.edit("Template restoration aborted") && confirm.delete({ timeout: 4000 });
		reaction.remove();

		var stopped = false;

		var collector = confirm.createReactionCollector((reaction) => {
			if (reaction.emoji.name === "❌") {
				stopped = true;
				confirm.edit("Template restoration was stopped");
				collector.stop();
			}
		});

		confirm.edit("You can stop the proccess with ❌", {
			title: "Template restoration",
			embed: {
				author: {
					name: "Restoring ...",
					icon_url: client.savedEmojis.searching.url,
				},
			},
		});

		for (const channel of guild.channels.cache.array()) {
			if (stopped) return;
			if (channel === msg.channel) continue;

			await channel.delete().catch((e) => {});
		}

		for (const role of guild.roles.cache.array()) {
			if (stopped) return;
			if (!role.editable) continue;

			await role.delete().catch((e) => {});
		}

		for (const role of tempGuild.roles.reverse()) {
			if (stopped) return;
			if (role.name === "@everyone") {
				role.newId = guild.roles.everyone;
				continue;
			}
			var r = await guild.roles.create({ data: role });
			role.newId = r.id;
		}

		for (const channel of categories) {
			if (stopped) return;

			if (channel.id === null) {
				var c = channel;
			} else {
				var c = await this.createChannel(guild, channel, tempGuild.roles);
			}

			var otherChannels = channels
				.filter((ch) => ch.parent_id === channel.id && ch.type !== "category")
				.forEach(async (x) => {
					x.parent_id = c.id;
					await this.createChannel(guild, x, tempGuild.roles);
				});
		}

		guild.setDefaultMessageNotifications(tempGuild.default_message_notifications);
		guild.setExplicitContentFilter(tempGuild.explicit_content_filter);
		guild.setAFKTimeout(tempGuild.afk_timeout);
		guild.setRegion(tempGuild.region);
		guild.setVerificationLevel(tempGuild.verification_level);
		guild.setName(tempGuild.name);

		confirm.reactions.removeAll();

		confirm.edit({
			title: "Template successfully applied",
			embed: {
				author: {
					name: "Success",
					icon_url: client.savedEmojis.success.url,
				},
			},
		});
	}

	async createChannel(guild, x, roles) {
		x.parent = x.parent_id;
		x.userLimit = x.user_limit;
		x.rateLimitPerUser = x.rate_limit_per_user;

		x.permissionOverwrites = x.permission_overwrites.map((x) => {
			x.id = roles.find((role) => role.id === x.id).newId;
			x.type = "role";
			return x;
		});

		return guild.channels.create(x.name, x);
	}

	async wait(s) {
		return new Promise((res) => setTimeout(res, s * 1000));
	}
};
