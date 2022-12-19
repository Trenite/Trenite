const fetch = require("node-fetch");
const mongoose = require("mongoose");
const OAuth2 = mongoose.model("OAuth2");
const Discord = require("discord.js");
const BotModel = mongoose.model("Bot");

module.exports = (api) => {
	var { app, config } = api;
	var { provider, allUsers } = api.server.bots;

	async function discordRequest(url, options = {}) {
		var defaultOptions = {
			method: options.method || "GET",
			headers: {
				"Content-type": "application/json",
				...(options.headers || {}),
			},
			body: options.body || null,
		};

		var req = await fetch(`https://discord.com/api/v6${url}`, defaultOptions);
		var text = await req.text();

		try {
			var json = JSON.parse(text);
			if (json.message || json.error) {
				throw new Error(json.message);
			}
			return json;
		} catch (error) {
			throw new Error(text);
		}
	}

	async function getAuth(req) {
		var user = await OAuth2.findOne({ discord: req.user.id, provider: "discord" }).exec();
		if (!user) throw new Error("Not authorized");

		user.authorization = `${user.token_type} ${user.access_token}`;

		if (!user.refresh_token) throw new Error("Not authorized");
		if (user.expires_in > Date.now()) return user;

		var body = new URLSearchParams();
		body.append("client_id", config.discord.client_id);
		body.append("client_secret", config.discord.client_secret);
		body.append("grant_type", "refresh_token");
		body.append("refresh_token", user.refresh_token);
		body.append("redirect_uri", `https://${api.config.api.domain}/api/oauth2/discord`);
		body.append("scope", user.scope);

		var token = await fetch(`${config.discord.api}/oauth2/token`, {
			method: "POST",
			body,
		});
		token = await token.json();
		if (token.error) user.refresh_token = null;
		else {
			user.refresh_token = token.refresh_token;
			user.access_token = token.access_token;
			user.expires_in = Date.now() + token.expires_in * 1000;
		}
		user.authorization = `${user.token_type} ${user.access_token}`;
		await OAuth2.updateOne(
			{ provider: "discord", discord: user.discord },
			{ $set: user }
		).exec();
		if (!user.refresh_token) throw new Error("Not authorized");

		return user;
	}

	app.get("/api/user", async (req, res) => {
		var { expires_in } = await getAuth(req);

		var user = api.server.bots.allUsers.get(req.user.id);

		return res.json({ ...req.user, expires_in, settings: { ...user } });
	});

	app.patch("/api/user", async (req, res) => {
		if (!req.body) throw new Error("Invalid Request");
		if (typeof req.body !== "object") throw new Error("Invalid Request type");

		allUsers.settings.set(req.user.id, req.body);

		return res.json({ success: true });
	});

	app.get("/api/user/discord", async (req, res, next) => {
		var { authorization } = await getAuth(req);

		var user = await discordRequest("/users/@me", { headers: { authorization } });
		if (user.avatar)
			user.avatar = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512`;
		else user.avatar = `https://discord.com/assets/322c936a8c8be1b803cd94861bdfa868.png`;

		return res.json(user);
	});

	app.get("/api/user/guilds", async (req, res, next) => {
		var { authorization } = await getAuth(req);

		var guilds = await discordRequest("/users/@me/guilds", { headers: { authorization } });

		return res.json(guilds);
	});

	app.get("/api/user/bots", async (req, res) => {
		var bots = api.server.bots.bots.filter(
			(x) => x.Client.options.owner.includes(req.user.id) || x.Client.trenite
		);
		bots = bots.map((x) => {
			return {
				id: x.id,
				owner: x.Client.options.owner,
				name: x.Client.user.username,
				logo: x.Client.user.displayAvatarURL({ format: "png", size: 256 }),
			};
		});
		res.json({ bots });
	});

	app.get("/api/user/logout", (req, res) => {
		res.cookie("token", { expires: 0 }).json({ success: true });
	});
};
