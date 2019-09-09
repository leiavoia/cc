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
		desc: 'Nuclear engines have just enough to power a ship capable of hyperspace travel.',
		type: 'engine',
		mx: 'engine',
		mods: [
			new Mod( 'speed', '=', 250, '', null ),
			new Mod( 'mass', '*', 2.0, '', null ),
			],
		scaled: true,
		cost: { labor:0.1, m:0.1 }
		},
	ENGINE2: {
		name: 'Stellar Folder',
		desc: 'Makes nuclear power look primitive, but are very expensive. These engines bend space itself by synchronized fiddling with sub-atomic bonds.',
		type: 'engine',
		mx: 'engine',
		mods: [
			new Mod( 'speed', '=', 400, '', null ),
			new Mod( 'mass', '*', 1.4, '', null ),
			],
		scaled: true,
		cost: { labor:0.1, m:0.1, r:0.3 }
		},
	ENGINE3: {
		name: 'Hyperspace Warp',
		desc: 'A true warp drive. Uses anti-gravity to create a warp field around the ship, driving it forward and superluminal speeds.',
		type: 'engine',
		mx: 'engine',
		mods: [
			new Mod( 'speed', '=', 600, '', null ),
			new Mod( 'mass', '*', 1.5, '', null ),
			],
		scaled: true,
		cost: { labor:0.1, m:0.1, r:0.3 }
		},
	ARMOR1: {
		name: 'Composite Armor',
		desc: 'Lightweight composite armor is an extension of primitive hull technology.',
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
		desc: 'Shock-absorbing composite material weighs less than traditional armors but provides more protection.',
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
		desc: 'Ultra-dense neutronium is heavy, but even a thin layer can be a wonderful defense.',
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
		desc: 'Basic energy field help protect ship from incoming objects and weapons fire.',
		type: 'armor',
		mx: 'shield',
		mods: [
			new Mod( 'shield', '=', 1, '', null ),
			new Mod( 'mass', '*', 1.1, '', null ),
			],
		scaled: true,
		cost: { labor:0.05, r:0.1 }
		},
	SHIELD2: {
		name: 'Deflectors',
		desc: 'Anti-gravity field deflects weapons of all kinds.',
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
		desc: 'Bends local hyperspace to redirect incoming attacks.',
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
		desc: 'Boosts the raw attack power of all beam weapons on the ship by 25%.',
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
		desc: 'Allows us to settle new worlds with similar environments.',
		type: 'colony',
		mods: [
			new Mod( 'colonize', 'H', 1, '', null ),
			new Mod( 'mass', '+', 200, '', null ),
			],
		cost: { labor:100, o:50, s:50, m:50 }
		},
	CARRIER1: {
		name: 'Troop Carrier Module',
		desc: 'Allows the transport of one ground combat unit.',
		type: 'troop',
		mods: [
			new Mod( 'troopcap', 'H', 2, '', null ),
			new Mod( 'mass', '+', 80, '', null ),
			],
		cost: { labor:50, o:1, m:25 }
		},
	CARRIER2: {
		name: 'Heavy Troop Carrier Module',
		desc: 'Allows the transport of two ground combat units.',
		type: 'troop',
		mods: [
			new Mod( 'troopcap', 'H', 4, '', null ),
			new Mod( 'mass', '+', 150, '', null ),
			],
		cost: { labor:75, o:15, m:45 }
		},
	RESEARCHLAB1: {
		name: 'Space Lab',
		desc: 'Allows our fleet to conduct research in space, investigate anomalies, and study new worlds.',
		type: 'research',
		mods: [
			new Mod( 'research', '+', 100, '', null ),
			new Mod( 'mass', '+', 100, '', null ),
			],
		cost: { labor:30, o:20, s:20, m:5 }
		}
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
