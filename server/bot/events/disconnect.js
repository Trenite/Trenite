module.exports = (client) => {
	client.on("disconnect", () => {
		console.error("Disconnected!");
	});
};
