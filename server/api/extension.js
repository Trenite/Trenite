class Extension {
	constructor(api) {
		this.api = api;
	}

	mapGuild(g) {
		if (!g) return g;
		var guild = { ...g };
		delete guild.name;
		delete guild.icon;
		delete guild.owner;
		delete guild.permissions;
		delete guild.features;
		delete guild.settings;
		delete guild.members;
		delete guild.presences;
		delete guild.voiceStates;

		var sorted = [];
		var channels = guild.channels.cache
			.array()
			.map((x) => {
				x = { ...x };
				x.parent = x.parentID;
				delete x.guild;
				return x;
			})
			.sort((a, b) => a.rawPosition - b.rawPosition);
		var categories = channels.filter((c) => c.type === "category");
		sorted = sorted.concat(channels.filter((x) => x.parent === null && x.type !== "category"));
		categories.forEach((category) => {
			var subchannels = channels
				.filter((x) => x.parent === category.id)
				.sort((a, b) => a.rawPosition - b.rawPosition)
				.sort((a, b) => {
					if (a.type === "voice") return 1;
					if (b.type === "voice") return -1;
					return 0;
				});
			sorted.push(category);
			sorted = sorted.concat(subchannels);
		});
		guild.channels = sorted;

		guild.emojis = guild.emojis.cache.array();
		guild.roles = guild.roles.cache
			.array()
			.sort((a, b) => a.rawPosition - b.rawPosition)
			.map((role) => {
				role = { ...role, color: role.hexColor };
				delete role.guild;
				return role;
			});

		return guild;
	}
}

module.exports = (api) => {
	return new Extension(api);
};
