import Anom from './Anom';
import Star from './Star';
import Planet from './Planet';
import Civ from './Civ';
import Hyperlane from './Hyperlane';
import Fleet from './Fleet';
import * as utils from '../util/utils';
import {Ship,ShipBlueprint} from './Ship';

export default class Galaxy {
	fleets = []; // maps to Fleet.all_fleets
	stars = [];
	lanes = [];
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
		this.lanes = [];
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
	
	MakeDemo() {

		// reset data
		this.stars = [];
		this.lanes = [];
	
		this.width = 1600;
		this.height = 900;
		this.age = 0.5;
		
		// git us some stars and planets
		this.stars.push( Star.Random( 400, 150,  this.age ) );	
		this.stars.push( Star.Random( 300, 450,  this.age ) );	
		this.stars.push( Star.Random( 750, 415,  this.age ) );	
		this.stars.push( Star.Random( 700, 175,  this.age ) );	
		this.stars.push( Star.Random( 540, 600,  this.age ) );	
			
		this.MakeCivs(3);
		this.AssignHomeWorlds();
		
		}
		
	MakeExploreDemo() {

		// reset data
		this.stars = [];
		this.lanes = [];
	
		this.width = 1500;
		this.height = 1500;
		this.age = 0.5;
		
		// git us some stars and planets
		this.stars.push( Star.Random( 400, 150,  this.age ) );	
		this.stars.push( Star.Random( 300, 450,  this.age ) );	
		this.stars.push( Star.Random( 750, 415,  this.age ) );	
		this.stars.push( Star.Random( 700, 175,  this.age ) );	
		this.stars.push( Star.Random( 540, 600,  this.age ) );	
		
		this.MakeCivs(1);
		
		// settle one planet
		outer:
		for ( let s of this.stars ) { 
			if ( s.planets.length ) { 
				for ( let p of s.planets ) { 
					p.Settle( this.civs[0] );
					s.explored = true;
					break;
					}
				break;
				}
			}
		}	
		
	AddExploreDemo( num_civs=1 ) {

		// reset data
		this.lanes = [];
	
		this.MakeCivs( num_civs );
		
		// settle some planets
		let star_i = this.stars.length-1;
		this.stars.shuffle();
		for ( let c of this.civs ) { 
			while ( star_i >= 0 ) { 
				let s = this.stars[star_i];
				if ( s.planets.length ) { 
					let p = s.planets[0];
					p.Settle( c );
					if ( c.id == 0 ) { 
						s.explored = true;
						}
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
			new Ship( owner.ship_blueprints[5] ),
			new Ship( owner.ship_blueprints[6] ),
			new Ship( owner.ship_blueprints[6] ),
			new Ship( owner.ship_blueprints[6] )
			];
		f.ReevaluateStats();	
		return f;
		}
	}
