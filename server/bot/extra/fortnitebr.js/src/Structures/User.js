class User {
	constructor(client, data) {
		Object.defineProperty(this, "Client", { value: client });
		Object.defineProperty(this, "data", { value: data });

		this.id = data.id || data.accountId;
		if (!this.id) throw new Error("User needs account id");
		this.displayName = data.displayName || data.accountName || data.name || undefined;
		this.externalAuths = data.externalAuths || [];
		if (data.email) this.email = data.email;
	}

	/**
	 * Send a friend request to the user
	 */
	async sendFriendRequest() {
		return this.Client.addFriend(this.id);
	}
}

module.exports = User;
