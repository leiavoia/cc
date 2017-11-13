import Star from './Star';
import Planet from './Planet';
import Civ from './Civ';
import Hyperlane from './Hyperlane';
import Fleet from './Fleet';
import * as utils from '../util/utils';

export default class Galaxy {
	fleets = []; // maps to Fleet.all_fleets
	stars = [];
	lanes = [];
	civs = [];
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
	
		// for aesthetics and UI reasons, 
		// we want an empty padded border.
		this.width = (map_size_x+2) * cell_size;
		this.height = (map_size_y+2) * cell_size;
		this.age = galaxy_age;
		
		// represent the galaxy as an array of bools, 
		// where the 1D array is the flattened version 
		// of a 2D array of sectors.
		// We assign the first X slots to be a star ("true")
		let sectors = map_size_x * map_size_y;
		if ( sectors < stars_wanted ) { stars_wanted = sectors; }
		let arr =  new Array( stars_wanted ).fill(true).concat(
			new Array( sectors - stars_wanted ).fill(false)
			) ;
	
		// these is where the shape of the galaxy is determined. 
		// Most of the time just shuffling works fine.
		arr.shuffle();
		
 		// loop over the array and create a star wherever we find a "true"
		for ( let x = 0; x < map_size_x; x++ ) { 
			for ( let y = 0; y < map_size_y; y++ ) { 
				if ( arr[ x*map_size_y + y ] ) {
					this.stars.push( Star.Random( 
						((x+1)*cell_size) + (Math.floor((Math.random() * 200)) + 100 ), 
						((y+1)*cell_size) + (Math.floor((Math.random() * 200)) + 100 ),  
						galaxy_age 
						) );					
					}
				}
			}


		// OLD METHOD
// 		let planet_ratio = stars_wanted / (((map_size_x-cell_size)/cell_size) * ((map_size_y-cell_size)/cell_size));
// 		for ( let x = cell_size; x < map_size_x-(cell_size); x += cell_size ) { 
// 			for ( let y = cell_size; y < map_size_y-(cell_size); y += cell_size ) { 
// 				if ( Math.random() <= planet_ratio ) {
// 					this.stars.push( Star.Random( 
// 						x + (Math.floor((Math.random() * 250)) - 125 ), 
// 						y + (Math.floor((Math.random() * 250)) - 125 ),  
// 						galaxy_age 
// 						) );				
// 					}
// 				}
// 			}
	
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
					s.explored = true;
					p.Settle( c );
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
			{
				name: 'Colony Ship',
				img: 'img/ships/ship3_mock.png',
				hp: 85,
				maxhp: 100,
				armor: 20,
				maxarmor: 28,
				shield: 13,
				maxshield: 20,
				att: 14,
				speed: 50,
				colonize: true,
				offroad: true,
				selected: true // default to selected for easier UI
				},
			{
				name: 'Defender mkII',
				img: 'img/ships/ship1_mock.png',
				hp: 62,
				maxhp: 100,
				armor: 20,
				maxarmor: 28,
				shield: 13,
				maxshield: 20,
				att: 14,
				speed: 100,
				colonize: false,
				offroad: true,
				selected: true // default to selected for easier UI
				},
			{
				name: 'Bomber',
				img: 'img/ships/ship2_mock.png',
				hp: 62,
				maxhp: 100,
				armor: 20,
				maxarmor: 28,
				shield: 13,
				maxshield: 20,
				att: 14,
				speed: 200,
				colonize: false,
				offroad: true,
				selected: true // default to selected for easier UI
				},
			];
		f.ReevaluateStats();	
		return f;
		}
	}
