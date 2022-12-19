export function custombot(
	state = {
		id: "689577516150816866",
		owner: [
			"689576183884415035",
			"311129357362135041",
			"417699816836169728",
			"495517815055450112",
			"433597946764722179",
			"390810485244821505",
		],
		name: "Trenite",
		logo: "https://cdn.discordapp.com/avatars/690165752950816772/9ddd9f25f4ba6e5a28a9453224ed0cab.png?size=256",
	},
	action
) {
	switch (action.type) {
		case "SELECT_CUSTOMBOT":
			return { ...action.payload };
		default:
			return state;
	}
}
