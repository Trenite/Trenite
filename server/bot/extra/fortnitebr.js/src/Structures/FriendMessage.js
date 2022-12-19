const Friend = require("./Friend");

class FriendMessage {
	constructor(client, data) {
		/**
		 * Fortnite Client
		 * @readonly
		 */
		Object.defineProperty(this, "Client", { value: client });

		Object.defineProperty(this, "data", { value: data });
		this.author = this.Client.friends.get(data.from.split("@")[0]);
		if (!this.author.id)
			this.author = new Friend(this.Client, { id: data.from.split("@")[0], _status: "FRIENDED" });
		this.content = data.body;
	}

	/**
	 * Reply to a message
	 * @param {string} reply
	 */
	async reply(reply) {
		return this.Client.sendFriendMessage(this.author.id, reply);
	}
}

module.exports = FriendMessage;
