export function docs(state = [], action) {
	switch (action.type) {
		case "SET_DOCS":
			return [...action.payload];
		default:
			return state;
	}
}
