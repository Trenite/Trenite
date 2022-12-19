module.exports = (client) => {
	client.on("warn", (warn) => {
		console.warn(warn);
	});
};
