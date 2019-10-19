import Anom from './Anom';
import Star from './Star';
import Planet from './Planet';
import Civ from './Civ';
import Fleet from './Fleet';
import * as utils from '../util/utils';
import {Ship,ShipBlueprint} from './Ship';

export default class Galaxy {
	id = null;
	fleets = []; // maps to Fleet.all_fleets
	stars = [];
	civs = [];
	historical_civs = []; // for graphs
	anoms = [];
	width = 2000;
	height = 2000;
	age = 0.5;
	bg_img = 'img/map/bg/spacebg_031.jpg';
	stats = {
		x: 0,
		y: 0,
		sectors: 0,
		density: 0,
		stars: 0,
		planets: 0,
		anoms: 0,
		age: 0,
		crazy: 0
		};
		
	constructor( data ) { 
		this.id = utils.UUID();
		if ( data ) { Object.assign( this, data ); }
		this.fleets = Fleet.all_fleets;
		}
		
	toJSON() { 
		return {
			_classname: 'Galaxy',
			stats: this.stats,
			id: this.id,
			height: this.height,
			width: this.width,
			age: this.age,
			bg_img: this.bg_img,
			stars: this.stars.map( x => x.id ),
			anoms: this.anoms.map( x => x.id ),
			civs: this.civs.map( x => x.id ),
			// dont need to save fleets list
			};
		}
		
	Pack( catalog ) { 
		catalog[ this.id ] = this.toJSON();
		for ( let x of this.stars ) { x.Pack(catalog); }
		for ( let x of this.anoms ) { x.Pack(catalog); }
		for ( let x of this.civs ) { x.Pack(catalog); }
		} 	
		
	Unpack( catalog ) {
		this.stars = this.stars.map( x => catalog[x] );
		this.civs = this.civs.map( x => catalog[x] );
		this.anoms = this.anoms.map( x => catalog[x] );
		}
						
	// size is in number of sectors, 
	// where sector is 400px and max one star per sector
	Make( sectors, density, galaxy_age = 0.5, crazy = 0 ) {
		
		const sectors_requested = sectors;
		const strategy = 'attraction'; // [attraction,shuffle]
		const cell_size = 400;
		const min_edge = 4;
		
		// reset data
		this.stars = [];
		this.anoms = [];
		
		// random background wallpaper
		this.bg_img = 'img/map/bg/spacebg_' + ("000" + utils.RandomInt(0,75)).slice(-3) + '.jpg';
		
		// sane limits
		sectors = Math.min( 10000, Math.max( 16, sectors ) );
		
		// take sqrt of the number of sectors for the ideal square edge
		let map_size_x = Math.ceil( Math.sqrt( sectors ) * 2 );
		let map_size_y = Math.ceil( utils.BiasedRand(min_edge, (map_size_x-min_edge), (map_size_x*0.5), (1.0-crazy)  ) );
		map_size_x -= map_size_y;
		// actual square should always be bigger than requested number of sectors
		while ( map_size_x * map_size_y < sectors_requested ) { ++map_size_y; }
		sectors = Math.ceil( map_size_x * map_size_y ); // finalize
		// make sure we always have horizontal galaxies
		if ( map_size_x < map_size_y ) {
			[map_size_x,map_size_y] = [map_size_y,map_size_x];
			}			
		
		// for aesthetics and UI reasons, 
		// we want an empty padded border.
		this.width = ((map_size_x+2) * cell_size) + 1 + cell_size; // leave room for sidebar
		this.height = ((map_size_y+2) * cell_size) + 1; // +1 is to get the sector overlay graphic border
		this.age = galaxy_age;
		
		// represent the galaxy as an array of bools, 
		// where the 1D array is the flattened version of a 2D array of sectors.
		// We assign the first X slots to be a star ("true")
		let stars_wanted = Math.ceil( sectors * Math.max( 0.05, density ) );
		if ( sectors < stars_wanted ) { stars_wanted = sectors; }
		let remainder = sectors - stars_wanted;
		// anomalies cover 50% of un-starred space or 30% of total space, 
		// whichever is less.
		let num_anoms = Math.min( Math.floor( remainder * 0.5 ), Math.floor( sectors * 0.3) );
		remainder -= num_anoms;
		let arr = [];
		
		// this is where the shape of the galaxy is determined. 
		if ( strategy == 'attraction' ) { 
				
			arr = new Array(sectors);
			let avail_indexes = new Array(sectors);
			for ( let i=0; i < sectors; i++  ) { avail_indexes[i] = i; }
			avail_indexes.shuffle();
			
			let num_attractors = 10 * crazy;	
			let attractors = [];
			for ( let a=0; a < num_attractors ; a++ ) { 
				let attractor = { 
					x: utils.RandomInt( 2, map_size_x-2 ), 
					y: utils.RandomInt( 2, map_size_y-2 ), 
					s: utils.BiasedRandInt( 
						(( map_size_x + map_size_y ) * -1),
						// 0,
						(( map_size_x + map_size_y ) * 2 ),
						// (( map_size_x + map_size_y ) ),
						0,
						0.5
						)
					}; 
				attractors.push( attractor );			
				}
			
			// returns next open spot in a spiral
			let NextInSpiral = function ( px, py ) {
				var x = 0;
				var y = 0;
				var delta = [0, -1];
				for ( let i = Math.pow(Math.max(map_size_x, map_size_y), 2); i>0; i--) {
					if ( px+x > 0 && px+x < map_size_x && py+y > 0 && py+y < map_size_y ) {
						let index = (px+x)*map_size_y + (py+y);
						if ( !arr[index] ) { return index; }
						}
					// change direction
					if ( x === y || (x < 0 && x === -y) || (x > 0 && x === 1-y) ){
						delta = [-delta[1], delta[0]];
						}
					x += delta[0];
					y += delta[1];        
					}	
				return 0;		
				}
				
			let PlaceGalacticObject = function ( objtype = 1 ) {
				// random starting point
				let px = utils.RandomInt(0,map_size_x);
				let py = utils.RandomInt(0,map_size_y);
				// attract point
				let vectors = [];
				for ( let attractor of attractors ) { 
					let dx = Math.abs( px - attractor.x ); 
					let dy = Math.abs( py - attractor.y );
					let dist = Math.sqrt( dx*dx + dy*dy );
					let force = attractor.s / Math.pow(dist,1.1);
					let new_dist = Math.max( dist - force, 0 );
					let dist_ratio = new_dist / dist;
					vectors.push( [
						( attractor.x - px ) * (1-dist_ratio),
						( attractor.y - py ) * (1-dist_ratio)
						] );
					}
				
				// add vectors
				let baricenter = [0,0];
				for ( let v of vectors ) {
					baricenter[0] += v[0];
					baricenter[1] += v[1];
					}	
				let new_x = utils.Clamp( Math.floor( baricenter[0] + px ), 0, map_size_x-1 );
				let new_y = utils.Clamp( Math.floor( baricenter[1] + py ), 0, map_size_y-1 );
				
				// if point is taken, find something nearby
				let index = new_x*map_size_y + new_y;
				if ( arr[index] ) {
					index = NextInSpiral( new_x, new_y );
					}
				// gotcha
				if ( !arr[index] ) {
					arr[index] = objtype;
					let i = avail_indexes.indexOf( index );
					if ( i >= 0 ) { avail_indexes.splice(i,0); }
					}
				// backup plan: just pick a random spot
				else {
					arr[ avail_indexes.pop() ] = objtype;
					}
				}
			
			for ( let i=0; i < stars_wanted; i++ ) { PlaceGalacticObject(1); }
			for ( let i=0; i < num_anoms; i++ ) { PlaceGalacticObject(2); }
			
			// random scattering
			for ( let i = 0; i < sectors*0.1; i++ ) {
				let one = utils.RandomInt( 0, sectors-1 );
				let two = utils.RandomInt( 0, sectors-1 );
				let temp = arr[two];
				arr[two] = arr[one];
				arr[one] = temp;
				}
			}

		else /*if ( strategy == 'shuffle' )*/ { 
			arr = new Array( stars_wanted ).fill(1).concat( // stars
				new Array( num_anoms ).fill(2).concat( // anomalies
					new Array( remainder ).fill(0) // empty space
					)
				) ;
			arr.shuffle();
			}
				
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
			
		this.stats.x = map_size_x;
		this.stats.y = map_size_y;
		this.stats.sectors = sectors;
		this.stats.density = density;
		this.stats.stars = this.stars.length;
		this.stats.anoms = this.anoms.length;
		this.stats.age = galaxy_age;
		this.stats.crazy = crazy;
		this.stats.planets = 0;
		for ( let s of this.stars ) { this.stats.planets += s.planets.length; }
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
			if ( c.is_player ) { s.explored = true; }
			else { p.ZonePlanet(); }
			this.AssignStartingFleet( c, s );
			c.homeworld = p;
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
					p.resources.o = 3;
					p.resources.s = 3;
					p.resources.m = 3;
					p.size = 20;
					p.Settle( c );
					if ( c.is_player ) { s.explored = true; }
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
		this.historical_civs = [...this.civs];
		}
		
	AssignHomeWorlds() { 
		for ( let s of this.stars ) { 
			for ( let p of s.planets ) { 
				let i = utils.RandomInt( 0, this.civs.length-1 );
				if ( i != this.civs.length ) { 
					this.ForcePlanetEnvToMatchRace( p, this.civs[i] );
					p.resources.o = 3;
					p.resources.s = 3;
					p.resources.m = 3;
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
			// new Ship( owner.ship_blueprints[2] )
			];
		// for ( let i = 0; i < 2; i++ ) { 
		// 	let ship = owner.ship_blueprints[2].Make();
		// 	ship.troops.push( 
		// 		owner.groundunit_blueprints[0].Make()
		// 		);
		// 	f.ships.push( ship );
		// 	}
		f.ReevaluateStats();
		f.SortShips();
		return f;
		}
		
	CreateRandomFleet( owner, star ) { 
		let f = new Fleet( owner, star );
		for ( let i = 0, max = utils.RandomInt(2,12); i < max; i++ ) { 
			let which = utils.RandomInt(0,owner.ship_blueprints.length-1);
			let ship = owner.ship_blueprints[which].Make();
			// add ground units
			if ( which == 2 ) { 
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
