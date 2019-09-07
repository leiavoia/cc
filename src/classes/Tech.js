
import {WeaponList} from './WeaponList';
import {ZoneList} from './Zones';
import {ShipComponentList} from './ShipComponentList';
import {Mod} from './Mods';

export let Techs = {
	
	// STARTING TECHS ---------\/--------------------
	
	BASE: {
		name: "Base Technologies",
		onComplete( civ ) { 
			// zones
			civ.AddAvailZoneType(ZoneList.HOUSING0A);
			civ.AddAvailZoneType(ZoneList.MINE0A);
			civ.AddAvailZoneType(ZoneList.RES0);
			civ.AddAvailZoneType(ZoneList.ECON0);
			civ.AddAvailZoneType(ZoneList.SHIP0);
			civ.AddAvailZoneType(ZoneList.MIL0); // NOTE: TESTING ONLY
			// starting ship bits:
			civ.avail_ship_comps = [
				ShipComponentList.ENGINE1,
				ShipComponentList.ARMOR1,
				ShipComponentList.SHIELD1,
				ShipComponentList.COLONY1,
				ShipComponentList.RESEARCHLAB1,
				];
			civ.avail_ship_weapons = [
				WeaponList.LASER,
				WeaponList.RAYGUN,
				WeaponList.MISSILE
				];			
			}
		},		

	FLEETSPEED1: {
		name: "Fleet Warp Bubble",
		desc: '<b>+50 Ship Speed</b>. Makes all ships go faster.',
		onComplete( civ ) { 
			civ.mods.Add( new Mod('speed', '+', 50, this.name) );
			civ.fleets.forEach( f => f.ReevaluateStats() );
			}
		},
	FLEETSPEED2: {
		name: "Fleet Warp Booster",
		desc: '<b>+100 Ship Speed</b>. Makes all ships go even faster.',
		onComplete( civ ) { 
			civ.mods.Add( new Mod('speed', '+', 100, this.name) );
			civ.fleets.forEach( f => f.ReevaluateStats() );
			}
		},
	FLEETSPEED3: {
		name: "Fleet HyperWarp",
		desc: '<b>+200 Ship Speed</b>. Makes all ships go screaming fast.',
		onComplete( civ ) { 
			civ.mods.Add( new Mod('speed', '+', 200, this.name) );
			civ.fleets.forEach( f => f.ReevaluateStats() );
			}
		},
	FLEETSPEED4: {
		name: "Fleet MegaWarp",
		desc: '<b>+350 Ship Speed</b>. Makes all ships go like a flying mammal out of the underworld.',
		onComplete( civ ) { 
			civ.mods.Add( new Mod('speed', '+', 350, this.name) );
			civ.fleets.forEach( f => f.ReevaluateStats() );
			}
		},
		
	SHIPRANGE1: {
		name: "Improved Warp Drive",
		desc: '<b>1000 Ship Range</b>. Basic FTL, or "warp drive", got us into deep space. Now improvements on this basic system will allows us to explore further into space.',
		onComplete( civ ) { civ.ship_range = 1000; civ.RecalcEmpireBox(); }
		},
	SHIPRANGE2: {
		name: "Advanced Warp Drive",
		desc: '<b>1250 Ship Range</b>. Further refinements in warp drive technology have yielded this pinnacle achievement. This is likely as far as we can take warp technology without rethinking FTL entirely.',
		onComplete( civ ) { civ.ship_range = 1250; civ.RecalcEmpireBox(); }
		},
	SHIPRANGE3: {
		name: "Hyperdrive",
		desc: '<b>1750 Ship Range</b>. Hyperdrives work on entirely different principal than Warp Drives, using low areas in hypersapce topology to quickly navigate through normal space.',
		onComplete( civ ) { civ.ship_range = 1750; civ.RecalcEmpireBox(); }
		},
	SHIPRANGE4: {
		name: "Turbo Hyperdrive",
		desc: '<b>2500 Ship Range</b>. This ultra-advanced Hyperdrive uses predictive hyperspace pathfinding to squeeze every bit of efficiency out of hyperspace travel. In a nutshell, it\'s wicked fast.',
		onComplete( civ ) { civ.ship_range = 2500; civ.RecalcEmpireBox(); }
		},
	SHIPRANGE5: {
		name: "Ultimate Drive",
		desc: '<b>5000 Ship Range</b>. It just works.',
		onComplete( civ ) { civ.ship_range = 5000; civ.RecalcEmpireBox(); }
		},
		
	HABITATION1: {
		name: "Improved Habitation",
		desc: '<b>+1 Habitation</b>. Living on alien planets can be difficult and expensive. These new habitation techniques will allow us to colonize even more hostile planets. With further refinements, we can live just about anywhere.',
		onComplete( civ ) { civ.race.env.habitation += 1; } /* TODO: hibitation tech should not affect the civ's race directly */
		},
	HABITATION2: {
		name: "Advanced Habitation",
		desc: '<b>+1 Habitation</b>. Breakthroughs in engineering and materials science has given us the ability to settle on particularly ugly planets. They are ugly now, but someday they will be wonderful.',
		onComplete( civ ) { civ.race.env.habitation += 1; } /* TODO: hibitation tech should not affect the civ's race directly */
		},
	HABITATION3: {
		name: "Superior Habitation",
		desc: '<b>+1 Habitation</b>. Living on alient planets is easy with new pre-fabricated, self-assembling shelters. It\'s still a dismal life, but it\'s one less colony our neighbors will get.',
		onComplete( civ ) { civ.race.env.habitation += 1; } /* TODO: hibitation tech should not affect the civ's race directly */
		},
	HABITATION4: {
		name: "Ultimate Habitation",
		desc: '<b>+5 Habitation</b>. Ultimate xeno-engineering technologies mean we can live virtually anywhere in the galaxy.',
		onComplete( civ ) { civ.race.env.habitation += 5; } /* TODO: hibitation tech should not affect the civ's race directly */
		},
		
	ADAPTATION1: {
		name: "Basic Terraforming",
		desc: '<b>+1 Adaptation</b>.',
		onComplete( civ ) { civ.race.env.adaptation += 1; } /* TODO: hibitation tech should not affect the civ's race directly */
		},
	ADAPTATION2: {
		name: "Advanced Terraforming",
		desc: '<b>+1 Adaptation</b>.',
		onComplete( civ ) { civ.race.env.adaptation += 1; } /* TODO: hibitation tech should not affect the civ's race directly */
		},
	ADAPTATION3: {
		name: "Superior Terraforming",
		desc: '<b>+1 Adaptation</b>.',
		onComplete( civ ) { civ.race.env.adaptation += 1; } /* TODO: hibitation tech should not affect the civ's race directly */
		},
	ADAPTATION4: {
		name: "Ultimate Terraforming",
		desc: '<b>+2 Adaptation</b>.',
		onComplete( civ ) { civ.race.env.adaptation += 2; } /* TODO: hibitation tech should not affect the civ's race directly */
		},
		
	XENOCOMM1: {
		name: "Xeno Communication Skills",
		desc: '<b>+1 Communication</b>.',
		onComplete( civ ) { 
			civ.diplo.skill += 0.1; 
			for ( let [contact,acct] of civ.diplo.contacts ) {
				const overlap = civ.CommOverlapWith(contact);
				acct.comm = overlap;
				contact.diplo.contacts.get(civ).comm = overlap;
				}
			} 
		},
	XENOCOMM2: {
		name: "Xeno Linguistic Mastery",
		desc: '<b>+1 Communication</b>.',
		onComplete( civ ) { 
			civ.diplo.skill += 0.1; 
			for ( let [contact,acct] of civ.diplo.contacts ) {
				const overlap = civ.CommOverlapWith(contact);
				acct.comm = overlap;
				contact.diplo.contacts.get(civ).comm = overlap;
				}
			} 
		},
	XENOCOMM3: {
		name: "Alien Negotiation Skills",
		desc: '<b>+1 Communication</b>.',
		onComplete( civ ) { 
			civ.diplo.skill += 0.1; 
			for ( let [contact,acct] of civ.diplo.contacts ) {
				const overlap = civ.CommOverlapWith(contact);
				acct.comm = overlap;
				contact.diplo.contacts.get(civ).comm = overlap;
				}
			} 
		}

	};
	
// bulk generate the weapon techs
for ( let k of Object.keys(WeaponList) ) { 
	Techs[k] = {
		name: WeaponList[k].name,
		desc: WeaponList[k].desc,
		onComplete( civ ) { civ.avail_ship_weapons.push( WeaponList[k] ); }
		};
	}
	
// bulk generate zones
for ( let k of Object.keys(ZoneList) ) { 
	Techs['ZONE_' + k] = {
		name: ZoneList[k].name,
		desc: ZoneList[k].desc,
		onComplete( civ ) { civ.AddAvailZoneType(ZoneList[k]); }
		};
	}
	
export let TechNodes = {
	
	BASE: {
		rp: 0,
		},
			
		
	// ZONES ---------\/-----------------------------
	
	ZONE_HOUSING0B: {
		rp: 5,
		},
	ZONE_HOUSING1A: {
		rp: 10,
		},
	ZONE_HOUSING1B: {
		rp: 25,
		requires: ['ZONE_HOUSING1A'], 
		},
	ZONE_HOUSING2A: {
		rp: 50,
		requires: ['ZONE_HOUSING1A'], 
		},
	ZONE_HOUSING2B: {
		rp: 100,
		requires: ['ZONE_HOUSING2A'], 
		},
	ZONE_HOUSING3A: {
		rp: 250,
		requires: ['ZONE_HOUSING2A'], 
		},
	ZONE_HOUSING3B: {
		rp: 400,
		requires: ['ZONE_HOUSING3A'], 
		},
	ZONE_HOUSING4A: {
		rp: 800,
		requires: ['ZONE_HOUSING3A'], 
		},
		
	ZONE_MINE0B: {
		rp: 75,
		},
	ZONE_MINE0C: {
		rp: 50,
		},
	ZONE_MINE1A: {
		rp: 200,
		},
	ZONE_MINE1B: {
		rp: 550,
		requires: ['ZONE_MINE1A'], 
		},
	ZONE_MINE1C: {
		rp: 400,
		requires: ['ZONE_MINE1A'], 
		},
	ZONE_MINE2A: {
		rp: 800,
		requires: ['ZONE_MINE1A'], 
		},
	ZONE_MINE2B: {
		rp: 1400,
		requires: ['ZONE_MINE2A'], 
		},
	ZONE_MINE2C: {
		rp: 1000,
		requires: ['ZONE_MINE2A'], 
		},
		
	ZONE_RES1: {
		rp: 40,
		},
	ZONE_RES2: {
		rp: 100,
		requires: ['ZONE_RES1'], 
		},
	ZONE_RES3: {
		rp: 400,
		requires: ['ZONE_RES2'], 
		},
	
	ZONE_SHIP1: {
		rp: 40,
		},
	ZONE_SHIP2: {
		rp: 100,
		requires: ['ZONE_SHIP1'], 
		},
	ZONE_SHIP3: {
		rp: 300,
		requires: ['ZONE_SHIP2'], 
		},
	ZONE_SHIP4: {
		rp: 900,
		requires: ['ZONE_SHIP3'], 
		},
	
					
	// SHIP ENGINES --------------\/-------------
	
	FLEETSPEED1: { 
		rp: 50,
		requires: [], 
		},
	FLEETSPEED2: { 
		rp: 300,
		requires: ['FLEETSPEED1'], 
		},
	FLEETSPEED3: { 
		rp: 1000,
		requires: ['FLEETSPEED2','SHIPRANGE3'], 
		},
	FLEETSPEED4: { 
		rp: 2000,
		requires: ['FLEETSPEED3','SHIPRANGE3'], 
		},

	SHIPRANGE1: { 
		rp: 40,
		requires: [], 
		},
	SHIPRANGE2: { 
		rp: 400,
		requires: ['SHIPRANGE1'], 
		},
	SHIPRANGE3: { 
		rp: 1050,
		requires: ['SHIPRANGE2'], 
		},
	SHIPRANGE4: { 
		rp: 2300,
		requires: ['SHIPRANGE3'], 
		},
	SHIPRANGE5: { 
		rp: 6000,
		requires: ['SHIPRANGE4'], 
		},
		
	HABITATION1: { 
		rp: 30,
		requires: [], 
		},
	HABITATION2: { 
		rp: 120,
		requires: ['HABITATION1'], 
		yields: ['HABITATION2'],
		},
	HABITATION3: { 
		rp: 220,
		requires: ['HABITATION2'], 
		},
	HABITATION4: { 
		rp: 1200,
		requires: ['HABITATION3'], 
		},
		
	ADAPTATION1: { 
		rp: 140,
		requires: [], 
		},
	ADAPTATION2: { 
		rp: 480,
		requires: ['ADAPTATION1'], 
		},
	ADAPTATION3: { 
		rp: 900,
		requires: ['ADAPTATION2'], 
		},
	ADAPTATION4: { 
		rp: 1800,
		requires: ['ADAPTATION3'], 
		},
		
	XENOCOMM1: { 
		rp: 35,
		requires: [], 
		},
	XENOCOMM2: { 
		rp: 95,
		requires: ['XENOCOMM1'], 
		},
	XENOCOMM3: { 
		rp: 225,
		requires: ['XENOCOMM2'], 
		}

	};
	
//  Sane defaults for missing values
for ( let k in Techs ) { 
	Techs[k].key = k; 
	Techs[k].img = Techs[k].img || 'img/workshop/tech/techmock.jpg';
	Techs[k].icon = Techs[k].icon || 'img/workshop/icons/star.png';
	Techs[k].name = Techs[k].name || 'UNKNOWN';	
	Techs[k].desc = Techs[k].desc || 'Missing Description';	
	}
	
for ( let k in TechNodes ) { 
	TechNodes[k].key = k; 
	TechNodes[k].img = TechNodes[k].img || 'img/workshop/tech/techmock.jpg';
	TechNodes[k].icon = TechNodes[k].icon || 'img/workshop/icons/star.png';
	TechNodes[k].rp = TechNodes[k].rp || 0;	
	TechNodes[k].requires = TechNodes[k].requires || [];
	// if there is no yield, look for a similarly named tech (usually the same anyway)
	if ( !TechNodes[k].yields && Techs.hasOwnProperty(k) ) {
		TechNodes[k].yields = [k];	
		}
	// names and descriptions can fall back to the yielded tech since these are
	// usually the same and only need to be overridden for group techs.
	if ( !TechNodes[k].name ) {
		TechNodes[k].name = Techs[ TechNodes[k].yields[0] ].name;	
		}
	if ( !TechNodes[k].desc ) {
		TechNodes[k].desc = Techs[ TechNodes[k].yields[0] ].desc;	
		}
	}