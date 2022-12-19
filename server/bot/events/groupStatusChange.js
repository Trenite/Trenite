const { oneLine } = require("common-tags");
module.exports = (client) => {
	client.on("groupStatusChange", (guild, group, enabled) => {
		console.log(oneLine`Group ${group.id}
			${enabled ? "enabled" : "disabled"}
			${guild ? `in guild ${guild.name} (${guild.id})` : "globally"}.`);
	});
};
