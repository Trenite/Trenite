export function guilds(state = [], action) {
	switch (action.type) {
		case "ADD_GUILDS":
			return [...state, ...action.payload];
		case "ADD_GUILD":
			return [...state, action.payload];
		case "UPDATE_GUILD":
			var newGuilds = [...state];
			var guildIndex = newGuilds.findIndex((x) => x === action.payload.id);
			if (guildIndex === -1) return newGuilds;
			newGuilds[guildIndex] = action.payload;
			return window.api.sortGuilds(newGuilds);
		case "SET_GUILDS":
			return [...action.payload];
		case "REMOVE_GUILDS":
			return [...state.filter((guild) => !action.payload.find((payload) => payload.id === guild.id))];
		case "REMOVE_GUILD":
			return [...state].filter((x) => x.id !== action.payload.id);
		case "LOGOUT":
		case "CLEAR_GUILDS":
			return [];
		default:
			return state;
	}
}
