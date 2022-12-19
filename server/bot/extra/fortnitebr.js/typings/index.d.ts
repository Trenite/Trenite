import { Enums } from "fortnitebr.js";

declare module "fortnitebr.js" {
	/**
	 * A user
	 */
	export class User {
		constructor(Client: Client, data: object);

		public readonly id: string;
		public readonly displayName?: string;
		public readonly externalAuths?: object;
		/**
		 * Add user as friend
		 */
		public async sendFriendRequest(): Promise<boolean>;
	}

	/**
	 * A friend's presence party
	 */
	export class PresenceParty {
		constructor(Client: Client, data: object);

		public readonly isPrivate: boolean;
		public readonly platform: string;
		public readonly id: string;
		public readonly key: string;
		public readonly appId: string;
		public readonly buildId?: string;
		public readonly netCl?: string;
		public readonly partyFlags: object;
		public readonly notAcceptingReason: string;
		public readonly playerCount: number;

		/**
		 * Join the party (must be public)
		 */
		public async join(): Promise<void>;
	}

	/**
	 * A friend of your account
	 */
	export class Friend {
		constructor(Client: Client, data: object);

		public readonly id: string;
		public readonly displayName?: string;

		public readonly status: "UNDEFINED" | "FRIENDED" | "BLOCKED" | "REMOVED";
		public readonly connections: object | [];
		public readonly mutualFriends?: number;
		public readonly favorite?: boolean;
		public readonly createdAt?: Date | undefined;
		public readonly note?: string;
		public readonly alias?: string;
		public readonly presence?: FriendPresence;
		public readonly jid: string;
		/**
		 * Remove a friend
		 */
		public async remove(): Promise<boolean>;

		/**
		 * Send a message to the friend
		 */
		public async sendMessage(): Promise<boolean>;

		/**
		 * Requests presence and returns it
		 */
		public async getPresence(): Promise<FriendPresence>;

		/**
		 * Blocks friend
		 */
		public async block(): Promise<FriendPresence>;

		/**
		 * Unblocks friend
		 */
		public async unblock(): Promise<FriendPresence>;
	}

	/**
	 * A friend's presence
	 */
	export class FriendPresence {
		constructor(Client: Client, data: object, from: string);

		public readonly friend: Friend;
		public readonly status: string;
		public readonly rawData: object;
		public readonly recievedAt: string;
		public readonly isPlaying: boolean;
		public readonly isJoinable: boolean;
		public readonly hasVoiceSupport: boolean;
		public readonly sessionId: string;
		public readonly rawProperties: object;
		public readonly avatar?: string;
		public readonly avatarBackgroundColor?: string;
		public readonly homeBaseRating?: number;
		public readonly lfg?: number;
		public readonly subGame?: number;
		public readonly inUnjoinableMatch?: boolean;
		public readonly playlist?: string;
		public readonly partySize?: number;
		public readonly gameJoinKey?: string;
		public readonly serverPlayerCount?: number;
		public readonly gameplayStats?: PresenceGameplayStats;
		public readonly party?: PresenceParty;
	}

	/**
	 * A message sent in a friend's the wisper chat
	 */
	export class FriendMessage {
		constructor(Client: Client, data: object);

		public readonly author: Friend;
		public readonly content: string;

		/**
		 * Reply to the message
		 */
		public async reply(message: string): Promise<void>;
	}

	/**
	 * A message sent in the party chat
	 */
	export class PartyMessage {
		constructor(Client: Client, data: object);

		public readonly author: PartyMember;
		public readonly content: string;

		/**
		 * Reply to the message
		 */
		public async reply(message: string): Promise<void>;
	}

	/**
	 * A friendship request. Can be accepted or declined
	 */
	export class FriendRequest {
		constructor(Client: Client, data: object);

		public readonly direction: "INCOMING" | "OUTGOING";
		public readonly status: "ACCEPTED" | "PENDING" | "DECLINED";
		public readonly friend: Friend;

		/**
		 * Accept a friend request (Only if incoming)
		 */
		public async accept(): Promise<boolean>;
		/**
		 * Decline a friend request (Only if incoming)
		 */
		public async decline(): Promise<boolean>;
	}

	/**
	 * A party invitation you recieved or sent
	 */
	export class PartyInvitation {
		constructor(Client: Client, data: object);

		public party = Party;

		/**
		 * Accept a party invitation (Only if incoming)
		 */
		public async accept(): Promise<boolean>;
		/**
		 * Decline a party invitation (Only if incoming)
		 */
		public async decline(): Promise<boolean>;
	}

	/**
	 * A party you might be a member of
	 */
	export class Party {
		constructor(Client: Client, data: object);
	}

	/**
	 * A party member
	 */
	export class PartyMember {
		constructor(Client: Client, data: object);

		public party = {};
	}

	/**
	 * The client party member
	 */
	export class ClientPartyMember extends PartyMember {
		constructor(Client: Client, data: object);

		public party = {};
	}

	/**
	 * If someone wants to join your party, you have to accept or decline that
	 */
	export class PartyMemberConfirmation {
		constructor(Client: Client, data: object);

		public party = {};

		/**
		 * Accept a party member confirmation (Only if incoming)
		 */
		public async accept(): Promise<boolean>;
		/**
		 * Decline a party member confirmation (Only if incoming)
		 */
		public async decline(): Promise<boolean>;
	}

	/**
	 * The main client
	 */
	export class Client {
		constructor(args: ClientOptions);

		public readonly config: {
			email: string;
			password: string;
			debug: boolean;
		};

		/**
		 * The account of the profile used to login
		 */
		public readonly account: {
			id: string;
			displayName: string;
			externalAuths: object | [];
			email: string;
			name: string;
			lastName: string;
			failedLoginAttempts: number;
			lastLogin: string;
			numberOfDisplayNameChanges: number;
			ageGroup: string | "UNKNOWN";
			headless: boolean;
			country: string;
			preferredLanguage: string;
			canUpdateDisplayName: boolean;
			tfaEnabled: boolean;
			emailVerified: boolean;
			minorVerified: boolean;
			minorExpected: boolean;
			minorStatus: string | "UNKNOWN";
		};

		public friends: List<Friend>;
		public party: Party;
		public blockedFriends: List<Friend>;
		public pendingFriends: List<FriendRequest>;

		/**
		 * Initialize client startup process.
		 */
		public async login(): Promise<void>;

		/**
		 * Logout from all processes
		 */
		public async logout(): Promise<void>;

		/**
		 * Fetch a player profile
		 */
		public async getProfile(IdOrName: string): Promise<User>;

		/**
		 * Get current news
		 */
		public async getNews(
			gamemode?: "battleroyale" | "creative" | "savetheworld",
			language?: "en" | "de" | string
		): Promise<Object> | Promise<boolean>;

		/**
		 * Get epicgames public server status
		 */
		public async getServerStatus(): Promise<object>;

		/**
		 * Add a friend
		 */
		public async addFriend(IdOrName: string): Promise<boolean>;

		/**
		 * Remove a friend
		 */
		public async removeFriend(IdOrName: string): Promise<boolean>;

		/**
		 * Block a friend
		 */
		public async blockFriend(IdOrName: string): Promise<boolean>;

		/**
		 * Unblock a friend
		 */
		public async unblockFriend(IdOrName: string): Promise<boolean>;

		/**
		 * Set the client's friendslist status
		 */
		public async setStatus(status: string): Promise<void>;

		/**
		 * Send a message to a friend
		 */
		public async sendFriendMessage(friendid: string, message: string): Promise<boolean>;

		/**
		 * Wait for an event to happen. Returns error on timeout exceed
		 */
		public async waitForEvent(event: string, timeout: number): Promise<object>;

		/**
		 * Get friend status. Returns error on failure
		 */
		public async getFriendStatus(friendid: string): Promise<object | boolean>;

		/**
		 * Get party info (party must be public).
		 */
		public async getParty(id: string): Promise<object>;

		/**
		 * Get party member info.
		 */
		public async getPartyMember(id: string): Promise<object>;

		/**
		 * Join a party.
		 */
		public async joinParty(id: string): Promise<Party>;

		/**
		 * Create a party (and of course join it aswell).
		 */
		public async createParty(config: object): Promise<Party>;

		/**
		 * Claims daily login bonus for Save The World
		 */
		public async claimStwLoginBonus(): Promise<object>;

		/**
		 * Get battle royale shop
		 */
		public async getBRShop(IdOrName: string): Promise<object>;

		/**
		 * Get battle royale stats for account id or name
		 */
		public async getBRStats(IdOrName: string): Promise<object>;

		public on(event: "ready", listener: () => void): void;
		public on(event: "start", listener: () => void): void;
		public on(event: "device:auth:created", listener: () => DeviceAuthDetails): void;

		public on(event: "friend:request", listener: (friendRequest: FriendRequest) => void): void;
		public on(event: "friend:request:abort", listener: (friendRequest: FriendRequest) => void): void;
		public on(event: "friend:request:decline", listener: (friendRequest: FriendRequest) => void): void;
		public on(event: "friend:added", listener: (friend: Friend) => void): void;
		public on(event: "friend:removed", listener: (friend: Friend) => void): void;
		public on(event: "friend:message", listener: (message: FriendMessage) => void): void;
		public on(event: "friend:list", listener: (friends: Array<Friend>) => void): void;
		public on(event: "friend:status", listener: (status: FriendPresence) => void): void;

		public on(event: "party:invitation", listener: (invitation: PartyInvitation) => void): void;
		public on(event: "party:member:left", listener: (member: PartyMember) => void): void;
		public on(event: "party:member:expired", listener: (member: PartyMember) => void): void;
		public on(event: "party:member:promoted", listener: (member: PartyMember) => void): void;
		public on(event: "party:member:kicked", listener: (member: PartyMember) => void): void;
		public on(event: "party:member:disconnected", listener: (member: PartyMember) => void): void;
		public on(event: "party:updated", listener: (party: Party) => void): void;
		public on(event: "party:member:state:updated", listener: (member: PartyMember) => void): void;
		public on(event: "party:member:joined", listener: (member: PartyMember) => void): void;
		public on(event: "party:member:confirmation", listener: (confirmation: PartyMemberConfirmation) => void): void;
		public on(event: "party:invitation:cancelled", listener: (invitation: PartyInvitation) => void): void;
		public on(event: "party:invitation:declined", listener: (invitation: PartyInvitation) => void): void;

		public once(event: "ready", listener: () => void): void;
		public once(event: "start", listener: () => void): void;
		public once(event: "device:auth:created", listener: () => DeviceAuthDetails): void;

		public once(event: "friend:request", listener: (friendRequest: FriendRequest) => void): void;
		public once(event: "friend:request:abort", listener: (friendRequest: FriendRequest) => void): void;
		public once(event: "friend:request:decline", listener: (friendRequest: FriendRequest) => void): void;
		public once(event: "friend:added", listener: (friend: Friend) => void): void;
		public once(event: "friend:removed", listener: (friend: Friend) => void): void;
		public once(event: "friend:message", listener: (message: FriendMessage) => void): void;
		public once(event: "friend:list", listener: (friends: Array<Friend>) => void): void;
		public once(event: "friend:status", listener: (status: FriendPresence) => void): void;

		public once(event: "party:invitation", listener: (invitation: PartyInvitation) => void): void;
		public once(event: "party:member:left", listener: (member: PartyMember) => void): void;
		public once(event: "party:member:expired", listener: (member: PartyMember) => void): void;
		public once(event: "party:member:promoted", listener: (member: PartyMember) => void): void;
		public once(event: "party:member:kicked", listener: (member: PartyMember) => void): void;
		public once(event: "party:member:disconnected", listener: (member: PartyMember) => void): void;
		public once(event: "party:updated", listener: (party: Party) => void): void;
		public once(event: "party:member:state:updated", listener: (member: PartyMember) => void): void;
		public once(event: "party:member:joined", listener: (member: PartyMember) => void): void;
		public once(
			event: "party:member:confirmation",
			listener: (confirmation: PartyMemberConfirmation) => void
		): void;
		public once(event: "party:invitation:cancelled", listener: (invitation: PartyInvitation) => void): void;
		public once(event: "party:invitation:declined", listener: (invitation: PartyInvitation) => void): void;
	}

	/**
	 * Options for the client constructor
	 */
	type ClientOptions = {
		/**
		 * Enable/Disable console debugging
		 */
		debug?: Function;

		/**
		 * Client platform
		 */
		platform?: Platform;

		/**
		 * If the client should create a party when started
		 */
		createPartyOnStart?: boolean;

		/**
		 * Client build like ``++Fortnite+Release-12.10-CL-11883027``
		 */
		build?: string;

		/**
		 * A method to get the 2 Factor Authentification code if needed. Default is a console prompt
		 */
		get2FACode?: Function;

		/**
		 * Default config to create parties
		 */
		partyConfig?: PartyConfig;

		/**
		 * whether a new party should be created if the Client's party was left
		 */
		createPartyOnLeave?: boolean;

		/**
		 * Account email for auth
		 */
		email?: string;

		/**
		 * Account password for auth
		 */
		password?: string;

		/**
		 * Exchange code for auth
		 */
		exchangeCode?: ExchangeCode | Function;

		/**
		 * Details needed to authentify via DeviceAuth. Object, Filepath or Function to Object.
		 */
		deviceAuthDetails?: DeviceAuthDetails | String | Function;

		/**
		 * If the Client's friends should see the Client as online in game
		 */
		showAsOnline?: boolean;

		/**
		 * Options for DeviceAuth method
		 */
		deviceAuthOptions?: {
			/**
			 * If new DeviceAuth details should be created. You can save them with the event ``device:auth:created``.
			 */
			createNew?: boolean;

			/**
			 * If all DeviceAuths except the used one should be deleted
			 */
			deleteExisting?: boolean;
		};
	};

	/**
	 * The code used for code auth. You can get it here: https://www.epicgames.com/id/login?redirectUrl=https%3A%2F%2Fwww.epicgames.com%2Fid%2Fapi%2Fexchange
	 */
	type ExchangeCode = string;

	/**
	 * Details needed to authentify via DeviceAuth
	 */
	type DeviceAuthDetails = {
		accountId: string;
		deviceId: string;
		secret: string;
	};

	/**
	 * Platform like Windows or Android
	 */
	type Platform = {
		full: string;
		short: string;
		os: string;
	};

	type PartyConfig = {
		privacy: Enums.PartyPrivacy.PUBLIC;
		joinConfirmation: boolean;
		joinability: "OPEN" | string;
		maxSize: number;
		subType: "default" | string;
		type: "default" | string;
		inviteTTL: number;
		chatEnabled: boolean;
	};

	type PresenceGameplayStats = {
		state: string;
		playlist: string;
		playersAlive: number;
		kills: number;
		fellToDeath: boolean;
	};

	export class List<K, V> extends Map<K, V> {
		public deleteAll(): Promise<V>[];
		public equals(list: List<any, any>): boolean;
		public find(fn: (value: V, key: K, list: List<K, V>) => boolean): V;
		public some(fn: (value: V, key: K, list: List<K, V>) => boolean, thisArg?: any): boolean;
		public sort(compareFunction?: (a: V, b: V, c?: K, d?: K) => number): List<K, V>;
	}
}
