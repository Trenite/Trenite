module.exports = (client) => {
	client.on("guildCreate", async (guild) => {
		if (client.guilds.cache.size > 5 && !client.meltic) {
			await client.options.owner.sendAll(
				`Your bot ${client.user} joined a sixth server: ${guild.name}, but is limited to **5 servers only**`
			);

			return await guild.leave();
		}
		try {
			client.server.emit("GUILD_CREATE", client, guild);
			guild.lang = guild.client.en;

			let set = client.provider.set.bind(client.provider, guild);
			let log = guild.channels.cache.find((x) => x.name.includes("log"));
			if (log) {
				set("logChannel", log.id);
				client.log(guild, "This is now the logs channel");
			}

			const guildInvites = await guild.fetchInvites();
			client.provider.set(
				guild,
				"invites",
				guildInvites.map((x) => ({ code: x.code, uses: x.uses }))
			);

			var invite = guildInvites.find((x) => !x.temporary);
			if (!invite) {
				var possibleInvites = guildInvites.sort((a, b) => a.expiresTimestamp - b.expiresTimestamp);
				if (possibleInvites.size) {
					invite = possibleInvites.first();
				}
			}

			var bots = guild.members.cache.filter((x) => x.user.bot).size;
			var botRatio = Math.floor((bots / guild.memberCount) * 100) + "%";

			await client.treniteLog("", {
				title: "New Server",
				embed: {
					thumbnail: {
						url: guild.iconURL({
							dynamic: true,
							type: "jpg",
							size: 2048,
						}),
					},
					fields: [
						{ name: "Servername:", value: guild.name },
						{
							name: "Owner:",
							value: `${guild.owner} (${guild.owner.user.tag})`,
						},
						{ name: "Members:", value: guild.memberCount },
						{ name: "Region:", value: guild.region },
						{ name: "Bots Ratio:", value: botRatio },
						{ name: "Invite:", value: (invite && invite.url) || "-" },
					],
				},
			});

			const channel = guild.channels.cache.sort((a, b) => a.position - b.position).find((x) => x.type === "text");
			if (!channel) return;

			var invite = await channel.send(
				`**Thanks** for inviting me!\n${client.registry.commands.get("about").message(client, guild)}`,
				{
					title: "Hello",
					embed: {
						fields: client.registry.groups.map((g) => {
							return {
								name: g.name + ": ",
								value: g.commands
									.filter((c) => !c.ownerOnly)
									.map((c) => c.name)
									.join(", "),
							};
						}),
					},
				}
			);

			var languagecmd = client.registry.commands.get("language");
			invite.command = languagecmd;
			var lang = languagecmd.lang(guild);
			await languagecmd.run(invite, { language: "none" }, lang, true);
		} catch (error) {}
	});
};
