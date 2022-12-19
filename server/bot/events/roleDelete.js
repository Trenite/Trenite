module.exports = (client) => {
	client.on("roleDelete", async (role) => {
		client.server.emit("ROLE_DELETE", role.guild, role);
	});
};
