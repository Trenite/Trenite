const fetch = require("node-fetch");
const mongoose = require("mongoose");
var OAuth2 = mongoose.model("OAuth2");

module.exports = (api) => {
	var { app } = api;
	const key = api.config.trello.key;

	api.on("subscribe#trello", async ({ token, board }) => {
		try {
			const callbackURL = `https://${api.config.api.domain}/api/webhook/trello`;
			var res = await fetch(
				`https://api.trello.com/1/tokens/${token}/webhooks/?key=${key}&callbackURL=${callbackURL}&idModel=${board.id}&description=TreniteDiscordBot&active=true`,
				{
					method: "POST",
				}
			);
			res = await res.json();
		} catch (error) {
			console.error(error);
		}
	});

	api.on("unsubscribe#trello", async ({ token, board }) => {
		try {
			const activeWebhooks = await (
				await fetch(`https://api.trello.com/1/tokens/${token}/webhooks/?key=${key}`)
			).json();

			const activeWebhook = activeWebhooks.find((x) => x.idModel === board.id);
			if (!activeWebhook) return;

			var res = await fetch(
				`https://api.trello.com/1/webhooks/${activeWebhook.id}?token=${token}&key=${key}`,
				{
					method: "DELETE",
				}
			);
			res = await res.json();
		} catch (error) {
			console.error(error);
		}
	});

	app.get("/api/webhook/trello", (req, res, next) => {
		res.send("OK");
	});
	app.post("/api/webhook/trello", (req, res) => {
		try {
			if (!req.body) return;

			api.emit("trello", req.body);
		} catch (error) {
			console.error(error);
		}
		res.send("OK");
	});

	app.get("/api/oauth2/trello", async (req, res) => {
		try {
			if (!req.query.token && !req.query.error) {
				return res.send(`
			<noscript>
				Enable JavaScript to redirect
			</noscript>
			<script>
				if (location.hash) {
					location.replace(location.href.replace("#","&"))
				}
			</script>
			`);
			}

			const token = req.query.token;
			const error = req.query.error;
			var discord = req.query.state;
			const provider = "trello";
			var t = new Date();
			t.setFullYear(t.getFullYear() + 50);
			const expires_in = t;
			if ((!token && !error) || !discord) throw "Token, error and state must be defined";
			if (error) throw error;

			const doc = {
				access_token: token,
				expires_in,
				refresh_token: null,
				scope: "read",
				token_type: "Bearer",
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
			api.emit("oauth2#trello", doc);

			res.redirect("/oauth2/trello?success");
		} catch (error) {
			api.emit("oauth2#trello", { error, discord });
			return res.redirect(`/oauth2/trello?error=${error}`);
		}
	});
};
