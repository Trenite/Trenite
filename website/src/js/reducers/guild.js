export function guild(state = { selected: false }, action) {
	switch (action.type) {
		case "SET_GUILD":
			return { ...action.payload, selected: true };
		case "UNSET_GUILD":
			return { selected: false };
		default:
			return state;
	}
}
