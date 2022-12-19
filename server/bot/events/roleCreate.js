module.exports = (client) => {
	client.on("roleCreate", async (role) => {
		client.server.emit("ROLE_CREATE", role.guild, role);
	});
};
