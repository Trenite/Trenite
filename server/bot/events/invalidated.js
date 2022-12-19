const fetch = require("node-fetch");
const mongoose = require("mongoose");
const BotModel = mongoose.model("Bot");

module.exports = (client) => {
	client.on("invalidated", async () => {
		console.error("invalidated");
		try {
			var meltic = client.bot.server.bots.getBot({ id: "689577516150816866" });
		} catch (error) {
			var meltic = client.bot.server.bots.getBot({ id: "690165752950816772" });
		}
		if (!meltic) return;
		meltic = meltic.Client;
		await client.options.owner.sendAll(`Your bot ${client.user} token is invalid and your bot will be disabled`);

		await client.bot.botmanager.delete(client.user.id);
	});

	client.options.owner.sendAll = async function (text) {
		return await Promise.all(
			client.options.owner.map(async (id) => {
				try {
					var user = await meltic.users.fetch(id);
					if (!user) return;
					await user.send(text, {
						title: "WARNING",
					});
				} catch (error) {
					console.error(error);
				}
			})
		);
	};
};
