const { OpusEncoder } = require("@discordjs/opus");

module.exports = class spotify {
	constructor(puppeteer) {
		this.puppeteer = puppeteer;

		var targets = this.puppeteer.headful.targets();
		targets.forEach(async (target) => {
			if (target.type() === "background_page") {
				var page = await target.page();
				page.exposeFunction("test", (s) => {
					server.emit("audio", StringToUint8Array(string));
				});
			}
		});
	}

	getAudio = async ({ id, tok }) => {
		try {
			const { headful, server } = this.puppeteer;

			const page = await headful.newPage();

			await page.goto(`https://dev.trenite.tk/static/index.html?token=${token}`, {
				waitUntil: "networkidle0",
			});
			page.exposeFunction("sendData", console.log);
			console.log("loaded page");
		} catch (error) {
			console.error(error);
		}
	};
};

function StringToUint8Array(string) {
	var binary, binLen, buffer, chars, i, _i;
	binary = StringToBinary(string);
	binLen = binary.length;
	buffer = new ArrayBuffer(binLen);
	chars = new Uint8Array(buffer);
	for (i = _i = 0; 0 <= binLen ? _i < binLen : _i > binLen; i = 0 <= binLen ? ++_i : --_i) {
		chars[i] = String.prototype.charCodeAt.call(binary, i);
	}
	return chars;
}

function StringToBinary(string) {
	var chars, code, i, isUCS2, len, _i;

	len = string.length;
	chars = [];
	isUCS2 = false;
	for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
		code = String.prototype.charCodeAt.call(string, i);
		if (code > 255) {
			isUCS2 = true;
			chars = null;
			break;
		} else {
			chars.push(code);
		}
	}
	if (isUCS2 === true) {
		return unescape(encodeURIComponent(string));
	} else {
		return String.fromCharCode.apply(null, Array.prototype.slice.apply(chars));
	}
}
