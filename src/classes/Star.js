import Planet from './Planet';
import Civ from './Civ';
import Constellation from './Constellation';
import Hyperlane from './Hyperlane';
import RandomPicker from '../util/RandomPicker';
import RandomName from '../util/RandomName';
import * as utils from '../util/utils';
import {computedFrom} from 'aurelia-framework';


export default class Star {
	
	objtype = 'star';
	id = 0;
	name = 'UNKNOWN';
	color = 'white';
	xpos = 0;
	ypos = 0;
	planets = [];
	lanes = [];
	fleets = [];
	ownership_title_css = null;
	settled = false; // set to true to tell the UI to do special stuff
	explored = false; // set to true to tell the UI to do special stuff
	in_range = false; // set to true to tell the UI to do special stuff
	
	// UI hinting - If a civ has settled this star, it's Civ-ID will be in the list
	settled_by = []; 
	
	// accounts are used to keep track of activities per-civ,
	// because multiple civs can inhabit the star system.
	accts = null; // new Map();
	
	static IncNextID() {
		if( !this.next_id && this.next_id!==0 ){
			this.next_id=1;
			}
		else{
			this.next_id++;
			}
		return this.next_id;
		}
		
	constructor( name, color, xpos, ypos ) { 
		this.name = ( name || RandomName() ).uppercaseFirst();
		this.color = color;
		this.xpos = xpos;
		this.ypos = ypos;
		this.id = Star.IncNextID();
		this.accts = new Map();
		}
	
	@computedFrom('fleets')
	get PlayerHasLocalFleet() { 
		for ( let f of this.fleets ) { 
			if ( f.owner.is_player ) { return true; }
			}
		return false;
		}
		
	ConnectLane( to, owner ) { 
		let l = new Hyperlane( this, to, owner );
		this.lanes.push(l);
		to.lanes.push(l);
		Constellation.Refactor( owner ); 	
		return l;
		}
// 	Disconnect( star ) { 
// 		this.lanes.indexOf( star
// 		}
		
	// helper function returns the account of the civ
	Acct( civ_id ) {
		civ_id = this.AccountConvertToCivID( civ_id );
		return this.accts.get(civ_id);
		}
	AddAccount( civ_id ) {
		civ_id = this.AccountConvertToCivID( civ_id );
		if ( !this.accts.has( civ_id ) ) { 
			let constel = new Constellation( this.name );
			constel.AddStar(this);
			this.accts.set( civ_id, {
				constel: constel, // default. will get refactored by the planet.Settle()
				time: Date.now(), // unix timestamp. used for naming constellations later on
				econ: { 
					need: 0,
					have: 0,
					export: 0,
					reset: function () { 
						this.need = 0;
						this.have = 0;
						this.export = 0;				
						this.imported = 0;				
						}
					}
				});
			}
		}
	// deletes if no more colonies in this system
	DeleteAccount( civ_id ) { 
		civ_id = this.AccountConvertToCivID( civ_id );
		if ( this.accts.has( civ_id )  ) { 
			let p = 0;
			// how many planets do they have left? 
			for ( let i =0; i < this.planets.length; i++ ) {
				if ( this.planets[i].owner !== false && this.planets[i].owner.id == civ_id ) {
					p++;
					}
				}
			if ( p == 0 ) { 
				this.accts.delete(civ_id);
				}
			}
		}
	AccountConvertToCivID( civ ) { 
		if ( civ instanceof Civ ) { return civ.id; }
		else if ( Number.isInteger(civ) ) { return civ; }
		else { return parseInt(civ); }
		}
		
	UpdateOwnershipTitleColorCSS() {
		// figure out how many people own how many planets
		let colors = new Map(); // maps civ colors to planet count
		let total_planets = 0;
		this.settled_by = new Array(); // hint fo aurelia to refresh
		for ( let p of this.planets ) { 
			if ( p.owner !== false ) { 
				if ( !colors.has( p.owner.color_rgb ) ) { colors.set(p.owner.color_rgb, 1); }
				else { colors.set(p.owner.color_rgb, colors.get(p.owner.color_rgb)+1 ); }
				total_planets++;
				// update this while we're here
				this.settled_by[p.owner.id] = true;
				}
			}
		if ( total_planets ) { 
			this.settled = true;
			// convert to percentages
			for ( let [k, v] of colors ) {
				colors.set(k, (v / total_planets) * 100.0);
				}
			let css = 'background-image: linear-gradient( to right, ';
			let cum_total = 0, counter = 0;
			let prev_perc = 0;
			for ( let [k, v] of colors ) {
				// fade in
				if ( counter == 0 ) { 
					css += `rgba( ${k[0]}, ${k[1]}, ${k[2]}, 0.0 ) 0%,`;
					} 
				cum_total += v;
				if ( counter == colors.size - 1 ) { cum_total = 100.0; } 
				// previous marker
				css += `rgba( ${k[0]}, ${k[1]}, ${k[2]}, 1.0 ) ${(prev_perc*0.6)+20.0}%, `;
				// current marker
				css += `rgba( ${k[0]}, ${k[1]}, ${k[2]}, 1.0 ) ${(cum_total*0.6)+20.0}%, `;
				// fade out
				if ( counter == colors.size - 1 ) { 
					css += `rgba( ${k[0]}, ${k[1]}, ${k[2]}, 0.0 ) 100%`;
					}
				counter++;
				prev_perc = cum_total;
				}
			css +=  ');';
			this.ownership_title_css = css;
			}
		else {
			this.settled = false;
			this.ownership_title_css =  'background: none;';
			}
		}
		
	get colorDesc() { 
		switch ( this.color ) { 
			case 'blue' : return 'Blue stars are very young and violently hot, making life difficult.';
			case 'cyan' : return 'Young, bright, light-blue stars are hot and swarming with gas.';
			case 'white' : return 'White stars are larger, mid-life stars, and more likely to support life.';
			case 'yellow' : return 'Yellow stars are stable, well-adjusted stars suitable for most lifeforms.';
			case 'orange' : return 'Orange stars are older, cooler stars that easily support most life.';
			case 'red' : return 'Red stars are nearing the end of their life. Planets tend to be cold and lacking atmosphere.';
			case 'purple' : return 'Rare purple stars are not on the main sequence of steller life. They tend to have larger planets and enigmatic features.';
			case 'black' : return 'Black holes can support planets too, albeit in very different ways. Who knows what awaits?';
			case 'green' : return 'Ultra-rare green stars are not understood by science at all. They are not detectable by most means. Their contents are a mystery.';
			default: return 'A star, much like many other stars.';
			}
		}
		
	static get Colors() { 
		return ['black','white','red','orange','yellow','green','blue','cyan','purple'];
		}
		
	// galaxy age can range from 0.0 (young) to 1.0 (old)
	static Random( x, y, galaxy_age = 0.5  ) {
		// Explained: The stellar spectrum ranges from young/hot to old/cool as:
		// blue, cyan, white, yellow, orange, red
		// ranging from 0.0 - 1.0.		
		let color = 'blue';
		let color_index = utils.BiasedRand(0,1,galaxy_age,2);	
		if ( color_index > 5/6 ) { color = 'red'; }
		else if ( color_index > 4/6 ) { color = 'orange'; }
		else if ( color_index > 3/6 ) { color = 'yellow'; }
		else if ( color_index > 2/6 ) { color = 'white'; }
		else if ( color_index > 1/6 ) { color = 'cyan'; }
		// 3.0 percent chance of being purple
		// 1.5 percent chance of being black
		// 1.0 percent chance of being green
		let special_color_roll = Math.random();
		if ( special_color_roll >= 0.990 ) { color = 'green'; }
		else if ( special_color_roll >= 0.975 ) { color = 'black'; }
		else if ( special_color_roll >= 0.945 ) { color = 'purple'; }
		// create the star itself
		let star = new Star( RandomName(), color, x, y );
		// create planets
		let num_planets = utils.BiasedRandInt(0,5,0.75,1.00);
		// zero-planet stars get a 50% chance to become onesies
		if ( !num_planets && Math.random() > 0.5 ) { num_planets = 1; } 
		for ( let i=0; i < num_planets; i++ ) {
			let planet = Planet.Random( star );
			planet.name = star.name;
			if ( i == 0 ) { planet.name += ' Prime'; }
			else { planet.name += ' ' + utils.Romanize(i+1); }
			star.planets.push( planet );
			}
		return star;
		}
	}

