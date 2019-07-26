import Anom from './Anom';
import Star from './Star';
import Planet from './Planet';
import Civ from './Civ';
import Fleet from './Fleet';
import * as utils from '../util/utils';
import {Ship,ShipBlueprint} from './Ship';

export default class Galaxy {
	fleets = []; // maps to Fleet.all_fleets
	stars = [];
	civs = [];
	anoms = [];
	width = 2000;
	height = 2000;
	age = 0.5;
	
	constructor() { 
		this.fleets = Fleet.all_fleets;
		}
		
	// size is in number of sectors, 
	// where sector is 400px and max one star per sector
	Make( map_size_x, map_size_y, stars_wanted, galaxy_age = 0.5 ) {
		
		let cell_size = 400;
		
		// reset data
		this.stars = [];
		this.anoms = [];
	
		// for aesthetics and UI reasons, 
		// we want an empty padded border.
		this.width = ((map_size_x+2) * cell_size) + 1 + cell_size; // leave room for sidebar
		this.height = ((map_size_y+2) * cell_size) + 1; // +1 is to get the sector overlay graphic border
		this.age = galaxy_age;
		
		// represent the galaxy as an array of bools, 
		// where the 1D array is the flattened version 
		// of a 2D array of sectors.
		// We assign the first X slots to be a star ("true")
		let sectors = map_size_x * map_size_y;
		if ( sectors < stars_wanted ) { stars_wanted = sectors; }
		let remainder = sectors - stars_wanted;
		// anomalies cover 50% of un-starred space or 30% of total space, 
		// whichever is less.
		let num_anoms = Math.min( Math.floor( remainder * 0.5 ), Math.floor( sectors * 0.3) );
		remainder -= num_anoms;
		let arr =  new Array( stars_wanted ).fill(1).concat( // stars
			new Array( num_anoms ).fill(2).concat( // anomalies
				new Array( remainder ).fill(0) // empty space
				)
			) ;
	
		// this is where the shape of the galaxy is determined. 
		// Most of the time just shuffling works fine.
		arr.shuffle();
		
 		// loop over the array and create map objects
		let jitter = 135; // values 100..150 work well
		for ( let x = 0; x < map_size_x; x++ ) { 
			for ( let y = 0; y < map_size_y; y++ ) { 
				let cell = arr[ x*map_size_y + y ];
				if ( cell==1 ) {
					this.stars.push( Star.Random( 
						((x+1)*cell_size) + (cell_size*0.5) + Math.floor((Math.random() * jitter * 2) - jitter), 
						((y+1)*cell_size) + (cell_size*0.5) + Math.floor((Math.random() * jitter * 2) - jitter),  
						galaxy_age 
						) );					
					}
				else if ( cell==2 ) {
					this.anoms.push( Anom.Random( 
						((x+1)*cell_size) + (cell_size*0.5) + Math.floor((Math.random() * jitter * 2) - jitter), 
						((y+1)*cell_size) + (cell_size*0.5) + Math.floor((Math.random() * jitter * 2) - jitter)
						) );					
					}
				}
			}
		}
			
	ThreatDemo( num_civs=2 ) {

		this.MakeCivs( num_civs );
		
		// find stars with planets
		let stars = [];
		for ( let s of this.stars ) { 
			if ( s.planets.length ) { 
				stars.push(s);
				}
			}
		// settle some planets
		stars.shuffle();
		for ( let c of this.civs ) { 
			// homeworld
			let s = stars.pop();
			let p = s.planets[0];
			this.ForcePlanetEnvToMatchRace( p, c ); 
			p.resources.o = 3;
			p.resources.s = 3;
			p.resources.m = 3;
			p.size = 20;
			p.Settle( c );
			if ( c.id == 0 ) { s.explored = true; }
			else { p.ZonePlanet(); }
			this.AssignStartingFleet( c, s );
			c.homeworld = p;
// 			// colonies
// 			for ( let i=0, max = utils.RandomInt(1,2); stars.length && i < max; i++ ) { 
// 				let next = stars.pop();
// 				let p = next.planets[0];
// 				this.ForcePlanetEnvToMatchRace( p, c );
// 				p.Settle( c );
// 				if ( c.id == 0 ) { next.explored = true; }
//				else { p.ZonePlanet(); }
// 				// defending fleet
// 				this.CreateRandomFleet( c, next );
// 				}
			}
		
		return this.civs[0].homeworld.star;
		}	
			
	ForcePlanetEnvToMatchRace( p, civ ) { 
		p.atm = civ.race.env.atm;
		p.temp = civ.race.env.temp;
		p.grav = civ.race.env.grav;
		}
		
	AddExploreDemo( num_civs=1 ) {

		this.MakeCivs( num_civs );
		
		// settle some planets
		let star_i = this.stars.length-1;
		this.stars.shuffle();
		for ( let c of this.civs ) { 
			while ( star_i >= 0 ) { 
				let s = this.stars[star_i];
				if ( s.planets.length ) { 
					let p = s.planets[0];
					this.ForcePlanetEnvToMatchRace( p, c );
					p.size = 20;
					p.Settle( c );
					if ( c.id == 0 ) { s.explored = true; }
					else { p.ZonePlanet(); }
					this.AssignStartingFleet( c, s );
					c.homeworld = p;
					star_i--;
					break;
					}
				star_i--;
				}
			}
		
		return this.civs[0].homeworld.star;
		}	
		
	MakeCivs( num_civs, difficulty ) { 
		this.civs = [];
		for ( let i=0; i < num_civs; i++ ) { 
			this.civs.push( Civ.Random( difficulty ) );
			}
		}
		
	AssignHomeWorlds() { 
		for ( let s of this.stars ) { 
			for ( let p of s.planets ) { 
				let i = utils.RandomInt( 0, this.civs.length-1 );
				if ( i != this.civs.length ) { 
					this.ForcePlanetEnvToMatchRace( p, this.civs[i] );
					p.size = 20;
					p.Settle( this.civs[i] );
					}
				}
			}
		}
		
	AssignStartingFleet( owner, star ) { 
		let f = new Fleet( owner, star );
		f.ships = [
			new Ship( owner.ship_blueprints[0] ),
			new Ship( owner.ship_blueprints[1] ),
			new Ship( owner.ship_blueprints[1] ),
			new Ship( owner.ship_blueprints[2] ),
			new Ship( owner.ship_blueprints[3] ),
			new Ship( owner.ship_blueprints[3] ),
			new Ship( owner.ship_blueprints[4] ),
			new Ship( owner.ship_blueprints[5] )
			];
		for ( let i = 0; i < 2; i++ ) { 
			let ship = owner.ship_blueprints[6].Make();
			ship.troops.push( 
				owner.groundunit_blueprints[0].Make()
				);
			f.ships.push( ship );
			}
		f.ReevaluateStats();
		f.SortShips();
		return f;
		}
		
	CreateRandomFleet( owner, star ) { 
		let f = new Fleet( owner, star );
		for ( let i = 0, max = utils.RandomInt(2,12); i < max; i++ ) { 
			let which = utils.RandomInt(0,6);
			let ship = owner.ship_blueprints[which].Make();
			// add ground units
			if ( which == 6 ) { 
				ship.troops.push( 
					owner.groundunit_blueprints[0].Make()
					);
				}
			f.ships.push( ship );
			}
		f.ReevaluateStats();	
		f.SortShips();
		return f;
		}
	}
