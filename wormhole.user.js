// ==UserScript==
// @name         WormholeScript
// @namespace    whatever
// @version 0.1
// @match *://steamcommunity.com/minigame/towerattack*
// @match *://steamcommunity.com//minigame/towerattack*
// @grant none
// @description  Script for wormhole runs
// @author       Raszlo + credit to wchill for providing solution to many tasks and for some ready functions.
// @grant        none
// ==/UserScript==


//===============
// Joining a room as soon as it appears
// var gameID = 
// setInterval(function () {$J('div.btn_grey_white_innerfade.btn_medium').click();}, 200);
// setInterval(function () {JoinGame(gameID);}, 1000);

// Leaving the current room:
// $J.post('http://steamcommunity.com/minigame/ajaxleavegame/',{'gameid':g_GameID,'sessionid':g_sessionID}); location.reload();
//===============
//

//WAIT FOR PEOPLE TO JOIN THE ROOM AND LET IT START BEFORE EXECUTING THE SCRIPT!
var EXPECTED_LEVEL = 50000 //the level expected to be reached with wormholes
var ClickRate = 20;
var CURRENT_LEVEL = -1

//=====
var lastDigID = g_steamID.substring(g_steamID.length-1,g_steamID.length) //last digit of steamID - used for the attack phase level assignment
var lastDigID2 = g_steamID.substring(g_steamID.length-1,g_steamID.length) //second to last digit of steamID - used for the attack phase lane assignment

function mainLoop() {
CURRENT_LEVEL = g_Minigame.m_CurrentScene.m_rgGameData.level+1;
buyStuff();
attemptRespawn();

var damagePerClick = g_Minigame.m_CurrentScene.CalculateDamage(
            g_Minigame.m_CurrentScene.m_rgPlayerTechTree.damage_per_click,
            g_Minigame.m_CurrentScene.m_rgGameData.lanes[g_Minigame.m_CurrentScene.m_rgPlayerData.current_lane].element
        );
//console.log("Ticked. Current clicks per second: " + ClickRate + ". Current damage per second: " + (damagePerClick * ClickRate));

//g_Minigame.m_CurrentScene.m_rgGameData.timestamp
//g_Minigame.m_CurrentScene.m_rgGameData.timestamp_level_start

if (! hasAbility(26) && CURRENT_LEVEL > EXPECTED_LEVEL && !(26 in g_Minigame.m_CurrentScene.m_rgLaneData[0].abilities) && !(26 in g_Minigame.m_CurrentScene.m_rgLaneData[1].abilities) && !(26 in g_Minigame.m_CurrentScene.m_rgLaneData[2].abilities)){ //reached expected level and no wormholes active in lanes
	if (g_Minigame.m_CurrentScene.m_rgGameData.timestamp-g_Minigame.m_CurrentScene.m_rgGameData.timestamp_level_start<10) { //if less than 10 seconds in the level - put the player in the designated lane
		g_Minigame.m_CurrentScene.TryChangeLane(parseInt(lastDigID2%3))
	} else { //else stick to wchill's algorithm
		goToLaneWithBestTarget()
	}
	useAbilitiesPhase2() //reach and kill the boss for progress to register
} else {
	if (g_Minigame.m_CurrentScene.m_rgGameData.timestamp-g_Minigame.m_CurrentScene.m_rgGameData.timestamp_level_start<15) { //if less than 10 seconds in a level - put all of the players in the middle lane, so like new applies to everyone
		g_Minigame.m_CurrentScene.TryChangeLane(parseInt(1))
	} else { //else stick to wchill's algorithm
		goToLaneWithBestTarget()
	}
	useAbilitiesPhase1() //wormhole phase
}
g_Minigame.m_CurrentScene.m_nClicks = ClickRate;
g_msTickRate = 1000;
}

function spendBP() { //spend badge points on wormholes and then on god mode
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
var LA_lvl = g_Minigame.m_CurrentScene.GetUpgradeLevel(0)
var HA_lvl = g_Minigame.m_CurrentScene.GetUpgradeLevel(8)
var ES_lvl = g_Minigame.m_CurrentScene.GetUpgradeLevel(20)
var AFC_lvl = g_Minigame.m_CurrentScene.GetUpgradeLevel(1)
var APR_lvl = g_Minigame.m_CurrentScene.GetUpgradeLevel(1)
if (LA_lvl>0 && g_Minigame.m_CurrentScene.GetUpgradeLevel(11) == 0 && g_Minigame.m_CurrentScene.GetUpgradeCost(11)<gold) {
	g_Minigame.m_CurrentScene.TryUpgrade($J('#upgr_11 .link').get(0)); //medics
} else if (g_Minigame.m_CurrentScene.GetUpgradeLevel(15) == 0 && g_Minigame.m_CurrentScene.GetUpgradeCost(15)<gold) {
	g_Minigame.m_CurrentScene.TryUpgrade($J('#upgr_15 .link').get(0)); //decrease cooldowns
} else if (APR_lvl >= 10 && g_Minigame.m_CurrentScene.GetUpgradeLevel(16) == 0 && g_Minigame.m_CurrentScene.GetUpgradeCost(16)<gold) {
	g_Minigame.m_CurrentScene.TryUpgrade($J('#upgr_16 .link').get(0)); //tactical nuke
} else if (AFC_lvl >= 10 && g_Minigame.m_CurrentScene.GetUpgradeLevel(17) == 0 && g_Minigame.m_CurrentScene.GetUpgradeCost(17)<gold) {
	g_Minigame.m_CurrentScene.TryUpgrade($J('#upgr_17 .link').get(0)); //cluster bomb
} else if (AFC_lvl >= 10 && g_Minigame.m_CurrentScene.GetUpgradeLevel(18) == 0 && g_Minigame.m_CurrentScene.GetUpgradeCost(18)<gold) {
	g_Minigame.m_CurrentScene.TryUpgrade($J('#upgr_18 .link').get(0)); //napalm
} else if (LA_lvl < 10 && g_Minigame.m_CurrentScene.GetUpgradeCost(0)<gold) {
	g_Minigame.m_CurrentScene.TryUpgrade($J('#upgr_0 .link').get(0)); //light armor
} else if (LA_lvl >= 10 && HA_lvl < 10 && g_Minigame.m_CurrentScene.GetUpgradeCost(8)<gold) {
	g_Minigame.m_CurrentScene.TryUpgrade($J('#upgr_8 .link').get(0)); //heavy armor
} else if (HA_lvl >= 10 && ES_lvl < 10 && g_Minigame.m_CurrentScene.GetUpgradeCost(20)<gold) {
	g_Minigame.m_CurrentScene.TryUpgrade($J('#upgr_20 .link').get(0)); //energy shields
} else if (ES_lvl >= 10 && g_Minigame.m_CurrentScene.GetUpgradeCost(23)<gold) {
	g_Minigame.m_CurrentScene.TryUpgrade($J('#upgr_23 .link').get(0)); //personal training
} else if (g_Minigame.m_CurrentScene.GetUpgradeLevel(1) < 10 && g_Minigame.m_CurrentScene.GetUpgradeCost(1)<gold) {
	g_Minigame.m_CurrentScene.TryUpgrade($J('#upgr_1 .link').get(0)); //auto fire cannon (needed for napalm and cluster bomb)
} else if (g_Minigame.m_CurrentScene.GetUpgradeLevel(2) < 10 && g_Minigame.m_CurrentScene.GetUpgradeCost(2)<gold) {
	g_Minigame.m_CurrentScene.TryUpgrade($J('#upgr_2 .link').get(0)); //armor piercing round (needed for tactical nuke)
}
}

function useAbilitiesPhase1() { //wormhole phase
if (g_Minigame.m_CurrentScene.GetUpgradeLevel(15)>0 && g_Minigame.m_CurrentScene.GetCooldownForAbility(9) == 0) {
	g_Minigame.m_CurrentScene.TryAbility($J('#ability_9 .link').get(0)); //decrease cooldowns
}
if (hasAbility(26) && g_Minigame.m_CurrentScene.GetCooldownForAbility(26) == 0) {
	g_Minigame.m_CurrentScene.TryAbility($J('#abilityitem_26 .link').get(0)); //wormhole
}
if (g_Minigame.m_CurrentScene.GetUpgradeLevel(11)>0 && !(7 in g_Minigame.m_CurrentScene.m_rgLaneData[g_Minigame.m_CurrentScene.m_rgPlayerData.current_lane].abilities) && g_Minigame.m_CurrentScene.GetCooldownForAbility(7) == 0) {
	g_Minigame.m_CurrentScene.TryAbility($J('#ability_7 .link').get(0)); //medics
}
}

function useAbilitiesPhase2() { //reach and kill the boss for progress to register (new version with players assigned to levels based on the last digit of their steamID)
if (g_Minigame.m_CurrentScene.GetUpgradeLevel(15)>0 && g_Minigame.m_CurrentScene.GetCooldownForAbility(9) == 0) {
	g_Minigame.m_CurrentScene.TryAbility($J('#ability_9 .link').get(0)); //decrease cooldowns
}
if (hasAbility(21) && g_Minigame.m_CurrentScene.GetCooldownForAbility(21) == 0) {
	g_Minigame.m_CurrentScene.TryAbility($J('#abilityitem_21 .link').get(0)); //god mode
}
if (g_Minigame.m_CurrentScene.GetUpgradeLevel(11)>0 && !(7 in g_Minigame.m_CurrentScene.m_rgLaneData[g_Minigame.m_CurrentScene.m_rgPlayerData.current_lane].abilities) && g_Minigame.m_CurrentScene.GetCooldownForAbility(7) == 0) {
	g_Minigame.m_CurrentScene.TryAbility($J('#ability_7 .link').get(0)); //medics
}
if (CURRENT_LEVEL%10 == lastDigID || CURRENT_LEVEL%10 == 0 || (CURRENT_LEVEL%10>5 && CURRENT_LEVEL%10-5 == 5-lastDigID)) { //attack if your designated level, or a boss level. The last condition is here because there is lower chance for levels 1-4 to appear, therefore players designated for 4 also act on 6, 3->7 2->8...
	if (g_Minigame.m_CurrentScene.GetUpgradeLevel(17)>0 && !(11 in g_Minigame.m_CurrentScene.m_rgLaneData[g_Minigame.m_CurrentScene.m_rgPlayerData.current_lane].abilities) && g_Minigame.m_CurrentScene.GetCooldownForAbility(11) == 0) {
		g_Minigame.m_CurrentScene.TryAbility($J('#ability_11 .link').get(0)); //cluster bomb
	}
	if (g_Minigame.m_CurrentScene.GetUpgradeLevel(18)>0 && !(12 in g_Minigame.m_CurrentScene.m_rgLaneData[g_Minigame.m_CurrentScene.m_rgPlayerData.current_lane].abilities) && g_Minigame.m_CurrentScene.GetCooldownForAbility(12) == 0) {
		g_Minigame.m_CurrentScene.TryAbility($J('#ability_12 .link').get(0)); //napalm
	}
}
}

function useAbilitiesPhase2_old() { //reach and kill the boss for progress to register (old version with randoms)
if (g_Minigame.m_CurrentScene.GetUpgradeLevel(15)>0 && g_Minigame.m_CurrentScene.GetCooldownForAbility(9) == 0) {
	g_Minigame.m_CurrentScene.TryAbility($J('#ability_9 .link').get(0)); //decrease cooldowns
}
if (hasAbility(21) && g_Minigame.m_CurrentScene.GetCooldownForAbility(21) == 0) {
	g_Minigame.m_CurrentScene.TryAbility($J('#abilityitem_21 .link').get(0)); //god mode
}
var rand=Math.random(); //random factor so not all players fire the offensive stuff right away
if (rand<0.2 && g_Minigame.m_CurrentScene.GetUpgradeLevel(17)>0 && !(11 in g_Minigame.m_CurrentScene.m_rgLaneData[g_Minigame.m_CurrentScene.m_rgPlayerData.current_lane].abilities) && g_Minigame.m_CurrentScene.GetCooldownForAbility(11) == 0) {
	g_Minigame.m_CurrentScene.TryAbility($J('#ability_11 .link').get(0)); //cluster bomb
}
if (rand>0.9 && g_Minigame.m_CurrentScene.GetUpgradeLevel(18)>0 && !(12 in g_Minigame.m_CurrentScene.m_rgLaneData[g_Minigame.m_CurrentScene.m_rgPlayerData.current_lane].abilities) && g_Minigame.m_CurrentScene.GetCooldownForAbility(12) == 0) {
	g_Minigame.m_CurrentScene.TryAbility($J('#ability_12 .link').get(0)); //napalm
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

if (g_Minigame.m_CurrentScene.m_rgPlayerTechTree.badge_points > 0) {
	spendBP();
}


//FULL CREDIT TO WCHILL FOR FUNCTIONS BELOW!
function s() {
    return g_Minigame.m_CurrentScene;
}
var ENEMY_TYPE = {
    "SPAWNER": 0,
    "CREEP": 1,
    "BOSS": 2,
    "MINIBOSS": 3,
    "TREASURE": 4
};
function goToLaneWithBestTarget() {
    // We can overlook spawners if all spawners are 40% hp or higher and a creep is under 10% hp
    var spawnerOKThreshold = 0.4;
    var creepSnagThreshold = 0.1;

    var targetFound = false;
    var lowHP = 0;
    var lowLane = 0;
    var lowTarget = 0;
    var lowPercentageHP = 0;
    var preferredLane = -1;
    var preferredTarget = -1;

    // determine which lane and enemy is the optimal target
    var enemyTypePriority = [
        ENEMY_TYPE.TREASURE,
        ENEMY_TYPE.BOSS,
        ENEMY_TYPE.MINIBOSS,
        ENEMY_TYPE.SPAWNER,
        ENEMY_TYPE.CREEP
    ];

    var i;
    var skippingSpawner = false;
    var skippedSpawnerLane = 0;
    var skippedSpawnerTarget = 0;
    var targetIsTreasure = false;
    var targetIsBoss = false;

    for (var k = 0; !targetFound && k < enemyTypePriority.length; k++) {
        targetIsTreasure = (enemyTypePriority[k] == ENEMY_TYPE.TREASURE);
        targetIsBoss = (enemyTypePriority[k] == ENEMY_TYPE.BOSS);

        var enemies = [];

        // gather all the enemies of the specified type.
        for (i = 0; i < 3; i++) {
            for (var j = 0; j < 4; j++) {
                var enemy = s().GetEnemy(i, j);
                if (enemy && enemy.m_data.type == enemyTypePriority[k]) {
                    enemies[enemies.length] = enemy;
                }
            }
        }

        //Prefer lane with raining gold, unless current enemy target is a treasure or boss.
    if (!targetIsTreasure && !targetIsBoss){
            var potential = 0;
            // Loop through lanes by elemental preference
            var sortedLanes = sortLanesByElementals();
            for(var notI = 0; notI < sortedLanes.length; notI++){
                // Maximize compability with upstream
                i = sortedLanes[notI];
                // ignore if lane is empty
                if(s().m_rgGameData.lanes[i].dps === 0)
                    continue;
                var stacks = 0;
                if(typeof s().m_rgLaneData[i].abilities[17] != 'undefined') {
                    stacks = s().m_rgLaneData[i].abilities[17];
                }
                for(var m = 0; m < s().m_rgEnemies.length; m++) {
                    var enemyGold = s().m_rgEnemies[m].m_data.gold;
                    if (stacks * enemyGold > potential) {
                        potential = stacks * enemyGold;
                        preferredTarget = s().m_rgEnemies[m].m_nID;
                        preferredLane = i;
                    }
                }
            }
        }

        // target the enemy of the specified type with the lowest hp
        var mostHPDone = 0;
        for (i = 0; i < enemies.length; i++) {
            if (enemies[i] && !enemies[i].m_bIsDestroyed) {
                // Only select enemy and lane if the preferedLane matches the potential enemy lane
                if(lowHP < 1 || enemies[i].m_flDisplayedHP < lowHP) {
                    var element = s().m_rgGameData.lanes[enemies[i].m_nLane].element;

                    var dmg = s().CalculateDamage(
                            s().m_rgPlayerTechTree.dps,
                            element
                        );
                    if(mostHPDone < dmg)
                    {
                        mostHPDone = dmg;
                    } else {
                         continue;
                    }

                    targetFound = true;
                    lowHP = enemies[i].m_flDisplayedHP;
                    lowLane = enemies[i].m_nLane;
                    lowTarget = enemies[i].m_nID;
                }
                var percentageHP = enemies[i].m_flDisplayedHP / enemies[i].m_data.max_hp;
                if (lowPercentageHP === 0 || percentageHP < lowPercentageHP) {
                    lowPercentageHP = percentageHP;
                }
            }
        }

        if(preferredLane != -1 && preferredTarget != -1){
            lowLane = preferredLane;
            lowTarget = preferredTarget;
        }

        // If we just finished looking at spawners,
        // AND none of them were below our threshold,
        // remember them and look for low creeps (so don't quit now)
        // Don't skip spawner if lane has raining gold
        if ((enemyTypePriority[k] == ENEMY_TYPE.SPAWNER && lowPercentageHP > spawnerOKThreshold) && preferredLane == -1) {
            skippedSpawnerLane = lowLane;
            skippedSpawnerTarget = lowTarget;
            skippingSpawner = true;
            targetFound = false;
        }

        // If we skipped a spawner and just finished looking at creeps,
        // AND the lowest was above our snag threshold,
        // just go back to the spawner!
        if (skippingSpawner && enemyTypePriority[k] == ENEMY_TYPE.CREEP && lowPercentageHP > creepSnagThreshold ) {
            lowLane = skippedSpawnerLane;
            lowTarget = skippedSpawnerTarget;
        }
    }


    // go to the chosen lane
    if (targetFound) {
        if (s().m_nExpectedLane != lowLane) {
            s().TryChangeLane(lowLane);
        }

        // target the chosen enemy
        if (s().m_nTarget != lowTarget) {
            s().TryChangeTarget(lowTarget);
        }
    }
}
function sortLanesByElementals() {
    var elementPriorities = [
        s().m_rgPlayerTechTree.damage_multiplier_fire,
        s().m_rgPlayerTechTree.damage_multiplier_water,
        s().m_rgPlayerTechTree.damage_multiplier_air,
        s().m_rgPlayerTechTree.damage_multiplier_earth
    ];

    var lanes = s().m_rgGameData.lanes;
    var lanePointers = [];

    for (var i = 0; i < lanes.length; i++) {
        lanePointers[i] = i;
    }

    lanePointers.sort(function(a, b) {
        return elementPriorities[lanes[b].element - 1] - elementPriorities[lanes[a].element - 1];
    });

    return lanePointers;
}

setInterval(mainLoop, 1000); //run the main loop