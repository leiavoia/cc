import {Mod,Modlist} from './Mods';

// SHIP COMPONENTS: 
//	name: (string) For in game display
//	desc: (string) In game flavor text description.
//	mods: (Array[Mod]) Array of value modifers that determine what the component actually does.
//	mx: (string,optional) Mutual Exclusivity Series. 
//		Add this if you want to prevent multiple components 
//		from the same series being equiped at the same time.
//	cost: { labor:0.1, r:0.1, ... } array of resources required to build this component
//		There may be one key for each of the 9 principle resources types, plus 'labor'
//		(ship production points from ship producing zones).
//	scaled: (optional) - if TRUE, multiplies all entries in `cost` by the final ship's mass.

export const ShipComponentList = {
	ENGINE1: {
		name: 'Nuclear Engines',
		desc: 'Enables hyperspace travel.',
		type: 'engine',
		mx: 'engine',
		mods: [
			new Mod( 'mapspeed', '=', 250, '', null ),
			new Mod( 'mass', '*', 2.0, '', null ),
			],
		scaled: true,
		cost: { labor:0.1, m:0.1 }
		},
	ENGINE2: {
		name: 'Stellar Folder',
		desc: 'Improved map speed.',
		type: 'engine',
		mx: 'engine',
		mods: [
			new Mod( 'mapspeed', '=', 400, '', null ),
			new Mod( 'mass', '*', 1.4, '', null ),
			],
		scaled: true,
		cost: { labor:0.1, m:0.1, r:0.3 }
		},
	ENGINE3: {
		name: 'Hyperspace Warp',
		desc: 'Superior map speed.',
		type: 'engine',
		mx: 'engine',
		mods: [
			new Mod( 'mapspeed', '=', 600, '', null ),
			new Mod( 'mass', '*', 1.5, '', null ),
			],
		scaled: true,
		cost: { labor:0.1, m:0.1, r:0.3 }
		},
	ARMOR1: {
		name: 'Composite Armor',
		desc: 'Adds hit points.',
		type: 'armor',
		mx: 'armor',
		mods: [
			new Mod( 'armor', '*', 2.0, '', null ),
			new Mod( 'mass', '*', 1.5, '', null ),
			],
		scaled: true,
		cost: { labor:0.05, s:0.2 }
		},
	ARMOR2: {
		name: 'Ooblek Armor',
		desc: 'Adds hit points.',
		type: 'armor',
		mx: 'armor',
		mods: [
			new Mod( 'armor', '*', 3.0, '', null ),
			new Mod( 'mass', '*', 1.4, '', null ),
			],
		scaled: true,
		cost: { labor:0.05, o:0.2, s:0.2 }
		},
	ARMOR3: {
		name: 'Neutronium Armor',
		desc: 'Adds hit points.',
		type: 'armor',
		mx: 'armor',
		mods: [
			new Mod( 'armor', '*', 5.0, '', null ),
			new Mod( 'mass', '*', 2.0, '', null ),
			],
		scaled: true,
		cost: { labor:0.05, o:0.2, s:0.2 }
		},
	SHIELD1: {
		name: 'Force Shield',
		desc: 'Reduces damage by a fixed amount.',
		type: 'armor',
		mx: 'shield',
		mods: [
			new Mod( 'shield', '=', 1, '', null ),
			new Mod( 'mass', '*', 1.1, '', null ),
			],
		scaled: true,
		cost: { labor:0.05, s:0.1 }
		},
	SHIELD2: {
		name: 'Deflectors',
		desc: 'Reduces damage by a fixed amount.',
		type: 'shield',
		mx: 'shield',
		mods: [
			new Mod( 'shield', '=', 3, '', null ),
			new Mod( 'mass', '*', 1.1, '', null ),
			],
		scaled: true,
		cost: { labor:0.1, m:0.1, g:0.1 }
		},
	SHIELD3: {
		name: 'Hyper-Refractors',
		desc: 'Reduces damage by a fixed amount.',
		type: 'shield',
		mx: 'shield',
		mods: [
			new Mod( 'shield', '=', 6, '', null ),
			new Mod( 'mass', '*', 1.1, '', null ),
			],
		scaled: true,
		cost: { labor:0.1, m:0.1, g:0.1 }
		},
	BEAMAMP: {
		name: 'Beam Amplifier',
		desc: 'Boosts attack power of all beam weapons on the ship.',
		type: 'beammod',
		mods: [
			new Mod( 'beam', '*', 1.25, '', null ),
			new Mod( 'mass', '+', 20, '', null ),
			new Mod( 'mass', '*', 1.1, '', null ),
			],
		scaled: true,
		cost: { labor:0.05, o:0.2, m:0.1 }
		},
	COLONY1: {
		name: 'Colony Module',
		desc: 'Allows us to settle new worlds.',
		type: 'colony',
		mods: [
			new Mod( 'colonize', '=', 1, '', null ),
			new Mod( 'mass', '+', 200, '', null ),
			],
		cost: { labor:100, o:50, s:50, m:50 }
		},
	CARRIER1: {
		name: 'Troop Carrier Module',
		desc: 'Allows the transport of ground combat units.',
		type: 'troop',
		mods: [
			new Mod( 'troopcap', 'H', 2, '', null ),
			new Mod( 'mass', '+', 80, '', null ),
			],
		cost: { labor:50, o:1, m:25 }
		},
	CARRIER2: {
		name: 'Heavy Troop Carrier Module',
		desc: 'Allows the transport of ground combat units.',
		type: 'troop',
		mods: [
			new Mod( 'troopcap', 'H', 4, '', null ),
			new Mod( 'mass', '+', 150, '', null ),
			],
		cost: { labor:75, o:15, m:45 }
		},
	RESEARCHLAB1: {
		name: 'Space Lab',
		desc: 'Enables anomaly research.',
		type: 'research',
		mods: [
			new Mod( 'research', '+', 100, '', null ),
			new Mod( 'mass', '+', 100, '', null ),
			],
		cost: { labor:30, o:20, s:20, m:5 }
		},
		
	// THRUSTERS / COMBATSPEED
	THRUSTERS1: {
		name: 'Impulse Thrusters',
		desc: 'Improved initiative and evasion.',
		type: 'thrusters',
		mx: 'thrusters',
		mods: [
			new Mod( 'combatspeed', '+', 1, '', null ),
			new Mod( 'mass', '*', 1.2, '', null ),
			],
		scaled: true,
		cost: { labor:0.1, o:0.1 }
		},		
	THRUSTERS2: {
		name: 'Neutron Thrusters',
		desc: 'High initiative and evasion.',
		type: 'thrusters',
		mx: 'thrusters',
		mods: [
			new Mod( 'combatspeed', '+', 3, '', null ),
			new Mod( 'mass', '*', 1.2, '', null ),
			],
		scaled: true,
		cost: { labor:0.1, s:0.1 }
		},		
	THRUSTERS3: {
		name: 'Quantum Thrusters',
		desc: 'Advanced initiative and evasion.',
		type: 'thrusters',
		mx: 'thrusters',
		mods: [
			new Mod( 'combatspeed', '+', 5, '', null ),
			new Mod( 'mass', '*', 1.2, '', null ),
			],
		scaled: true,
		cost: { labor:0.2, b:0.1 }
		},		
	THRUSTERS4: {
		name: 'Phasing Thrusters',
		desc: 'Superior initiative and evasion.',
		type: 'thrusters',
		mx: 'thrusters',
		mods: [
			new Mod( 'combatspeed', '+', 7, '', null ),
			new Mod( 'mass', '*', 1.2, '', null ),
			],
		scaled: true,
		cost: { labor:0.1, g:0.1, b:0.1 }
		},		
	THRUSTERS5: {
		name: 'Dimensional Thrusters',
		desc: 'Ultimate initiative and evasion.',
		type: 'thrusters',
		mx: 'thrusters',
		mods: [
			new Mod( 'combatspeed', '+', 10, '', null ),
			new Mod( 'mass', '*', 1.2, '', null ),
			],
		scaled: true,
		cost: { labor:0.1, v:0.1, g:0.1 }
		},		
		
	CLOAK1: {
		name: 'Cloaking',
		desc: 'Additional evasion and initiative.',
		type: 'cloak',
		mx: 'cloak',
		mods: [
			new Mod( 'evade', '+', 5, '', null ),
			new Mod( 'init', '+', 5, '', null ),
			],
		scaled: false,
		cost: { labor:40, o:10 }
		},		
	CLOAK2: {
		name: 'Phasing Cloak',
		desc: 'Additional evasion and initiative.',
		type: 'cloak',
		mx: 'cloak',
		mods: [
			new Mod( 'evade', '+', 10, '', null ),
			new Mod( 'init', '+', 10, '', null ),
			],
		scaled: false,
		cost: { labor:80, g:10, r:10 }
		},		
	CLOAK3: {
		name: 'Dimensional Cloak',
		desc: 'Additional evasion and initiative.',
		type: 'cloak',
		mx: 'cloak',
		mods: [
			new Mod( 'evade', '+', 20, '', null ),
			new Mod( 'init', '+', 20, '', null ),
			],
		scaled: false,
		cost: { labor:150, v:5, c:10, y:15 }
		},		
		
	TARGETTING1: {
		name: 'Predictive Targetting',
		desc: 'Improved accuracy on to-hit calculations.',
		type: 'targetting',
		mx: 'targetting',
		mods: [
			new Mod( 'hit', '+', 2, '', null ),
			],
		scaled: false,
		cost: { labor:30 }
		},		
	TARGETTING2: {
		name: 'AI Targetting',
		desc: 'High accuracy on to-hit calculations.',
		type: 'targetting',
		mx: 'targetting',
		mods: [
			new Mod( 'hit', '+', 6, '', null ),
			],
		scaled: false,
		cost: { labor:60 }
		},		
	TARGETTING3: {
		name: 'Quantum Targetting',
		desc: 'Extreme accuracy on to-hit calculations.',
		type: 'targetting',
		mx: 'targetting',
		mods: [
			new Mod( 'hit', '+', 12, '', null ),
			],
		scaled: false,
		cost: { labor:90 }
		},		
		
	};
	
// add keys to objects themselves for later self-reference
for ( let k in ShipComponentList ) {
	if ( ShipComponentList.hasOwnProperty(k) ) {
		ShipComponentList[k].tag = k;
		ShipComponentList[k].scaled = ShipComponentList[k].hasOwnProperty('scaled') && ShipComponentList[k].scaled;
		ShipComponentList[k].mods.forEach( m => { 
			m.label = ShipComponentList[k].name; 
			m.prov = ShipComponentList[k];
			});
		}
	};
