const { createCanvas } = require("canvas");
const fs = require("fs");
var fontsize = 50;
var width = 1100;
const GIFEncoder = require("gifencoder");
const pngFileStream = require("png-file-stream");
const canvas = createCanvas(width, fontsize);
const ctx = canvas.getContext("2d");
const encoder = new GIFEncoder(width, fontsize);
encoder.createReadStream().pipe(fs.createWriteStream(__dirname + "/myanimated.gif"));

encoder.start();
encoder.setRepeat(-1); // 0 for repeat, -1 for no-repeat
encoder.setDelay(1000); // frame delay in ms
encoder.setQuality(10); // image quality. 10 is default.

ctx.lineCap = "round";
ctx.font = fontsize + "px Arial";

var wait = [];

for (var i = 0; i <= 100; i++) {
	ctx.clearRect(0, 0, 1200, fontsize);
	ctx.fillStyle = "grey";
	ctx.fillRect(50, 0, i * 10, fontsize);
	ctx.fillStyle = "white";
	ctx.fillText(getTimestamp(i), 0, fontsize - 1);
	ctx.fillText(getTimestamp(100), 1050, fontsize - 1);
	encoder.addFrame(ctx);
}

encoder.finish();

function getTimestamp(seconds) {
	return new Date(1000 * seconds).toGMTString().slice(-12, -4);
}
