function capture() {
	chrome.tabCapture.capture({ audio: true }, (stream) => {
		console.log(stream);
		if (!stream) return;

		var recorder = new MediaRecorder(stream, {
			mimeType: "audio/webm",
			audioBitsPerSecond: 128000,
			audioBitrateMode: "cbr",
		});
		// cbr: Encode at a constant bitrate.
		// vbr: Encode using a variable bitrate, allowing more space to be used for complex signals and less space for less complex signals.

		recorder.ondataavailable = (blob) => {
			var reader = new FileReader();
			reader.addEventListener("loadend", function () {
				// console.log("data:", reader.result);
				test(reader.result);

				// reader.result beinhaltet den Inhalt des Blobs
			});
			reader.readAsBinaryString(blob.data);
		};

		recorder.start(500);

		let audio = new Audio();
		audio.srcObject = stream;
		audio.play();
	});
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	console.log(request, sender);
	if (request.type === "capture") {
		capture();
	}
});
