const { Command } = require("discord.js-commando");
const fetch = require("node-fetch");

module.exports = class CocPlayerCommand extends Command {
	constructor(client) {
		super(client, {
			name: "coc-player", //lowercase
			memberName: "coc-player", //lowercase
			aliases: [],
			group: "coc", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "Info about a clash of clans player by player tag",
			examples: ["coc-player #88VPUJGRP"],
			userPermissions: ["SEND_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "clan",
					prompt: "Your player tag",
					type: "string",
					wait: 120,
				},
			],
		});
	}

	async run(msg, args, lang) {
		var { clan } = args;

		const clantag = clan.replace("#", "%23");
		const uri = `https://api.clashofclans.com/v1/players/${clantag}`;
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

		msg.reply(lang.infoabout.replace("{player}", data.name), {
			title: "Clash of Clans Player",
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
						name: fields.tag,
						value: data.tag,
						inline: true,
					},
					{
						name: fields.level,
						value: data.expLevel,
						inline: true,
					},
					{
						name: fields.trophies,
						value: data.trophies,
						inline: true,
					},
					{
						name: fields.stars,
						value: data.warStars ? data.warStars : "-️",
						inline: true,
					},
					{
						name: fields.donations,
						value: data.donations ? data.donations : "-️",
						inline: true,
					},
					{
						name: fields.halllevel,
						value: data.townHallLevel,
						inline: true,
					},
					{
						name: fields.clanname,
						value: data.clan.name ? data.clan.name : "-️",
						inline: true,
					},
					{
						name: fields.clantag,
						value: data.clan.tag ? data.clan.tag : "-️",
						inline: true,
					},
					{
						name: fields.clanrole,
						value: data.role ? data.role : "-️",
						inline: true,
					},
				],
			},
		});
	}
};
