const commando = require("discord.js-commando");
const fetch = require("node-fetch");
const morsify = require("morsify");

module.exports = class FunTranslateCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "funtranslate",
			memberName: "funtranslate",
			aliases: [],
			group: "fun",
			description: "Translates to specified language",
			examples: ["`$translate [language]:[message to translate]`"],
			clientPermissions: ["SEND_MESSAGES"],
			args: [
				{
					key: "mode",
					type: "string",
					prompt: `Available Translation modes:
					spongebob
					morse
					decodemorse`,
				},
				{
					key: "input",
					type: "string",
					prompt: "Enter your text:",
					wait: 120,
				},
			],
		});
	}

	// /**
	//  * @param {String} type_of_trans Yoda, Pirate, Morse
	//  * @param {String} content The content to translate
	//  */
	// async fetchTranslation(type_of_trans, content) {
	// 	let base_url = "https://api.funtranslations.com/translate/";
	// 	switch (type_of_trans) {
	// 		// case "pirate":
	// 		// 	base_url = base_url + "pirate.json?text=";
	// 		// 	break;
	// 		// case "yoda":
	// 		// 	base_url = base_url + "yoda.json?text=";
	// 		// 	break;
	// 		default:
	// 			throw "Translation Mode not found";
	// 	}
	// 	let url = base_url + content;
	// 	let re = await fetch(encodeURI(url));
	// 	let json = await re.json();
	// 	return json.contents.translated;
	// }

	/**
	 * @param {String} content Info to be Spongebobed
	 */
	spongeGen(content) {
		content = content.toLowerCase();
		var newString = "";
		let y = 0;
		for (var x of content) {
			y = y + 1;
			if (y % 2) {
				newString += x.toUpperCase();
			} else {
				newString += x;
			}
		}
		return newString;
	}

	/**
	 * @param {String} type_of_trans Yoda, Pirate, Morse, Spongebob
	 * @param {String} content The content to translate
	 */
	async Translation(type_of_trans, content) {
		// let base_url = 'https://api.funtranslations.com/translate/';
		let endey = "";
		switch (type_of_trans) {
			case "spongebob":
				endey = this.spongeGen(content);
				break;
			case "morse":
				endey = morsify.encode(content);
				break;
			case "decodemorse":
				endey = morsify.decode(content);
				break;
			default:
				endey = await this.fetchTranslation();
		}
		let reobj = {
			contents: {
				text: content,
				translated: endey,
				translation: type_of_trans,
			},
		};
		return reobj;
	}

	async run(msg, args) {
		const { client, guild } = msg;
		const { mode, input } = args;
		let req = await this.Translation(mode, input);
		msg.reply({
			title: "Funtranslate " + req.contents.translation,
			embed: {
				fields: [
					{
						name: "Before",
						value: req.contents.text,
					},
					{
						name: "After",
						value: req.contents.translated,
					},
				],
			},
		});
	}
};
