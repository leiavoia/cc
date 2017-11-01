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
	
	flag_img = 'img/workshop/flag_mock.gif';
	diplo_img = 'img/races/diplo_race_000.jpg';
	diplo_img_small = 'img/races/diplo_race_000s.jpg';
	color = '#FFFFFF';
	color_rgb = [255,255,255];
	
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
				[20, 20, 235], 	// blue
				[219, 210, 72], 	// yellow
				[10, 128, 30], 	// green
				[15, 155, 155],	// teal
				[192, 192, 192], 	// silver
				[255, 0, 0], 		// red
				[0, 255, 0], 		// lime
				[100, 100, 100], 	// grey
				[128, 128, 0], 	// olive
				[30, 30, 170], 	// navy
				[255, 0, 255],		// fuschia
				[128, 0, 128],		// purple
				[0, 255, 255]		// aqua
				];
			Civ.colors.shuffle();
			} 
		return Civ.colors;
		}
	static PickNextStandardColor() {
		return Civ.StandardColors()[ Civ.total_civs ];
		}
	static IncTotalNumCivs() {
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
					targets.push(p);
					}
				}
			}
		// have colony ships?
		if ( targets )  {
			console.log(`[${targets.length}] targets`);
			for ( let f of this.fleets ) {
				// parked?
				if ( f.colonize && f.star && !f.dest ) { 
					next_ship:
					for ( let s of f.ships ) {
						if ( s.colonize ) { 
							// can i settle anything where i am?
							for ( let p of f.star.planets ) { 
								if ( !p.owner ) { 
									console.log(`F${f.id}: i'm already here, so i'm going to settle ${p.name}`);
									p.Settle( this );
									f.RemoveShip( s );
									if ( !f.ships.length ) { f.Kill(); }
									else { f.FireOnUpdate(); }
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
								console.log(`F${f.id}: chose target ${t.name}`);
								let myfleet = null;
								// split fleet if more than ship in fleet
								if ( f.ships.length > 1 ) { 
									console.log(`F${f.id}: i'm splitting off and headed for ${t.name}`);
									f.RemoveShip(s); // old fleet
									myfleet = new Fleet( f.owner, f.star );
									myfleet.ships = []; // TODO: remove this debug junk
									myfleet.AddShip(s);
// 									console.log(`sending fleet ${myfleet.id} from ${f.star.name} to ${t.name} `);
									myfleet.SetDest(t.star);
									}
								else {
									console.log(`F${f.id}: i'm on my own and headed for ${t.name}`);
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
