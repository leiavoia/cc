import * as utils from '../util/utils';
import {Mod} from './Mods';
import {ShipBlueprint} from './Ship';

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
	// TODO: 'nature'. May need UI hint to indicate the general nature of the anomoly: good, bad, neutral.
	
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
		
	constructor( type, xpos, ypos ) { 
		// 'fromJSON' style object as first param. Note that stored JSON objects
		// do not contain all necessary properties. We need to fetch from the anom library.
		if ( type && typeof(type)==='object' && 'xpos' in type ) { 
			Object.assign( this, anom_list[type.key] );
			Object.assign( this, type ); 
			}
		// regular constructor
		else { 
			this.type = type;
			this.xpos = xpos;
			this.ypos = ypos;	
			this.id = utils.UUID();
			this.name = 'Anomaly ' + this.id; //( name || /*utils.RandomName()*/'X' ).uppercaseFirst();
	// 		this.name = 'Abandoned Cargo';
			this.collected = false; // collectable
			}
		}
		
	toJSON() { 
		let obj = {};
		for ( let k of ['pre_desc','post_desc','key','collected','size','vis_level','onmap','order','in_range', 'explored','settled','ypos','xpos','type','name','id'] ) { 
			obj[k] = this[k];
			}
		obj._classname = 'Anom';
		obj.fleets = this.fleets.map( x => x.id );
		obj.researched = {};
		for ( let [k,v] of this.researched ) {
			obj.researched[ k.id ] = v;
			}
		return obj;
		}
		
	Pack( catalog ) { 
		// console.log('packing Anom' + this.id + ' ' + this.name); 
		if ( !( this.id in catalog ) ) { 
			catalog[ this.id ] = this.toJSON(); 
			}
		}
	
	Unpack( catalog ) {
		this.fleets = this.fleets.map( x => catalog[x] );
		let map = new Map();
		for ( let k in this.researched ) {
			map.set( catalog[k], this.researched[k] );
			} 
		this.researched = map;
		}
				
	static CreateFrom( anomdata, x, y ) { 
		let a = new Anom( 'normal', x, y );
		Object.assign( a, anomdata );
		a.onmap = true;
		a.collected = false;
		a.vis_level = 0; // 0..2
		a.size = 1;
		a.order = utils.RandomInt( 0, 100 );
		return a;
		}
		
	static Random( x, y ) {
		let keys = Object.keys(anom_list);
		let list_i = utils.RandomInt( 0, keys.length-1 );
		let a = new Anom( 'normal', x, y );
		Object.assign( a, anom_list[keys[list_i]] );
		a.key = keys[list_i];
		a.onmap = !( Math.random() > 0.5 ); // 50% chance of being a map object
		a.collected = a.onmap ? null : false; // on-map anoms cant be collectable
		a.vis_level = 0;//utils.RandomInt(0,2);
		a.size = utils.RandomInt( 3, 80) * 10 * ( (a.vis_level+1) * 2 );
		a.order = utils.RandomInt( 0, 100 );
		return a;
		}
		
	// copied from Star
	FleetFor( civ ) { 
		for ( let f of this.fleets ) { 
			if ( f.owner == civ ) { 
				if ( !f.killme && !f.mission && !f.merged_with ) { return f; }
				else { return null; }
				}
			}
		return null;
		}
		
	}

let anom_list = {
	ABANDONED_CARGO: {
		pre_desc: 'Small object or gravitational disturbance detected.',
		post_desc: 'In the vacuum of space we found a stream of valuable cargo apparently jetisoned from a convoy. Who were the owners? Smugglers? Thieves? Regardless, we recovered the cargo and sold it off for {AMOUNT} credits.',		
		onComplete: function (fleet) { 
			this.name = 'Abandoned Cargo';
			let amount = Math.ceil( Math.random() * 500 ) * 10; 
			fleet.owner.resources.$ += amount;
			this.post_desc = this.post_desc.replace('{AMOUNT}',amount);
			}
		},
	ASTEROID: {
		pre_desc: 'Small object or gravitational disturbance detected.',
		post_desc: 'We found a small intersteller asteroid comprised mainly of precious metals. It was sold for {AMOUNT} credits.',		
		onComplete: function (fleet) { 
			this.name = 'Bonanza Asteroid';
			let amount = Math.ceil( Math.random() * 500 ) * 10; 
			fleet.owner.resources.$ += amount;
			this.post_desc = this.post_desc.replace('{AMOUNT}',amount);
			}
		},
	WRECKAGE: {
		pre_desc: 'Small object or gravitational disturbance detected.',
		post_desc: 'Research teams happened upon what appears to be the wreckage of a failed "orgship". It seems to have suffered an accident and was found drifting eternally end over end.',		
		onComplete: function (fleet) { 
			// find the next biology or engineering tech available
			let best_node = null;
			let max_rp = 4 * (fleet.owner.tech.current_project ? fleet.owner.tech.current_project.node.rp : 200);
			for ( let [k,n] of fleet.owner.tech.nodes_avail ) {
				if ( n.node.tags.contains('biology') || n.node.tags.contains('engineering') ) {
					if ( ( !best_node || n.node.rp < best_node.rp ) && n.node.rp <= max_rp ) { 
						best_node = n.node;
						}
					}
				}
			if ( best_node ) {
				fleet.owner.CompleteTechNode( best_node );
				this.post_desc += ` Studying the ship and its contents has taught us <b>${best_node.name}</b> technology.`;
				}
			else {
				this.post_desc += ` However, there was nothing to learn from this curiosity.`;
				}
			this.name = 'Mysterious Wreckage';
			}
		},
	FUEL_DEPO: {
		pre_desc: 'Abnormal energy signatures detected.',
		post_desc: 'We discovered a small deep space proto-star. It hasn\'t started solar fusion, so it makes a great resource for fuel. Our range has increased by {AMOUNT}.',		
		onComplete: function (fleet) {
			this.name = 'Fuel Deposit';
			let amount = Math.random() > 0.5 ? 50 : 100;
			fleet.owner.ship_range += amount;
			this.post_desc = this.post_desc.replace('{AMOUNT}',amount);
			}
		},
	PROBE: {
		pre_desc: 'Abnormal energy signatures detected.',
		post_desc: 'Drifting though space at sub-light speeds, research teams intercepted an uncrewed alien probe.',		
		onComplete: function (fleet) {
			// find the next propulsion or armor or shield or weapon tech available
			let best_node = null;
			let max_rp = 2 * (fleet.owner.tech.current_project ? fleet.owner.tech.current_project.node.rp : 200);
			for ( let [k,n] of fleet.owner.tech.nodes_avail ) {
				if ( n.node.tags.contains('propulsion') || n.node.tags.contains('armor') 
					|| n.node.tags.contains('weapon') || n.node.tags.contains('shield') ) {
					if ( ( !best_node || n.node.rp < best_node.rp ) && n.node.rp <= max_rp ) { 
						best_node = n.node;
						}
					}
				}
			if ( best_node ) {
				fleet.owner.CompleteTechNode( best_node );
				this.post_desc += ` Studying the probe has taught us <b>${best_node.name}</b> technology.`;
				}
			else {
				this.post_desc += ` However, there was nothing to learn.`;
				}			
			this.name = 'Probe';
			}
		},
	WRINKLE: {
		pre_desc: 'Abnormal energy signatures detected.',
		post_desc: 'This region of space exhibits unusual hyperspace geometry. It should give us a kind of 4-dimensional "shortcut". Our ship speed has increased by {AMOUNT}.',		
		onComplete: function (fleet) {
			this.name = 'Hyperspace Wrinkle';
			let amount = Math.random() > 0.5 ? 50 : 100;
			fleet.owner.mods.Add( new Mod('speed', '+', amount, this.name) );
			fleet.owner.fleets.forEach( f => f.ReevaluateStats() );
			this.post_desc = this.post_desc.replace('{AMOUNT}',amount);
			}
		},
	LOST_FIGHTER: {
		pre_desc: 'Small object or gravitational disturbance detected.',
		post_desc: 'Drifting in deep space, we discovered an abandoned spacecraft of unknown origin. The reseach team will will retrofit the craft for use in our own fleet and further manufacturing.',		
		onComplete: function (fleet) {
			this.name = 'Lost Spacecraft';
			let bp = new ShipBlueprint();
			bp.name = 'Lost Fighter';
			bp.img = 'img/ships/ship030_mock.png';
			if ( Math.random() > 0.2 ) bp.AddWeapon('RAYGUN', Math.ceil( Math.random() * 3 ) );
			if ( Math.random() > 0.2 ) bp.AddWeapon('LASER', Math.ceil( Math.random() * 3 ) );
			if ( Math.random() > 0.2 ) bp.AddWeapon('MISSILE', Math.ceil( Math.random() * 3 ) );
			if ( Math.random() > 0.6 ) bp.AddComponent('ENGINE1');
			if ( Math.random() > 0.6 ) bp.AddComponent('ARMOR1');
			if ( Math.random() > 0.6 ) bp.AddComponent('THRUSTERS1');
			if ( Math.random() > 0.6 ) bp.AddComponent('TARGETTING1');
			if ( Math.random() > 0.6 ) bp.AddComponent('SHIELD1');
			if ( Math.random() > 0.75 ) bp.AddComponent('RESEARCHLAB1');
			fleet.owner.ship_blueprints.push(bp);
			fleet.AddShip( bp.Make() );
			}
		}
	};
