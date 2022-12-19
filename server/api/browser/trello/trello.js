module.exports = class Trello {
	constructor(puppeteer) {
		this.puppeteer = puppeteer;
	}

	getImage = async ({ id, token, card }) => {
		try {
			const { server, browser } = this.puppeteer;
			const key = server.config.trello.key;
			var page = await browser.newPage();
			await page.emulate({
				viewport: { width: 800, height: 600, deviceScaleFactor: 1, isMobile: false },
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36",
			});
			await page.evaluateOnNewDocument(
				({ id, key, token, card }) => {
					document.addEventListener("DOMContentLoaded", function () {
						return loadBoard({
							id,
							key,
							token,
							card,
						});
					});
				},
				{ id, key, token, card }
			);
			await page.goto(`file://${__dirname}/trello.html`, { waitUntil: "networkidle0" });
			await page.evaluate(() => {
				document
					.querySelectorAll(".card")
					.forEach((card) => (card.shadowRoot.querySelector("a").style.fontSize = "18px"));
			});
			return await page.screenshot({ fullPage: true, omitBackground: false, type: "png" });
		} catch (error) {
			console.error(error);
			return Buffer.from([]);
		}
	};
};
