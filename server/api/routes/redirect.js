module.exports = (api) => {
	var { app } = api;
	app.get("/api/redirect/spotify/:userid", (req, res) => {
		if (!req.params || !req.params.userid) throw new Error("Missing userid");

		var scopes = [
			"user-read-playback-state",
			"user-modify-playback-state",
			"user-read-currently-playing",
			"streaming",
			"user-read-email",
			"user-read-private",
			"user-read-recently-played",
		].join("%20");

		var redirect_uri = `https://${api.config.api.domain}/api/oauth2/spotify`;

		res.redirect(
			`https://accounts.spotify.com/de/authorize?response_type=code&redirect_uri=${encodeURIComponent(
				redirect_uri
			)}&client_id=be29aaa10a7648c397b5a292aceb2a36&scope=${scopes}&state=${
				req.params.userid
			}`
		);
	});
	app.get("/api/redirect/trello/:userid", (req, res) => {
		if (!req.params || !req.params.userid) throw new Error("Missing userid");

		const key = api.config.trello.key;
		const scopes = api.config.trello.scopes.join("%20");

		var redirect_uri = encodeURIComponent(
			`https://${api.config.api.domain}/api/oauth2/trello?state=${req.params.userid}`
		);

		res.redirect(
			`https://trello.com/1/authorize?response_type=token&key=${key}&redirect_uri=${redirect_uri}&callback_method=fragment&scope=${scopes}&expiration=never&name=Trenite`
		);
	});
	app.get("/api/redirect/discord", (req, res) => {
		var { api: base, client_id, scope, redirect_uri, owner, invite } = api.config.discord;

		var authorizeURL = encodeURI(
			`${base}/oauth2/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope}`
		);

		res.redirect(authorizeURL);
	});
};
