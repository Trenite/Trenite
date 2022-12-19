/* eslint-disable no-underscore-dangle */
const request = require("request-promise");
const User = require("./User.js");
const Endpoints = require("../../resources/Endpoints");

class Friend extends User {
	constructor(client, data) {
		super(client, data);

		Object.defineProperty(this, "Client", { value: client });
		Object.defineProperty(this, "data", { value: data });

		this.status = data._status || "UNDEFINED"; // AVAILABLE: UNDEFINED, FRIENDED, BLOCKED, REMOVED, PENDING
		this.connections = data.connections || [];
		this.mutualFriends = data.mutual || 0;
		this.favorite = data.favorite || false;
		this.createdAt = data.created || undefined;
		this.note = data.note || "";
		this.alias = data.alias || "";
		this.presence = undefined;
	}

	async remove() {
		if (this.status !== "FRIENDED") return true;
		try {
			await request.delete({
				url: `${Endpoints.FRIENDS}/${this.Client.account.id}/friends/${this.id}`,
				headers: {
					Authorization: `${this.Client.Authenticator.auths.token_type} ${this.Client.Authenticator.auths.access_token}`,
				},
			});
			return true;
		} catch (err) {
			throw new Error(`Can't remove ${this.id} as a friend: ${err}`);
		}
	}

	async block() {
		if (this.status === "BLOCKED") return true;
		return this.Client.blockFriend(this.id);
	}

	async unblock() {
		if (this.status !== "BLOCKED") return true;
		return this.Client.unblockFriend(this.id);
	}

	async sendMessage(msg) {
		if (!msg) return false;
		return this.Client.Communicator.sendMessage(`${this.id}@${Endpoints.EPIC_PROD_ENV}`, msg);
	}

	async getPresence() {
		return this.Client.getFriendStatus(this.id);
	}

	get jid() {
		return `${this.id}@${Endpoints.EPIC_PROD_ENV}`;
	}
}

module.exports = Friend;
