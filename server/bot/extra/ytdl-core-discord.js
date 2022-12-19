const ytdl = require("ytdl-core");
const prism = require("prism-media");
const { infos } = require("../../../config.json");

var ytdlOptions = {
	requestOptions: {
		headers: {
			cookie: infos.youtube,
		},
	},
};
global.ytdlOptions = ytdlOptions;

function filter(format) {
	return format.codecs === "opus" && format.container === "webm" && format.mimeType.includes("audio");
}

/**
 * Tries to find the highest bitrate audio-only format. Failing that, will use any available audio format.
 * @private
 * @param {Object[]} formats The formats to select from
 */
function nextBestFormat(formats) {
	formats = formats.filter((format) => format.audioBitrate).sort((a, b) => b.audioBitrate - a.audioBitrate);
	return formats.find((format) => !format.bitrate) || formats[0];
}

function download(url, options = {}) {
	return new Promise(async (resolve, reject) => {
		try {
			var info = await ytdl.getInfo(url, ytdlOptions);
			// Prefer opus
			const format = info.formats.find(filter);
			const canDemux = format && info.lengthSeconds != 0;
			if (canDemux) options = { ...options, filter };
			else if (info.lengthSeconds != 0) options = { ...options };
			if (canDemux) {
				const demuxer = new prism.opus.WebmDemuxer();
				const download = ytdl.downloadFromInfo(info, {
					...ytdlOptions,
					...options,
					highWaterMark: 1024 * 1024 * 8, // 8 megabytes
				});
				download.pipe(demuxer);

				var toReturn = {
					demuxer,
					download,
					length: info.lengthSeconds,
				};
				return resolve(toReturn);
			} else {
				var toReturn = {
					demuxer: ytdl(url, { ...options, ...ytdlOptions }),
					download: false,
				};
				return resolve(toReturn);
			}
		} catch (error) {
			console.error(error);
			reject(error);
		}
	});
}

module.exports = Object.assign(download, ytdl);
