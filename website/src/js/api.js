import io from "socket.io-client";
import store from "./store";
import axios from "axios";

class API {
	constructor() {
		this.request = axios.create({
			baseURL: "/api",
			headers: { bot: this.state.custombot.id, guild: this.state.guild.id },
		});
		this.request.interceptors.response.use(this.success.bind(this), this.error.bind(this));
		store.subscribe(() => {
			this.request.defaults.headers.bot = this.state.custombot.id;
			this.request.defaults.headers.guild = this.state.guild.id;
		});
	}

	success(response) {
		try {
			if (typeof response.data === "text") response.data = JSON.parse(response.data);
		} catch (e) {
			response.data = { error: response.statusText };
		}
		return response.data;
	}

	error(error) {
		try {
			if (typeof error.response.data === "text") error.response.data = JSON.parse(error.response.data);
		} catch (e) {
			error.response.data = { error: error.response.statusText };
		}

		if (!(error.response.data ? error.response.data.error : "").includes("UnauthorizedError")) {
			window.app.notification
				.create({
					icon: `<img style="border-radius: 50%" src="${this.state.custombot.logo}" />`,
					title: this.state.custombot.name,
					titleRightText: "error",
					subtitle: error.response.data.error || error.response.data.message,
					closeOnClick: true,
					closeTimeout: 5000,
				})
				.open();
		}
		throw error.response.data;
	}

	get state() {
		return store.getState();
	}

	async login() {
		try {
			var user = await this.request.get(`/user`);

			store.dispatch({ type: "SET_CREDENTIALS", payload: user });
			return user;
		} catch (error) {
			store.dispatch({ type: "LOGOUT" });
			return false;
		}
	}

	async connect() {
		var socket = io("/", {
			path: "/api/gateway",
		});
		this.gateway = socket;

		socket.on("GUILD_CREATE", this.onGuild.bind(this));
		socket.on("GUILD_DELETE", this.onGuild.bind(this));
		socket.on("GUILD_UPDATE", this.onGuild.bind(this));
		socket.on("reconnect", this.onConnect.bind(this));
		socket.on("connect", this.onConnect.bind(this));
		var onevent = socket.onevent;
		socket.onevent = function (packet) {
			console.log(packet.data);
			onevent.call(this, packet); // original call
		};

		return new Promise((res, rej) => {
			socket.once("connect", res);
			socket.once("connect_error", rej);
		});
	}

	onConnect() {
		this.gateway.emit("SUBSCRIBE_BOT", this.state.custombot.id);
		if (this.state.guild && this.state.guild.selected) {
			this.gateway.emit("SUBSCRIBE_GUILD", this.state.guild.id);
		}
	}

	getGuild(id) {
		return this.state.guilds.find((x) => x.id === id);
	}

	onGuild(guild) {
		var server = this.getGuild(guild.id);
		if (!server) return;
		guild = { ...server, ...guild };
		store.dispatch({ type: "UPDATE_GUILD", payload: guild });
	}

	async getUser() {
		var user = await this.request.get("/user/discord");

		store.dispatch({ type: "LOGIN", payload: user });
		return user;
	}

	async getBots() {
		var { bots } = await this.request.get("/user/bots");

		store.dispatch({ type: "SET_CUSTOMBOTS", payload: bots });

		return bots;
	}

	async getGuilds() {
		var guilds = await this.request.get("/user/guilds");

		guilds = guilds
			.map((x) => {
				x.icon = x.icon && `https://cdn.discordapp.com/icons/${x.id}/${x.icon}.png?size=256`;
				return x;
			})
			.sort((a, b) => {
				if (!!(a.permissions & (1 << 3))) return -1;
				if (!!(b.permissions & (1 << 3))) return 1;
				return 0;
			});

		try {
			guilds = await this.getAddedGuilds(guilds);
		} catch (error) {
			console.error(error);
		}

		store.dispatch({ type: "SET_GUILDS", payload: guilds });
		if (this.state.guild && this.state.guild.id) {
			var guild = guilds.find((x) => x.id === this.state.guild.id);
			if (guild) store.dispatch({ type: "SET_GUILD", payload: guild });
		}
		return guilds;
	}

	async getAddedGuilds(guilds, doNotDispatch) {
		if (!guilds) guilds = this.state.guilds;
		var checkGuilds = guilds.filter((x) => x.permissions & (1 << 3)).map((x) => x.id);
		checkGuilds = await this.request.post("/bot/guilds", { guilds: checkGuilds });

		checkGuilds.guilds.forEach((check) => {
			var guild = guilds.findIndex((x) => x.id === check.id);

			if (!guild) guilds[guild].added = false;
			else guilds[guild] = { ...check, ...guilds[guild] };
		});

		guilds = guilds.sort((a, b) => {
			if (a.added) return -1;
			if (b.added) return 1;
			return 0;
		});

		if (!doNotDispatch) store.dispatch({ type: "SET_GUILDS", payload: guilds });

		return guilds;
	}

	sortGuilds(guilds) {
		if (!guilds) guilds = this.state.guilds;
		return guilds
			.sort((a, b) => {
				if (!!(a.permissions & (1 << 3))) return -1;
				if (!!(b.permissions & (1 << 3))) return 1;
				return 0;
			})
			.sort((a, b) => {
				if (a.added) return -1;
				if (b.added) return 1;
				return 0;
			});
	}

	async getDocs() {
		var docs = await this.request.get("/docs");

		return docs;
	}
}

var api = new API();
window.api = api;

export default api;
