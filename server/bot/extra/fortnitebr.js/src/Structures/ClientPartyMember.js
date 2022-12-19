const request = require("request-promise");
const PartyMember = require("./PartyMember");

class ClientPartyMember extends PartyMember {
	constructor(party, meta) {
		super(party, meta);

		this.currentlyPatching = false;
		this.patchQueue = [];
		this.revision = 0;

		if (this.Client.lastMemberMeta) this.meta.update(this.Client.lastMemberMeta, true);
	}

	/**
	 * Set client readiness in party. NOTE: This is visually.
	 * Matchmaking is a completely different thing
	 * @param {Boolean} ready readiness
	 */
	async setReadiness(ready) {
		await this.sendPatch({
			GameReadiness_s: this.meta.set("GameReadiness_s", ready === true ? "Ready" : "NotReady"),
			ReadyInputType_s: this.meta.get("CurrentInputType_s"),
		});
	}

	/**
	 * Set the level of the client in party
	 * @param level level
	 */
	async setLevel(level) {
		const data = {
			seasonLevel: level,
		};
		let loadout = this.meta.get("AthenaBannerInfo_j");
		loadout = this.meta.set("AthenaBannerInfo_j", {
			...loadout,
			AthenaBannerInfo: {
				...loadout.AthenaBannerInfo,
				...data,
			},
		});
		await this.sendPatch({
			AthenaBannerInfo_j: loadout,
		});
	}

	/**
	 * Set the clients banner in party
	 * @param banner bannerid
	 * @param color color (number)
	 */
	async setBanner(banner, color) {
		const data = {
			bannerIconId: banner,
			bannerColorId: color,
		};
		let loadout = this.meta.get("AthenaBannerInfo_j");
		loadout = this.meta.set("AthenaBannerInfo_j", {
			...loadout,
			AthenaBannerInfo: {
				...loadout.AthenaBannerInfo,
				...data,
			},
		});
		await this.sendPatch({
			AthenaBannerInfo_j: loadout,
		});
	}

	/**
	 * Set the clients outfit in party
	 * @param asset Asset in game files as /Game/Athena/Items/Cosmetics/Characters/{ID}.{ID}
	 */
	async setOutfit(asset) {
		const data = {
			characterDef: asset,
		};
		let loadout = this.meta.get("AthenaCosmeticLoadout_j");
		loadout = this.meta.set("AthenaCosmeticLoadout_j", {
			...loadout,
			AthenaCosmeticLoadout: {
				...loadout.AthenaCosmeticLoadout,
				...data,
			},
		});
		await this.sendPatch({
			AthenaCosmeticLoadout_j: loadout,
		});
	}

	/**
	 * Set the clients backpack in party
	 * @param asset Asset in game files as /Game/Athena/Items/Cosmetics/Backpacks/{ID}.{ID}
	 */
	async setBackpack(asset) {
		const data = {
			backpackDef: asset,
		};
		let loadout = this.meta.get("AthenaCosmeticLoadout_j");
		loadout = this.meta.set("AthenaCosmeticLoadout_j", {
			...loadout,
			AthenaCosmeticLoadout: {
				...loadout.AthenaCosmeticLoadout,
				...data,
			},
		});
		await this.sendPatch({
			AthenaCosmeticLoadout_j: loadout,
		});
	}

	/**
	 * Set the clients pickaxe in party
	 * @param asset Asset in game files as /Game/Athena/Items/Cosmetics/Pickaxes/{ID}.{ID}
	 */
	async setPickaxe(asset) {
		const data = {
			pickaxeDef: asset,
		};
		let loadout = this.meta.get("AthenaCosmeticLoadout_j");
		loadout = this.meta.set("AthenaCosmeticLoadout_j", {
			...loadout,
			AthenaCosmeticLoadout: {
				...loadout.AthenaCosmeticLoadout,
				...data,
			},
		});
		await this.sendPatch({
			AthenaCosmeticLoadout_j: loadout,
		});
	}

	/**
	 * Set the clients emote in party
	 * @param asset Asset in game files as /Game/Athena/Items/Cosmetics/Dances/{ID}.{ID}
	 */
	async setEmote(asset) {
		const data = {
			emoteItemDef: asset,
		};
		let loadout = this.meta.get("FrontendEmote_j");
		loadout = this.meta.set("FrontendEmote_j", {
			...loadout,
			FrontendEmote: {
				...loadout.FrontendEmote,
				...data,
			},
		});
		await this.sendPatch({
			FrontendEmote_j: loadout,
		});
	}

	async sendPatch(updated, isForced) {
		if (!this.Client.party || !this.Client.party.me || this.Client.party.id !== this.Party.id) {
			return;
		}
		if (!isForced && this.currentlyPatching) {
			this.patchQueue.push([updated]);
			return;
		}
		this.currentlyPatching = true;

		try {
			await request.patch({
				url: `https://party-service-prod.ol.epicgames.com/party/api/v1/Fortnite/parties/${this.Party.id}/members/${this.id}/meta`,
				body: {
					delete: [],
					revision: parseInt(this.revision, 10),
					update: updated || this.meta.schema,
				},
				headers: {
					Authorization: `${this.Client.Authenticator.auths.token_type} ${this.Client.Authenticator.auths.access_token}`,
				},
				json: true,
			});
			this.revision += 1;
		} catch (err) {
			if (err.error.errorCode === "errors.com.epicgames.social.party.stale_revision") {
				[, this.revision] = err.error.messageVars;
				this.patchQueue.push([updated]);
			} else throw new Error(`Can't patch party member: ${err}`);
		}

		if (this.patchQueue.length > 0) {
			const args = this.patchQueue.shift();
			this.sendPatch(...args, true);
		} else {
			this.currentlyPatching = false;
		}
		if (this.Client.config.savePartyMemberMeta) this.Client.lastMemberMeta = this.meta.schema;
	}
}

module.exports = ClientPartyMember;
