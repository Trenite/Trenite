const fs = require("fs");
var { exec } = require("child_process");
var GitHub = require("github-api");
var config = require("../config.json");
const { makeBadge, ValidationError } = require("badge-maker");
const util = require("util");
exec = util.promisify(exec);
const packageFile = __dirname + "/package.json";
var package = fs.readFileSync(packageFile);
var stdout = "";
var gh = new GitHub({ token: config.infos.github.token });

(async () => {
	try {
		package = JSON.parse(package);
		const version = package.version;

		// const versionNumber = parseFloat(version.split(".").reduce((total, item) => (total += item))) + 1;
		// dont increase the number, set the number of commits:

		const versionNumber = parseInt((await exec("git rev-list --count master")).stdout) + 1;
		const lastTwoDigits = versionNumber
			.toString()
			.slice(-2)
			.split("")
			.map((x) => parseInt(x))
			.join(".");
		const thirdNumber = versionNumber.toString().slice(0, -2);
		const newVersion = `${thirdNumber}.${lastTwoDigits}`;

		package.version = newVersion;
		var HOME = process.env.HOME || "/root/";

		stdout = await exec("git pull", { env: { HOME } });
		fs.writeFileSync(packageFile, JSON.stringify(package, null, 4));

		var repo = await gh.getRepo("Flam3rboy", "Trenite");
		var details = await repo.getContributors();
		genBadge({ label: "Version", message: newVersion, color: "blue" });
		genBadge({ label: "Collaborators", message: "" + details.data.length, color: "blue" });

		stdout = await exec(`cd ${__dirname}/.. && git_stats generate -o stats/`);
		// stdout = await exec(`cd ${__dirname}/../stats/ && rename 's/html/md/g' *`);
		// stdout = await exec(`cd ${__dirname}/../stats/ && sed -i 's/.html/.md/g' *`);

		stdout = await exec("git add .");
		stdout = await exec(`git commit -m "update version"`);
		stdout = await exec("git push", { env: { HOME } });
	} catch (error) {
		console.error(error, stdout);
		process.exit(1);
	}
})();

function genBadge(params) {
	return fs.writeFileSync(__dirname + "/../docs/badges/" + params.label + ".svg", makeBadge(params));
}
