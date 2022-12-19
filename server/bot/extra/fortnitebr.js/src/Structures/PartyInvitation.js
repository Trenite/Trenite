const request = require("request-promise");

class PartyInvitation {
	constructor(client, data) {
		Object.defineProperty(this, "Client", { value: client });
		Object.defineProperty(this, "data", { value: data });

		this.friend = client.friends.get(data.sent_by);
		this.sentAt = new Date(data.sent_at);
		this.party = data.party;
	}

	async accept() {
		return this.party.join();
	}

	async decline() {
		try {
			return await request.post({
				url: `https://party-service-prod.ol.epicgames.com/party/api/v1/Fortnite/parties/${this.party.id}/invites/${this.Client.account.id}/decline`,
				headers: {
					Authorization: `${this.Client.Authenticator.auths.token_type} ${this.Client.Authenticator.auths.access_token}`,
				},
				json: true,
			});
		} catch (err) {
			throw new Error(`Can't decline party invitation: ${err}`);
		}
	}
}

module.exports = PartyInvitation;
