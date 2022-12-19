const { Command } = require("discord.js-commando");

const { json } = require("body-parser");
const { fstat } = require("fs");
const ms = require("ms");
const fs = require("fs");
/*const puppeteer = require('puppeteer-core');
const { post, get } = require('request-promise');
const { createInterface } = require('readline');
const { readdir, mkdir, writeFile, readFile } = require('fs').promises;
const { join } = require('path');

const makeBool = (text) => text.toLowerCase() === 'y' || text.toLowerCase() === 'yes' || !text;
const wait = (time) => new Promise((res) => setTimeout(res, time));*/
module.exports = class fnBotCommand extends Command {
  constructor(client) {
    super(client, {
      name: "fn-bot", //lowercase
      memberName: "fn-bot", //lowercase
      aliases: [],
      group: "dev", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, setup, stats, util]
      description: "add a fortnite bot",
      examples: [""],

      clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
      devOnly: true,
      // if no args, delete the args object COMPLETLY
      args: [
        {
          key: "email",
          prompt: "email?",
          type: "string",
          time: 1000 * 60 * 5,
        },
        {
          key: "password",
          prompt: "password?",
          type: "string",
          time: 1000 * 60 * 5,
        },
        {
          key: "code",
          prompt: "the exchange code?",
          type: "string",
          time: 1000 * 60 * 5,
        },
      ],
    });
  }
  async startBot(code, fnbots, email, password, msg) {
    const { Client } = require("fnbr");
    this.fnbot = new Client({
      deviceAuthOptions: {
        createNew: true, // TURN THIS TO FALSE AFTER THE DETAILS WERE GENERATED
        deleteExisting: false,
      },
      createPartyOnStart: false,
      auth: {
        exchangeCode: code,
      },
    });
    /*this.fnbot = new Client({
	  //deviceAuthDetails: deviceAuth,
	  deviceAuthOptions: {
		createNew: true, // TURN THIS TO FALSE AFTER THE DETAILS WERE GENERATED
		deleteExisting: false,
	  },
	  createPartyOnStart: false,
	  // email: this.config.epicGames.email,
	  // password: this.config.epicGames.password,
	  exchangeCode: code,
	});*/
    var auth = [];
    this.fnbot.on("deviceauth:created", async (details) => {
      auth = {
        accountId: details.accountId,
        deviceId: details.deviceId,
        secret: details.secret,
      };
      console.log(fnbots);
      fnbots.push({
        verify: false,
        production: true,
        auth: auth,
        email: email,
        password: password,
        used: false,
        id: fnbots.length + 1,
      });
      this.client.provider.set("global", "fn-bots", fnbots);
      console.log(fnbots);
      console.log(auth);
      fs.writeFileSync(__dirname + "/accounts.json", JSON.stringify(fnbots), {
        encoding: "utf-8",
      });
    });
    this.fnbot.login();

    this.fnbot.on("ready", () => {
      console.log("Fortnite Bot online");
      msg.reply(this.fnbot.user.displayName + " online.");
    });
    msg.reply("Now " + fnbots.size + " fn bots");
  }
  async run(msg, args, lang) {
    var { client, author } = msg;
    var { email, password, code } = args;

    var fnbots = this.client.provider.get("global", "fn-bots") || [];
    fnbots = await fs.readFileSync(__dirname + "/accounts.json", {
      encoding: "utf-8",
    });
    fnbots = JSON.parse(fnbots);
    this.startBot(code, fnbots, email, password, msg);
    msg.reply("" + fnbots.length + " fn bots");
  }

  /*
 async consoleQuestion (question, isYN = false) {
  return new Promise((res) => {
	const itf = createInterface(process.stdin, process.stdout);
	itf.question(isYN ? `${question}(yes/no) ` : question, (answer) => {
	  res(isYN ? makeBool(answer) : answer);
	  itf.close();
	});
  });
};


 async useDeviceAuth(deviceAuth) {
  const { access_token } = await post({
	url: 'https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token',
	headers: {
	  'Content-Type': 'application/x-www-form-urlencoded',
	  Authorization: 'basic MzQ0NmNkNzI2OTRjNGE0NDg1ZDgxYjc3YWRiYjIxNDE6OTIwOWQ0YTVlMjVhNDU3ZmI5YjA3NDg5ZDMxM2I0MWE=',
	},
	form: {
	  grant_type: 'device_auth',
	  account_id: deviceAuth.accountId,
	  device_id: deviceAuth.deviceId,
	  secret: deviceAuth.secret,
	},
	json: true,
  });
  return get({
	url: 'https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/exchange',
	headers: {
	  Authorization: `bearer ${access_token}`,
	},
	json: true,
  });
};

async generateDeviceAuth (exchangeCode)  {
  const iosToken = await post({
	url: 'https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token',
	headers: {
	  'Content-Type': 'application/x-www-form-urlencoded',
	  Authorization: 'basic MzQ0NmNkNzI2OTRjNGE0NDg1ZDgxYjc3YWRiYjIxNDE6OTIwOWQ0YTVlMjVhNDU3ZmI5YjA3NDg5ZDMxM2I0MWE=',
	},
	form: {
	  grant_type: 'exchange_code',
	  exchange_code: exchangeCode,
	  includePerms: false,
	},
	json: true,
  });
 startBot(exchangeCode, fnbots, email, password)
};


async create(){
  console.log('Checking for Chrome installation');
  let chromeIsAvailable = true;
  try {
	if (process.platform !== 'win32') throw new Error();
	const chromePath = await readdir(`${process.env['ProgramFiles(x86)']}\\Google\\Chrome\\Application`);
	if (!chromePath.find((f) => f === 'chrome.exe')) throw new Error();
  } catch (e) {
	chromeIsAvailable = false;
  }

  /*let executablePath;
  if (chromeIsAvailable) {
	executablePath = `${process.env['ProgramFiles(x86)']}\\Google\\Chrome\\Application\\chrome.exe`;
	console.log('Chrome is already installed');
  } else {
	const browserFetcher = puppeteer.createBrowserFetcher({
	  path: join(savingFolder, 'ecg'),
	});
	console.log(await browserFetcher.canDownload('666595') ? 'Downloading Chrome. This may take a while!' : 'Chrome is already installed');
	const downloadInfo = await browserFetcher.download('666595');
	executablePath = downloadInfo.executablePath;
  }
  console.log('Starting chrome...');
  const browser = await puppeteer.launch({
	executablePath,
	headless: false,
	devtools: false,
	defaultViewport: {
	  width: 500, height: 800,
	},
	args: ['--window-size=500,800', '--lang=en-US'],
  });

  console.log('Chrome started! Please log in');

  const page = await browser.pages().then((p) => p[0]);
 
  await page.goto("https://www.epicgames.com/id/register/epic");

  await page.waitType("#name", "Trenite");
  await page.waitType("#lastName", "Bot");
  await page.waitType("#displayName", this.username);
  await page.waitType("#email", this.email);
  await page.waitType("#password", this.password);
  await page.waitClick("#termsOfService");
  await page.waitClick("#btn-submit");
  await page.waitFor(5000);
  await page.mouse.click(150, 200);

  var mail = await this.server.email.waitForMail(
	(mail) => mail.to === this.email && mail.from === "help@acct.epicgames.com"
  );
  console.log(mail);
  var code = mail.html.match(/\n\d{6}\n/g)[0].replace(/\n/g, "");
  await page.waitType("#code", code);
  await (await page.waitForSelector('#login-with-epic')).click();
  await page.waitForRequest((req) => req.url() === 'https://www.epicgames.com/account/personal' && req.method() === 'GET', {
	timeout: 120000000,
  });

  const oldXsrfToken = (await page.cookies()).find((c) => c.name === 'XSRF-TOKEN').value;
  page.once('request', (req) => {
	req.continue({
	  method: 'GET',
	  headers: {
		...req.headers,
		'X-XSRF-TOKEN': oldXsrfToken,
	  },
	});
  });
  await page.setRequestInterception(true);
  await page.goto('https://www.epicgames.com/id/api/authenticate');
  await page.setRequestInterception(false);

  page.once('request', (req) => {
	req.continue({
	  method: 'GET',
	  headers: {
		...req.headers,
		'X-XSRF-TOKEN': oldXsrfToken,
	  },
	});
  });
  await page.setRequestInterception(true);
  try {
	await page.goto('https://www.epicgames.com/id/api/csrf');
  } catch (e) {}
  await page.setRequestInterception(false);

  const xsrfToken = (await page.cookies()).find((c) => c.name === 'XSRF-TOKEN').value;
  page.once('request', (req) => {
	req.continue({
	  method: 'POST',
	  headers: {
		...req.headers,
		'X-XSRF-TOKEN': xsrfToken,
	  },
	});
  });
  await page.setRequestInterception(true);
  const pageJSON = await (await page.goto('https://www.epicgames.com/id/api/exchange/generate')).json();
  await browser.close();

  const deviceAuthCredentials = await generateDeviceAuth(pageJSON.code);
  await writeFile(join(savingFolder, 'ecg') + '/deviceauth', JSON.stringify(deviceAuthCredentials));

  
  console.log(`Your exchange code is: ${deviceAuthCredentials}`);
  console.log('This terminal will be closed in 15 seconds');
  await wait(15000);
}*/
};
