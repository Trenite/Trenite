const Meta = require("../Util/Meta");

class PartyMemberMeta extends Meta {
	constructor(member, meta) {
		super();

		Object.defineProperty(this, "Member", { value: member });

		const defaultCharacters = [
			"CID_556_Athena_Commando_F_RebirthDefaultA",
			"CID_557_Athena_Commando_F_RebirthDefaultB",
			"CID_558_Athena_Commando_F_RebirthDefaultC",
			"CID_559_Athena_Commando_F_RebirthDefaultD",
			"CID_560_Athena_Commando_M_RebirthDefaultA",
			"CID_561_Athena_Commando_M_RebirthDefaultB",
			"CID_562_Athena_Commando_M_RebirthDefaultC",
			"CID_563_Athena_Commando_M_RebirthDefaultD",
		];
		const defCharacter = defaultCharacters[Math.floor(Math.random() * defaultCharacters.length)];

		this.schema = {
			Location_s: "PreLobby",
			CampaignHero_j: JSON.stringify({
				CampaignHero: {
					heroItemInstanceId: "",
					heroType: `FortHeroType'/Game/Athena/Heroes/${defCharacter}.${defCharacter}'`,
				},
			}),
			MatchmakingLevel_U: "0",
			ZoneInstanceId_s: "",
			HomeBaseVersion_U: "1",
			HasPreloadedAthena_b: false,
			FrontendEmote_j: JSON.stringify({
				FrontendEmote: {
					emoteItemDef: "None",
					emoteItemDefEncryptionKey: "",
					emoteSection: -1,
				},
			}),
			NumAthenaPlayersLeft_U: "0",
			UtcTimeStartedMatchAthena_s: "0001-01-01T00:00:00.000Z",
			GameReadiness_s: "NotReady",
			HiddenMatchmakingDelayMax_U: "0",
			ReadyInputType_s: "Count",
			CurrentInputType_s: "MouseAndKeyboard",
			AssistedChallengeInfo_j: JSON.stringify({
				AssistedChallengeInfo: {
					questItemDef: "None",
					objectivesCompleted: 0,
				},
			}),
			MemberSquadAssignmentRequest_j: JSON.stringify({
				MemberSquadAssignmentRequest: {
					startingAbsoluteIdx: -1,
					targetAbsoluteIdx: -1,
					swapTargetMemberId: "INVALID",
					version: 0,
				},
			}),
			AthenaCosmeticLoadout_j: JSON.stringify({
				AthenaCosmeticLoadout: {
					characterDef: `AthenaCharacterItemDefinition'/Game/Athena/Items/Cosmetics/Characters/${defCharacter}.${defCharacter}'`,
					characterEKey: "",
					backpackDef: "None",
					backpackEKey: "",
					pickaxeDef:
						"AthenaPickaxeItemDefinition'/Game/Athena/Items/Cosmetics/Pickaxes/DefaultPickaxe.DefaultPickaxe'",
					pickaxeEKey: "",
					variants: [],
				},
			}),
			AthenaBannerInfo_j: JSON.stringify({
				AthenaBannerInfo: {
					bannerIconId: "standardbanner15",
					bannerColorId: "defaultcolor15",
					seasonLevel: 1,
				},
			}),
			BattlePassInfo_j: JSON.stringify({
				BattlePassInfo: {
					bHasPurchasedPass: false,
					passLevel: 1,
					selfBoostXp: 0,
					friendBoostXp: 0,
				},
			}),
			Platform_j: JSON.stringify({
				Platform: {
					platformStr: this.Member.Client.config.platform.short,
				},
			}),
			PlatformUniqueId_s: "INVALID",
			PlatformSessionId_s: "",
			CrossplayPreference_s: "OptedIn",
			VoiceChatEnabled_b: "true",
			VoiceConnectionId_s: "",
		};

		if (meta) this.update(meta, true);
	}
}

module.exports = PartyMemberMeta;
