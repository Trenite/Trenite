const express = require("express");

module.exports = (api) => {
	var { app } = api;

	app.get("/api/docs", (req, res) => {
		var trenite = global.Client;
		var docs = trenite.registry.groups.map((group) => ({
			category: group.id,
			name: group.name.split(" • ")[0].includes("<")
				? trenite.emojis.resolve(group.name.split(" • ")[0].replace(/\D+/g, "")).url +
				  " • " +
				  group.name.split(" • ")[1]
				: group.name,
			commands: group.commands
				.sort((a, b) => a.memberName.localeCompare(b.memberName))
				.map((x) => ({
					name: x.name,
					description: x.description,
					examples: x.examples,
					guildOnly: x.guildOnly,
					devOnly: x.devOnly,
					ownerOnly: x.ownerOnly,
					args: x.argsCollector ? x.argsCollector.args : [],
					aliases: x.aliases,
					nsfw: x.nsfw,
					throttling: x.throttling,
					userPermissions: x.userPermissions,
					clientPermissions: x.clientPermissions,
				})),
		}));
		res.json(docs);
	});
};
