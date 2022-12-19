const { Command } = require("discord.js-commando");
const { MessageEmbed } = require("discord.js");

module.exports = class RosterCommand extends Command {
	constructor(client) {
		super(client, {
			name: "roster", //lowercase
			memberName: "roster", //lowercase
			aliases: ["rolelist", "roles-list", "roleslist", "role-list"],
			group: "setup", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, stats, util]
			description: "Create a list of role members, a roster!",
			examples: [""],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "roles",
					prompt:
						"**Enter the roles in new lines**\nYou can just enter the **name**, **id** or **mention** it\nIf role doesn't show up make sure to write the exact case sensitive name and **no other role with the same exact name exist**",
					type: "string",
					wait: 120,
				},
			],
		});
		this.client.on("ready", () => {
			this.updatemsg();
		});
	}

	async updatemsg() {
		var interval = this.client.setInterval(
			async function () {
				this.client.guilds.cache.forEach(async (guild) => {
					var rostermsg = this.client.provider.get(guild, "Rostermsg");
					var RosterChannel = this.client.provider.get(guild, "RosterChannel");
					RosterChannel = this.client.channels.resolve(RosterChannel);
					if (!RosterChannel) return;
					rostermsg = await RosterChannel.messages.fetch(rostermsg);
					if (!rostermsg) return;

					rostermsg.edit(this.makeEmbed(guild));
				});
			}.bind(this),
			1000 * 10 * 6
		);
	}

	makeEmbed(guild) {
		var roles = this.client.provider.get(guild, "RosterRoles");
		var embed = { fields: [], footer: null };

		roles = roles.forEach((entry) => {
			var role = guild.roles.resolve(entry);

			if (!role) return;
			if (role.members.size === 0) {
				return embed.fields.push({ name: role.name, value: "0" });
			}

			var users =
				role.members
					.sort((a, b) => a.user.username.localeCompare(b.user.username))
					.map((u) => `${u}`)
					.join("\n") || "-";
			embed.fields.push({ name: role.name, value: users });
		});

		return { embed, title: "Roster of " + guild.name };
	}

	async run(msg, args) {
		var roles = args.roles;
		var { guild } = msg;
		roles = args.roles
			.split("\n")
			.map((r) => {
				r = r.trim();
				if (r.length <= 0) return;
				var role = this.client.registry.types.get("role").parse(r, msg);
				if (role) return role.id;
			})
			.filter((r) => !!r);

		this.client.provider.set(guild, "RosterRoles", roles);

		var rostermsg = await msg.reply(this.makeEmbed(guild));

		this.client.provider.set(guild, "RosterChannel", msg.channel.id);
		this.client.provider.set(guild, "Rostermsg", rostermsg.id);
		var test = await this.client.provider.get(guild, "RosterRoles");
	}
};
