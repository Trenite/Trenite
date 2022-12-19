module.exports = (api) => {
	var { app } = api;

	app.use("/api/bot/*", (req, res, next) => {
		try {
			if (!req.headers.bot) throw new Error("Please select a bot first");
			var id = req.headers.bot;
			var bot = api.server.bots.getBot({ id });
			if (!bot.Client.options.owner.find((owner) => owner === req.user.id) && !bot.trenite) {
				throw new Error("You are not the admin of the bot");
			}
			req.bot = bot;
			req.client = bot.Client;
			req.provider = bot.Client.provider;
			next();
		} catch (error) {
			next(error);
		}
	});

	app.use("/api/bot/commands/*", async (req, res, next) => {
		try {
			var id = req.headers.guild;
			if (!id) throw new Error("Please select a server first");
			var guild = req.bot.Client.guilds.resolve(id);
			if (!guild) throw new Error("Please add the bot the server");
			var user = socket.user.id;
			var member = guild.members.resolve(user);
			if (!member) throw new Error("You need to be member of the server");
			if (!member.hasPermission("ADMINISTRATOR")) throw new Error("You don't have admin permissions");
			req.member = member;
			req.guild = guild;
			next();
		} catch (error) {
			next(error);
		}
	});

	app.get("/api/bot", async (req, res) => {
		res.json({ id: req.bot.id });
	});

	app.post("/api/bot/guilds", async (req, res) => {
		if (!req.body) return;
		if (!req.body.guilds || !Array.isArray(req.body.guilds)) return;
		if (req.body.guilds.length > 100) return;

		var client = req.bot.Client;

		var guilds = req.body.guilds.map((guildid) => {
			var guild = client.guilds.cache.find((x) => x.id === guildid);
			guild = api.extension.mapGuild(guild);

			return { ...guild, added: !!guild, id: guildid };
		});

		res.json({ guilds });
	});
};
