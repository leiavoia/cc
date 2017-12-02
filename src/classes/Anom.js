// import Civ from './Civ';
import * as utils from '../util/utils';
// import * as Signals from '../util/signals';


export default class Anom {
	
	objtype = 'anom';
	id = 0;
	name = 'Anomaly';
	type = 'normal';
	xpos = 0;
	ypos = 0;
	fleets = [];
	settled = false; // set to true to tell the UI to do special stuff
	explored = false; // set to true to tell the UI to do special stuff
	in_range = false; // set to true to tell the UI to do special stuff
	order = 0; // for exploration
	onmap = false;
	vis_level = 0;
	size = 100; // measure of how much it takes to research this anom
	collected = false; // NULL = not collectable, FALSE = not collected, TRUE = collected
	researched = new Map();
	
	// pre-discovery description. A hint of what lurks inside
	pre_desc = 'A strange anomaly.';
	// post discovery summary / backstory / color commentary
	post_desc = `We checked it out and it was just the neighbor's cat.`;
	
	// a callback you can override
	onComplete( fleet ) { 
		
		}
		
	AmountResearched( civ ) {
		return this.researched.get( civ ) || 0;
		}
	ResearchIsCompleted( civ ) {
		return this.researched.get( civ ) >= this.size;
		}
	AddResearch( civ, amount ) {
		let a = this.researched.get( civ ) || 0;
		if ( a < this.size ) { 
			this.researched.set( civ, Math.min( this.size, a + amount ) );
			let finished = ( a + amount ) >= this.size;
			if ( finished && this.collected === false ) { this.collected = true; }
			return finished;
			}
		else {
			return true;
			}
		}
		
	static IncNextID() {
		if( !this.next_id && this.next_id!==0 ){
			this.next_id=1;
			}
		else{
			this.next_id++;
			}
		return this.next_id;
		}
		
	constructor( name, type, xpos, ypos ) { 
		this.type = type;
		this.xpos = xpos;
		this.ypos = ypos;	
		this.id = Anom.IncNextID();
		this.name = 'Anomaly ' + this.id; //( name || /*utils.RandomName()*/'X' ).uppercaseFirst();
		}
		
	static Random( x, y ) {
// 		let color = 'blue';
// 		let color_index = utils.BiasedRand(0,1,galaxy_age,2);	
// 		if ( color_index > 5/6 ) { color = 'red'; }
// 		else if ( color_index > 4/6 ) { color = 'orange'; }
// 		else if ( color_index > 3/6 ) { color = 'yellow'; }
// 		else if ( color_index > 2/6 ) { color = 'white'; }
// 		else if ( color_index > 1/6 ) { color = 'cyan'; }
		let a = new Anom( /*utils.RandomName()*/ 'X', 'normal', x, y );
		a.onmap = !( Math.random() > 0.5 ); // 50% chance of being a map object
		a.size = utils.RandomInt( 2, 50 ) * 10;
		a.vis_level = 0; // utils.RandomInt(0,2);
		a.order = utils.RandomInt( 0, 100 );
		return a;
		}
	}

