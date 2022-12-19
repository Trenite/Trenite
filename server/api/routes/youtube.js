const parser = require("fast-xml-parser");
const fetch = require("node-fetch");

module.exports = (api) => {
	var { app } = api;
	const postedVideos = [];

	function defaultBody({ id, type }) {
		const body = new URLSearchParams();

		const callback = `https://${api.config.api.domain}/api/webhook/youtube`;

		var topic = `https://www.youtube.com/xml/feeds/videos.xml?${
			type === "channel" ? "channel_id" : type
		}=${id}`;

		body.append("hub.callback", callback);
		body.append("hub.topic", topic);
		body.append("hub.verify", "sync");
		body.append("hub.lease_seconds", "432000");
		return body;
	}

	api.on("subscribe#youtube", async ({ id, type }) => {
		try {
			if (!id) return;

			const body = defaultBody({ id, type });
			body.append("hub.mode", "subscribe");

			var res = await fetch("https://pubsubhubbub.appspot.com/subscribe", {
				headers: {
					"content-type": "application/x-www-form-urlencoded",
				},
				body,
				method: "POST",
			});

			if (res.status >= 400)
				throw new Error("YouTube Subscribe Notifications failed: " + res.status);
		} catch (error) {
			console.error(error);
		}
	});

	api.on("unsubscribe#youtube", async ({ id, type }) => {
		try {
			if (!id) return;

			const body = defaultBody({ id, type });
			body.append("hub.mode", "unsubscribe");

			var res = await fetch("https://pubsubhubbub.appspot.com/subscribe", {
				headers: {
					"content-type": "application/x-www-form-urlencoded",
				},
				body,
				method: "POST",
			});

			if (res.status >= 400)
				throw new Error("YouTube Subscribe Notifications failed: " + res.status);
		} catch (error) {
			console.error(error);
		}
	});

	app.get("/api/webhook/youtube", (req, res, next) => {
		if (req.query && req.query["hub.challenge"]) {
			return res.send(req.query["hub.challenge"]);
		}
		res.send("OK");
	});

	app.post("/api/webhook/youtube", (req, res) => {
		try {
			if (!req.body) return;

			var body = parser.parse(req.body);
			if (!body || !body.feed || !body.feed.entry) return;

			var video = body.feed.entry;
			const id = video["yt:videoId"];
			video.link = `https://www.youtube.com/watch?v=${id}`;

			if (postedVideos.find((x) => x === id)) return res.send("OK");
			postedVideos.push(id);

			api.emit("youtube", video);

			res.send("OK");
		} catch (error) {
			console.error(error);
		}
	});
};
