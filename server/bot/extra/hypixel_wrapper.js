/**
hypixel-api wrapper
|
+--> skyblock endpoint
|
+--> general endpoint
|
+--> status enpoint

this wrapper does: 
--> convert username to uuid [requestID] 
--> convert uuid to username [requestName]
--> request skyblock, general and status info and format them [requestStatus], [MainReq], [requestGen]
--> returns new formated object (only important info incuded)


written and developed by 'xnacly'
credit:
github/xnacly

discord:
xnacly#6370
**/



const fetch = require("node-fetch");

const __api_key = "19016de5-df50-44e2-bf6b-3d17681ddafa";//_conf.hypixel.api_key;
const __url = "https://api.hypixel.net/";//_conf.hypixel.url;


/**
 * 
 * @param {String} name Minecraft Username
 * Return uuid for name
 */
async function requestID(name) {
	let result;
	let based_url = `https://api.mojang.com/users/profiles/minecraft/${name}`;
	try {
		result = await fetch(based_url);
		result = await result.json();
	} catch{
		result = false;
	}
	return result;
}


/**
 * 
 * @param {String} uuid Minecraft Uuid
 * Return: name for uuid
 */
async function requestName(uuid) {
	// uuid = uuid.replace(/-/g, "");
	let result;
	let based_url = `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`;
	try {
		result = await fetch(based_url);
		result = await result.text();
		result = JSON.parse(result);
	} catch (e) {
		result = false;
	}
	return result;
}


async function checkKey(key) {
	let result;
	try {
		result = await fetch(__url + "key?key=" + key);
		result = await result.json();
		result = result.record.owner;
	} catch{
		result = false;
	}
	return result;
}


async function minireq(uuid) {
	let name = await requestName(uuid);
	if (!name) return { mcUsername: "", mcUUID: uuid, skinRender: "" };
	skinRender = `https://crafatar.com/renders/head/${name.id}?size=16&overlay`;
	let linkObject = {
		mcUsername: name.name,
		mcUUID: name.id,
		skinRender: skinRender,
	};
	return linkObject;
}


/**
 * 
 * @param {String} string Minecraft Name
 * Return: jsonObject - skyblock endpoint
 */
async function mainReq(string) {
	uuid = await requestID(string);
	let result = await fetch(__url + `skyblock/profiles?key=${__api_key}&uuid=${uuid.id}`);
	result = await result.json();
	if (result.success == false) {
		result = false;
	}
	return result;
}


/**
 * @param {String} name minecraft name
 * Return: array of cute profilenames :)
 */
async function getProfiles(name) {
	let object = await mainReq(name);
	let ohmanarray = [];
	let skills;
	for (const x in object.profiles) {
		try {
			skills = await formatSkyblockSkills(name, object.profiles[x].cute_name);
		} catch (e) {
			skills = false;
		}
		let memberArray = [];
		for (const y in object.profiles[x].members) {
			memberArray.push(y);
		}
		let balance = "Api disabled";
		try {
			balance = Math.round(object.profiles[x].banking.balance).toLocaleString();
		} catch (e) { }
		ohmanarray.push({
			cute_name: object.profiles[x].cute_name,
			members: memberArray.length,
			highestskill: skills ? skills.sort(function (a, b) { return b.xp - a.xp; })[0] : "none",
			balance: balance
		});
	}
	return ohmanarray;
}


/**
 * 
 * @param {String} uuid Minecraft Uuid
 * Return: current Status for the Minecraft account (hypixel)
 */
async function requestStatus(uuid) {
	let result;
	try {
		result = await fetch(__url + `status?key=${__api_key}&uuid=${uuid}`);
		result = await result.json();
	} catch{
		return false;
	}
	if (result.session.online == false) {
		result = "offline";
	} else {
		result = {
			mode: result.session.mode,
			type: result.session.gameType,
		};
	}
	return result;
}



//neat lil helpers
/**
 * @param {number} xp xp to calculate into network LVL
 */
async function calcNetworkLvL(xp) {
	let level;
	let Base = 10000;
	let Growth_per_lvl = 2500;
	let Reverse_Q = -(Base - 0.5 * Growth_per_lvl) / Growth_per_lvl;
	let REVERSE_CONST = Reverse_Q * Reverse_Q;
	let GROWTH_DIVIDES_2 = 2 / Growth_per_lvl;
	let num = 1 + Reverse_Q + Math.sqrt(REVERSE_CONST + GROWTH_DIVIDES_2 * xp);
	level = Math.round(num * 100) / 100;
	return level;
}


/**
 * 
 * @param {string} type [normal, rune] - type of skill
 * @param {number} xp xp to be calculated into LVL 
 */
async function calcSkillLVL(type, xp) {
	xp = Math.round(xp);
	let skillXParray;
	let skillMAX;
	let runeMax = 25;
	let normalMax = 50;
	let runeCraftArray = [0, 50, 150, 275, 435, 635, 885, 1200, 1600, 2100, 2725, 3510, 4510, 5760, 7325, 9325, 11825, 14950, 18950, 23950, 30200, 38050, 47850, 60100, 75400];
	let normalCraftArray = [0, 50, 175, 375, 675, 1175, 1925, 2925, 4425, 6425, 9925, 14925, 22425, 32425, 47425, 67425, 97425, 147425, 222425, 322425, 522425, 822425, 1222425, 1722425, 2322425, 3022425, 3822425, 4722425, 5722425, 6822425, 8022425, 9322425, 10722425, 12222425, 13822425, 15522425, 17322425, 19222425, 21222425, 23322425, 25522425, 27822425, 30222425, 32722425, 35322425, 38072425, 40972425, 44072425, 47472425, 51172425, 55172425];

	switch (type) {
		case "normal":
			skillXParray = normalCraftArray;
			skillMAX = normalMax;
			break;
		case "rune":
			skillXParray = runeCraftArray;
			skillMAX = runeMax;
			break;
	}
	var i;
	for (i = 0; i < skillXParray.length; i++) {//skillXParray
		if (skillXParray[i] >= xp) {
			break;
		}
	}
	let reObject = {
		lvl: (i >= runeMax && type == "rune") ? i : i - 1,
		xp: xp,
		progress: (xp > skillXParray[skillXParray.length - 1]) ? "max lvl" : Math.round(((xp - skillXParray[i - 1]) * 100) / (skillXParray[i] - skillXParray[i - 1])),
		progressXP: (xp > skillXParray[skillXParray.length - 1]) ? "max lvl" : xp - skillXParray[i - 1],
		XPneeded: (xp > skillXParray[skillXParray.length - 1]) ? "max lvl" : skillXParray[i] - skillXParray[i - 1],
	};
	return reObject;
}

function estimatedTimeWastedOnSlayers(tier_1Kills, tier_2Kills, tier_3Kills, tier_4Kills) {
	let costPerKill = [100, 2000, 10000, 50000];
	let slayerArray = [tier_1Kills, tier_2Kills, tier_3Kills, tier_4Kills];
	let money = 0;
	for (let x = 0; x < slayerArray.length; x++) {
		money += Number(slayerArray[x].replace(",", "")) * costPerKill[x];
	}

	//t1
	tier_1Kills = Number(tier_1Kills.replace(",", ""));
	let tier1_m = (tier_1Kills * 100) / 60;
	let tier1_h = tier1_m / 60;
	let tier1_d = tier1_h / 24;
	//t2
	tier_2Kills = Number(tier_2Kills.replace(",", ""));
	let tier2_m = (tier_2Kills * 200) / 60;
	let tier2_h = tier2_m / 60;
	let tier2_d = tier2_h / 24;
	//t3
	tier_3Kills = Number(tier_3Kills.replace(",", ""));
	let tier3_m = (tier_3Kills * 240) / 60;
	let tier3_h = tier3_m / 60;
	let tier3_d = tier3_h / 24;
	//t4
	tier_4Kills = Number(tier_4Kills.replace(",", ""));
	let tier4_m = (tier_4Kills * 300) / 60;
	let tier4_h = tier4_m / 60;
	let tier4_d = tier4_h / 24;

	let m = tier1_m + tier2_m + tier3_m + tier4_m;
	let h = tier1_h + tier2_h + tier3_h + tier4_h;
	let d = tier1_d + tier2_d + tier3_d + tier4_d;
	let obj = {
		mins: m,
		hours: h,
		days: d,
		money: money
	};
	return obj;
}

//requests

/**
 * 
 * @param {String} string Minecraft Name
 * Return: jsonObject - general endpoint
 */
async function requestGen(username) {
	uuid = await requestID(username);
	let result = await fetch(__url + `player?key=${__api_key}&uuid=${uuid.id}`);
	result = await result.json();
	if (result.success == false) {
		result = false;
	}
	return result;
}

async function requestSlayers(username, profileName) {
	let requesty = await mainReq(username);
	let uuid = await requestID(username);
	let profileNuM = 0;
	for (let profiles in requesty.profiles) {
		if (requesty.profiles[profiles].cute_name.toLowerCase() === profileName.toLowerCase()) {
			profileNuM = profiles;
			break;
		}
	}
	let i = requesty.profiles[profileNuM].members[uuid.id].slayer_bosses;
	let LVLarray = [];
	for (let slayers in i) {
		let slayerLVLarray = [];
		for (x in i[slayers].claimed_levels) {
			slayerLVLarray.push(x);
		}
		let lvl = Number(slayerLVLarray[slayerLVLarray.length - 1].split("_")[1]);
		let bonus = {
			rev: [2, 2, 3, 3, 4, 4, 4, 0, 0],
			tara: [1, 1, 1, 1, 2, 2, 0, 0, 0],
			wolf: {
				speed: [1, 0, 1, 0, 0, 0, 0, 0, 0],
				critDamage: [0, 0, 0, 0, 1, 0, 2, 0, 0],
				health: [0, 2, 0, 2, 0, 3, 0, 0, 0]
			}
		};
		let lvlArray = [5, 15, 200, 1000, 5000, 20000, 100000, 400000, 1000000];
		// 1 - 2 - 3 - 4
		let bossKills = {
			tier_1: (i[slayers].boss_kills_tier_1 || "0").toLocaleString(),
			tier_2: (i[slayers].boss_kills_tier_1 || "0").toLocaleString(),
			tier_3: (i[slayers].boss_kills_tier_2 || "0").toLocaleString(),
			tier_4: (i[slayers].boss_kills_tier_3 || "0").toLocaleString(),
		};
		let neededBossKills = {
			tier_1: (lvlArray[lvl] - i[slayers].xp) / 5,
			tier_2: (lvlArray[lvl] - i[slayers].xp) / 10,
			tier_3: (lvlArray[lvl] - i[slayers].xp) / 100,
			tier_4: (lvlArray[lvl] - i[slayers].xp) / 500,
		};
		let bonusStats = {
			health: 0,
			critChance: 0,
			critDamage: 0,
			speed: 0
		};
		let name = slayers;
		switch (name) {
			case "zombie":
				name = "Revenant's";
				for (let i = 0; i < lvl; i++) {
					bonusStats.health += bonus.rev[i];
				}
				break;
			case "spider":
				name = "Tarantula's";
				for (let i = 0; i < lvl; i++) {
					bonusStats.critDamage += bonus.tara[i];
				}
				if (lvl == 7) {
					bonusStats.critChance += 1;
				}
				break;
			case "wolf":
				name = "Sven's";
				for (let i = 0; i < lvl; i++) {
					bonusStats.speed += bonus.wolf.speed[i];
					bonusStats.critDamage += bonus.wolf.critDamage[i];
					bonusStats.health += bonus.wolf.health[i];
				}
				break;
		}
		LVLarray.push({
			name: name,
			lvl: lvl,
			bonusStats: bonusStats,
			progressPerCent: Math.round((i[slayers].xp * 100) / lvlArray[lvl]),
			progress: `${i[slayers].xp ? i[slayers].xp.toLocaleString() : "null"}/${lvlArray[lvl] ? lvlArray[lvl].toLocaleString() : "max"}`,
			bosses: bossKills,
			needBosses: neededBossKills,
			wasted: estimatedTimeWastedOnSlayers(bossKills.tier_1, bossKills.tier_2, bossKills.tier_3, bossKills.tier_4),
		});
	}
	return LVLarray;
};


async function requestSkyblockSkills(username, profileName) {
	let requesty = await mainReq(username);
	let uuid = await requestID(username);
	let skillArray = [];
	let skills = ["experience_skill_runecrafting", "experience_skill_combat", "experience_skill_mining", "experience_skill_alchemy", "experience_skill_farming", "experience_skill_taming", "experience_skill_enchanting", "experience_skill_fishing", "experience_skill_carpentry", "experience_skill_foraging"];
	let profileNuM = 0;
	for (const profiles in requesty.profiles) {
		if (requesty.profiles[profiles].cute_name.toLowerCase() === profileName.toLowerCase()) {
			profileNuM = profiles;
			break;
		}
	}
	for (const x in requesty.profiles[profileNuM].members[uuid.id]) {
		for (const y in skills) {
			if (x === skills[y]) {
				let skillObject = {};
				skillObject[x] = requesty.profiles[profileNuM].members[uuid.id][x];
				skillArray.push(skillObject);
			}
		}
	}
	return skillArray;
}



// format and sort Requests
async function formatRequestSkyblock(username, profileName) {
	let SkyblockObject = [];
	let data = await mainReq(username);
	let slayers = await getFormatedSlayers(username, profileName);
	let skills = await getFormatedSkillsSkyblock(username, profileName);
	if (!data) {
		return false;
	}
	let uuid = await requestID(username);
	if (!uuid) {
		return false;
	}
	let profileNuM;
	for (const profiles in data.profiles) {
		if (data.profiles[profiles].cute_name.toLowerCase() === profileName.toLowerCase()) {
			profileNuM = profiles;
			break;
		}
	}
	memberUUIDarray = [];
	for (const x in data.profiles[profileNuM].members) {
		memberUUIDarray.push(x);
	}
	memberNAMEarray = [];
	for (const x of memberUUIDarray) {
		let user = await requestName(x);
		memberNAMEarray.push(user.name);
	}

	let usernameMember = data.profiles[profileNuM].members[uuid.id];
	let balance;
	try {
		balance = Math.round(data.profiles[profileNuM].banking.balance).toLocaleString();
	} catch (e) {
		balance = "Bank-Api disabled";
	}


	let first_join;
	let last_save;
	try {
		first_join = new Date(usernameMember.first_join).toLocaleString();
		last_save = new Date(usernameMember.last_save).toLocaleString();
	} catch (e) {
		first_join = "Api disabled";
		last_save = "Api disabled";
	}

	let purse;
	try {
		purse = Math.round(usernameMember.coin_purse).toLocaleString();
	} catch (e) {
		purse = "Api disabled";
	}

	let fairys;
	try {
		fairys = usernameMember.fairy_souls_collected;
	} catch (e) {
		fairys = "Api disabled";
	}
	if (!fairys) {
		fairys = 0;
	}
	let baseStats = {
		health: 100,
		defence: 0,
		strength: 0,
		speed: 100,
		damage_increase: 0,
		critChance: 20,
		critDamage: 50,
		mana: 100,
		seaCchance: 20,
		magicFind: 10,
		petLuck: 0,
	};
	let bonusFairy = {
		health: [3, 6, 10, 14, 19, 24, 30, 36, 43, 50, 58, 66, 75, 84, 94, 104, 115, 126, 138, 150, 163, 176, 190, 204, 219, 234, 250, 266, 283, 300, 318, 336, 355, 374, 394, 414, 435, 456],
		defence: [1, 1, 3, 4, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34, 36, 37, 38, 39, 40, 42, 43, 44, 45],
		speed: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0],
	};
	amount = Math.floor(fairys / 5);

	if (amount > bonusFairy.health.length) {
		amount = 38;
	}
	//skills increase:
	for (const x in skills) {
		if (skills[x].name === "Farming" || skills[x].name === "Fishing") {
			let lvl = skills[x].lvl;
			hp = 0;
			if (lvl > 25) {
				baseStats.health += (67 + ((lvl - 25) * 5)); //lvl 25 and above
			} else {
				baseStats.health += (lvl - 19) * 4 + (lvl - 20) * 3 + (lvl - 11) * 2; //lvl 1-25
			}
		}
		if (skills[x].name === "Alchemy" || skills[x].name === "Enchanting") {
			let lvl = skills[x].lvl;
			if (lvl > 15) {
				baseStats.mana += (14 + (lvl - 14) * 2);
			} else {
				baseStats.mana += (14);
			}
		}
		if (skills[x].name === "Combat") {
			baseStats.critChance += skills[x].lvl;
			baseStats.damage_increase += skills[x].lvl * 4;
		}

		if (skills[x].name === "Mining") {
			let lvl = skills[x].lvl;
			if (lvl > 15) {
				baseStats.defence += (14 + (lvl - 14) * 2);
			} else {
				baseStats.defence += (14);
			}
		}

		if (skills[x].name === "Foraging") {
			let lvl = skills[x].lvl;
			if (lvl > 15) {
				baseStats.strength += (14 + (lvl - 14) * 2);
			} else {
				baseStats.strength += (14);
			}
		}

		if (skills[x].name === "Taming") {
			baseStats.petLuck += skills[x].lvl;
		}
	}

	//slayer stat increase:
	for (const x in slayers) {
		baseStats.critChance += slayers[x].bonusStats.critChance;
		baseStats.critDamage += slayers[x].bonusStats.critDamage;
		baseStats.health += slayers[x].bonusStats.health;
		baseStats.speed += slayers[x].bonusStats.speed;
	}

	//fairys stat increase: 
	baseStats.health += bonusFairy.health[amount - 1];
	baseStats.defence += bonusFairy.defence[amount - 1];
	baseStats.strength += bonusFairy.defence[amount - 1];
	baseStats.speed += bonusFairy.speed[amount - 1];


	let hi = skills.sort(function (a, b) { return b.xp - a.xp; })[0];
	SkyblockObject.push({
		name: data.profiles[profileNuM].cute_name,
		profile_id: data.profiles[profileNuM].profile_id,
		skinRender: `https://crafatar.com/renders/head/${uuid.id}?size=16&overlay`,
		members: memberNAMEarray,
		firstjoin: first_join,
		lastjoin: last_save,
		fairys: `${fairys}/195`,
		highestSkill: `${hi.name}: *lvl:${hi.lvl}* | ${hi.xp.toLocaleString()}`,
		baseStats: baseStats,
		balance: balance,
		purse: purse
	});
	return SkyblockObject;
}


async function formatSkyblockSkills(username, ProfileName) {
	let skills = await requestSkyblockSkills(username, ProfileName);
	let arrayer = [];

	for (const x in skills) {
		let skilllevel;
		let name = Object.keys(skills[x])[0].toString().split("_")[2];
		let skillname = name.charAt(0).toUpperCase() + name.slice(1);
		if (skillname === "Runecrafting") {
			skilllevel = await calcSkillLVL("rune", skills[x][Object.keys(skills[x])]);
		} else {
			skilllevel = await calcSkillLVL("normal", skills[x][Object.keys(skills[x])]);
		}

		arrayer.push({
			name: skillname,
			lvl: skilllevel.lvl,
			xp: skilllevel.xp,
			progress: (skilllevel.progress == "max lvl") ? "max" : skilllevel.progress + "% progress",
			progressNum: (skilllevel.progress == "max lvl") ? "max" : `${skilllevel.progressXP.toLocaleString()}/${skilllevel.XPneeded.toLocaleString()}`
		});
	}
	return arrayer;
}


async function formatRequestGeneral(usernameoruuid) {
	let gen = await requestGen(usernameoruuid);
	if (!gen) {
		return false;
	}
	let status = await requestStatus(gen.player.uuid);
	if (!status) {
		return false;
	}
	if (status !== "offline") {
		status = `${status.type} ${status.mode}`;
	}

	let aliases = [];
	for (const x of gen.player.knownAliases) {
		aliases.push(x);
	}
	for (const x of gen.player.knownAliasesLower) {
		aliases.push(x);
	}

	let lvl = await calcNetworkLvL(gen.player.networkExp);
	let nt_lvl = lvl.toString().split(".")[0];
	let lvl_progress = lvl.toString().split(".")[1] + "%";

	let rank;
	let rank_color;
	let rankpre;

	try {
		rankpre = gen.player.rank;
		rank = gen.player.newPackageRank;
	} catch{ }



	switch (rank) {
		case "VIP":
			rank = "VIP";
			rank_color = "#55FF55";
			break;
		case "VIP_PLUS":
			rank = "VIP+";
			rank_color = "#55FF55";
			break;
		case "MVP":
			rank = "MVP";
			rank_color = "#55FFFF";
			break;
		case "MVP_PLUS":
			rank = "MVP+";
			rank_color = "#55FFFF";
			break;
	}

	if (rankpre) {
		if (rankpre === "YOUTUBER") {
			rank = "Youtuber";
			rank_color = "#ff0000";
		}
	}

	if (!rank) {
		rank = "non";
		rank_color = "#4d4d4d";
	}

	let GenObject = {
		name: gen.player.displayname + " | " + gen.player.playername,
		status: status,
		rank: rank,
		embed_rank_color: rank_color,
		skinRender: `https://crafatar.com/renders/head/${uuid.id}?size=16&overlay`,
		uuid: gen.player.uuid,
		aliases: aliases,
		first_logon: new Date(gen.player.firstLogin).toLocaleString(),
		last_logout: new Date(gen.player.lastLogout).toLocaleString(),
		network_lvl: nt_lvl,
		network_lvl_progress: lvl_progress,
		xp: gen.player.networkExp.toLocaleString(),
		karma: gen.player.karma.toLocaleString()
	};
	return GenObject;
}


// call Functions
async function getFormatedStatsSkyblock(player, profileName) {
	let data = await formatRequestSkyblock(player, profileName);
	return data;
}
async function getFormatedStatsGeneral(player) {
	let data = await formatRequestGeneral(player);
	return data;
}
async function getFormatedSkillsSkyblock(player, profileName) {
	let data = await formatSkyblockSkills(player, profileName);
	return data;
}
async function getFormatedSlayers(player, profileName) {
	let data = await requestSlayers(player, profileName);
	return data;
}


module.exports = {
	getProfiles,
	checkKey,
	requestID,
	minireq,
	mainReq,
	requestName,
	calcSkillLVL,
	getFormatedStatsSkyblock,
	getFormatedStatsGeneral,
	getFormatedSkillsSkyblock,
	getFormatedSlayers
};
