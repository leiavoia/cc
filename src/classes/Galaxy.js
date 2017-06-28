import Star from './Star';
import Planet from './Planet';
import Civ from './Civ';
import Hyperlane from './Hyperlane';
import Fleet from './Fleet';
import * as utils from '../util/utils';

export default class Galaxy {
	stars = [];
	lanes = [];
	civs = [];
	width = 2000;
	height = 2000;
	age = 0.5;
	
	Make( map_size_x, map_size_y, stars_wanted, galaxy_age = 0.5 ) {
		
		// reset data
		this.stars = [];
		this.lanes = [];
	
		this.width = map_size_x;
		this.height = map_size_y;
		this.age = galaxy_age;
		
		// git us some stars and planets
		let planet_cell_size = 400;
		let planet_ratio = stars_wanted / (((map_size_x-planet_cell_size)/planet_cell_size) * ((map_size_y-planet_cell_size)/planet_cell_size));
		for ( let x = planet_cell_size; x < map_size_x-(planet_cell_size); x += planet_cell_size ) { 
			for ( let y = planet_cell_size; y < map_size_y-(planet_cell_size); y += planet_cell_size ) { 
				if ( Math.random() <= planet_ratio ) {
					this.stars.push( Star.Random( 
						x + (Math.floor((Math.random() * 250)) - 125 ), 
						y + (Math.floor((Math.random() * 250)) - 125 ),  
						galaxy_age 
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
		
	AddExploreDemo() {

		// reset data
		this.lanes = [];
	
		this.MakeCivs(1);
		
		// settle one planet
		let star = null;
		let settled = null;
		this.stars.shuffle();
		for ( var s of this.stars ) { 
			if ( s.planets.length ) { 
				for ( let p of s.planets ) {
					s.explored = true;
					p.Settle( this.civs[0] );
					s.fleets.push( new Fleet( p.owner, s ) );
					break;
					}
				break;
				}
			}
		return s;
		}	
		
	MakeCivs( num_civs, difficulty ) { 
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
		
		
	}
