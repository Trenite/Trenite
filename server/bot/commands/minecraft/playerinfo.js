const { Command } = require("discord.js-commando");
const fetch = require("node-fetch");

module.exports = class PlayerInfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: "mc-player", //lowercase
			memberName: "mc-player", //lowercase
			aliases: ["playerinfo", "mc-info", "minecraft", "mc-stats"],
			group: "minecraft", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "Get player info",
			examples: ["playerinfo Paluten"],
			userPermissions: ["SEND_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			autoAliases: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "search",
					prompt: "Which Minecraft Player you mean?",
					type: "string",
				},
			],
		});
	}

	async run(msg, args) {
		var { search, pixels } = args;
		const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${search}`);
		var body;
		body = await res.json().catch((e) => (body = null));
		if (!res || !body) throw `Not a valid profile`;

		let a = await fetch(`https://api.mojang.com/user/profiles/${body.id}/names`);
		a = await a.json().catch((e) => (a = null));
		if (!a) throw `Not a valid profile`;

		var namestring = "";
		for (const b of a) {
			namestring += b.name + "\n";
		}

		msg.reply(`**Player Info**`, {
			title: " ",

			embed: {
				image: {
					url: `https://minotar.net/armor/body/${search}/100.png`,
				},
				thumbnail: {
					url: `https://cravatar.eu/avatar/${search}/${600}.png`,
				},
				footer: {
					icon_url: msg.guild.iconURL({
						format: "jpg",
					}),
					text: msg.guild.name,
				},
				fields: [
					{
						name: "Playername",
						value: `${body.name}`,
					},
					{
						name: "UUID",
						value: `${body.id}`,
					},
					{
						name: "Player-Skin",
						value: `https://minotar.net/skin/${search}`,
					},
					{
						name: "Name History",
						value: namestring,
					},
				],
			},
		});
	}
};
