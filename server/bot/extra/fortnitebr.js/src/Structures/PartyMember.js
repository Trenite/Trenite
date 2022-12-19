const PartyMemberMeta = require("./PartyMemberMeta");

class PartyMember {
	constructor(party, data) {
		Object.defineProperty(this, "Party", { value: party });
		Object.defineProperty(this, "Client", { value: party.Client });
		Object.defineProperty(this, "data", { value: data });

		this.id = data.accountId || data.account_id;
		this.displayName = data.account_dn;
		this.role = data.role || "";
		this.joinedAt = new Date(data.joined_at);
		this.meta = new PartyMemberMeta(this, data.meta);
	}

	get pickaxe() {
		return this.meta.get("AthenaCosmeticLoadout_j").AthenaCosmeticLoadout.pickaxeDef;
	}

	get outfit() {
		return this.meta.get("AthenaCosmeticLoadout_j").AthenaCosmeticLoadout.characterDef;
	}

	get emote() {
		return this.meta.get("FrontendEmote_j").FrontendEmote.emoteItemDef;
	}

	get isReady() {
		return this.meta.get("GameReadiness_s") === "Ready";
	}

	/**
	 * Kick this member from the party
	 */
	async kick() {
		return this.Party.kick(this.id);
	}

	/**
	 * Promote this member to the party leader
	 */
	async promote() {
		return this.Party.promote(this.id);
	}

	update(data) {
		if (data.revision > this.revision) this.revision = data.revision;
		if (data.account_dn !== this.displayName) this.displayName = data.account_dn;
		this.meta.update(data.member_state_updated, true);
		this.meta.remove(data.member_state_removed);
	}

	meIsLeader() {
		return this.Party.me.role === "CAPTAIN";
	}
}

module.exports = PartyMember;
