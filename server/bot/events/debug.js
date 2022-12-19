module.exports = (client) => {
	if (client.production) {
		client.on("commandRun", (cmd) => {
			console.log(`[cmd] executed - ${cmd.name}`);
		});
	}
};
