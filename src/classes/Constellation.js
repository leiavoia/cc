import Star from './Star';
import Civ from './Civ';
import Planet from './Planet';
import * as utils from '../util/utils';

export default class Constellation {
	
	id = false;
	name = 'NO NAME';
	
	stars = [];
	
	scanlist = []; // used internally for flood filling
				
	econ = { 
		need: 0,
		have: 0,
		export: 0,
		reset: function () { 
			this.need = 0;
			this.have = 0;
			this.export = 0;				
			}
		};
					
	static IncNextID() {
		if( !this.next_id && this.next_id!==0 ){
			this.next_id=1;
			}
		else{
			this.next_id++;
			}
		return this.next_id;
		}

	constructor( name ) { 
		this.name = name.uppercaseFirst();
		this.id = Constellation.IncNextID();
		}
	
	// returns true if added
	AddStar( star ) {
		let i = this.stars.indexOf(star);
		if ( i == -1 ) { 
			this.stars.push( star ); 
			return true; 
			}
		return false;
		}
		
	// recursive function.
	FloodFill( star, civ_id ) {
		// add the star to the list if its not already there
		let acct = star.Acct(civ_id);
		if ( acct ) { 
			this.AddStar( star );
			acct.constel = this;
			}
		// if we havent scanned this star before, do it
		if ( this.scanlist.indexOf(star) == -1 ) { 
			this.scanlist.push( star );
			// add connected stars
			for ( let l of star.lanes ) { 
				// TODO: check for lane friendliness beyond ownership
				if ( l.from != star && l.owner.id == civ_id ) { this.FloodFill( l.from, civ_id ); }
				if ( l.to != star && l.owner.id == civ_id ) { this.FloodFill( l.to, civ_id ); }
				}
			}
		}
		
	static Refactor( civs ) { 
		
		if ( !Array.isArray(civs) ) { 
			civs = [ civs ];
			}
			
		// foreach civ
		for ( let civ of civs ) { 
			
			// each new constellation goes in here
			let constels = [];
			
			// make a temp list of stars
			let stars = [];
			for ( let p of civ.planets ) { 
				if ( stars.indexOf(p.star) == -1 ) { stars.push(p.star);  }
				}
			
			// while there are stars in the list
			while ( stars.length ) { 
				// pick the first star in the list
				let s = stars.shift();
				// get and purge the star's current contellation's star list.
				// we want to keep the constellation itself because it might
				// have historical records we want to keep.
				let constel = s.Acct( civ.id ).constel;
				constel.stars = [];
				constel.scanlist = [];
				// flood-fill the constellation (recursive)
				constel.FloodFill( s, civ.id );
				// delete stars in this constellation from the master list
				stars = stars.filter( x => constel.stars.indexOf(x) == -1 );				
				// add this constellation to the output list of constellations
				constels.push( constel );
				constel.scanlist = []; // clear
				}
				
			// reset the civ's master constellation list
			civ.constels = constels;
				
			}
			
		}
		
		
		
		
	}
