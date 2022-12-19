module.exports = (client) => {
	client.on("reconnecting", () => {
		console.error("Reconnecting...");
	});
};
