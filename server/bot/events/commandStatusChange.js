const { oneLine } = require("common-tags");
module.exports = (client) => {
	client.on("commandStatusChange", (guild, command, enabled) => {
		console.log(oneLine`[guild] ${guild.name} (${guild.id}) ${command.name}
			${enabled ? "enabled" : "disabled"}
			${guild ? `in guild ${guild.name} (${guild.id})` : "globally"}.`);
	});
};
