const { oneLine } = require("common-tags");

module.exports = (client) => {
	client.on("commandBlocked", (msg, reason) => {
		console.log(oneLine`[cmd] ${msg.command ? `${msg.command.name}` : ""} - blocked: ${reason}`);
	});
};
