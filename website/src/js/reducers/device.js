export function device(state = { desktop: true, mobile: false }, action) {
	switch (action.type) {
		case "DEVICE":
			if (action.payload) return { desktop: false, mobile: true };
			return { desktop: true, mobile: false };
		default:
			return state;
	}
}
