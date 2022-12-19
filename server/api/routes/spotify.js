const fetch = require("node-fetch");
const mongoose = require("mongoose");
var OAuth2 = mongoose.model("OAuth2");

module.exports = (api) => {
	var { app } = api;

	app.get("/api/oauth2/spotify", async (req, res) => {
		if (!req.query) throw new Error("Invalid Response");
		if (!req.query.state) throw new Error("Invalid redirect_uri");
		if (!req.query.code && !req.query.error) throw new Error("Invalid message");

		var discord = req.query.state;
		const provider = "spotify";

		var redirect_uri = `https://${api.config.api.domain}/api/oauth2/spotify`;

		const form = new URLSearchParams();
		form.append("grant_type", "authorization_code");
		form.append("code", req.query.code);
		form.append("redirect_uri", redirect_uri);

		var token = await fetch("https://accounts.spotify.com/api/token", {
			method: "POST",
			headers: {
				Authorization:
					"Basic " +
					Buffer.from(
						"be29aaa10a7648c397b5a292aceb2a36:ad7ada9bddc6429f9509fbea82a5ca56"
					).toString("base64"),
			},
			body: form,
		});
		token = await token.json();
		if (token.error) {
			res.redirect(`/oauth2/spotify?error=${token.error_description || token.error}`);
			return;
		}

		var doc = { ...token, expires_in: Date.now() + token.expires_in * 1000, provider, discord };

		await OAuth2.updateOne(
			{ discord, provider },
			{
				$set: doc,
			},
			{ upsert: true }
		);
		api.emit("oauth2#update", doc);
		api.emit("oauth2#spotify", doc);

		res.redirect("/static/index.html?token=" + token.access_token);
	});
};
