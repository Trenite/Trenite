module.exports = (client) => {
	client.on("guildDelete", async (guild) => {
		try {
			client.server.emit("GUILD_DELETE", client, guild);
			client.provider.clear(guild);

			if (!client.guilds.cache.size) {
				await client.options.owner.sendAll(
					`Your bot ${client.user} was removed from ${guild.name} and is now in 0 servers, therefore your bot will be disabled`
				);

				return await client.bot.botmanager.delete(client.user.id);
			}

			var invites = client.provider.get(guild, "invites");
			var invite = invites && invites.length && `https://discord.gg/${invites[0].code}`;
			var bots = guild.members.cache.filter((x) => x.user.bot).size;
			var botRatio = Math.floor((bots / guild.memberCount) * 100) + "%";

			const embed1 = await client.treniteLog("", {
				title: "Server left",
				embed: {
					thumbnail: {
						url: guild.iconURL({ dynamic: true, type: "jpg", size: 2048 }),
					},
					fields: [
						{ name: "Servername:", value: guild.name },
						{ name: "Owner:", value: `${guild.owner} (${guild.owner.user.tag})` },
						{ name: "Members:", value: guild.memberCount },
						{ name: "Bots Ratio:", value: botRatio },
						{ name: "Invite:", value: invite || "-" },
					],
				},
			});
		} catch (error) {}
	});
};
