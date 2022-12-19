const mongoose = require("mongoose");
const fetch = require("node-fetch");
const OAuth2 = mongoose.model("OAuth2");
const jwt = require("jsonwebtoken");

module.exports = async (api) => {
	var { app } = api;

	app.get("/api/oauth2/discord", async (req, res) => {
		try {
			if (!req.query.code && !req.query.error) {
				throw new Error("No token or error provided");
			}

			const code = req.query.code;
			const error = req.query.error_description || req.query.error;
			const provider = "discord";
			if (error) throw error;

			var body = new URLSearchParams();
			body.append("client_id", api.config.discord.client_id);
			body.append("client_secret", api.config.discord.client_secret);
			body.append("grant_type", "authorization_code");
			body.append("code", code);
			body.append("redirect_uri", `https://${api.config.api.domain}/api/oauth2/discord`);
			body.append("scope", api.config.discord.scope);

			var token = await fetch(`${api.config.discord.api}/oauth2/token`, {
				method: "POST",
				body,
			});
			token = await token.json();
			if (token.error) throw new Error(token.error);

			const { access_token, expires_in, refresh_token, scope } = token;
			const token_type = "Bearer";

			var user = await fetch(`${api.config.discord.api}/users/@me`, {
				headers: {
					authorization: `${token_type} ${access_token}`,
				},
			});
			user = await user.json();
			if (user.error) throw new Error(user.error);
			const discord = user.id;

			const doc = {
				access_token,
				expires_in: Date.now() + expires_in * 1000,
				refresh_token,
				scope,
				token_type,
				discord,
				provider,
			};

			await OAuth2.updateOne(
				{ discord, provider },
				{
					$set: doc,
				},
				{ upsert: true }
			);
			api.emit("oauth2#update", doc);
			api.emit("oauth2#discord", doc);

			var role = "user";
			if (api.config.discord.dev.includes(discord)) {
				role = "dev";
			}

			const jwtToken = jwt.sign({ id: discord, role }, api.config.server.jwtSecret);

			res.cookie("token", jwtToken, {
				httpOnly: true,
				secure: true,
				maxAge: Date.now() + 1000 * 60 * 60 * 24 * 365,
			}).redirect("/");
		} catch (error) {
			api.emit("oauth2#discord", { error, discord });
			return res.redirect(`/oauth2/discord?error=${error}`);
		}
	});
};
