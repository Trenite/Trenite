module.exports = (client) => {
	client.on("roleUpdate", async (oldRole, newRole) => {
		client.server.emit("ROLE_UPDATE", oldRole.guild, newRole);
	});
};
