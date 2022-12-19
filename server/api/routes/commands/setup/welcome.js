module.exports = (api) => {
	var { app } = api;

	app.post("/api/bot/commands/setup/welcome", (req, res) => {
		if (!req.body) return;
		var { member, guild, client, body } = req;
		var { channel, roles, dm, text } = body;

		if (!Array.isArray(roles)) throw new Error("Roles must be a array");
		if (typeof dm !== "boolean") throw new Error("DM must be boolean");
		if (typeof text !== "boolean" && typeof text !== "string") throw new Error("Text must be false or a string");

		channel = guild.channels.resolve(channel);
		roles = roles
			.map((x) => guild.roles.resolve(x))
			.filter((x) => !!x)
			.map((x) => x.id);

		client.provider.set(guild, "welcomeChannel", channel);
		client.provider.set(guild, "welcomeText", text);
		client.provider.set(guild, "welcomePrivate", dm);
		client.provider.set(guild, "welcomeRoles", roles);

		res.send({ welcome: { roles, dm, text, channel }, success: true });
	});
};
