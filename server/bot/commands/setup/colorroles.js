const Commando = require("discord.js-commando");
var parsecolor = require("color-parse");
const Color = require("color-converter").default;

module.exports = class ColorRolesCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: "colorroles", //lowercase
			memberName: "colorroles", //lowercase
			aliases: [
				"colur-roles",
				"colur-role",
				"color-role",
				"colour-role",
				"colour-roles",
				"rainbow-roles",
				"rainbow-role",
			],
			autoAliases: true,
			group: "setup", // [dev, fortnite, fun, mod, audio, util]
			description: "Automatically color the roles",
			examples: ["colorrole @Admin @Member rainbow"],
			clientPermissions: ["MANAGE_ROLES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			userPermissions: ["MANAGE_ROLES"],
			guildOnly: true,
			// if no args, delete the object COMPLETLY
			args: [
				{
					key: "start",
					prompt: `Select the first role.\nIf a rolename has spaces, enter it with quotes: "role name with spaces"`,
					type: "role",
					wait: 120,
				},
				{
					key: "end",
					prompt: "Select the last role",
					type: "role",
					wait: 120,
				},
				{
					key: "color",
					prompt: `[**Select the color:**](https://www.google.com/search?q=color+picker)
					You've two options:
					- Select only one color and the bot will automatically generate the last color 
					- Select two colors with spaces between them and the bot will color the roles between the color range (firstcolor lastcolor)

					**Available Formats**
					#00ff00 (HEX)
					hsl(12,10%,50%) (HSL No Spaces)
					rgb(0,255,0) (RGB No spaces)
					rainbow
					blue
					red
					green
					cyan
					yellow
					orange
					pink
					`,
					type: "string",
					wait: 120,
				},
			],
		});
	}

	formatRoles(roles) {
		return roles.map((x) => `${x}`).join("\n");
	}

	takeColor(color) {
		if (color === "rainbow") return Color.fromRGB.apply(null, [255, 0, 0]);

		color = parsecolor(color);
		if (!color) throw `Sorry we couldn't find that color`;

		switch (color.space) {
			case "rgb":
				color = Color.fromRGB.apply(null, color.values);
				break;
			case "hsl":
				color = Color.fromHSL.apply(null, color.values);
				break;
			default:
				throw `Sorry we don't support that color`;
		}

		return color;
	}

	async run(msg, args) {
		const { client, guild } = msg;
		const { start, end, color } = args;
		const colors = color.split(" ");

		if (colors.length > 2) throw "Sorry only two colors are supported";
		var startcolor = this.takeColor(colors[0]);
		var endcolor;

		if (colors.length > 1) {
			endcolor = this.takeColor(colors[1]);
		} else {
			endcolor = Color.fromColor(startcolor).rotate(50);
		}

		var roles = guild.roles.cache.array().sort((a, b) => b.position - a.position);

		var startRole = roles.findIndex((r) => r === start);
		var endRole = roles.findIndex((r) => r === end);

		if (startRole > endRole) {
			var temp = startRole;
			startRole = endRole;
			endRole = temp;
		}

		var botRolePosition = roles.findIndex((r) => r === guild.me.roles.highest);
		if (botRolePosition > startRole) throw `Move my role up, over ${roles[startRole]}`;
		var betweenroles = roles.slice(startRole, endRole + 1);

		var spaceR = endcolor.red - startcolor.red;
		var spaceG = endcolor.green - startcolor.green;
		var spaceB = endcolor.blue - startcolor.blue;
		var stepR = spaceR / betweenroles.length;
		var stepG = spaceG / betweenroles.length;
		var stepB = spaceB / betweenroles.length;

		var send = await msg.reply(
			Commando.createMessage(
				guild,
				`Coloring roles from ${startcolor.toHex()} to ${endcolor.toHex()}\n` + this.formatRoles(betweenroles),
				{
					title: "Colorroles",
					embed: {
						author: {
							name: "Generating",
							icon_url: "https://i.imgur.com/mFalBNg.gif",
						},
					},
				}
			)
		);

		var rainbow = Color.fromColor(Color.fromRGB.apply(null, [255, 0, 0]));
		if (colors[1]) rainbow = this.takeColor(colors[1]);

		await Promise.all(
			betweenroles.map(async (role, i) => {
				var newColor = Color.fromColor(startcolor);
				newColor.red += i * stepR;
				newColor.green += i * stepG;
				newColor.blue += i * stepB;
				if (colors[0] === "rainbow") newColor = rainbow;
				var rgbColor = Object.values(newColor.toRGB());

				if (!rgbColor.some((x) => x !== 0)) {
					rgbColor[0] = 1;
				}

				rainbow.rotate(360 / betweenroles.length);

				return role.setColor(rgbColor);
			})
		);

		send.edit("Finished: \n" + this.formatRoles(betweenroles), { title: "Colorroles" });
	}
};
