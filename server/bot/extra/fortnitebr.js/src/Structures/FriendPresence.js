const PresenceParty = require("./PresenceParty");

class FriendPresence {
	constructor(client, data, fromId) {
		Object.defineProperty(this, "Client", { value: client });
		Object.defineProperty(this, "data", { value: data });

		this.status = data.Status;
		this.rawData = data;
		this.friend = this.Client.friends.get(fromId);
		this.recievedAt = data.recievedAt || new Date();

		this.isPlaying = data.bIsPlaying;
		this.isJoinable = data.bIsJoinable;
		this.hasVoiceSupport = data.bHasVoiceSupport;
		this.sessionId = data.SessionId || "";

		this.rawProperties = data.Properties;

		if (this.rawProperties) {
			const kairosProfile = this.rawProperties.KairosProfile_s
				? JSON.parse(this.rawProperties.KairosProfile_s)
				: {};
			this.avatar = kairosProfile.avatar;
			this.avatarBackgroundColor = kairosProfile.avatarBackground;

			const basicInfo = this.rawProperties.FortBasicInfo_j || {};
			this.homeBaseRating = basicInfo.homeBaseRating;
			this.lfg = this.rawProperties.FortLFG_I;
			this.subGame = this.rawProperties.FortSubGame_i;

			this.inUnjoinableMatch = this.rawProperties.InUnjoinableMatch_b;
			this.playlist = this.rawProperties.GamePlaylistName_s;
			const playersAlive = this.rawProperties.Event_PlayersAlive_s;
			this.partySize = this.rawProperties.Event_PartySize_s;
			this.gameJoinKey = this.rawProperties.GameSessionJoinKey_s;
			this.serverPlayerCount = this.rawProperties.ServerPlayerCount_i;
			const GameplayStats = this.rawProperties.FortGameplayStats_j;
			this.gameplayStats = GameplayStats
				? {
						state: GameplayStats.state,
						playlist: GameplayStats.playlist,
						kills: GameplayStats.numKills,
						fellToDeath: GameplayStats.bFellToDeath,
						...playersAlive,
				  }
				: {};
			const propkeys = Object.keys(this.rawProperties);
			const partyPropKey = propkeys.find((k) => /party\.joininfodata\.\d+_j/.test(k));
			if (this.rawProperties[partyPropKey]) {
				this.party = new PresenceParty(this.Client, this.rawProperties[partyPropKey]);
			}
		}
	}
}

module.exports = FriendPresence;
