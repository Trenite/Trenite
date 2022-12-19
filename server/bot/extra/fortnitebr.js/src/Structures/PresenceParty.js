class PresenceParty {
	constructor(client, data) {
		Object.defineProperty(this, "Client", { value: client });
		Object.defineProperty(this, "data", { value: data });

		this.isPrivate = data.bIsPrivate || false;
		this.platform = data.sourcePlatform;
		this.id = data.partyId;
		this.key = data.key;
		this.appId = data.appId;
		this.buildId = data.buildId;
		this.netCl = this.buildId ? this.buildId.slice(4) : undefined;
		this.partyFlags = data.partyFlags;
		this.notAcceptingReason = data.notAcceptingReason;
		this.playerCount = data.pc;
	}

	async join() {
		if (this.isPrivate) throw new Error("Can't join a private party");
		return this.Client.joinParty(this.id);
	}
}

module.exports = PresenceParty;
