import store from "./store";
import api from "./api";

class Client {
	constructor() {
		this.custombot = api.state.custombot.id;
		this.guild = api.state.guild.id;
		store.subscribe(() => {
			if (api.state.custombot.id !== this.custombot) {
				this.onBotChange();
				this.custombot = api.state.custombot.id;
			}
			if (api.state.guild.id !== this.guild) {
				this.onGuildChange();
				this.guild = api.state.guild.id;
			}
		});
	}

	async init() {
		var docs = await api.getDocs();
		store.dispatch({ type: "SET_DOCS", payload: docs });

		var loggedin = await api.login();
		if (loggedin) {
			api.getUser().catch((e) => {});
			api.connect().catch((e) => {});
			api.getBots().catch((e) => {});
			api.getGuilds().catch((e) => {});
		}
	}

	onBotChange() {
		api.gateway.emit("UNSUBSCRIBE_BOT", this.custombot);
		api.gateway.emit("SUBSCRIBE_BOT", api.state.custombot.id);
		api.getAddedGuilds();
	}

	onGuildChange() {
		api.gateway.emit("UNSUBSCRIBE_GUILD", this.custombot);
		api.gateway.emit("SUBSCRIBE_GUILD", api.state.custombot.id);
	}
}

export default new Client();
