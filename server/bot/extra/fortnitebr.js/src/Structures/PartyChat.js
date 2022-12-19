class PartyChat {
	constructor(party) {
		Object.defineProperty(this, "Client", { value: party.Client });
		Object.defineProperty(this, "Party", { value: party });
		Object.defineProperty(this, "Stream", { value: party.Client.Communicator.stream });

		this.jid = `Party-${party.id}@muc.prod.ol.epicgames.com`;
		this.nick = `${this.Client.account.displayName}:${this.Client.account.id}:${this.Client.Communicator.resource}`;

		this.isConnected = false;

		this.Stream.once("muc:join", (muc) => {
			this.isConnected = true;
			this.id = muc.from;
		});
	}

	async sendMessage(message) {
		if (!(await this.waitForConnection())) throw new Error("Can't send party message: chatroom not connected");

		return this.Stream.sendMessage({
			to: this.jid,
			type: "groupchat",
			body: message,
		});
	}

	join() {
		if (this.isConnected) return;
		this.Stream.joinRoom(this.jid, this.nick);
	}

	leave() {
		if (!this.isConnected) return;
		this.Stream.leaveRoom(this.jid, this.nick);
	}

	waitForConnection() {
		if (this.isConnected) return true;
		return new Promise((res) => {
			this.Stream.once("muc:join", () => res(true));
			setTimeout(() => res(false), 5000);
		});
	}
}

module.exports = PartyChat;
