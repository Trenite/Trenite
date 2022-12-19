export function user(state = { loggedin: false }, action) {
	switch (action.type) {
		case "LOGIN":
			return { ...state, ...action.payload, loggedin: true };
		case "SET_CREDENTIALS":
			return { ...state, ...action.payload };
		case "LOGOUT":
			return { loggedin: false };
		default:
			return state;
	}
}
