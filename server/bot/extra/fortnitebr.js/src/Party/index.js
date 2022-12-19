/* eslint-disable no-param-reassign */
const request = require("request-promise");
const PartyMember = require("../Structures/PartyMember");
const ClientPartyMember = require("../Structures/ClientPartyMember");
const PartyMeta = require("../Structures/PartyMeta");
const List = require("../Util/List");
const PartyChat = require("../Structures/PartyChat");
const PartyPrivacy = require("../../enums/PartyPrivacy");

class Party {
	constructor(client, data) {
		Object.defineProperty(this, "Client", { value: client });
		Object.defineProperty(this, "data", { value: data });

		this.config = this.convertPartyConfig(data.config);
		this.id = data.id;
		this.members = new List();
		if (data.members[0]) {
			data.members.forEach((m) => {
				if (m.account_id === this.Client.account.id) {
					this.members.set(m.accountId || m.account_id, new ClientPartyMember(this, m));
				} else {
					this.members.set(m.accountId || m.account_id, new PartyMember(this, m));
				}
			});
		}
		this.applicants = data.applicants || [];
		this.invites = data.invites || [];
		this.revision = data.revision || 0;
		this.currentlyPatching = false;
		this.patchQueue = [];
		this.chat = new PartyChat(this);
		this.meta = new PartyMeta(this, data.meta);

		const handleMemberChange = () => {
			if (this.me && this.me.role === "CAPTAIN") {
				this.sendPatch({
					RawSquadAssignments_j: this.meta.updateSquadAssignments(),
				});
			}
		};

		this.handlePartyLeave = () => {
			this.chat.leave();
			this.Client.removeListener("party:member:joined", handleMemberChange);
			this.Client.removeListener("party:member:left", handleMemberChange);
		};

		this.Client.on("party:member:joined", () => handleMemberChange());
		this.Client.on("party:member:left", () => handleMemberChange());
	}

	get me() {
		return this.members.get(this.Client.account.id);
	}

	get leader() {
		return this.members.find((m) => m.role === "CAPTAIN");
	}

	/**
	 * Send a message to party chat
	 * @param message message to send
	 */
	async send(message) {
		return this.chat.sendMessage(message);
	}

	/**
	 * Leaves this party
	 * @param createNew If a new party should be created
	 */
	async leave(createNew) {
		if (!this.me) throw new Error("Can't leave a party you are not member of");
		return Party.Leave(this.Client, this.id, null, createNew);
	}

	/**
	 * Joins this party
	 */
	async join() {
		if (this.Client.party.id === this.id) throw new Error("You can't join a party you are already a member of");
		await Party.Join(this.Client, this);
	}

	/**
	 * Promote someone to party leader
	 * @param id id of the member to promote
	 */
	async promote(id) {
		if (this.me.id !== this.leader.id) throw new Error("Can't promote party member: You aren't leader");
		if (id === this.me.id) throw new Error("Can't promote party member: You can't promote yourself");
		return Party.PostMemberAction(this.Client, "promote", id, this.id);
	}

	/**
	 * Kick someone from the party
	 * @param id id of the member to kick
	 */
	async kick(id) {
		return Party.Leave(this.Client, this.id, id);
	}

	/**
	 * Set a custom matchmaking key for this party
	 * @param key Key to set
	 */
	async setCustomKey(key) {
		if (this.me.role !== "CAPTAIN")
			throw new Error("Can't set custom matchmaking key: You are not leader of the party");
		await this.meta.patch({
			CustomMatchKey_s: this.meta.set("CustomMatchKey_s", key || ""),
		});
	}

	/**
	 * Set this party's playlist
	 * @param playlist playlistName, tournamentId and eventWindowId of this playlist
	 * @param regionId regionId e.g. EU
	 */
	async setPlaylist(playlist, regionId) {
		if (!regionId) throw new Error("Can't set playlist: regionId is needed");
		if (!playlist.playlistName) throw new Error("Can't set playlist: playlist.playlistName is needed");
		await this.sendPatch({
			PlaylistData_j: this.meta.set("PlaylistData_j", {
				PlaylistData: {
					playlistName: playlist.playlistName,
					tournamentId: playlist.tournamentId || "",
					eventWindowId: playlist.eventWindowId || "",
					regionId,
				},
			}),
		});
	}

	/**
	 * Invite someone to this party
	 * @param f id or displayName of the friend to invite
	 */
	async invite(f) {
		return this.Client.sendPartyInvitation(f);
	}

	/**
	 * Delete a party invitation
	 * @param f id or displayName of the friend to delete the invitation of
	 */
	async deleteInvite(f) {
		return this.Client.deletePartyInvitation(f);
	}

	/**
	 * Set this parties privacy
	 * @param privacy updated privacy
	 */
	async setPrivacy(privacy) {
		const updated = {};
		const deleted = [];

		const privacySettings = this.meta.get("PrivacySettings_j");
		if (privacySettings) {
			updated.PrivacySettings_j = this.meta.set("PrivacySettings_j", {
				PrivacySettings: {
					...privacySettings.PrivacySettings,
					partyType: privacy.partyType,
					bOnlyLeaderFriendsCanJoin: privacy.onlyLeaderFriendsCanJoin,
					partyInviteRestriction: privacy.inviteRestriction,
				},
			});
		}

		updated["urn:epic:cfg:presence-perm_s"] = this.meta.set(
			"urn:epic:cfg:presence-perm_s",
			privacy.presencePermission
		);
		updated["urn:epic:cfg:accepting-members_b"] = this.meta.set(
			"urn:epic:cfg:accepting-members_b",
			privacy.acceptingMembers
		);
		updated["urn:epic:cfg:invite-perm_s"] = this.meta.set("urn:epic:cfg:invite-perm_s", privacy.invitePermission);

		if (["Public", "FriendsOnly"].indexOf(privacy.partyType) > -1)
			deleted.push("urn:epic:cfg:not-accepting-members");

		if (privacy.partyType === "Private") {
			updated["urn:epic:cfg:not-accepting-members-reason_i"] = 7;
		} else deleted.push("urn:epic:cfg:not-accepting-members-reason_i");

		await this.sendPatch(updated, deleted);
	}

	async sendPatch(updated, deleted, isForced) {
		if (!this.me.role === "CAPTAIN") return false;
		if (!isForced && this.currentlyPatching) return this.patchQueue.push([updated, deleted]);
		this.currentlyPatching = true;

		try {
			await request.patch({
				url: `https://party-service-prod.ol.epicgames.com/party/api/v1/Fortnite/parties/${this.id}`,
				headers: {
					Authorization: `${this.Client.Authenticator.auths.token_type} ${this.Client.Authenticator.auths.access_token}`,
				},
				body: {
					config: {
						join_confirmation: this.config.joinConfirmation,
						joinability: this.config.joinability,
						max_size: this.config.maxSize,
					},
					meta: {
						delete: deleted || [],
						update: updated || this.meta.schema,
					},
					party_state_overridden: {},
					party_privacy_type: this.config.joinability,
					party_type: this.config.type,
					party_sub_type: this.config.subType,
					max_number_of_members: this.config.maxSize,
					invite_ttl_seconds: this.config.inviteTTL,
					revision: this.revision,
				},
				json: true,
			});
		} catch (err) {
			if (err.error.errorCode === "errors.com.epicgames.social.party.stale_revision") {
				[, this.revision] = err.error.messageVars;
				this.patchQueue.push([updated]);
			} else if (err.error.errorCode === "errors.com.epicgames.social.party.party_change_forbidden") {
				return false;
			} else if (err.error.errorCode === "errors.com.epicgames.social.party.party_not_found") {
				return false;
			} else throw new Error(`Can't patch party: ${err}`);
		}

		this.revision += 1;

		if (this.patchQueue.length > 0) {
			const args = this.patchQueue.shift();
			this.sendPatch(...args, true);
		} else {
			this.currentlyPatching = false;
		}
		return true;
	}

	convertPartyConfig(conf = {}) {
		const newConf = {};

		if (conf.invite_ttl_seconds) newConf.inviteTTL = conf.invite_ttl_seconds;
		if (conf.join_confirmation) newConf.joinConfirmation = conf.join_confirmation;
		if (conf.sub_type) newConf.subType = conf.sub_type;
		if (conf.max_size) newConf.maxSize = conf.max_size;
		return { ...this.Client.config.partyConfig, ...newConf };
	}

	update(data) {
		if (data.revision > this.revision) this.revision = data.revision;
		this.meta.update(data.party_state_updated, true);
		this.meta.remove(data.party_state_removed);

		this.config.joinability = data.party_privacy_type;
		this.config.maxSize = data.max_number_of_members;
		this.config.subType = data.party_sub_type;
		this.config.type = data.party_type;
		this.config.inviteTTL = data.invite_ttl_seconds;

		let privacy = this.meta.get("PrivacySettings_j");
		privacy = Object.values(PartyPrivacy).find(
			(val) =>
				val.partyType === privacy.PrivacySettings.partyType &&
				val.inviteRestriction === privacy.PrivacySettings.partyInviteRestriction &&
				val.onlyLeaderFriendsCanJoin === privacy.PrivacySettings.bOnlyLeaderFriendsCanJoin
		);
		if (privacy) this.config.privacy = privacy;
	}

	static async Get(client, id) {
		await client.Authenticator.refreshtoken();
		try {
			const party = await request.get({
				url: `https://party-service-prod.ol.epicgames.com/party/api/v1/Fortnite/parties/${id}`,
				headers: {
					Authorization: `${client.Authenticator.auths.token_type} ${client.Authenticator.auths.access_token}`,
				},
				json: true,
			});

			if (!party) return false;
			return new this(client, party);
		} catch (err) {
			throw new Error(`Can't access party info: ${err}`);
		}
	}

	static async GetMember(client, id) {
		await client.Authenticator.refreshtoken();
		try {
			const member = await request.get({
				url: `https://party-service-prod.ol.epicgames.com/party/api/v1/Fortnite/user/${id}`,
				headers: {
					Authorization: `${client.Authenticator.auths.token_type} ${client.Authenticator.auths.access_token}`,
				},
				json: true,
			});
			return member;
		} catch (err) {
			throw new Error(`Can't access party member info: ${err}`);
		}
	}

	static async GetInvites(client, id) {
		try {
			const invites = await request.get({
				url: `https://party-service-prod.ol.epicgames.com/party/api/v1/Fortnite/user/${client.account.id}/pings/${id}/parties`,
				headers: {
					Authorization: `${client.Authenticator.auths.token_type} ${client.Authenticator.auths.access_token}`,
				},
				json: true,
			});
			return invites;
		} catch (err) {
			throw new Error(`Can't access party invites info: ${err}`);
		}
	}

	static async Join(client, party) {
		try {
			if (client.party) await client.party.leave();
			await request.post({
				url: `https://party-service-prod.ol.epicgames.com/party/api/v1/Fortnite/parties/${party.id}/members/${client.account.id}/join`,
				headers: {
					Authorization: `${client.Authenticator.auths.token_type} ${client.Authenticator.auths.access_token}`,
				},
				body: {
					connection: {
						id: client.Communicator.stream.jid.toString(),
						meta: {
							"urn:epic:conn:platform_s": client.config.platform.short,
							"urn:epic:conn:type_s": "game",
						},
						yield_leadership: false,
					},
					meta: {
						"urn:epic:member:dn_s": client.account.displayName,
						"urn:epic:member:joinrequestusers_j": JSON.stringify({
							users: [
								{
									id: client.account.id,
									dn: client.account.displayName,
									plat: client.config.platform.short,
									data: JSON.stringify({
										CrossplayPreference: "1",
										SubGame_u: "1",
									}),
								},
							],
						}),
					},
				},
				json: true,
			});
			client.party = party;
			client.party.chat.join();
		} catch (err) {
			throw new Error(`Can't join party: ${err}`);
		}
	}

	static async Create(client, config) {
		config = { ...client.config.partyConfig, ...config };
		try {
			const party = await request.post({
				url: "https://party-service-prod.ol.epicgames.com/party/api/v1/Fortnite/parties",
				headers: {
					Authorization: `${client.Authenticator.auths.token_type} ${client.Authenticator.auths.access_token}`,
					"Content-Type": "application/json",
				},
				body: {
					config: {
						join_confirmation: config.joinConfirmation,
						joinability: config.joinability,
						max_size: config.maxSize,
					},
					join_info: {
						connection: {
							id: client.Communicator.stream.jid.toString(),
							meta: {
								"urn:epic:conn:platform_s": client.config.platform.short,
								"urn:epic:conn:type_s": "game",
							},
						},
					},
					meta: {
						"urn:epic:cfg:party-type-id_s": "default",
						"urn:epic:cfg:build-id_s": "1:1:",
						"urn:epic:cfg:join-request-action_s": "Manual",
						"urn:epic:cfg:chat-enabled_b": config.chatEnabled.toString(),
					},
				},
				json: true,
			});
			if (!party) throw new Error("Can't create party: no response from endpoint");
			party.config = { ...config, ...(party.config || {}) };
			client.party = new this(client, party);
			await client.party.setPrivacy(client.party.config.privacy);
			client.party.chat.join();
			return client.party;
		} catch (err) {
			throw new Error(`Can't create party: ${err}`);
		}
	}

	static async Leave(client, partyId, memberId, createNew = false) {
		try {
			client.party.handlePartyLeave();
			await request.delete({
				url: `https://party-service-prod.ol.epicgames.com/party/api/v1/Fortnite/parties/${partyId}/members/${
					memberId || client.account.id
				}`,
				headers: {
					Authorization: `${client.Authenticator.auths.token_type} ${client.Authenticator.auths.access_token}`,
					"Content-Type": "application/json",
				},
				body:
					memberId === client.account.id
						? {
								connection: {
									id: client.Communicator.stream.jid.toString(),
									meta: {
										"urn:epic:conn:platform_s": client.config.platform.short,
										"urn:epic:conn:type_s": "game",
									},
								},
								meta: {
									"urn:epic:member:dn_s": client.account.displayName,
									"urn:epic:member:type_s": "game",
									"urn:epic:member:platform_s": client.config.platform.short,
									"urn:epic:member:joinrequest_j": '{"CrossplayPreference_i":"1"}',
								},
						  }
						: {},
				json: true,
			});
			client.party = undefined;
			if (createNew) await Party.Create(client);
		} catch (err) {
			throw new Error(`Can't remove party member: ${err}`);
		}
	}

	static async PostMemberAction(client, action, memberId, partyId) {
		try {
			return await request.post({
				url: `https://party-service-prod.ol.epicgames.com/party/api/v1/Fortnite/parties/${partyId}/members/${memberId}/${action}`,
				headers: {
					Authorization: `${client.Authenticator.auths.token_type} ${client.Authenticator.auths.access_token}`,
				},
				json: true,
			});
		} catch (err) {
			throw new Error(`Can't ${action} party member: ${err}`);
		}
	}
}

module.exports = Party;
