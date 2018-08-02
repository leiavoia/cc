import {Mod,Modlist} from './Mods';

// SHIP COMPONENTS: 
//	name: (string) For in game display
//	desc: (string) In game flavor text description.
//	mods: (Array[Mod]) Array of value modifers that determine what the component actually does.
//	mx: (string,optional) Mutual Exclusivity Series. 
//		Add this if you want to prevent multiple components 
//		from the same series being equiped at the same time.

export const ShipComponentList = {
	ENGINE1: {
		name: 'Nuclear Engines',
		desc: 'Nuclear engines have just enough to power a ship capable of hyperspace travel.',
		mx: 'engine',
		mods: [
			new Mod( 'speed', '=', 300, '', null ),
			new Mod( 'mass', '*', 2.0, '', null ),
			new Mod( 'labor', '*', 1.5, '', null )
			]
		},
	ENGINE2: {
		name: 'Stellar Folder',
		desc: 'Makes nuclear power look primitive, but are very expensive. These engines bend space itself by synchronized fiddling with sub-atomic bonds.',
		mx: 'engine',
		mods: [
			new Mod( 'speed', '=', 500, '', null ),
			new Mod( 'mass', '*', 1.4, '', null ),
			new Mod( 'labor', '*', 2.5, '', null )
			]
		},
	ARMOR1: {
		name: 'Composite Armor',
		desc: 'Lightweight composite armor is an extension of primitive hull technology.',
		mx: 'armor',
		mods: [
			new Mod( 'armor', '*', 2.0, '', null ),
			new Mod( 'mass', '*', 1.5, '', null ),
			new Mod( 'labor', '*', 1.5, '', null )
			]
		},
	ARMOR2: {
		name: 'Ooblek Armor',
		desc: 'Shock-absorbing composite material weighs less than traditional armors but provides more protection.',
		mx: 'armor',
		mods: [
			new Mod( 'armor', '*', 3.0, '', null ),
			new Mod( 'mass', '*', 1.4, '', null ),
			new Mod( 'labor', '*', 1.8, '', null )
			]
		},
	SHIELD1: {
		name: 'Force Shield',
		desc: 'Basic energy field help protect ship from incoming objects and weapons fire.',
		mx: 'shield',
		mods: [
			new Mod( 'shield', '=', 1, '', null ),
			new Mod( 'mass', '*', 1.1, '', null ),
			new Mod( 'labor', '*', 1.1, '', null )
			]
		},
	SHIELD2: {
		name: 'Deflectors',
		desc: 'Anti-gravity field deflects weapons of all kinds.',
		mx: 'shield',
		mods: [
			new Mod( 'shield', '=', 3, '', null ),
			new Mod( 'mass', '*', 1.1, '', null ),
			new Mod( 'labor', '*', 1.1, '', null ),
			]
		},
	BEAMAMP: {
		name: 'Beam Amplifier',
		desc: 'Boosts the raw attack power of all beam weapons on the ship by 25%.',
		mods: [
			new Mod( 'beam', '*', 1.25, '', null ),
			new Mod( 'mass', '+', 20, '', null ),
			new Mod( 'mass', '*', 1.1, '', null ),
			new Mod( 'labor', '+', 50, '', null )
			]
		},
	COLONY1: {
		name: 'Colony Module',
		desc: 'Allows us to settle new worlds with similar environments.',
		mods: [
			new Mod( 'colonize', 'H', 1, '', null ),
			new Mod( 'mass', '+', 200, '', null ),
			new Mod( 'labor', '+', 600, '', null )
			]
		},
	RESEARCHLAB1: {
		name: 'Space Lab',
		desc: 'Allows our fleet to conduct research in space, investigate anomalies, and study new worlds.',
		mods: [
			new Mod( 'research', '+', 100, '', null ),
			new Mod( 'mass', '+', 100, '', null ),
			new Mod( 'labor', '+', 200, '', null )
			]
		}
	};
	
// add keys to objects themselves for later self-reference
for ( let k in ShipComponentList ) {
	if ( ShipComponentList.hasOwnProperty(k) ) {
		ShipComponentList[k].tag = k;
		ShipComponentList[k].mods.forEach( m => { 
			m.label = ShipComponentList[k].name; 
			m.prov = ShipComponentList[k];
			});
		}
	};
