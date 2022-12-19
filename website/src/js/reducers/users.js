export function users(state = [], action) {
	switch (action.type) {
		case "ADD_USER":
			return [...state, action.payload];
		case "REMOVE_USER":
			var newUsers = [...state].filter((x) => x.id !== action.payload);
			return newUsers;
		default:
			return state;
	}
}
