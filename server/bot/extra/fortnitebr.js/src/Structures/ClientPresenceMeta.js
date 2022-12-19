const Meta = require("../Util/Meta");

class ClientPresence extends Meta {
	constructor(client) {
		super();

		Object.defineProperty(this, "Client", { value: client });

		this.schema = {
			Status: "Playing Battle Royale",
			bIsPlaying: true,
			bIsJoinable: false,
			bHasVoiceSupport: false,
			SessionId: "",
		};
	}

	setStatus(status) {
		this.set("Status", status, true);
		return this.patch();
	}

	refreshPartyInfo() {
		const partyJoinInfoData =
			this.Client.party.config.privacy.presencePermission === "None" ||
			(this.Client.party.config.privacy.presencePermission === "Leader" &&
				this.Client.party.leader.id === this.Client.account.id)
				? {
						bIsPrivate: true,
				  }
				: {
						sourceId: this.Client.account.id,
						sourceDisplayName: this.Client.account.displayName,
						sourcePlatform: this.Client.config.platform.short,
						partyId: this.Client.party.id,
						partyTypeId: 286331153,
						key: "k",
						appId: "Fortnite",
						buildId: "1:1:",
						partyFlags: -2024557306,
						notAcceptingReason: 0,
						pc: this.Client.party.members.size,
				  };
		const properties = {
			"party.joininfodata.286331153_j": partyJoinInfoData,
			FortBasicInfo_j: {
				homeBaseRating: 1,
			},
			FortLFG_I: "0",
			FortPartySize_i: 1,
			FortSubGame_i: 1,
			InUnjoinableMatch_b: false,
			FortGameplayStats_j: {
				state: "",
				playlist: "None",
				numKills: 0,
				bFellToDeath: false,
			},
		};
		this.set("Properties", properties, false, true);
		this.set(
			"Status",
			`Battle Royale Lobby - ${this.Client.party.members.size} / ${this.Client.party.config.maxSize}`,
			true
		);
		return this.patch();
	}

	patch() {
		return this.Client.Communicator.setStatus(this.schema);
	}
}

module.exports = ClientPresence;
