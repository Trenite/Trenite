/* eslint-disable class-methods-use-this */
const { createClient } = require("stanza");
const UUID = require("uuid/v4");
const Endpoints = require("../../resources/Endpoints");
const Friend = require("../Structures/Friend");
const FriendRequest = require("../Structures/FriendRequest");
const FriendMessage = require("../Structures/FriendMessage");
const Presence = require("../Structures/FriendPresence");
const PartyMessage = require("../Structures/PartyMessage");
const PartyMember = require("../Structures/PartyMember");
const ClientPartyMember = require("../Structures/ClientPartyMember");
const Party = require("../Party");
const PartyInvitation = require("../Structures/PartyInvitation");

module.exports = class Communicator {
	constructor(client) {
		Object.defineProperty(this, "Client", { value: client });
		const uuid = this.generateUUID();

		this.connected = false;
		this.uuid = uuid;
		this.resource = this.Client.config.showAsOnline
			? `V2:Fortnite:${this.Client.config.platform.short}::${this.uuid}`
			: "";
		this.alreadyConnected = false;
		this.isReconnecting = false;
	}

	async setStatus(status) {
		if (!status) return this.stream.sendPresence(null);
		return this.stream.sendPresence({
			status: JSON.stringify(typeof status === "object" ? status : { Status: status }),
		});
	}

	/**
	 * Send a friend message
	 * @param {JID} to JID of the user to send the message to
	 * @param {String} message Message
	 */
	sendMessage(to, message) {
		try {
			return this.stream.sendMessage({
				to,
				type: "chat",
				body: message,
			});
		} catch (err) {
			return false;
		}
	}

	/**
	 * Send a request for a status
	 * @param {string} to JID or ID of the user to send the probe to
	 */
	sendProbe(to) {
		const user = to.includes("@") ? to : `${to}@${Endpoints.EPIC_PROD_ENV}`;
		return this.stream.sendPresence({
			to: user,
			type: "probe",
		});
	}

	generateUUID() {
		return UUID().replace(/-/g, "").toUpperCase();
	}

	setup() {
		this.Client.config.debug("Connecting communicator...");
		this.stream = createClient({
			wsURL: `wss://${Endpoints.XMPP_SERVER}`,
			server: Endpoints.EPIC_PROD_ENV,
			transports: {
				websocket: `wss://${Endpoints.XMPP_SERVER}`,
				bosh: false,
			},

			credentials: {
				jid: `${this.Client.account.id}@${Endpoints.EPIC_PROD_ENV}`,
				host: Endpoints.EPIC_PROD_ENV,
				username: this.Client.account.id,
				password: this.Client.Authenticator.auths.access_token,
			},

			resource: this.resource,
		});

		this.stream.enableKeepAlive({
			interval: 60,
		});
		// this.stream.on('raw:incoming', (r) => console.log(r));
	}

	disconnect() {
		this.connected = false;
		this.stream.disconnect();
	}

	async reconnect() {
		this.isReconnecting = true;
		this.stream.disconnect();
		this.uuid = this.generateUUID();
		this.resource = this.Client.config.showAsOnline
			? `V2:Fortnite:${this.Client.config.platform.short}::${this.uuid}`
			: "";
		this.stream = createClient({
			wsURL: `wss://${Endpoints.XMPP_SERVER}`,
			server: Endpoints.EPIC_PROD_ENV,
			transports: {
				websocket: `wss://${Endpoints.XMPP_SERVER}`,
				bosh: false,
			},

			credentials: {
				jid: `${this.Client.account.id}@${Endpoints.EPIC_PROD_ENV}`,
				host: Endpoints.EPIC_PROD_ENV,
				username: this.Client.account.id,
				password: this.Client.Authenticator.auths.access_token,
			},

			resource: this.resource,
		});

		this.stream.enableKeepAlive({
			interval: 60,
		});
		this.setupEvents();
		this.stream.connect();
		try {
			await this.Client.waitForEvent("communicator:connected", 15000);
			this.isReconnecting = false;
			return { success: true };
		} catch (err) {
			this.isReconnecting = false;
			return { success: false, err: "Communicator connection time exceeded" };
		}
	}

	connect() {
		this.setupEvents();
		this.connected = true;
		this.stream.connect();
	}

	setupEvents() {
		this.stream.on("session:started", async () => {
			this.Client.emit("communicator:connected");
			if (!this.alreadyConnected) {
				if (this.Client.config.showAsOnline) this.setStatus("Playing Battle Royale");
				this.alreadyConnected = true;
			}
		});

		this.stream.on("disconnected", async () => {
			if (this.isReconnecting) return;
			if (this.connected) {
				const reconnect = await this.reconnect();
				if (!reconnect.success) {
					throw new Error("Communicator reconnect failed!");
				}
			}
		});

		this.stream.on("presence", async (p) => {
			if (!p.status || p.from.split("@")[0] === this.Client.account.id) return;
			const presence = JSON.parse(p.status);
			if (!this.Client.friends.some((f) => f.id === p.from.split("@")[0])) {
				const wait = await this.waitForFriend(p.from.split("@")[0], 250, 7000);
				if (wait !== true) return;
			}
			const friend = this.Client.friends.get(p.from.split("@")[0]);
			const friendPresence = new Presence(this.Client, presence, friend.id);
			this.Client.friends.set(friend.id, { ...friend, presence: friendPresence });
			const updatedFriendPresence = new Presence(this.Client, presence, friend.id);
			this.Client.friends.set(friend.id, { ...friend, presence: updatedFriendPresence });
			this.Client.emit("friend:status", friend.presence);
			this.Client.emit(`friend#${friend.id}:status`, friend.presence);
		});

		this.stream.on("groupchat", async (g) => {
			if (!this.Client.party || this.Client.party.id !== g.from.split("@")[0].slice(6)) return;
			if (g.body === "Welcome! You created new Multi User Chat Room.") return;
			const [, id] = g.from.split(":");
			if (id === this.Client.account.id) return;
			const member = this.Client.party.members.get(id);
			if (!member) return;

			const partyMessage = new PartyMessage(this.Client, g.body, member);
			this.Client.emit("party:member:message", partyMessage);
			this.Client.emit(`party#${this.Client.party}:member:message`, partyMessage);
			this.Client.emit(`party:member#${id}:message`, partyMessage);
			this.Client.emit(`party#${this.Client.party}:member#${id}:message`, partyMessage);
		});

		this.stream.on("message", async (m) => {
			if (m.type !== "chat" && m.type !== "headline" && m.type !== "groupchat" && m.type !== "error") {
				const body = JSON.parse(m.body);
				if (!body.type) return;
				switch (body.type) {
					case "com.epicgames.friends.core.apiobjects.Friend":
						{
							const { payload } = body;
							const { status } = payload;
							const id = payload.accountId;
							if (status === "ACCEPTED") {
								const user = await this.Client.getProfile(id);
								if (!user || !user.id) break;
								const friend = new Friend(this.Client, {
									...user,
									_status: "FRIENDED",
									favorite: payload.favorite,
									created: body.timestamp,
								});
								this.Client.friends.set(friend.id, friend);
								if (this.Client.pendingFriends.some((f) => f.friend.id === id)) {
									this.Client.pendingFriends.delete(id);
								}
								this.Client.emit("friend:added", friend);
								this.Client.emit(`friend#${id}:added`, friend);
							} else if (status === "PENDING") {
								const user = await this.Client.getProfile(id);
								if (!user || !user.id) break;
								const friend = new Friend(this.Client, {
									...user,
									_status: "PENDING",
									favorite: payload.favorite,
								});
								const friendRequest = new FriendRequest(this.Client, {
									friend,
									direction: payload.direction === "INBOUND" ? "INCOMING" : "OUTGOING",
								});
								this.Client.pendingFriends.set(friend.id, friendRequest);
								this.Client.emit("friend:request", friendRequest);
								this.Client.emit(`friend#${id}:request`, friendRequest);
							}
						}
						break;

					case "FRIENDSHIP_REMOVE":
						{
							const { reason } = body;
							const id = body.from === this.Client.account.id ? body.to : body.from;

							if (reason === "ABORTED") {
								const friendRequest = this.Client.pendingFriends.get(id);
								this.Client.pendingFriends.delete(id);
								friendRequest.status = "DECLINED";
								this.Client.emit("friend:request:abort", friendRequest);
								this.Client.emit(`friend#${id}:request:abort`, friendRequest);
							} else if (reason === "REJECTED") {
								const friendRequest = this.Client.pendingFriends.get(id);
								this.Client.pendingFriends.delete(id);
								friendRequest.status = "DECLINED";
								this.Client.emit("friend:request:decline", friendRequest);
								this.Client.emit(`friend#${id}:request:decline`, friendRequest);
							} else {
								const friend = this.Client.friends.get(id);
								this.Client.friends.delete(id);
								friend.status = "REMOVED";
								this.Client.emit("friend:removed", friend);
								this.Client.emit(`friend#${id}:removed`, friend);
							}
						}
						break;

					case "USER_BLOCKLIST_UPDATE":
						{
							const { status } = body;
							const id = body.accountId;

							if (status === "BLOCKED") {
								const friend = this.Client.friends.get(id);
								friend.status = "BLOCKED";
								this.Client.blockedFriends.set(id, friend);
								this.Client.friends.delete(id);
							} else if (status === "UNBLOCKED") {
								const friend = this.Client.blockedFriends.get(id);
								friend.status = "FRIENDED";
								this.Client.friends.set(id, friend);
								this.Client.blockedFriends.delete(id);
							}
						}
						break;

					case "com.epicgames.social.party.notification.v0.PING":
						{
							if (body.ns !== "Fortnite") break;

							const clientPartyPings = (await Party.GetInvites(this.Client, body.pinger_id))[0];
							let invitation;
							let party;

							// eslint-disable-next-line no-restricted-syntax
							for (const invite of clientPartyPings.invites) {
								if (invite.sent_by === body.pinger_id && invite.status === "SENT") {
									invitation = invite;
									break;
								}
							}
							if (!invitation) {
								party = await Party.Get(this.Client, clientPartyPings.id);
								invitation = this.createInvite(body.pinger_id, party);
							} else {
								party = new Party(this.Client, clientPartyPings);
							}

							const partyInv = new PartyInvitation(this.Client, { ...invitation, party });
							this.Client.emit("party:invitation", partyInv);
							this.Client.emit(`party#${party.id}:invitation`, partyInv);
						}
						break;

					case "com.epicgames.social.party.notification.v0.MEMBER_LEFT":
						{
							if (!this.Client.party || !this.Client.party.id === body.party_id) break;
							const member = this.Client.party.members.get(body.account_id);
							if (!member) break;
							this.Client.party.members.delete(body.account_id);
							this.Client.PresenceMeta.refreshPartyInfo();

							this.Client.emit("party:member:left", member);
							this.Client.emit(`party#${body.party_id}:member:left`, member);
							this.Client.emit(`party#${body.party_id}:member#${body.account_id}:left`, member);
							this.Client.emit(`party:member#${body.account_id}:left`, member);
						}
						break;

					case "com.epicgames.social.party.notification.v0.MEMBER_EXPIRED":
						{
							if (!this.Client.party || !this.Client.party.id === body.party_id) break;
							const member = this.Client.party.members.get(body.account_id);
							if (!member) break;
							this.Client.party.members.delete(body.account_id);
							this.Client.PresenceMeta.refreshPartyInfo();

							this.Client.emit("party:member:expired", member);
							this.Client.emit(`party#${this.Client.party.id}:member:expired`, member);
							this.Client.emit(`party#${this.Client.party.id}:member#${member.id}:expired`, member);
							this.Client.emit(`party:member#${member.id}:expired`, member);
						}
						break;

					case "com.epicgames.social.party.notification.v0.MEMBER_NEW_CAPTAIN":
						{
							if (!this.Client.party || !this.Client.party.id === body.party_id) break;
							const member = this.Client.party.members.get(body.account_id);
							if (!member) break;
							this.Client.party.members.forEach((mem) => mem.role === "");
							member.role = "CAPTAIN";
							this.Client.party.members.set(member.id, member);
							this.Client.PresenceMeta.refreshPartyInfo();

							this.Client.emit("party:member:promoted", member);
							this.Client.emit(`party#${this.Client.party.id}:member:promoted`, member);
							this.Client.emit(`party#${this.Client.party.id}:member#${member.id}:promoted`, member);
							this.Client.emit(`party:member#${member.id}:promoted`, member);
						}
						break;

					case "com.epicgames.social.party.notification.v0.MEMBER_KICKED":
						{
							if (!this.Client.party || !this.Client.party.id === body.party_id) break;
							const member = this.Client.party.members.get(body.account_id);
							if (!member) break;
							this.Client.party.members.delete(body.account_id);
							this.Client.PresenceMeta.refreshPartyInfo();

							this.Client.emit("party:member:kicked", member);
							this.Client.emit(`party#${this.Client.party.id}:member:kicked`, member);
							this.Client.emit(`party#${this.Client.party.id}:member#${member.id}:kicked`, member);
							this.Client.emit(`party:member#${member.id}:kicked`, member);
						}
						break;

					case "com.epicgames.social.party.notification.v0.MEMBER_DISCONNECTED":
						{
							if (!this.Client.party || !this.Client.party.id === body.party_id) break;
							const member = this.Client.party.members.get(body.account_id);
							if (!member) break;
							this.Client.party.members.delete(body.account_id);
							this.Client.PresenceMeta.refreshPartyInfo();

							this.Client.emit("party:member:disconnected", member);
							this.Client.emit(`party#${this.Client.party.id}:member:disconnected`, member);
							this.Client.emit(`party#${this.Client.party.id}:member#${member.id}:disconnected`, member);
							this.Client.emit(`party:member#${member.id}:disconnected`, member);
						}
						break;

					case "com.epicgames.social.party.notification.v0.PARTY_UPDATED":
						if (!this.Client.party || !this.Client.party.id === body.party_id) break;
						this.Client.party.update(body, true);
						this.Client.PresenceMeta.refreshPartyInfo();

						this.Client.emit("party:updated", this.Client.party);
						this.Client.emit(`party#${body.party_id}:updated`, this.Client.party);
						break;

					case "com.epicgames.social.party.notification.v0.MEMBER_STATE_UPDATED":
						{
							if (!this.Client.party || !this.Client.party.id === body.party_id) break;

							const member = this.Client.party.members.get(body.account_id);
							if (!member) break;
							member.update(body, true);

							this.Client.emit("party:member:state:updated", member);
							this.Client.emit(`party#${this.Client.party.id}:member:state:updated`, member);
							this.Client.emit(`party#${this.Client.party.id}:member#${member.id}:state:updated`, member);
							this.Client.emit(`party:member#${member.id}:state:updated`, member);
						}
						break;

					case "com.epicgames.social.party.notification.v0.MEMBER_JOINED":
						{
							if (!this.Client.party || !this.Client.party.id === body.party_id) break;

							let member = this.Client.party.members.get(body.account_id);
							if (!member) {
								if (body.account_id === this.Client.account.id) {
									member = new ClientPartyMember(this.Client.party, body);
								} else {
									member = new PartyMember(this.Client.party, body);
								}
							}
							this.Client.party.members.set(member.id, member);
							if (this.Client.party.me) await this.Client.party.me.sendPatch();
							this.Client.PresenceMeta.refreshPartyInfo();

							this.Client.emit("party:member:joined", member);
							this.Client.emit(`party#${this.Client.party.id}:member:joined`, member);
							this.Client.emit(`party#${this.Client.party.id}:member#${member.id}:joined`, member);
							this.Client.emit(`party:member#${member.id}:joined`, member);
						}
						break;

					case "com.epicgames.social.party.notification.v0.INITIAL_INVITE":
						break;

					case "com.epicgames.social.party.notification.v0.MEMBER_REQUIRE_CONFIRMATION":
						if (!this.Client.party || !this.Client.party.id === body.party_id) break;
						if (this.Client.party.me.role !== "CAPTAIN") break;

						await Party.PostMemberAction(this.Client, "confirm", body.account_id, this.Client.party.id);
						break;

					case "com.epicgames.social.party.notification.v0.INVITE_CANCELLED":
						this.Client.emit("party:invitation:cancelled");
						this.Client.emit(`party#${body.party_id}:invitation:cancelled`);
						this.Client.emit(`party#${body.party_id}:invitation#${body.invite_id}:cancelled`);
						this.Client.emit(`party:invitation#${body.invite_id}:cancelled`);
						break;

					case "com.epicgames.social.party.notification.v0.INVITE_DECLINED":
						this.Client.emit("party:invitation:declined");
						this.Client.emit(`party#${body.party_id}:invitation#${body.invite_id}:declined`);
						this.Client.emit(`party:invitation#${body.invite_id}:declined`);
						break;

					case "com.epicgames.social.presence.notification.v1.UNSUBSCRIBE":
						break;

					case "com.epicgames.social.presence.notification.v1.SUBSCRIBE":
						break;

					case "com.epicgames.friends.core.apiobjects.FriendRemoval":
						break;

					case "com.epicgames.friends.core.apiobjects.BlockListEntryAdded":
						break;

					case "com.epicgames.friends.core.apiobjects.BlockListEntryRemoved":
						break;

					case "FRIENDSHIP_REQUEST":
						break;

					case "com.epicgames.social.party.notification.v0.MEMBER_CONNECTED":
						break;

					default:
						this.Client.config.debug(`New Unknown XMPP message: ${m}`);
						break;
				}
			} else if (m.type === "chat") {
				if (!this.Client.friends.some((f) => f.id === m.from.split("@")[0])) {
					await this.waitForFriend(m.from.split("@")[0], 250, 7000);
				}
				const FMessage = new FriendMessage(this.Client, m);
				this.Client.emit("friend:message", FMessage);
			} else if (m.type === "error") {
				this.Client.config.debug(`XMPP error: ${m.error.text || m.error.condition}`);
			}
		});
	}

	waitForFriend(id, interval, time) {
		return new Promise((res) => {
			setInterval(() => {
				if (this.Client.friends.some((x) => x.id === id)) res(true);
			}, interval);
			setTimeout(() => res(false), time);
		});
	}

	createInvite(fromId, party) {
		if (!party) return false;
		if (!party.meta) return false;

		const nowDate = new Date();
		const expDate = new Date();
		expDate.setHours(nowDate.getHours() + 4);

		const inv = {
			party_id: party.id,
			sent_by: fromId,
			meta: {
				"urn:epic:conn:type_s": "game",
				"urn:epic:conn:platform_s": party.members.get(fromId).meta.get("Platform_j").Platform.platformStr,
				"urn:epic:member:dn_s": this.Client.friends.get(fromId).displayName,
				"urn:epic:cfg:build-id_s": party.meta.schema["urn:epic:cfg:build-id_s"],
				"urn:epic:invite:platformdata_s": "",
			},
			sent_to: this.Client.account.id,
			sent_at: nowDate.toISOString(),
			updated_at: nowDate.toISOString(),
			expires_at: expDate.toISOString(),
			status: "SENT",
		};
		return inv;
	}
};
