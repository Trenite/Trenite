const parser = require("fast-xml-parser");
const fetch = require("node-fetch");

module.exports = (api) => {
	var { app } = api;
	const { clientID, secret, token } = api.config.twitch;
	const postedWebhooks = [];
	const postedUsers = [];

	function defaultBody({ id }) {
		const callback = `https://${api.config.api.domain}/api/webhook/twitch/${id}`;

		var topic = `https://api.twitch.tv/helix/streams?user_id=${id}`;

		return {
			"hub.callback": callback,
			"hub.topic": topic,
			"hub.lease_seconds": 864000,
		};
	}

	api.on("subscribe#twitch", async ({ id }) => {
		try {
			if (!id) return;

			const body = defaultBody({ id });
			body["hub.mode"] = "subscribe";

			var res = await fetch("https://api.twitch.tv/helix/webhooks/hub", {
				headers: {
					"content-type": "application/json",
					"Client-ID": clientID,
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(body),
				method: "POST",
			});

			if (res.status >= 400)
				throw new Error("Twitch Subscribe Notifications failed: " + res.status);
		} catch (error) {
			console.error(error);
		}
	});

	api.on("unsubscribe#twitch", async ({ id }) => {
		try {
			if (!id) return;

			const body = defaultBody({ id });
			body["hub.mode"] = "unsubscribe";

			var res = await fetch("https://api.twitch.tv/helix/webhooks/hub", {
				headers: {
					"content-type": "application/json",
					"Client-ID": clientID,
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(body),
				method: "POST",
			});

			if (res.status >= 400)
				throw new Error("Twitch Subscribe Notifications failed: " + res.status);
		} catch (error) {
			console.error(error);
		}
	});

	app.get("/api/webhook/twitch/:id", (req, res, next) => {
		if (req.query && req.query["hub.challenge"]) {
			return res.send(req.query["hub.challenge"]);
		}
		res.send("OK");
	});
	app.post("/api/webhook/twitch/:id", (req, res) => {
		try {
			if (!req.body) return;
			var data = req.body.data[0];
			if (!data) postedUsers = postedUsers.filter((x) => x !== req.params.id);

			if (postedWebhooks.find((x) => x === data.id)) return res.send("");
			if (postedUsers.find((x) => x === data.user_id)) return res.send("");

			api.emit("twitch", data);
			postedWebhooks.push(data.id);
			postedUsers.push(data.user_id);

			res.send("OK");
		} catch (error) {
			console.error(error);
		}
	});
};
