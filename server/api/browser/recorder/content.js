var button = document.createElement("button");
button.onclick = () => {
	chrome.runtime.sendMessage({ type: "capture" });
};
button.innerHTML = "CAPTURE";
document.body.appendChild(button);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	console.log(request, sender);
});
