import Fleet from './Fleet';
// import Star from './Star';
import RandomName from '../util/RandomName';
import * as utils from '../util/utils';
import Constellation from './Constellation';
import Planet from './Planet';

export default class Civ {
	
	id = false;
	
	name = 'RACE';
	name_plural = 'RACITES';
	
	// we'll flesh this out later
	race = {
		env: { // natural habitat
			atm: 2,
			temp: 2,
			grav: 2,
			adaptation: 1, // levels to shift the habitability scale
			habitation: 2 // maximum bad planet we can settle
			},
		size: 1.0, // literal size of pop units
		};
	
	ship_range = 900; // px
	
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
		let i1 = Math.min(this.id,civ.id);
		let i2 = (i1 == civ.id) ? this.id : civ.id;
		if ( !Civ.relation_matrix ) { Civ.relation_matrix = []; }
		if ( !Civ.relation_matrix[i1] ) { Civ.relation_matrix[i1] = []; }
		if ( !Civ.relation_matrix[i1][i2] ) { Civ.relation_matrix[i1][i2] = (this.diplo_dispo + civ.diplo_dispo ) * 0.5; }
		return Civ.relation_matrix[i1][i2];
		}
		
	// The 'annoyed' meter relates to the player only. 
	// Other races are free to cheat. The player has no 
	// access to monitor inter-species communication.
	annoyed = 0.5;
	
	research = 0; // to split into cats later
	research_income = 0; // calculated per turn
	
	gov_type = 'feudal';
	gov_pts = 0;
	gov_pts_income = 0;
	
	treasury = 10000;
	
	ships = [];
	ship_designs;
	
	spy = []; // how to structure???
	econ = {
		income: 0,
		warehouse : 0,
		mp_need: 0,
		mp_need_met: 0 // 0..1
		}; // how to structure???
	policies = []; // how to structure???
	
	planets = [];
	constels = []; // list of connected constellations
	fleets = [];
	
	diplo = []; // list of contacts. starts empty
	
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
		return Civ.StandardColors()[ Civ.total_civs ];
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
		// internal flag roster picks unique flags for each race
		if ( !Civ.flag_id_roster ) { 
			Civ.flag_id_roster = [];
			for ( let i=0; i<=30; i++ ) { Civ.flag_id_roster.push(i); }
			Civ.flag_id_roster.shuffle();
			Civ.img_id_roster = [];
			for ( let i=0; i<=414 ; i++ ) { Civ.img_id_roster.push(i); }
			Civ.img_id_roster.shuffle();
			}
		this.flag_img = 'img/flags/flag_' + ("000" + Civ.flag_id_roster[this.id]).slice(-3) + '.png';
		this.diplo_img = 'img/races/alien_' + ("000" + Civ.img_id_roster[this.id]).slice(-3) + '.jpg';
		this.diplo_img_small = 'img/races/alien_' + ("000" + Civ.img_id_roster[this.id]).slice(-3) + '.jpg';
		// [!]DEBUG HACK
		this.lovenub = Math.random();
		this.annoyed = Math.random();
		this.diplo_dispo = Math.random();
		this.diplo_style = Math.random();
		this.diplo_skill = utils.BiasedRand(0.05, 0.25, 0.10, 0.5);
		}
	
	static Random( difficulty = 0.5 ) {
		let civ = new Civ;
// 		this.color_rgb = [ utils.RandomInt(0,255), utils.RandomInt(0,255), utils.RandomInt(0,255), ];
		civ.color_rgb = Civ.PickNextStandardColor();
// 		console.log( 'my colors are: ' + civ.color_rgb[0] + ' ' + civ.color_rgb[1] + ' ' + civ.color_rgb[2]  );
		return civ;
		}
		
	TurnAI( app ) {
		// build a list of targets, sorted by distance
		let targets = [];
		for ( let s of app.game.galaxy.stars ) { 
			for ( let p of s.planets ) {
				if ( !p.owner ) { 
					// TODO: respect ship range.
					// In order to calculate range, we have to check
					// every colony we have against every unclaimed
					// star system. Each civ has to keep track of their
					// own ship range and that's a lot of track-keeping.
					targets.push(p);
					}
				}
			}
		// have colony ships?
		if ( targets )  {
// 			console.log(`[${targets.length}] targets`);
			for ( let f of this.fleets ) {
				// parked?
				if ( f.colonize && f.star && !f.dest ) { 
					next_ship:
					for ( let s of f.ships ) {
						if ( s.colonize ) { 
							// can i settle anything where i am?
							for ( let p of f.star.planets ) { 
								if ( !p.owner ) { 
// 									console.log(`F${f.id}: i'm already here, so i'm going to settle ${p.name}`);
									p.Settle( this );
									f.RemoveShip( s );
									if ( !f.ships.length ) { f.Kill(); }
									else { f.FireOnUpdate(); }
									// i'm me?
									if ( this == app.game.myciv ) { 
// 										app.AddNote( 'good',`${p.name} Settled`,'',function(){app.FocusMap(p);});	
										}
	// 								this.mode = 'fleet';
	// 								this.app.CloseSideBar();
	// 								this.app.SwitchMainPanel('colonize',p);	
									//
									// TODO: destroy all refs to the ship
									//	
									break next_ship;
									}
								}
							if ( targets.length) { 
								// resort the list and send to the first target
								targets.sort( (a,b) => {
									if ( a.star == b.star ) { return 0; }
									let dist_a = 
										Math.pow( Math.abs(f.star.xpos - a.star.xpos), 2 ) 
										+ Math.pow( Math.abs(f.star.ypos - a.star.ypos), 2 ) 
										;
									let dist_b = 
										Math.pow( Math.abs(f.star.xpos - b.star.xpos), 2 ) 
										+ Math.pow( Math.abs(f.star.ypos - b.star.ypos), 2 ) 
										;
									if ( dist_a > dist_b ) { return -1; }
									else { return 1; }
									} );
								let t = targets.pop();
// 								console.log(`F${f.id}: chose target ${t.name}`);
								let myfleet = null;
								// split fleet if more than 1 ship in fleet
								if ( f.ships.length > 1 ) { 
// 									console.log(`F${f.id}: i'm splitting off and headed for ${t.name}`);
									f.RemoveShip(s); // old fleet
									myfleet = new Fleet( f.owner, f.star );
									myfleet.ships = []; // TODO: remove this debug junk
									myfleet.AddShip(s);
									console.log(`sending fleet ${myfleet.id} from ${f.star.name} to ${t.name} `);
									myfleet.SetDest(t.star);
									}
								else {
// 									console.log(`F${f.id}: i'm on my own and headed for ${t.name}`);
									f.SetDest(t.star);
									}
								}
							}
						}
					}
				}
			}
		}
		
	}
