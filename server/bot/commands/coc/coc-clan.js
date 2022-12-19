const { Command } = require("discord.js-commando");
const fetch = require("node-fetch");
module.exports = class TemplateCommand extends Command {
	constructor(client) {
		super(client, {
			name: "coc-clan", //lowercase
			memberName: "coc-clan", //lowercase
			aliases: [],
			group: "coc", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "Info about a clash of clans clan by clan tag",
			examples: ["coc-clan #88VPUJGRP"],
			userPermissions: ["SEND_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "clan",
					prompt: "Your clan tag",
					type: "string",
					wait: 120,
				},
			],
		});
	}

	async run(msg, args, lang) {
		var { clan } = args;

		const clantag = clan.replace("#", "%23");
		const uri = `https://api.clashofclans.com/v1/clans/${clantag}`;
		const res = await fetch(uri, {
			method: "GET",
			headers: {
				Accept: "application/json",
				authorization: `Bearer ${this.client.config.clashofclans.token}`,
			},
		});
		const data = await res.json();

		if (res.status === 404) {
			throw lang.notfound;
		}
		if (res.status === 400) {
			throw lang.incorrect;
		}
		if (res.status === 503) {
			throw lang.notreachable;
		}

		var { fields } = lang;

		msg.reply(data.description, {
			title: "Clash of Clans Clan",
			embed: {
				footer: {
					icon_url: msg.guild.iconURL({
						format: "jpg",
					}),
					text: msg.guild.name,
				},
				thumbnail: {
					url: data.badgeUrls
						? data.badgeUrls.small
						: "https://s12.directupload.net/images/200723/y9z4gt2a.jpg",
				},
				fields: [
					{
						name: fields.name,
						value: data.name,
						inline: true,
					},
					{
						name: fields.tag,
						value: data.tag,
						inline: true,
					},
					{
						name: fields.type,
						value: data.type,
						inline: true,
					},

					{
						name: fields.level,
						value: data.clanLevel,
						inline: true,
					},
					{
						name: fields.points,
						value: data.clanPoints,
						inline: true,
					},
					{
						name: fields.wins,
						value: data.warWins ? data.warWins : "-️",
						inline: true,
					},
					{
						name: fields.members,
						value: data.members,
						inline: true,
					},
				],
			},
		});
	}
};
