 import Fleet from './Fleet';
// import Star from './Star';
import RandomName from '../util/RandomName';
import * as utils from '../util/utils';
import * as Tech from './Tech';
import Planet from './Planet';
import {Ship,ShipBlueprint} from './Ship';
import {GroundUnit,GroundUnitBlueprint} from './GroundUnit';
import {WeaponList} from './WeaponList';
import {ShipComponentList} from './ShipComponentList';
import {Mod,Modlist} from './Mods';

export default class Civ {
	
	id = false;
	
	name = 'RACE';
	name_plural = 'RACITES';
	
	is_player = false; // set to true to indicate who the human is
  
	// we'll flesh this out later
	race = {
		env: { // natural habitat
			atm: 2,
			temp: 2,
			grav: 2,
			adaptation: 1, // levels to shift the habitability scale
			habitation: 1 // maximum bad planet we can settle
			},
		size: 1.0, // literal size of pop units
		is_monster: false, // true for space monsters. changes some UI formating.
		};
	
	// AI stuff
	ai = { 
		objectives: [],
		priorities: [], // TODO
		needs: { 
			colony_ships: 0,
			combat_ships: 0,
			troop_ships: 0,
			research_ships: 0,
			scout_ships: 0,
			troops: 0,
			cash: 1,
			tech: 1
			}
		};
		
	power_score = 0;
	
	homeworld = null; // a Planet // TODO // necessary?
	victory_ingredients = []; // list of VictoryIngredient objects
	
	ship_range = 750; // px
	ship_speed = 200; // HACK
	ship_blueprints = [];
	groundunit_blueprints = [];
	max_hull_size = 800; // HACK HARDSET FOR DEVELOPMENT
	avail_ship_comps = []; // components we can equip on ships
	avail_ship_weapons = []; // weapons we can equip on ships
	
	vis_level = 0; // HACK : 0 = space, 1 = hyperspace, 2 = subspace
	empire_box = {x1:0,x2:0,y1:0,y2:0};
	
	flag_img = 'img/workshop/flag_mock.gif';
	diplo_img = 'img/races/alien_000.jpg';
	diplo_img_small = 'img/races/alien_000.jpg';
	color = '#FFFFFF';
	color_rgb = [255,255,255];
	
	// diplomatic communication with other races is measured
	// by comparing their overlapping line segments composed 
	// of diplo_style +/- diplo_skill
	// US:   |----------------====#====-------|
	// THEM: |---------======#======----------|
	// the general spread of race types over diplo_style is (0..1) :
	// rocks - plants - organic - cyborgs - robots - energy - trandimensional
	diplo_style = 0.5; // 0..1, what kind of communication type this race uses 
	diplo_skill = 0.25; // 0..1, the range of communication skills this race has.
	diplo_dispo = 0.5; // 0..1, lovenub starting disposition when we meet other races.
	// integrate this with above later
	diplo = {
		contactable: true
		};
		
	CommOverlapWith( civ ) { 
		let min1 = utils.Clamp( this.diplo_style - this.diplo_skill, 0, 1 );
		let max1 = utils.Clamp( this.diplo_style + this.diplo_skill, 0, 1 );
		let range1 = max1 - min1;
		let min2 = utils.Clamp( civ.diplo_style - civ.diplo_skill, 0, 1 );
		let max2 = utils.Clamp( civ.diplo_style + civ.diplo_skill, 0, 1 );
		let range2 = max2 - min2;
		let overlap = Math.max(0, Math.min(max1, max2) - Math.max(min1, min2));
		let ratio1 = range1 ? ( overlap / range1 ) : 0;
		let ratio2 = range2 ? ( overlap / range2 ) : 0;
		// console.log(`mystyle=${this.diplo_style},myrange=${this.diplo_skill},theirstyle=${civ.diplo_style},theirrange=${civ.diplo_skill}`);
		// console.log(`min1=${min1},max1=${max1},min2=${min2},max2=${max2},range1=${range1},range2=${range2},overlap=${overlap}`);
		return Math.max(ratio1,ratio2); // return the greater of the ratios of overlap
		}
		
	LoveNub( civ ) {
		let key = Math.min(this.id,civ.id) + '-' + Math.max(this.id,civ.id);
		if ( !(key in Civ.relation_matrix) ) { 
			Civ.relation_matrix[key] = (this.diplo_dispo + civ.diplo_dispo ) * 0.5; 
			}
		return Civ.relation_matrix[key];
		}
		
	InRangeOfCiv( civ ) {
		let key = Math.min(this.id,civ.id) + '-' + Math.max(this.id,civ.id);
		return !!Civ.range_matrix[key];
		}
	
	SetInRangeOfCiv( civ, in_range = false ) {
		let key = Math.min(this.id,civ.id) + '-' + Math.max(this.id,civ.id);
		Civ.range_matrix[key] = in_range;
		}
	
	RecalcEmpireBox() { 
		this.empire_box = {x1:100000,x2:0,y1:100000,y2:0};
		this.planets.forEach( (v, k, array) => {
			this.empire_box.x1 = Math.min( this.empire_box.x1, v.star.xpos - this.ship_range );
			this.empire_box.y1 = Math.min( this.empire_box.y1, v.star.ypos - this.ship_range );
			this.empire_box.x2 = Math.max( this.empire_box.x2, v.star.xpos + this.ship_range );
			this.empire_box.y2 = Math.max( this.empire_box.y2, v.star.ypos + this.ship_range );
			});
		}
		
	// returns boolean
	InRangeOf( x, y ) {
		// easy box test
		if ( !utils.BoxPointIntersect( this.empire_box, x, y ) ) { 
			return false; 
			}
		let range = this.ship_range * this.ship_range ; // NOTE: avoid square rooting.
		for ( let p of this.planets ) { 
			let dist = 
				Math.pow( Math.abs(p.star.xpos - x), 2 )
				+ Math.pow( Math.abs(p.star.ypos - y), 2 );
			if ( dist <= range ) {
				return true;
				}
			}
		return false;
		}
		
	// The 'annoyed' meter relates to the player only. 
	// Other races are free to cheat. The player has no 
	// access to monitor inter-species communication.
	annoyed = 0.5;
	
	research = 0; // to split into cats later
	research_income = 0; // calculated per turn
	
	tech = {
		techs: new Map(),
		nodes_avail: new Map(),
		nodes_compl: new Map(),
		current_project: null
		};
		
	// set the civ up with starting technology roster
	InitResearch() { 
		// commit free seed nodes
// 		this.tech.nodes_compl.set( 'NODE0', {
// 			node: Tech.TechNodes.NODE0,
// 			key: 'NODE0',
// 			rp: 0 // how much research we've committed so far
// 			});
		this.RecalcAvailableTechNodes();
		this.AI_ChooseNextResearchProject();
		// TODO: some civs may get free techs or have other seed nodes
		}
		
	SelectResearchProject( key ) {
		if ( this.tech.nodes_avail.has(key) ) { 
			this.tech.current_project = this.tech.nodes_avail.get(key);
			}
		}
		
	AI_ChooseNextResearchProject() { 
		if ( !this.tech.current_project ) { 
			if ( !this.tech.nodes_avail.size ) { 
// 				console.warn(`CIV #${this.id} "${this.name}" ran out of research projects.`);
				}
			else {
				this.tech.current_project = this.tech.nodes_avail.values().next().value; // first item in list
				}
			}	
		}
		
	RecalcAvailableTechNodes() {
		nodescannerloop:
		for ( let key in Tech.TechNodes ) { 
			// if it isn't in either of our lists ...
			if ( !this.tech.nodes_avail.has(key) && !this.tech.nodes_compl.has(key) ) { 
				// check the prerequisites against our completed nodes
				let t = Tech.TechNodes[key];
				if ( t.requires ) { 
					for ( let req of t.requires ) { 
						if ( !this.tech.nodes_compl.has(req) ) { 
							continue nodescannerloop;
							}
						}
					// all prerequisites met. add the node to available list
					this.tech.nodes_avail.set( key, { node: t, key: key, rp: 0 } );
					}
				// else: this node has no prereqs, but these are 
				// usually special seed nodes, so do NOT add them here.
				}
			}
		}
		
	DoResearch( app ) { 
		let income = this.research_income;
		// pick something to work on if i dont already have one
		this.AI_ChooseNextResearchProject();
		let sanity_counter = 0;
		while ( income > 0.001 && this.tech.current_project && ++sanity_counter < 5 ) { 
			let rp_applied = Math.min( income, this.tech.current_project.node.rp - this.tech.current_project.rp );
			income -= rp_applied;
			this.tech.current_project.rp += rp_applied;
			// project completed?
			if ( this.tech.current_project.rp >= this.tech.current_project.node.rp ) { 
				// dispurse any techs
				if ( this.tech.current_project.node.yields.length ) { 
					for ( let t of this.tech.current_project.node.yields ) { 
						this.tech.techs.set(t,Tech.Techs[t]);
						Tech.Techs[t].onComplete( this ); // run callback
						}
					}
				// note to player
				if ( app.game.myciv == this && app.options.notify.research ) { 
					app.AddNote(
						'good',
						`${this.tech.current_project.node.name} completed.`,
						`Research on "${this.tech.current_project.node.name}" has been completed`,
						function(){app.SwitchMainPanel('tech');}
						);
					}
				// move node into the completed pile
				this.tech.nodes_compl.set(this.tech.current_project.key, this.tech.current_project );
				this.tech.nodes_avail.delete(this.tech.current_project.key);
				this.tech.current_project = null;
				// reevaluate our nodes available. completing the last node may have opened up new ones.
				this.RecalcAvailableTechNodes();
				// are there new nodes available?
				this.AI_ChooseNextResearchProject();			
				}
			}
		}
		
	gov_type = 'feudal';
	gov_pts = 0;
	gov_pts_income = 0;
	
	treasury = 10000;
	
	ships = [];
	ship_designs;
	
	econ = {
		income: 0,
		warehouse : 0,
		mp_need: 0,
		mp_need_met: 0 // 0..1
		}; // how to structure???
	policies = []; // how to structure???
	
	planets = [];
	fleets = [];
	
	// well-chosen colors for other races:
	static StandardColors() {
		if ( !Civ.colors ) { 
			Civ.colors = [
				[128, 0, 0], 		// maroon
				[45, 130, 220], 	// blue
				[219, 210, 72], 	// yellow
				[10, 128, 30], 	// forest green
				[15, 120, 155],	// teal
				[192, 192, 192], 	// silver
				[255, 0, 0], 		// red
				[0, 220, 0], 		// green
				[100, 100, 100], 	// grey
				[128, 128, 0], 	// olive
				[20, 66, 170], 	// navy
				[255, 0, 255],		// fuschia
				[128, 0, 128],		// purple
				[0, 255, 255],		// aqua
				[140,205,140],		// spring green
				[195,144,212],		// lavender
				[212,161,144],		// mid brown
				[120,80,24],		// dark brown
				[222,195,144],		// tan
				[190,102,40],		// dull orange
				[255,149,0],		// orange 
				[162,255,31],		// chartreuse
				[230,119,119],		// salmon
				[255,186,206]		// pink
				];
			Civ.colors.shuffle();
			} 
		return Civ.colors;
		}
		
	static PickNextStandardColor() {
		let colors = Civ.StandardColors();
		if ( Civ.total_civs < colors.length ) { 
			return colors[ Civ.total_civs ];
			}
		else { return [255,255,255]; } // default white
		}
		
	static IncTotalNumCivs( reset=false ) {
		if( !this.total_civs && this.total_civs!==0 ){
			this.total_civs=0;
			}
		else{
			this.total_civs++;
			}
		}




	constructor( name ) { 
		this.name = ( name || RandomName() ).uppercaseFirst();
		this.name_plural = name + 's';
		Civ.IncTotalNumCivs();
		this.id = Civ.total_civs;
		if ( !Civ.relation_matrix ) { Civ.relation_matrix = []; }
		if ( !Civ.range_matrix ) { Civ.range_matrix = []; }
		// internal flag roster picks unique flags for each race
		if ( !Civ.flag_id_roster ) { 
			Civ.flag_id_roster = [];
			for ( let i=0; i<=30; i++ ) { Civ.flag_id_roster.push(i); }
			Civ.flag_id_roster.shuffle();
			Civ.img_id_roster = [];
			for ( let i=0; i<=454 ; i++ ) { Civ.img_id_roster.push(i); }
			Civ.img_id_roster.shuffle();
			}
		this.flag_img = 'img/flags/flag_' + ("000" + Civ.flag_id_roster[this.id]).slice(-3) + '.png';
		this.diplo_img = 'img/races/alien_' + ("000" + Civ.img_id_roster[this.id]).slice(-3) + '.jpg';
		this.diplo_img_small = 'img/races/alien_' + ("000" + Civ.img_id_roster[this.id]).slice(-3) + '.jpg';
		this.mods = new Modlist( this.race );
		this.InitResearch();
		
		// starting ship bits:
		this.avail_ship_comps = [
			ShipComponentList.ENGINE1,
			ShipComponentList.ARMOR1,
			ShipComponentList.SHIELD1,
			ShipComponentList.COLONY1,
			ShipComponentList.RESEARCHLAB1,
			];
		this.avail_ship_weapons = [
			WeaponList.LASER,
			WeaponList.RAYGUN,
			WeaponList.MISSILE
			];
	
		// default ship set
		let colonizer = new ShipBlueprint();
		colonizer.name = 'Colony Ship';
		colonizer.img = 'img/ships/ship003_mock.png';
		colonizer.AddComponent( 'ENGINE1' );
		colonizer.AddComponent( 'RESEARCHLAB1' );
		colonizer.AddComponent( 'COLONY1' );
		this.ship_blueprints.push(colonizer);
	
		let fighter = new ShipBlueprint();
		fighter.name = 'Fighter';
		fighter.img = 'img/ships/ship002_mock.png';
		fighter.AddComponent( 'ENGINE1' );
		fighter.AddWeapon( 'LASER', 2 );
		fighter.AddComponent( 'ARMOR1' );
		this.ship_blueprints.push(fighter);
	
		let bomber = new ShipBlueprint();
		bomber.name = 'Bomber'; 
		bomber.img = 'img/ships/ship001_mock.png';
		bomber.AddWeapon( 'MISSILE', 2 );
		bomber.AddWeapon( 'RAYGUN', 1 );
		bomber.AddComponent( 'ENGINE1' );
		bomber.AddComponent( 'SHIELD1' );
		bomber.AddComponent( 'ARMOR2' );
		this.ship_blueprints.push(bomber);
			
		let hfighter = new ShipBlueprint();
		hfighter.name = 'Heavy Fighter'; 
		hfighter.img = 'img/ships/ship034_mock.png';
		hfighter.AddComponent( 'ENGINE1' );
		hfighter.AddWeapon( 'TURBOLASER', 4 );
		hfighter.AddComponent( 'ARMOR1' );
		this.ship_blueprints.push(hfighter);
		
		let battleship = new ShipBlueprint();
		battleship.name = 'Battleship'; 
		battleship.img = 'img/ships/ship025_mock.png';
		battleship.AddWeapon( 'HEAVYLASER', 2 );
		battleship.AddWeapon( 'TURBOLASER', 3 );
		battleship.AddWeapon( 'MISSILE', 2 );
		battleship.AddWeapon( 'BUCKSHOT', 2 );
		battleship.AddComponent( 'ARMOR2' );
		battleship.AddComponent( 'ENGINE1' );
		battleship.AddComponent( 'SHIELD2' );
		this.ship_blueprints.push(battleship);
			
	
		let cruiser = new ShipBlueprint();
		cruiser.name = 'Cruiser'; 
		cruiser.img = 'img/ships/ship035_mock.png';
		cruiser.AddWeapon( 'BUCKSHOT', 3 );
		cruiser.AddWeapon( 'SPACECANNON', 2 );
		cruiser.AddComponent( 'ENGINE1' );
		cruiser.AddComponent( 'ARMOR1' );
		cruiser.AddComponent( 'SHIELD2' );
		this.ship_blueprints.push(cruiser);
	
		let carrier = new ShipBlueprint();
		carrier.name = 'Troop Carrier'; 
		carrier.img = 'img/ships/ship021_mock.png';
		carrier.AddComponent( 'CARRIER1' );
		carrier.AddComponent( 'ENGINE1' );
		carrier.AddComponent( 'ARMOR1' );
		carrier.AddComponent( 'SHIELD2' );
		this.ship_blueprints.push(carrier);
			
		// ground unit hack
		let troop1 = new GroundUnitBlueprint();
		troop1.name = 'Basic Infantry';
		troop1.mindmg = 0;
		troop1.maxdmg = 5;
		troop1.mass = 5;
		troop1.labor = 5;
		troop1.hp = 1;
		this.groundunit_blueprints.push( troop1 );
		}
	
	static Random( difficulty = 0.5 ) {
		let civ = new Civ;
		civ.color_rgb = Civ.PickNextStandardColor();
		civ.lovenub = Math.random();
		civ.annoyed = Math.random();
		civ.diplo_dispo = Math.random();
		civ.diplo_style = Math.random();
		civ.diplo_skill = utils.BiasedRand(0.05, 0.25, 0.10, 0.5);
		civ.race.env.atm = utils.BiasedRandInt(0, 4, 2, 0.5);
		civ.race.env.temp = utils.BiasedRandInt(0, 4, 2, 0.5);
		civ.race.env.grav = utils.BiasedRandInt(0, 4, 2, 0.5);
		return civ;
		}
		
	// returns score, but you can also access this.power_score
	CalcPowerScore() { 
		this.score = 0;
		
		// planets
		let planet_score = 0;
		for ( let p of this.planets ) { 
			planet_score += p.score;
			planet_score += p.total_pop * 0.1;
			// local economy
			for ( let s of Object.keys(p.sect) ) { 
				planet_score += p.sect[s].output * 0.05;
				}
			}
			
		// ships
		let ship_score = 0;
		for ( let f of this.fleets ) { 
			if ( !f.killme ) { 
				ship_score += f.fp;
				}
			}
			
		// troops
		let ground_score = 0;
		for ( let p of this.planets ) { 
			ground_score += p.troops.length;
			}
		for ( let f of this.fleets ) { 
			ground_score += f.troops;
			}
		
		// tech level
		let tech_score = 0;
		for ( let t of this.tech.nodes_compl.values() ) { 
			tech_score += t.rp;
			}
			
		this.power_score = Math.round( 
			  ( planet_score * 10.0 )
			+ ( ship_score * 0.01 )
			+ ( ground_score * 2.0 )
			+ ( tech_score * 0.1 )
			+ ( this.treasury * 0.01 )
			);
			
		return this.power_score;
		}
		
	// find a particular objective
	AI_QueryObjectives( type, obj ) {
		for ( let o of this.ai.objectives ) { 
			if ( o.type == type && obj == o.obj ) { 
				return o;
				}
			}
		return null;
		}
		
	AI_EvaluateObjectives(app) { 
		this.AI_Colonize(app);
		this.AI_Defend(app);
		this.AI_Attack(app);
		this.AI_Intercept(app);
		}
	
	AI_Defend(app) {
	
		}
		
	AI_Attack(app) {
	
		}
		
	AI_Intercept(app) {
	
		}
		
	AI_Planets(app) {
		for ( let p of this.planets ) { 
			// colony ships
			if ( this.ai.needs.colony_ships > 0 ) { 
				for ( let bp of this.ship_blueprints ) { 
					if ( bp.colonize ) { 
						// note: by adding just one, it will
						// encourage other planets to build some too
						p.AddBuildQueueShipBlueprint( bp );
						--this.ai.needs.colony_ships;
						break;
						}
					}
				}
			else if ( this.ai.needs.colony_ships < 0 && p.prod_q.length > 1 ) { 
				// we need to get rid of some unbuilt colony ships
				for ( let i=1; i < p.prod_q.length; i++ ) { // start on the first one
					if ( p.prod_q[i].type == 'ship' && p.prod_q[i].obj.colonize ) {
						this.ai.needs.colony_ships += ( p.prod_q[i].qty == -1 ) ? 1 : p.prod_q[i].qty;
						}
					}
				}
			// combat ships
			if ( this.ai.needs.combat_ships > 0 ) { 
				
				}
			// troop ships
			if ( this.ai.needs.troop_ships > 0 ) { 
				
				}
			// research ships
			if ( this.ai.needs.research_ships > 0 ) { 
				
				}
			// research ships
			if ( this.ai.needs.scout_ships > 0 ) { 
				
				}
			// troops / ground units
			if ( this.ai.needs.troops > 0 ) { 
				
				}
			// tech research
			if ( this.ai.needs.tech > 0 ) { 
				
				}
			// cash
			if ( this.ai.needs.cash > 0 ) { 
				// already in queue?
				let inq = false;
				for ( let i of p.prod_q ) { 
					if ( i.obj == 'tradegoods' ) {
						inq = true; break;
						}
					}
				if ( !inq ) { 
					p.AddBuildQueueMakeworkProject( 'tradegoods' );
					}
				}
			}
		}
		
	AI_Colonize(app) {
		// build a list of targets, sorted by distance
		let targets = [];
		for ( let s of app.game.galaxy.stars ) { 
			for ( let p of s.planets ) {
				if ( !p.owner && p.Habitable( this.race ) && this.InRangeOf(p.star.xpos, p.star.ypos) ) { 
					targets.push(p);
					}
				}
			}
		// have colony ships?
		if ( targets.length )  {
			for ( let f of this.fleets ) {
				// parked and not on mission
				if ( f.colonize && f.star && !f.dest && f.star.objtype == 'star' && !f.mission ) { 
					next_ship:
					for ( let s of f.ships ) {
						if ( s.bp.colonize ) { 
							// can i settle anything where i am?
							for ( let p of f.star.planets ) { 
								if ( !p.owner && p.Habitable( this.race ) ) { 
									p.Settle( this );
									f.RemoveShip( s );
									if ( !f.ships.length ) { f.Kill(); }
									else { f.FireOnUpdate(); }
									// i'm me?
									if ( this == app.game.myciv && app.options.notify.settle ) { 
										app.AddNote( 'good',`${p.name} Settled`,'',function(){app.FocusMap(p);});	
										}
									// remove from target list
									targets.splice( targets.indexOf(p), 1 );
									break next_ship;
									}
								}
							if ( targets.length ) { 
								// resort the list and send to the first target
								targets.sort( (a,b) => {
									let score_a = a.ValueTo(this);
									let score_b = b.ValueTo(this);
									if ( score_a > score_b ) { return -1; }
									else { return 1; }
									} );
								let t = targets.shift();
// 								console.log(`Best planet was ${t.name} @ ${t.ValueTo(this)}`);
// 								for ( let x of targets ) { 
// 									console.log(`Runnerup: ${x.name} @ ${x.ValueTo(this)} :: size ${x.size}, SLOT: ${x.maxslots}, HAB ${x.Adaptation(this.race)} MINE ${x.sect.mine.pow}, PROD ${x.sect.prod.pow}, SCI ${x.sect.sci.pow}, DEF ${x.sect.def.pow}, ESP ${x.sect.esp.pow}, `);
// 									}
								let myfleet = null;
								// split fleet if more than 1 ship in fleet
								// TODO: escorts would be nice
								if ( f.ships.length > 1 ) { 
									f.RemoveShip(s); // old fleet
									myfleet = new Fleet( f.owner, f.star );
									myfleet.AddShip(s);
									myfleet.SetDest(t.star);
									}
								// otherwise send on its way
								else {
									f.SetDest(t.star);
									}
								}
							}
						}
					}
				}
			}
		// if i still have leftover targets, i dont have enough colony ships.
		this.ai.needs.colony_ships = targets.length;
		// see how many colony ships we already have in production. this may
		// indicate we need to build more or possibly cull some already queued.
		for ( let p of this.planets ) { 
			for ( let i of p.prod_q ) { 
				if ( i.type == 'ship' && i.obj.colonize ) {
					this.ai.needs.colony_ships -= ( i.qty == -1 ) ? 1 : i.qty;
					}
				}
			}
		}
		
	TurnAI( app ) {
		this.AI_EvaluateObjectives(app);
		this.AI_Planets(app);
		}
		
	}
