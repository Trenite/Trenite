const apiKey = "b6531f10-4af5-47fb-9801-321ce9f4429f";
const api = "https://fnbr.co/api/shop?";
const Canvas = require("canvas");
const FortniteClient = require("fortnite");
const fortnite = new FortniteClient(apiKey);
const commando = require("discord.js-commando");
const Discord = require("discord.js");
const fs = require("fs");

var images = {
	types: {},
};
(async () => {
	var path = __dirname + "/../../ressources/fortnite/types/";

	fs.readdirSync(path).forEach(async (type) => {
		images.types[type.replace(".png", "")] = await Canvas.loadImage(path + type);
	});
	images.back = await Canvas.loadImage(path + "../back.png");
	images.logo = await Canvas.loadImage(path + "../logo.png");
	images.vbucks = await Canvas.loadImage(path + "../vbucks.png");
	images.melticlogo = await Canvas.loadImage(path + "../trenitelogo.png");
})();

module.exports = class ShopCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "fn-shop",
			memberName: "fn-shop",
			aliases: ["fortnite-shop", "fnshop", "fortniteshop"],
			group: "fortnite",
			description: "Sends the current Fortnite item shop",
			examples: [
				`shop -> sends the current Fortnite shop
				shop #channel -> automatically sends a the new Fortnite shop
				shop disable -> disables the automatic sending of the new Fortnite shop`,
			],
			clientPermissions: ["SEND_MESSAGES"],
			args: [
				{
					key: "channel",
					default: "none",
					prompt: "In what the channel should the fortnite shop be send?\nEnter disabled for none",
					type: "text-channel",
					validate: (text, msg) => {
						if (text.includes("disable")) {
							return true;
						} else if (msg.client.registry.types.get("text-channel").parse(text, msg)) {
							return true;
						}

						return false;
					},
				},
			],
		});
		this.client.on("providerReady", () => {
			this.generateDailyShop();
			var interval = this.client.setInterval(this.generateDailyShop.bind(this), 60 * 1000 * 10);
		});
		this.shop = __dirname + "/../../ressources/fortnite/shop/";
	}

	async generateDailyShop() {
		try {
			var shop = await fortnite.store();
			try {
				var shopText = fs.readFileSync(this.shop + "shop.json", {
					encoding: "utf-8",
				});
			} catch (error) {
				var shopText = "{}";
			}
if(!shop) return;
if(shop.length === 0) return;
			var equal = shopText === JSON.stringify(shop);

			if (!equal) {
				fs.writeFileSync(this.shop + "shop.json", JSON.stringify(shop), {
					encoding: "utf-8",
				});
				var canvas = await this.generateShop(shop);

				fs.writeFileSync(this.shop + "shop.jpg", canvas.toBuffer(), {
					encoding: "binary",
				});

				this.client.guilds.cache.forEach(async (guild) => {
					var shopchannel = await this.client.provider.get(guild, "fnshop");
					if (!shopchannel) return;
					shopchannel = await this.client.channels.resolve(shopchannel);
					const file = await this.getShop();
					const attachment = new Discord.MessageAttachment(file, "shop.jpg");
					var datum = new Date();
					datum = datum.getDate() + "." + (datum.getMonth() + 1) + "." + datum.getFullYear();
					datum = new Date().toDateString();
					shopchannel.send({
						title: "Fortnite Shop of " + datum,
						embed: {
							image: {
								url: "attachment://shop.jpg",
							},
						},
						files: [attachment],
					});
				});
			} else {
				// Shop ist gleich
			}
		} catch (error) {
			console.error(error);
		}
	}

	async generateShop(shop) {
		shop = shop
			.map((x) => {
				var newRarity = x.rarity;
				switch (x.rarity.toLowerCase()) {
					case "handmade":
						newRarity = "uncommon";
						break;
					case "sturdy":
						newRarity = "rare";
						break;
					case "quality":
						newRarity = "epic";
						break;
					case "fine":
						newRarity = "legendary";
						break;
					case "transcendent":
						newRarity = "marvel";
						break;
				}
				x.rarity = newRarity;
				return x;
			})
			.sort((a, b) => {
				function getR(s) {
					switch (s.toLowerCase()) {
						case "legendary":
							return -2;
						case "starwars":
							return -1;
						case "marvel":
							return 0;
						case "epic":
							return 1;
						case "rare":
							return 2;
						case "uncommon":
							return 3;
						case "common":
							return 4;
						case "icon":
							return 5;
					}
				}
				return getR(a.rarity) - getR(b.rarity);
			});
		const specialWeekly = shop.filter(
			(x) => x.category === "BRSpecialFeatured" || x.category === "BRWeeklyStorefront"
		);
		const daily = shop.filter((x) => x.category === "BRDailyStorefront" || x.category === "BRSpecialDaily");
		var colors = {
			epic: "#e95eff",
			rare: "#36d1ff",
			uncommon: "#86e239",
			common: "#7b7b7b",
			legendary: "#e88d4a",
			marvel: "#c53334",
			mythic: "#fce959",
			starwars: "#0e0e0e",
			icon: "#00000000",
		};

		var width = 1920;
		var height = 1080;

		var cols = 3;
		var rows = Math.ceil(specialWeekly.length / cols);
		var imgWidth = 180;
		var imgHeight = imgWidth;
		var space = 1.2;
		var ySpace = 200;
		var xSpace = 100;
		var rectSpace = 10;
		var arr = specialWeekly;
		var max = Math.max(daily.length, specialWeekly.length);

		if (max > 12) {
			height += Math.ceil((max - 12) / 3) * ySpace;
		}

		const canvas = Canvas.createCanvas(width, height);
		const ctx = canvas.getContext("2d");

		ctx.drawImage(images.back, 0, 0, width, height);

		var logoWH = 250;
		var logoWidth = width / 2 - logoWH / 2;
		var logoHeight = height / 2 - logoWH / 2;

		ctx.drawImage(images.melticlogo, logoWidth, logoHeight, logoWH, logoWH);

		ctx.font = '70px "Burbank Big Condensed Black"';
		ctx.fillStyle = "white";
		ctx.fillText("FEATURED", 280, 150);
		ctx.fillText("DAILY", 1450, 150);
		//https://cdn.discordapp.com/attachments/683027288283021388/715508769987231804/logoCircle1024.png

		var fnWidth = images.logo.width / 1.5;
		var fnHeight = images.logo.height / 1.5;

		ctx.drawImage(images.logo, width / 2 - fnWidth / 2, 50, fnWidth, fnHeight);

		for (var test = 0; test < 2; test++) {
			if (test === 1) {
				xSpace = 1200;
				rows = Math.ceil(daily.length / cols);
				arr = daily;
			}
			for (var row = 0; row < rows; row++) {
				for (var col = 0; col < cols; col++) {
					var i = cols * row + col;
					if (i < arr.length) {
						var im = arr[i];
						var typ = im.rarity.toLowerCase();
						var type = images.types[typ];
						if (!type) {
							console.error("unkown fn shop type:" + typ);
							break;
						}
						var x = xSpace + col * imgWidth * space;
						var y = ySpace + row * imgHeight * space;

						ctx.drawImage(type, x, y, imgWidth, imgHeight);

						try {
							var img = await Canvas.loadImage(im.image);

							ctx.drawImage(
								img,
								x + rectSpace / 2,
								y + rectSpace / 2,
								imgWidth - rectSpace,
								imgHeight - rectSpace
							);
						} catch (error) {
							if (im.image !== "unknown") {
								console.error("img not defined: ", im.image);
							}
						}

						var descHeight = imgHeight / 3;
						ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
						ctx.fillRect(x, y + imgHeight - descHeight, imgWidth, descHeight);

						ctx.strokeStyle = colors[typ];
						ctx.lineWidth = 5;
						ctx.strokeRect(x, y, imgHeight, imgWidth);
						ctx.fillStyle = "white";
						ctx.textAlign = "center";
						ctx.font = '27px "Burbank Big Condensed Black"';
						ctx.fillText(im.name, x + imgWidth / 2, y + imgHeight - imgHeight / 5);
						ctx.font = '20px "Burbank Big Condensed Black"';
						y = y + imgHeight - imgHeight / 15;
						x = x + imgWidth / 2;
						ctx.fillText(im.vbucks, x, y);
						ctx.drawImage(
							images.vbucks,
							x - imgWidth / 4,
							y - imgHeight / 12,
							imgWidth / 10,
							imgHeight / 10
						);
					}
				}
			}
		}

		return canvas;
	}

	getShop() {
		try {
			var file = fs.readFileSync(this.shop + "shop.jpg", { encoding: null });
			return file;
		} catch (error) {}
	}

	async run(msg, args) {
		var { client, guild, channel } = msg;
		var channelArgs = args.channel;

		const attachment = new Discord.MessageAttachment(this.getShop(), "shop.jpg");
		var datum = new Date().toDateString();

		msg.reply({
			title: "Fortnite Shop of " + datum,
			embed: {
				image: {
					url: "attachment://shop.jpg",
				},
			},
			files: [attachment],
		});
		if (channelArgs !== "disabled" && channelArgs !== "none" && channelArgs) {
			const member = guild.members.cache.find((user1) => user1.id === msg.author.id);
			if (!member.permissions.has("MANAGE_GUILD"))
				return msg.reply(
					"The ``fortnite-shop`` command requires you to have the " + `"manage server"` + `permission.`
				);
			const fnchannel = await this.client.channels.resolve(channelArgs);
			client.provider.set(guild, "fnshop", fnchannel.id);
			msg.reply("Fortnite Shop Channel set to " + fnchannel);

			fnchannel.send("This is now the fortnite shop channel", {
				title: "Fortnite Shop",
			});
		} else {
			if (channelArgs === "none") return;
			if (!member.permissions.has("MANAGE_GUILD"))
				return msg.reply(
					"The ``fortnite-shop`` command requires you to have the " + `"manage server"` + `permission.`
				);
			const fnchannel = await this.client.channels.resolve(channelArgs);
			msg.reply("Fortnite Shop Channel disabled");
			var channeldb = await client.provider.get(guild, "fnshop");
			const channel1 = client.channels.resolve(channeldb);
			channel1.send("This is not longer the fortnite shopchannel", {
				title: "Fortnite Shop",
			});
			client.provider.remove(guild, "fnshop");
		}
	}
};
