import HomePage from "../pages/home.jsx";

function asyncPage(file) {
	return async (routeTo, routeFrom, resolve, reject) => {
		import(`../pages/${file}`).then((rc) => {
			resolve({ component: rc.default });
		});
	};
}

var routes = [
	{
		path: "/",
		component: HomePage,
	},
	{
		path: "/guild/:id/:category/:name",
		async: async (routeTo, routeFrom, resolve, reject) => {
			var { category, name } = routeTo.params;
			import(`../pages/guild/commands/${category}/${name}/${name}.jsx`).then((rc) => {
				resolve({ component: rc.default });
			});
		},
	},
	{
		path: "/docs/:category/:name",
		async: asyncPage("docs/commandsSite.jsx"),
	},
	{
		path: "/guild/:id",
		async: asyncPage("guild/guild.jsx"),
	},
	{
		path: "/oauth2/",
		async: asyncPage("oauth2/oauth2.jsx"),
	},
	{
		path: "/settings",
		async: asyncPage("settings.jsx"),
	},
	{
		path: "/premium",
		async: asyncPage("premium/premium.jsx"),
	},
	{
		path: "/supersecretopggvotepage",
		async: asyncPage("autovote.jsx"),
	},
	{
		path: "/oauth2/:provider",
		async: asyncPage("oauth2/provider/provider.jsx"),
	},
	{
		path: "(.*)",
		async: asyncPage("404.jsx"),
	},
];

export default routes;
