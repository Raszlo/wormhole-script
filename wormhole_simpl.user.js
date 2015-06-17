// ==UserScript==
// @name         WormholeScript
// @namespace    whatever
// @version 0.1
// @match *://steamcommunity.com/minigame/towerattack*
// @match *://steamcommunity.com//minigame/towerattack*
// @grant none
// @description  Script for wormhole runs
// @author       Raszlo + The Ye Olde Wormhole Group
// @grant        none
// ==/UserScript==

//WAIT FOR PEOPLE TO JOIN THE ROOM AND LET IT START BEFORE EXECUTING THE SCRIPT!
var CURRENT_LEVEL = -1
var PARTICIPANTS = -1

function aboveMainLoop() {
var timeFromStart = g_Minigame.m_CurrentScene.m_rgGameData.timestamp-g_Minigame.m_CurrentScene.m_rgGameData.timestamp_game_start;
if (timeFromStart<70) { //keep players in the first lane for 2 minutes
	g_Minigame.m_CurrentScene.TryChangeLane(0);
	if (timeFromStart>50) {
		PARTICIPANTS = g_Minigame.m_CurrentScene.m_rgLaneData[0].players-(g_Minigame.m_CurrentScene.m_rgLaneData[1].players+g_Minigame.m_CurrentScene.m_rgLaneData[2].players)/2; //amount of players above average from the other two lanes (game tries to equally distribute players every 5 sec)
	}
} else if (PARTICIPANTS<100) {//late players, small amount of participants
	PARTICIPANTS = 100; //assume something
} else {
	if (g_Minigame.m_CurrentScene.m_rgPlayerTechTree.badge_points > 0) {
		spendBP();
	}
	mainLoop();
}
}

function mainLoop() {
CURRENT_LEVEL = g_Minigame.m_CurrentScene.m_rgGameData.level+1;
buyStuff();
attemptRespawn();

if (CURRENT_LEVEL%100 == 0) {
	g_Minigame.m_CurrentScene.TryChangeLane(0); // put everyone in the same lane
	useAbilitiesAt100(); //spam wormholes and occasionally fire 'like new' (statistically once per second)
}
g_Minigame.m_CurrentScene.m_nClicks = 7;
g_msTickRate = 1000;
}

function spendBP() { //spend badge points on wormholes and then on god mode
var startingBP = g_Minigame.m_CurrentScene.m_rgPlayerTechTree.badge_points
for (var i = 0; i<Math.ceil(Math.floor(startingBP/100)/PARTICIPANTS) && g_Minigame.m_CurrentScene.m_rgPlayerTechTree.badge_points > 100; i++) {
	g_Minigame.m_CurrentScene.TrySpendBadgePoints($J('#purchase_abilityitem_27')); //like new
}
while (g_Minigame.m_CurrentScene.m_rgPlayerTechTree.badge_points > 0) {
	if (g_Minigame.m_CurrentScene.m_rgPlayerTechTree.badge_points > 100) {
		g_Minigame.m_CurrentScene.TrySpendBadgePoints($J('#purchase_abilityitem_26')); //wormhole
	} else {
		g_Minigame.m_CurrentScene.TrySpendBadgePoints($J('#purchase_abilityitem_21')); //god mode
	}
}
}

function buyStuff() {
var gold = g_Minigame.m_CurrentScene.m_rgPlayerData.gold
var LA_lvl = g_Minigame.m_CurrentScene.GetUpgradeLevel(0) //light armor
var HA_lvl = g_Minigame.m_CurrentScene.GetUpgradeLevel(8) //heavy armor
var ES_lvl = g_Minigame.m_CurrentScene.GetUpgradeLevel(20) //energy shield
var AFC_lvl = g_Minigame.m_CurrentScene.GetUpgradeLevel(1) //auto fire cannon
var APR_lvl = g_Minigame.m_CurrentScene.GetUpgradeLevel(2) //armor piercing rounds
if (LA_lvl>0 && g_Minigame.m_CurrentScene.GetUpgradeLevel(11) == 0 && g_Minigame.m_CurrentScene.GetUpgradeCost(11)<gold) {
	g_Minigame.m_CurrentScene.TryUpgrade($J('#upgr_11 .link').get(0)); //medics
} else if (LA_lvl < 10 && g_Minigame.m_CurrentScene.GetUpgradeCost(0)<gold) {
	g_Minigame.m_CurrentScene.TryUpgrade($J('#upgr_0 .link').get(0)); //light armor
} else if (LA_lvl >= 10 && HA_lvl < 10 && g_Minigame.m_CurrentScene.GetUpgradeCost(8)<gold) {
	g_Minigame.m_CurrentScene.TryUpgrade($J('#upgr_8 .link').get(0)); //heavy armor
} else if (HA_lvl >= 10 && ES_lvl < 10 && g_Minigame.m_CurrentScene.GetUpgradeCost(20)<gold) {
	g_Minigame.m_CurrentScene.TryUpgrade($J('#upgr_20 .link').get(0)); //energy shields
} else if (ES_lvl >= 10 && g_Minigame.m_CurrentScene.GetUpgradeCost(23)<gold) {
	g_Minigame.m_CurrentScene.TryUpgrade($J('#upgr_23 .link').get(0)); //personal training
}
}

function useAbilitiesAt100() { //at level 100 spam WH and fire LN with a probability depending on the number of players
var rand=Math.random();
var INCREASING_FACTOR = 2.0;
if (hasAbility(26) && g_Minigame.m_CurrentScene.GetCooldownForAbility(26) == 0) {
	g_Minigame.m_CurrentScene.TryAbility($J('#abilityitem_26 .link').get(0)); //wormhole
}
if (rand < 1/PARTICIPANTS*INCREASING_FACTOR && hasAbility(27) && g_Minigame.m_CurrentScene.GetCooldownForAbility(27) == 0) {
	g_Minigame.m_CurrentScene.TryAbility($J('#abilityitem_27 .link').get(0)); //like new
}
if (g_Minigame.m_CurrentScene.GetUpgradeLevel(11)>0 && !(7 in g_Minigame.m_CurrentScene.m_rgLaneData[g_Minigame.m_CurrentScene.m_rgPlayerData.current_lane].abilities) && g_Minigame.m_CurrentScene.GetCooldownForAbility(7) == 0) {
	g_Minigame.m_CurrentScene.TryAbility($J('#ability_7 .link').get(0)); //medics
}
}

function hasAbility(id) {
for (var i = 0; i<g_Minigame.m_CurrentScene.m_rgPlayerTechTree.ability_items.length; i++) {
	if (g_Minigame.m_CurrentScene.m_rgPlayerTechTree.ability_items[i].ability == id) {
		return true
	}
}
return false
}
	
function attemptRespawn() {
    if ((g_Minigame.m_CurrentScene.m_bIsDead) &&
        ((g_Minigame.m_CurrentScene.m_rgPlayerData.time_died) + 5) < (g_Minigame.m_CurrentScene.m_nTime)) {
        RespawnPlayer();
    }
}

setInterval(aboveMainLoop, 1000); //run the main loop