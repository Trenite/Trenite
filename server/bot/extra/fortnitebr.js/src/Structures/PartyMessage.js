class FriendMessage {
	constructor(client, data, member) {
		Object.defineProperty(this, "Client", { value: client });

		this.author = member;
		this.content = data;
	}

	async reply(m) {
		return this.Client.party.send(m);
	}
}

module.exports = FriendMessage;
