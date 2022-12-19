export function route(
	state = {
		query: {},
		params: {},
		url: "/",
		path: "/",
		route: { path: "/", component: { compare: null, displayName: "Connect(Home)" } },
	},
	action
) {
	switch (action.type) {
		case "CHANGE_ROUTE":
			return { ...action.payload };
		default:
			return state;
	}
}
