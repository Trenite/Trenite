export function custombots(state = [], action) {
	switch (action.type) {
		case "ADD_CUSTOMBOT":
			return [...state, action.payload];
		case "ADD_CUSTOMBOTS":
			return [...state, ...action.payload];
		case "REMOVE_CUSTOMBOT":
			return state.filter((x) => x.id !== action.payload.id);
		case "REMOVE_CUSTOMBOTS":
			return state.filter((x) => !action.payload.find((bot) => bot.id === x.id));
		case "SET_CUSTOMBOTS":
			return [...action.payload];
		default:
			return state;
	}
}
