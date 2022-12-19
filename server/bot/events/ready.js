var emojis = require("../emojis.json");

module.exports = (client) => {
	client.on("ready", async () => {
		console.log(
			`🤖 Discord Bot ${client.user.username}#${client.user.discriminator} (${client.user.id}) ready on ${client.guilds.cache.size} servers`
		);

		var prefix = client.commandPrefix;

		async function setStatus() {
			function add(arr) {
				return arr.reduce((prev, count) => prev + count, 0);
			}
			if (client.shard) {
				var users = add(await client.shard.fetchClientValues("guilds.cache.size"));
				var guilds = add(await client.shard.fetchClientValues("users.cache.size"));
				var shard = `| Shard ${client.shard}`;
			} else {
				var shard = "";
				var guilds = client.guilds.cache.size;
				var users = client.users.cache.size;
			}
			var statuses = [
				`${prefix}help | ${client.bot.config.api.domain} | ${users} users | ${guilds} server ${shard}`,
			];
			if (!client.production) {
				var username = require("os").userInfo().username;
				statuses = [`${prefix}help | ${username} | ${process.platform}`];
			}
			let status = statuses[Math.floor(Math.random() * statuses.length)];
			client.user.setPresence({
				status: "online",
				activity: {
					name: status,
					type: "WATCHING",
				},
			});
		}
		client.setInterval(setStatus, 1000 * 60);
		setStatus();

		client.savedEmojis = {};
		Object.keys(emojis).forEach((name) => {
			try {
				client.savedEmojis[name] = client.emojis.resolve(emojis[name].id);
				if (!client.savedEmojis[name]) {
					client.savedEmojis[name] = emojis[name];
				}
			} catch (error) {
				client.savedEmojis[name] = emojis[name];
			}
		});
	});
};
