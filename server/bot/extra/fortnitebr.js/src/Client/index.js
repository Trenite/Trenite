/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-vars */
const EventEmitter = require("events");
const request = require("request-promise");
const Endpoints = require("../../resources/Endpoints");
const Authenticator = require("./auth.js");
const Lookup = require("./lookup.js");
const List = require("../Util/List.js");
const User = require("../Structures/User.js");
const LauncherAccount = require("../Structures/ClientAccount.js");
const Friend = require("../Structures/Friend.js");
const Communicator = require("../Communicator");
const FriendRequest = require("../Structures/FriendRequest.js");
const Party = require("../Party");
const PartyPrivacy = require("../../enums/PartyPrivacy");
const Platform = require("../../enums/Platform");
const ReadyState = require("../../enums/ReadyState");
const Region = require("../../enums/Region");
const KairosColor = require("../../enums/KairosColor");
const Playlist = require("../../enums/Playlist");
const ClientPresenceMeta = require("../Structures/ClientPresenceMeta");

class Client extends EventEmitter {
	/**
	 * Main client.
	 * @param {ClientArguments} [args] email, password and debug
	 */
	constructor(args = {}) {
		super();
		this.config = {
			email: undefined,
			password: undefined,
			debug: () => undefined,
			platform: {
				full: "Windows",
				short: "WIN",
				os: "Windows/10.0.17134.1.768.64bit",
			},
			createPartyOnStart: true,
			get2FACode: async () => this.Authenticator.consoleQuestion("Please enter 2FA Code: ", 20000),
			partyConfig: {
				privacy: PartyPrivacy.PUBLIC,
				joinConfirmation: false,
				joinability: "OPEN",
				maxSize: 16,
				subType: "default",
				type: "default",
				inviteTTL: 14400,
				chatEnabled: true,
			},
			exchangeCode: undefined,
			deviceAuthDetails: undefined,
			deviceAuthOptions: {
				createNew: false,
				deleteOthers: false,
				...args.deviceAuthOptions,
			},
			showAsOnline: true,
			savePartyMemberMeta: true,
			...args,
		};

		/**
		 * Client authenticator.
		 * @private
		 */
		this.Authenticator = new Authenticator(this);

		/**
		 * Client profile lookup.
		 * @private
		 */
		this.Lookup = new Lookup(this);

		/**
		 * Client friends.
		 */
		this.friends = new List();

		/**
		 * Client pending friends.
		 */
		this.pendingFriends = new List();

		/**
		 * Client blocked friends.
		 */
		this.blockedFriends = new List();

		/**
		 * Client's epicgames account.
		 */
		this.account = undefined;

		this.party = undefined;

		/**
		 * Client communicator.
		 * @private
		 */
		this.Communicator = new Communicator(this);

		this.PresenceMeta = new ClientPresenceMeta(this);

		this.lastMemberMeta = undefined;
	}

	get Party() {
		return Party;
	}

	/**
	 * Initialize client startup process
	 */
	async login() {
		this.emit("start");
		const auth = await this.Authenticator.authenticate();
		if (!auth.success) throw new Error(`Authentification failed: ${auth.err}`);
		this.account = this.Authenticator.account;

		try {
			const launcheracc = await request.get({
				url: `https://account-public-service-prod03.ol.epicgames.com/account/api/public/account/${this.account.id}`,
				headers: {
					Authorization: `bearer ${this.Authenticator.auths.access_token}`,
				},
				json: true,
			});
			this.account = new LauncherAccount(this, launcheracc);
		} catch (err) {
			throw new Error(`Account error: ${err}`);
		}

		this.Communicator.setup();
		await this.updateFriendsCache();
		this.Communicator.connect();
		try {
			await this.waitForEvent("communicator:connected", 10000);
		} catch (err) {
			throw new Error("Communicator startup error");
		}

		if (this.config.showAsOnline) this.PresenceMeta.setStatus("Playing Battle Royale");

		if (this.config.createPartyOnStart) {
			const clientParties = await Party.GetMember(this, this.account.id);
			if (clientParties.current.length > 0) {
				this.party = new Party(this, clientParties.current[0]);
				await this.party.leave();
				this.config.debug("Left old party");
			}
			await Party.Create(this);
			await this.PresenceMeta.refreshPartyInfo();
		}

		this.config.debug(`Logged in as ${this.account.displayName}`);
		this.emit("ready");
	}

	/**
	 * Logout from all processes
	 */
	async logout() {
		try {
			this.removeAllListeners();
			clearTimeout(this.Authenticator.scheduledReauth);
			if (this.party) await this.party.leave();
			if (this.Communicator && this.Communicator.stream) this.Communicator.disconnect();
			const tcheck = await this.Authenticator.checktoken();
			if (!tcheck.valid) return true;
			await request.delete({
				url: `${Endpoints.OAUTH_KILL_SESSION}/${this.Authenticator.auths.access_token}`,
				headers: {
					Authorization: `${this.Authenticator.auths.token_type} ${this.Authenticator.auths.access_token}`,
				},
			});
			this.Authenticator.auths = {};
			this.Authenticator.reauths = {};
			return true;
		} catch (err) {
			throw new Error(`Logging out failed: ${err}`);
		}
	}

	/**
	 * Fetch a player profile
	 * @param {String | Array} IdOrName Id or displayName of the profile(s)
	 */
	async getProfile(IdOrName) {
		if (typeof IdOrName === "string") {
			const profile = await this.Lookup.lookup(IdOrName);
			if (!profile) return false;
			return new User(this, profile);
		}
		if (IdOrName[0].length !== 32)
			throw new Error("It's not possible to fetch multiple diplayNames at the moment!");
		const profiles = await this.Lookup.lookupmultipleids(IdOrName);
		if (!profiles) return false;
		profiles.map((p) => new User(this, p));
		return profiles;
	}

	/**
	 * Get current news
	 * @param {String} gamemode 'battleroyale' (default), 'creative' or 'savetheworld'
	 * @param {String} lang news language: 'en' (default), 'de', 'fr', ...
	 */
	async getNews(gamemode = "battleroyale", lang = "en") {
		try {
			const news = await request.get({
				url: `${Endpoints.NEWS}?lang=${lang}`,
				json: true,
			});
			return news[`${gamemode}news`].news;
		} catch (err) {
			throw new Error(`Can't access ${gamemode} news: ${err}`);
		}
	}

	/**
	 * Get epicgames public server status
	 */
	// eslint-disable-next-line class-methods-use-this
	async getServerStatus() {
		try {
			const ss = await request.get({
				url: Endpoints.SERVER_STATUS,
				json: true,
			});
			return ss;
		} catch (err) {
			throw new Error(`Can't access server status: ${err}`);
		}
	}

	/**
	 * Send a friend message
	 */
	async sendFriendMessage(friendid, message) {
		if (!friendid) return false;
		if (!message) return false;
		this.Communicator.sendMessage(`${friendid}@${Endpoints.EPIC_PROD_ENV}`, message);
		return true;
	}

	/**
	 * Add a friend
	 * @param {String} IdOrName Id or Name of the friend to check
	 */
	async addFriend(IdOrName) {
		const id = IdOrName.length === 32 ? IdOrName : (await this.getProfile(IdOrName)).id;
		try {
			await request.post({
				url: `${Endpoints.ADD_FRIEND}/${this.account.id}/${id}`,
				headers: {
					Authorization: `${this.Authenticator.auths.token_type} ${this.Authenticator.auths.access_token}`,
				},
			});
			return true;
		} catch (err) {
			throw new Error(`Can't add a friend: ${err}`);
		}
	}

	/**
	 * Remove a friend
	 * @param {String} IdOrName Id or Name of the friend to remove
	 */
	async removeFriend(IdOrName) {
		const id = IdOrName.length === 32 ? IdOrName : (await this.getProfile(IdOrName)).id;
		try {
			const friend = this.friends.get(id);
			if (!friend) return false;
			await request.delete({
				url: `${Endpoints.FRIENDS}/${this.account.id}/friends/${id}`,
				headers: {
					Authorization: `${this.Authenticator.auths.token_type} ${this.Authenticator.auths.access_token}`,
				},
			});
			return true;
		} catch (err) {
			throw new Error(`Can't remove a friend: ${err}`);
		}
	}

	/**
	 * Block a friend
	 * @param {String} IdOrName Id or Name of the friend to block
	 */
	async blockFriend(IdOrName) {
		const id = IdOrName.length === 32 ? IdOrName : (await this.getProfile(IdOrName)).id;
		try {
			await request.post({
				url: `${Endpoints.FRIENDS_BLOCKLIST}/${this.account.id}/${id}`,
				headers: {
					Authorization: `${this.Authenticator.auths.token_type} ${this.Authenticator.auths.access_token}`,
				},
			});
			return true;
		} catch (err) {
			throw new Error(`Can't block a friend: ${err}`);
		}
	}

	/**
	 * Unblock a friend
	 * @param IdOrName Id or displayName of the friend to unblock
	 */
	async unblockFriend(IdOrName) {
		const id = IdOrName.length === 32 ? IdOrName : (await this.getProfile(IdOrName)).id;
		try {
			await request.delete({
				url: `${Endpoints.FRIENDS_BLOCKLIST}/${this.account.id}/${id}`,
				headers: {
					Authorization: `${this.Authenticator.auths.token_type} ${this.Authenticator.auths.access_token}`,
				},
			});
			return true;
		} catch (err) {
			throw new Error(`Can't unblock a friend: ${err}`);
		}
	}

	/**
	 * Get friend status. Returns false on failure
	 * @param {String} IdOrName id or displayName of the friend
	 */
	async getFriendStatus(IdOrName) {
		const friend = this.friends.find((f) => f.id === IdOrName || f.displayName === IdOrName);
		if (!friend) throw new Error(`Can't fetch ${IdOrName}'s status: You aren't friended with ${IdOrName}`);
		if (friend) throw new Error(`Can't fetch ${IdOrName}'s status: ${IdOrName} not found`);
		this.Communicator.sendProbe(IdOrName);
		try {
			return await this.waitForEvent(`friend#${friend.id}:status`, 5000);
		} catch (err) {
			throw new Error(`Can't access friend status: ${err}`);
		}
	}

	/**
	 * Update client.friends manually. Usually thats not needed.
	 */
	async updateFriendsCache() {
		const friends = await request.get({
			url: `${Endpoints.FRIENDS}/${this.account.id}/summary?displayNames=true`,
			headers: {
				Authorization: `${this.Authenticator.auths.token_type} ${this.Authenticator.auths.access_token}`,
			},
			json: true,
		});
		this.friends.deleteAll();
		this.blockedFriends.deleteAll();
		this.pendingFriends.deleteAll();
		await friends.friends.forEach((f) => {
			this.friends.set(f.accountId, new Friend(this, { ...f, _status: "FRIENDED" }));
		});
		await friends.incoming.forEach((fr) => {
			this.pendingFriends.set(
				fr.accountId,
				new FriendRequest(this, {
					friend: new Friend(this, {
						id: fr.accountId,
						displayName: fr.displayName,
						favorite: fr.favorite,
						_status: "PENDING",
					}),
				})
			);
		});
		await friends.outgoing.forEach((fr) => {
			this.pendingFriends.set(
				fr.accountId,
				new FriendRequest(this, {
					direction: "OUTGOING",
					friend: new Friend(this, { id: fr.accountId, displayName: fr.displayName, favorite: fr.favorite }),
				})
			);
		});
		await friends.blocklist.forEach((bf) => {
			this.blockedFriends.set(bf.accountId, new Friend(this, { ...bf, _status: "BLOCKED" }));
		});
	}

	/**
	 * Set the client's friendslist status
	 * @param {string} status
	 */
	async setStatus(status) {
		return this.Communicator.setStatus(status);
	}

	/**
	 * Get a public party by id
	 * @param {string} id id of the party to lookup
	 */
	async getParty(id) {
		return Party.Get(this, id);
	}

	/**
	 * Joins a party (must be public)
	 * @param id id of the party
	 */
	async joinParty(id) {
		const joinParty = await Party.Get(this, id);
		if (!joinParty || !joinParty.id) throw new Error("Can't join party: Party not found");
		return Party.Join(this, joinParty);
	}

	/**
	 * Sends a party invitation to a friend
	 * @param IdOrName Id or displayName of the friend you want to invite
	 */
	async sendPartyInvitation(IdOrName) {
		const friend = this.friends.find((f) => f.id === IdOrName || f.displayName === IdOrName);
		if (!friend) throw new Error(`Can't send party invitation: Friend ${IdOrName} not found`);
		try {
			return await request.post({
				url: `https://party-service-prod.ol.epicgames.com/party/api/v1/Fortnite/user/${friend.id}/pings/${this.account.id}`,
				headers: {
					Authorization: `${this.Authenticator.auths.token_type} ${this.Authenticator.auths.access_token}`,
				},
				body: {},
				json: true,
			});
		} catch (err) {
			throw new Error(`Can't send party invitation: ${err}`);
		}
	}

	/**
	 * Deletes all incoming party invitations from a specific friend.
	 * @param IdOrName Id or displayName of the friend you want to clear all invites from
	 */
	async deletePartyInvitation(IdOrName) {
		const friend = this.friends.find((f) => f.id === IdOrName || f.displayName === IdOrName);
		if (!friend) throw new Error(`Can't send party invitation: Friend ${IdOrName} not found`);
		try {
			return await request.delete({
				url: `https://party-service-prod.ol.epicgames.com/party/api/v1/Fortnite/user/${friend.id}/pings/${this.account.id}`,
				headers: {
					Authorization: `${this.Authenticator.auths.token_type} ${this.Authenticator.auths.access_token}`,
				},
				body: {},
				json: true,
			});
		} catch (err) {
			throw new Error(`Can't send party invitation: ${err}`);
		}
	}

	/**
	 * Wait for an event
	 * @param {string} event event name
	 * @param {number} timeout time to wait
	 * @returns {object} data collected in event | false on failure / timeout exceed
	 */
	waitForEvent(event, timeout, filter) {
		const time = typeof timeout === "number" ? timeout : 5000;
		return new Promise((resolve, reject) => {
			this.once(event, (...args) => {
				if (filter && !filter(...args)) return;
				resolve(...args);
			});
			setTimeout(() => reject(new Error(`Waiting for event timeout exceeded: ${time} ms`)), time);
		});
	}

	/**
	 * MCP is a way to communicate with Fortnites Database.
	 * This is at your own risk, because commands like PurchaseCatalogEntry can be abused.
	 * @param command Command to execute e.g. QueryProfile or PurchaseCatalogEntry
	 * @param profileId Profile to execute the command in e.g. athena or common_core
	 * @param body Body (leave empty if your command doesnt require a body)
	 */
	async postMCP(command, profileId, body) {
		try {
			return await request.post({
				url: `${Endpoints.MCP_PROFILE}/${this.account.id}/client/${command}?profileId=${profileId}&rvn=-1&leanResponse=true`,
				body: body || {},
				headers: {
					Authorization: `${this.Authenticator.auths.token_type} ${this.Authenticator.auths.access_token}`,
				},
				json: true,
			});
		} catch (err) {
			throw new Error(`Can't post MCP: ${err}`);
		}
	}

	/**
	 * Claims the daily login bonus in SaveTheWorld
	 */
	async claimStwLoginBonus() {
		return this.postMCP("ClaimLoginReward", "campaign");
	}

	/**
	 * Get current BattleRoyale storefront
	 */
	async getBRShop() {
		try {
			const rawShop = await request.get({
				url: Endpoints.BR_STORE,
				headers: {
					Authorization: `${this.Authenticator.auths.token_type} ${this.Authenticator.auths.access_token}`,
				},
				json: true,
			});
			return rawShop;
		} catch (err) {
			throw new Error(`Can't get item shop: ${err}`);
		}
	}

	/**
	 * Lookup someones BattleRoyale v2 stats
	 * @param IdOrName Id or displayName of the player
	 */
	async getBRStats(IdOrName) {
		const id = IdOrName.length === 32 ? IdOrName : (await this.getProfile(IdOrName)).id;
		try {
			return request.get({
				url: `${Endpoints.STATS_BR_V2}/${id}`,
				headers: {
					Authorization: `${this.Authenticator.auths.token_type} ${this.Authenticator.auths.access_token}`,
				},
				json: true,
			});
		} catch (err) {
			throw new Error(`Can't lookup ${IdOrName}'s stats: ${err}`);
		}
	}
}

module.exports = Client;
