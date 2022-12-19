module.exports = {
	async send(text = "", opts) {
		if (opts !== false) {
			if (!opts) opts = {};
			var { max = 1, time = 60000, errors = ["time"], awaitMessages = true } = opts;
			text = global.config.discord.prefix + text;
		}

		var test = await global.userBot.channels.fetch(global.config.discord.unittest.channel);
		if (!test) {
			throw new Error("Unittest Channel not found");
		}
		await test.send(text);

		if (opts !== false && awaitMessages) {
			var msgs = await test.awaitMessages((m) => m.author.id === global.config.discord.client_id, {
				max,
				time,
				errors,
			});
			if (max > 1) {
				return msgs.array();
			}
			return msgs.array()[0];
		}
	},
	async waitFor(event, { count = 1, filter = null } = {}) {
		var events = [];
		return new Promise((resolve) => {
			global.userBot.on(event, on);
			function on(...result) {
				if (filter) {
					if (!filter.apply(null, result)) {
						return;
					}
				}
				events.push(result.length === 1 ? result[0] : result);
				if (events.length >= count) {
					global.userBot.off(event, on);
					if (count === 1) {
						return resolve(events[0]);
					}
					resolve(events);
				}
			}
		});
	},
	async on(event, fn) {
		global.userBot.on(event, fn);
	},
	async sleep(ms) {
		return new Promise((r) => setTimeout(r, ms));
	},
	get bot() {
		return global.userBot;
	},
	get config() {
		return global.config.discord.unittest;
	},
};
