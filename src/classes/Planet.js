import Star from './Star';
import Fleet from './Fleet';
import {App} from '../app';
import RandomPicker from '../util/RandomPicker';
import RandomName from '../util/RandomName';
import * as utils from '../util/utils';
import {computedFrom} from 'aurelia-framework';
import {Ship,ShipBlueprint} from './Ship';
import {GroundUnit,GroundUnitBlueprint} from './GroundUnit';
import {Mod,Modlist} from './Mods';
import {Zone,ZoneList} from './Zones';
import {AIPlanetsObjective} from './AI';
import {VictoryIngredients} from './VictoryRecipes';

export default class Planet {
	
	// UI and DATA ---------------------------------------
	id = null;
	star = null;
	established = 0; // turn planet was settled or conquered
	explored = false; // does what?
	owner = null; // false indicates unowned.
	name = 'UNKNOWN';
	total_pop = 0;
	maxpop = 10;
	popmax_contrib = 0; // used to calculate housing development from zones. resets every turn.
	morale = 1.0;	// multiplier, default 1.0, range 0-2
	troops = []; // list of GroundUnits defending planet.
	prod_q = []; // { type, obj (blueprint), name, cost (labor), qty, turns_left, pct }
	
	// PHYSICAL ATTRIBUTES -------------------------------
	energy = 1.0; // speeds up zone development
	size = 0; // base number of sectors planet can support
	atm = 0;
	temp = 0;
	grav = 0;
	physattrs = [];
	resources = {
		o:0, // organics
		s:0, // silicates
		m:0, // metals
		r:0, // redium
		g:0, // greenitoid
		b:0, // bluetonium
		c:0, // cyanite
		v:0, // violetronium
		y:0, // yellowtron
		};
	
	// AI ------------------------------------------------
	score = 0; // AI score of natural attributes
	ai_value = 0;
	ai_min_troops = 0; // minimum number of troops AI wants to keep to defend planet
	
	// ECONOMY -------------------------------------------
	sectors = 0; // based on size and modified by race and tech
	zones = [];
	zoned = 0; // number of sectors that have been zoned 
	output_rec = { $:0, o:0, s:0, m:0, r:0, g:0, b:0, c:0, v:0, y:0, ship:0, def:0, hou:0, esp:0, res:0 };
	resource_rec = { $:0, o:0, s:0, m:0, r:0, g:0, b:0, c:0, v:0, y:0, };
	acct_ledger = []; // list of { name, ... optional resources types ... }
	acct_total = {}; // totalled values of acct_ledger. This includes stuff not in resource_rec and output_rec
	acct_hist = []; 
	// throttling controls how resource input and output works for zones.
	// throttling takes time shift between positions, handled by MoveThrottle().
	throttle = 0.5; // where we are
	throttle_target = 0.5; // where we want to be
	throttle_speed = 1.0; // zone growth modifier
	throttle_output = 1.0; // zone output modifier
	throttle_input = 1.0; // zone resource consumption modifier
	
	tax_rate = 0.2;
	spending = 0.5;
	// max spending may be modable with technology improvements. 
	// zones support >100% spending values, but there is no 
	// penalty or cost increase for going over 100% yet.
	max_spending = 1.0 
	base_PCI = 10.0; // per capita income
	bonus_PCI = 0.0;	
	econ = {
		tax_rev: 0,
		GDP: 1.0, // gross domestic product
		PCI: 1.0, // per-capita income
		GF: 1.0, // growth factor
		};
			
	// POLICIES -------------------------------------------
	// Ship Destination: Where to send ships when they are built.
	// Valid options: NULL (here), '@' (nearest rondezvous point), Star (object)
	ship_dest = null; 
	
		
	constructor( star, name ) { 
		// regular constructor
		if ( star && 'xpos' in star ) { 
			this.star = star; 
			this.name = ( name || RandomName() ).uppercaseFirst();
			this.mods = new Modlist;
			this.id = utils.UUID();
			}
		// also takes alternate "fromJSON" data blob as first arg	
		else if ( star ) { 
			Object.assign( this, star );
			if ( this.zones.length ) {
				this.zones = this.zones.map( x => { 
					let z = new Zone(x);
					z.output_rec = x.output_rec;
					z.resource_rec = x.resource_rec;
					z.resource_estm = x.resource_estm;
					return z;
					} );
				} 
			}
		}
	
	toJSON() { 
		let obj = Object.assign( {}, this ); 
		obj._classname = 'Planet';
		obj.owner = this.owner ? this.owner.id : null;
		obj.troops = this.troops.map( x => x.id );
		if ( typeof(this.ship_dest) === 'object' && this.ship_dest ) {
			obj.ship_dest = this.ship_dest.id;
			} 
		obj.prod_q = this.prod_q.map( x => { // { item, turns }
			let o = Object.assign( {}, x ); // dont overwrite the original object
			// object may be a string (makework project) or a link to a blueprint to be built
			if ( typeof(o.obj)=='object' && 'id' in o.obj ) o.obj = o.obj.id;
			return o;
			} );
		obj.star = this.star.id; // could omit
		obj.mods = this.mods.toJSON();
		obj.zones = this.zones.map( x => ({
			key:x.key, 
			val:x.val,
			sect:x.sect,
			size:x.size,
			insuf:x.insuf,
			output_rec:x.output_rec, 
			resource_rec:x.resource_rec,
			resource_estm:x.resource_estm
			}) );
		obj.physattrs = this.physattrs.map( x => x.key );
		// optionally remove history to save space;
		if ( !App.instance.options.graph_history ) { 
			delete(obj.acct_hist);
			}
		return obj;
		}
		
	Pack( catalog ) { 
		if ( !( this.id in catalog ) ) { 
			catalog[ this.id ] = this.toJSON(); 
			for ( let x of this.troops ) { x.Pack(catalog); }
			}
		}	

	Unpack( catalog ) {
		this.star = catalog[this.star];
		this.owner = this.owner ? catalog[this.owner] : null;
		if ( Number.isInteger(this.ship_dest) ) { 
			this.ship_dest = catalog[this.ship_dest];
			}
		this.prod_q = this.prod_q.map( x => {
			if ( Number.isInteger(x.obj) ) { x.obj = catalog[x.obj]; }
			return x;
			} );
		this.troops = this.troops.map( x => catalog[x] );
		this.physattrs = this.physattrs.map( x => PlanetAttrs[x] );
		this.mods = new Modlist(this.mods);
		this.mods.Unpack(catalog);
		// this line doesnt work because parent's modlist may not yet be unpacked
		// if ( this.owner ) this.mods.parent = this.owner;
		}
				
	static Random( star ) {
		// create the planet itself
		let planet = new Planet(star);
		
		// calculate the "age" of the star based on color, mapped to 0.0 .. 1.0
		let star_age = 0.5; // default for off-track stars
		if ( star.color == 'cyan' ) { star_age = 1/5.0; }
		else if ( star.color == 'white' ) { star_age = 2/5.0; }
		else if ( star.color == 'yellow' ) { star_age = 3/5.0; }
		else if ( star.color == 'orange' ) { star_age = 4/5.0; }
		else if ( star.color == 'red' ) { star_age = 1.0; }
		else if ( star.color == 'blue' ) { star_age = 0.0; }
		// physical environment depends on star color
		// purple, green, and black stars are totally random
		if ( star.color == 'black' || star.color == 'purple' || star.color == 'green' ) { 
			planet.atm = utils.RandomInt(0,4);
			planet.temp = utils.RandomInt(0,4);
			planet.grav = utils.RandomInt(0,4);
			}
		else {
			let star_age_mod = star_age + 1.0;
			planet.atm = utils.BiasedRandInt(0, 4, (1.0-star_age)*4.0, 0.3);
			planet.temp = utils.BiasedRandInt(0, 4, (1.0-star_age)*4.0, 0.3);
			}
			
		// younger stars have more energy potential, making them better for industry
		let energy_salt = 0.8 + ((1.0-star_age) - 0.5);
		planet.energy = Math.pow( utils.BiasedRand(0.3, 1.732, energy_salt, 0.8), 2 );
		// rare planet types are just totally wacky
		if ( star.color == 'purple' ) { planet.energy = utils.RandomFloat( 0.2, 3.0 ); }
		if ( star.color == 'black' ) { planet.energy = utils.RandomFloat( 0.2, 5.0 ); }
		if ( star.color == 'green' ) { planet.energy = utils.RandomFloat( 0.2, 8.0 ); } 
		planet.energy = parseFloat( planet.energy.toFixed(1) );
		
		// size is not dependent on star or galaxy. just random.
		planet.size = utils.BiasedRandInt(4, 25, 10, 0.5);
		// ... unless you are a special color
		if ( star.color == 'purple' ) { planet.size += utils.RandomInt(0, 5); }
		else if ( star.color == 'black' ) { planet.size += utils.RandomInt(0, 10); }
		else if ( star.color == 'green' ) { planet.size += utils.RandomInt(0, 15); }
		// 1% chance of getting a flat-out whopper
		if ( Math.random() > 0.99 ) { planet.size = utils.RandomInt(25, 40); }
		
		// gravity generally coralates with size, except for weird stars
		if ( star.color == 'black' || star.color == 'purple' || star.color == 'green' ) { 
			planet.grav = utils.RandomInt(0,4);
			}
		else {
			planet.grav = utils.Clamp( utils.BiasedRandInt(0, 4, planet.size/5, 1.0), 0, 4);
			}
			
			
		let rarity = Math.abs( planet.atm - planet.temp ); // high number = more off the main line of probability.		
		let rarity_bonus = 0;
		if ( star.color == 'purple' ) { rarity_bonus = 0.2; }
		if ( star.color == 'black' ) { rarity_bonus = 0.35; }
		if ( star.color == 'green' ) { rarity_bonus = 0.5; } 
		
		// resources are integers 0..5
		// organics determined by proximity to atm/temp sweet spot at 2,2
		let sweetspot_offset = Math.min( 5, Math.abs(2-planet.atm) + Math.abs(2-planet.temp) );
		if ( Math.random() > sweetspot_offset * 0.28 ) { planet.resources.o = utils.BiasedRandInt(1, 5, 5-sweetspot_offset, 0.0); }
		// silicates totally random
		if ( Math.random() < 0.5 ) { planet.resources.s = utils.BiasedRandInt(0, 5, 1, 0.35); }
		// metals more common in old stars
		if ( Math.random() < star_age ) { planet.resources.m = utils.BiasedRandInt(0, 5, 1+star_age*2, 0.0); }
		// uncommon resources vary on star age
		if ( Math.random() < 0.5-(1-star_age)*0.5 ) { planet.resources.r = utils.BiasedRandInt(0, 5, 1, 0.75); }
		if ( Math.random() < 0.25 ) { planet.resources.g = utils.BiasedRandInt(0, 5, 1, 0.75); }
		if ( Math.random() < 0.5-star_age*0.5 ) { planet.resources.b = utils.BiasedRandInt(0, 5, 1, 0.75); }
		// rare resources get a boost for rare planet types (makes them worth colonizing)
		if ( Math.random() < 0.02 + rarity*0.075 + rarity_bonus ) { planet.resources.c = utils.BiasedRandInt(0, 5, 0, 0.9); }
		if ( Math.random() < 0.02 + rarity*0.075 + rarity_bonus + (planet.grav*0.05) ) { planet.resources.v = utils.BiasedRandInt(0, 5, 0, 0.9); }
		if ( Math.random() < 0.02 + rarity*0.075 + rarity_bonus + ((4-planet.grav)*0.05) ) { planet.resources.y = utils.BiasedRandInt(0, 5, 0, 0.9); }
		// throw a bone
		let resource_total = 
			planet.resources.o 
			+ planet.resources.s
			+ planet.resources.m
			+ planet.resources.r
			+ planet.resources.g
			+ planet.resources.b
			+ planet.resources.c
			+ planet.resources.v
			+ planet.resources.y;
		if ( resource_total == 0 ) { 
			planet.resources[ ['o','s','m','r','g','b'][Math.floor(Math.random()*6)] ]
				= utils.BiasedRandInt(1, 2, 1, 0.5);
			}
		// planets with a lot of resource get extra gravity as punishment
		if ( resource_total > 10 && planet.grav < 4 && Math.random() > 0.25 ) { planet.grav++; }
		else if ( resource_total > 15 && planet.grav < 4 && Math.random() > 0.25 ) { planet.grav = Math.min( planet.grav + 2, 4 ); }
		
		// special attributes (AKA "goodies")
		let selector = Planet.AttributeSelector();
		let attr_randnum = 0.30;
		// special and rare stars get more goodies
		if ( star.color == 'purple' ) { attr_randnum += 0.20; }
		else if ( star.color == 'black' ) { attr_randnum += 0.30; }
		else if ( star.color == 'green' ) { attr_randnum += 0.40; }
		else if ( rarity == 3 ) { attr_randnum += 0.20; }
		else if ( rarity == 4 ) { attr_randnum += 0.30; }
		while ( Math.random() < attr_randnum ) { 
			planet.physattrs.push( selector.Pick() );
			attr_randnum *= 0.5;
			}
		planet.physattrs = planet.physattrs.unique();
		// unpack the intrinsic mods
		for ( let a of planet.physattrs ) {
			// unpack intrinsic mods
			if ( 'mods' in a ) {
				for ( let m of a.mods ) { planet.mods.Add(m); }
				}
			// add to planet score
			let attrscore = ( 'score' in a ) ? a.score : 10;
			planet.score += attrscore;
			}
			
		planet.score += planet.size;
		
		return planet;
		}
								
	SetThrottle( v ) {
		this.throttle_target = v.clamp(0,1);
		}
	
	// call this every turn
	MoveThrottle() {
		if ( this.throttle_target == this.throttle ) { return; }
		let diff = Math.min( 0.025, Math.abs( this.throttle_target - this.throttle ) );
		this.throttle += this.throttle_target > this.throttle ? diff : -diff;
		if ( this.throttle < 0.5 ) {
			this.throttle_input = utils.MapToRange( this.throttle, 0, 0.5, 0.25, 1.0 );
			this.throttle_output = utils.MapToRange( this.throttle, 0,  0.5, 0.5, 1.0 );
			this.throttle_speed = utils.MapToRange( this.throttle, 0,  0.5, 0.5, 1.0 );
			}
		else {
			this.throttle_input = utils.MapToRange( this.throttle,  0.5, 1, 1.0, 2.0 );
			this.throttle_output = utils.MapToRange( this.throttle,  0.5, 1, 1.0, 1.5 );
			this.throttle_speed = utils.MapToRange( this.throttle,  0.5, 1, 1.0, 1.5 );
			}
		}
		
	// returns zone on success, false on failure
	AddZone( key ) {
		let o = new Zone(key);
		if ( o.minsect > this.sectors - this.zoned ) { return false; }
		this.zoned += o.sect;
		// some zones are "instant" and do not grow to size.
		if ( !o.gf ) { o.val = 1; }
		this.zones.push(o);
		this.zones.sort( (a,b) => a.type=='government' ? -1 : (a.type > b.type) );
		return o;
		}
	
	// returns true on success, false on failure.
	// `force` will remove permanent zones.
	RemoveZone( z, force = false ) {
		let i = this.zones.indexOf(z);
		if ( i >= 0 ) {
			// some zones are permanent and cannot be removed 
			if ( this.zones[i].perma && !force ) { return false; }
			this.zoned -= this.zones[i].sect;
			this.zones.splice( i, 1 );
			// TODO recalc stats
			return true;
			}
		return false;
		}
		
	// removes 1 sector from the zone's sector size.
	// returns true on success, false on failure.
	// `force` will trim permanent zones.
	TrimZone( z, force = false ) {
		// some zones are permanent and cannot be removed 
		if ( z.perma && !force ) { return false; }
		if ( z.sect > z.minsect ) {
			z.Trim(); 
			this.zoned--;
			}
		else { 
			this.RemoveZone( z, force );
			z.sect = 0; // signal to outside
			}
		// TODO recalc stats
		return true;
		}
		
	ProduceBuildQueueItem( item ) {
		// ships
		if ( item.type == 'ship' ) { 
			let ship = item.obj.Make();
			// if this is a troop carrier, autoload troops if any available
			if ( ship.bp.troopcap ) { // TODO: Make optional, but no access to app.options here???
				while ( this.troops.length > 0 && ship.troops.length < ship.bp.troopcap ) { 
					ship.troops.push( this.troops.pop() );
					}
				}
			// find out where we will send the new ship
			let dest = this;
			if ( this.ship_dest ) { 
				if ( typeof(this.ship_dest)==='object' ) { 
					if ( this.ship_dest.accts.has(this.owner) ) { 
						myfleet.SetDest(this.ship_dest);
						}
					}
				else if ( this.ship_dest == '@' ) { 
					let best_length = 100000000;
					for ( let star of this.owner.ai.staging_pts ) { 
						if ( star.accts.has(this.owner) ) { 
							let dist = utils.DistanceBetween( star.xpos, star.ypos, this.star.xpos, this.star.ypos, true );
							if ( dist < best_length ) { 
								best_length = dist;
								dest = star;
								}
							}
						// remove from staging point list while we're here
						else {
							this.owner.AI_RemoveStagingPoint(star);
							}
						}
					}
				}
			// existing local fleet?
			let myfleet = this.OwnerFleet();
			if ( !myfleet || dest != this ) { 
				myfleet = new Fleet( this.owner, this.star );
				}
			myfleet.AddShip( ship );
			if ( dest != this ) { myfleet.SetDest(dest); }
			}
		// ground units
		else if ( item.type == 'groundunit' ) { 
			this.troops.push( item.obj.Make() );
			}
		// NOTE: custom functions will not serialize to a save format.
		// clean this up later.
		else if ( item.hasOwnProperty('ProduceMe') ) { 
			item.ProduceMe( this );
			}
		}
		
	AddBuildQueueShipBlueprint( bp, qty =1 ) { 
		qty = utils.Clamp( qty, 1, 5 );
		let item = {
			type: 'ship',
			obj: bp,
			name: bp.name,
			cost: bp.cost,
			qty: qty,
			turns_left: ( Math.min( 999, Math.ceil( bp.cost.labor/(this.output_rec.ship||0.001) ) ) || '-'),
			pct: 0
			};
		this.prod_q.push(item);
		this.BuildQueueShuffleDownInfiniteProjects();
		return true;
		}
		
	AddBuildQueueGroundUnitBlueprint( bp, qty = 1 ) { 
		qty = utils.Clamp( qty, 1, 5 );
		let item = {
			type: 'groundunit',
			obj: bp,
			name: bp.name,
			cost: bp.cost,
			qty: qty,
			turns_left: ( Math.min( 999, Math.ceil( bp.cost.labor/(this.output_rec.def||0.001) ) ) || '-'),
			pct: 0
			};
		this.prod_q.push(item);
		this.BuildQueueShuffleDownInfiniteProjects();
		return false;
		}
		
	AddBuildQueueMakeworkProject( type = 'tradegoods' ) { 
		let item = null;
		switch ( type ) { 
			case 'research' : { 
				item = {
					type: 'makework',
					name: 'Research Support',
					obj: 'research',
					img: 'img/icons/svg/atom02.svg',
					cost: { labor: 50 }, // "cost" in hammers
					qty: -1, // default infinity
					turns_left: '-',
					pct: 0,
					ProduceMe: function ( planet ) {
						let amount = 5;
						let row = planet.acct_ledger.find( r => r.name=='Research Support' )
							|| { name:'Research Support', type:'project', subcat:'makework' };
						row.res = (row.res||0) + amount;
						planet.acct_total.res = (planet.acct_total.res||0) + amount;
						planet.owner.resource_income.res += amount;
						planet.owner.resources.research += amount;	
						planet.owner.resources.research_income += amount;	
						}
					};
				break;
				}
			case 'tradegoods' : 
			default : { 
				item = {
					type: 'makework',
					name: 'Trade Goods',
					obj: 'tradegoods',
					img: 'img/icons/svg/coins-1.svg',
					cost: { labor: 50 }, // "cost" in hammers
					qty: -1, // default infinity
					turns_left: '-',
					pct: 0,
					ProduceMe: function ( planet ) {
						let amount = 5;
						planet.econ.tradegoods += amount;
						let row = planet.acct_ledger.find( r => r.name=='Trade Goods' )
							|| { name:'Trade Goods', type:'project', subcat:'makework' };
						row.$ = (row.$||0) + amount;
						planet.acct_total.$ = (planet.acct_total.$||0) + amount;
						planet.owner.resource_income.$ += amount;
						planet.owner.resources.$ += amount;	
						}
					};
				break;
				}
			}
		this.prod_q.push(item);
		this.BuildQueueShuffleDownInfiniteProjects();
		return true;
		}

	BuildQueueShuffleDownInfiniteProjects() { 
		this.prod_q.sort( (a,b) => { 
			if ( a.qty == -1 && b.qty != -1 ) { return 1; }
			else if ( b.qty == -1 && a.qty != -1 ) { return -1; }
			return 0;
			});
		}
		
	ListMakeworkProjects() { 
		return [
			{ type: 'tradegoods', name: 'Trade Goods', img: 'img/icons/svg/coins-1.svg', desc: 'Converts unused ship and defense manufacturing labor into cash at a reduced rate.' },
			{ type: 'research', name: 'Research Support', img: 'img/icons/svg/atom02.svg', desc: 'Converts unused ship and defense manufacturing labor into research points at a reduced rate.' },
			];
		}
		
  	// returns an integer value which may be negative
	Adaptation( civ ) {
		// OPTIMIZATION: This function gets called so much it needs to be omptimized.
		// We precompute values for the owning civ, and take a shortcut for silicates.
		// It would also be helpful if code calling this function would cache the result.
		// TODO: we may wish to differentiate between a civ as a planet owner and
		// the type of population that actually lives here. There may be differences in 
		// natural adaptability not related to technology.
		if ( !civ && !this.owner ) { return 0; }
		if ( !civ && this.owner ) { civ = this.owner; }
		if ( civ.race.type == 'silicate' ) { return 1; } // use this to optimize for speed if using mods is too slow
		if ( civ == this.owner && this.adaptation_precomp!==null ) { return this.adaptation_precomp; }
		let diff = civ.race.env.adaptation
			-( Math.abs( this.atm - civ.race.env.atm ) + Math.abs( this.temp - civ.race.env.temp ) + Math.abs( this.grav - civ.race.env.grav ) );
		diff = this.mods.Apply( diff, 'adaptation' );
		if ( civ == this.owner ) { this.adaptation_precomp = diff; }
		return diff;
		}
  	// returns true if the planet can be settled by the race
	Habitable( civ ) {
		return this.Adaptation( civ ) > 0;	
		}
	HabitationBonus( civ ) { 
		let x = this.Adaptation( civ );
// 		let y = ( 2 / ( 1 + Math.pow( Math.exp(1), -0.52*x ) ) ) - 1; // sigmoid function
// 		return Math.round( y * 20 ) / 20; // this part rounds off to the nearest 5%
		// lets keep this simple: -20% for each negative, +10% for each positive
		if ( x < 0 ) { return utils.Clamp( x*0.2, -0.9, 0 ); }
		else if ( x > 0 ) { return utils.Clamp( x*0.1, 0, 1.0 ); }
		return 0;
		}
	@computedFrom('total_pop','tax_rate','econ.PCI')
	get tax() { 
		return this.total_pop * this.tax_rate * this.econ.PCI;
		}
	@computedFrom('spending')
	get slider_spending() { 
		return this.spending;
		}
	set slider_spending(x) { 
		this.spending = parseFloat(x).clamp(0,this.max_spending);
		this.SetThrottle(this.spending);
		}
	set slider_taxrate(x) { 
		this.tax_rate = parseFloat(x);
		}
	@computedFrom('tax_rate')	
	get slider_taxrate() { return this.tax_rate; }
	
	EstimateProduction( labortype, labor_avail=0 ) {
		let est = {};
		if ( !this.prod_q.length ) { return est; }
		
		outerloop:
		for ( let i = 0; i < this.prod_q.length; i++ ) {
			
			// no labor to do any work
			if ( labor_avail <= 0 ) { break; }
			let item = this.prod_q[i];
			// each queue item also has a quantity
			if ( !item.qty ) { continue; }
			// not the droids we're looking for
			if ( item.type != labortype && item.type != 'makework' ) { continue; }
			
			else {
				
				let item_qty = item.qty; // dont change the actual values
				let item_pct = item.pct;
				let safety = 50;
				
				while ( labor_avail > 0 && item_qty != 0 && --safety ) {
				
					// how much can i build next turn?
					let maxpct = 1 - item_pct; // account for partially completed items
					for ( let k in item.cost ) {
						let resource_avail = ( k == 'labor' ) ? labor_avail : this.owner.resources[k];
						let cost = ( k == 'labor' ) ? item.cost[k] : this.mods.Apply( item.cost[k], `resources_consumed` );
						maxpct = Math.min( maxpct, 1.0, resource_avail/cost );
						}
					
					// no work can be done; skip item
					if ( maxpct <= 0 ) { break outerloop; }
					
					// calculate work to be done
					item_pct += maxpct;
					for ( let k in item.cost ) { 
						if ( k == 'labor' ) { 
							labor_avail -= maxpct * item.cost[k];
							}
						else { 
							est[k] = (est[k]||0) + (maxpct * item.cost[k]);
							est[k] = this.mods.Apply( est[k], `resources_consumed` )
							}
						}
					
					// did something get built?
					if ( item_pct >= 0.99999 ) { // slop room
						// items_built.push(item); // maybe?
						// reset
						item_pct = 0;
						// decrement if they wanted more than one
						if ( item_qty > 0 ) { item_qty -= 1; }
						}
						
					// exhausted?
					if ( labor_avail <= 0 ) { break outerloop; }
					}
				}
			}
		return est;
		}
			
	// returns a list of items built
	DoProduction( ) { 
		if ( !this.prod_q.length ) { return false; }
		let items_built = [];
		// produce as many items in the queue as we can 
		let ship_labor_avail = this.output_rec.ship;
		let def_labor_avail = this.output_rec.def;
		for ( let i = 0; i < this.prod_q.length; i++ ) {
			// no labor to do any work
			if ( ship_labor_avail + def_labor_avail <= 0 ) { break; }
			let item = this.prod_q[i];
			// each queue item also has a quantity
			if ( !item.qty ) { continue; }
			else { 
				
				// impossible to build - delete
				if ( item.cost.labor && item.type == 'ship' && !this.output_rec.ship ) { this.prod_q.splice( i--, 1 ); continue; }
				if ( item.cost.labor && item.type == 'groundunit' && !this.output_rec.def ) { this.prod_q.splice( i--, 1 ); continue; }
				
				// how much can i build next turn?
				let maxpct = 1 - item.pct; // account for partially completed items
				for ( let k in item.cost ) { 
					// "labor" can be either ship points or defense points, depending on context
					if ( k == 'labor' && item.type == 'ship' ) { 
						maxpct = Math.min( maxpct, 1.0, ship_labor_avail/item.cost[k] );
						}
					else if ( k == 'labor' && item.type == 'groundunit' ) { 
						maxpct = Math.min( maxpct, 1.0, def_labor_avail/item.cost[k] );
						}
					else if ( k == 'labor' && item.type == 'makework' ) { 
						maxpct = Math.min( maxpct, 1.0, (ship_labor_avail+def_labor_avail)/item.cost[k] );
						}
					else { 
						maxpct = Math.min( maxpct, 1.0, this.owner.resources[k] / this.mods.Apply( item.cost[k], `resources_consumed` ) );
						}
					}
					
				// no work can be done; skip item
				if ( maxpct <= 0 ) { continue; }
				
				// accounting: each build item is a separate record,
				// except makework projects which are combined into one record
				let accounting = { name:item.name, type:'project', subcat:item.type };
				let accounting_using_existing_record = false;
				if ( item.type=='makework' ) { 
					let old_rec = this.acct_ledger.find( r => r.name==item.name );
					accounting = old_rec || accounting;
					accounting_using_existing_record = !!old_rec;
					}
					
				// do the work and decrement resources
				item.pct += maxpct;
				for ( let k in item.cost ) { 
					if ( k == 'labor' && item.type == 'ship' ) { 
						ship_labor_avail -= maxpct * item.cost[k];
						}
					else if ( k == 'labor' && item.type == 'groundunit' ) { 
						def_labor_avail -= maxpct * item.cost[k];
						}
					else if ( k == 'labor' && item.type == 'makework' ) { 
						ship_labor_avail -= maxpct * item.cost[k];
						if ( ship_labor_avail < 0 ) { 
							def_labor_avail += ship_labor_avail; 
							ship_labor_avail = 0;
							if ( def_labor_avail < 0 ) { def_labor_avail = 0; }
							}
						}
					else { 
						let total = maxpct * this.mods.Apply( item.cost[k], `resources_consumed` );
						this.owner.resources[k] -= total;
						this.owner.resource_spent[k] += total;
						accounting[k] = (accounting[k]||0) - total;
						this.acct_total[k] = (this.acct_total[k]||0) - total;
						}
					}
				if ( !accounting_using_existing_record ) {
					this.acct_ledger.push(accounting);
					}
				
				// did something get built?
				if ( item.pct >= 0.99999 ) { // slop room
					this.ProduceBuildQueueItem( item );
					items_built.push(item);
					// reset
					item.pct = 0;
					item.turns_left = '-';
					// decrement if they wanted more than one
					if ( item.qty > 0 ) { item.qty -= 1; }
					// pop from list if we reached zero
					if ( item.qty == 0 ) {
						this.prod_q.splice( i, 1 );
						}
					// otherwise see if we can build even more stuff
					else if ( ship_labor_avail || def_labor_avail ) { i--; }
					}
				// update the stats
				else {
					let maxlabor = item.type=='ship' ? this.output_rec.ship : this.output_rec.def;
					item.turns_left = Math.min( 999, Math.ceil( ( 1 - item.pct ) / ((maxlabor/item.cost.labor)||1) ) ); // assumes full resource availability
					}
					
				// exhausted?
				let labor_left = ship_labor_avail + def_labor_avail;
				if ( labor_left <= 0 || !this.prod_q.length ) {
					break;
					}
				}
			}
		return items_built;
		}
		
  	UpdateMorale() {
		// each element outputs a number between 0..2
		// and are then scaled against each other to
		// vary the weighting of different factors.
		// We then take the average of them.

		// TODO:
		// gov type
		// local culture
		// at war
		// recently conquered
		// recently attacked
		// enemy ships present
		// defensive fleet present?
		// spending? (employment)
    
		let factors = {};
		// economy (PCI)
		factors.econ = {
			fx: ( (this.econ.PCI > 14) ? utils.MapToRange(this.econ.PCI,14,60,1,2) : utils.MapToRange(this.econ.PCI,1,14,0,1) ),
			weight: 10.0
			};
		// environment
		factors.env = {
			fx: this.Adaptation( this.owner ),
			weight: 5.0
			};
		// crowding (sigmoid function)
		// see: https://www.desmos.com/calculator/5uo3t7mqnj
		factors.crowding = { 
			fx: ( 1.5 / ( 1 + Math.pow( Math.E, (-6 + (9*( this.total_pop/this.maxpop )) ) ) ) ) + 0.5,
			weight: 4.0
			};
     	// TODO military defense - makes people feel safe
    	let total_weight = 0;
		let total_value = 0;
		for ( let f in factors ) { 
		  total_weight += factors[f].weight; 
		  total_value += factors[f].fx * factors[f].weight; 
		  }
		let target_morale = total_value / total_weight;
		// morale changes over time, not all at once
		let diff = target_morale - this.morale;
		let growth = diff ? (0.4 * Math.pow( Math.abs(diff), 0.75 ) ) : 0;
		this.morale += ( diff > 0 ) ? growth : -growth ;	
		this.morale = utils.Clamp( this.morale, 0, 2 );
    	}

    
	GrowEconomy() { 
		// TODO:
		// local culture
			// technology
			// galactic economy
			// recent events
			
		// we want PCI=10 for new vanilla colonies
		let richness = 1.0;
		const rvals = { o:2, s:1, m:2, r:4, g:4, b:4, c:6, y:8, v:9 };
		for ( let k in this.resources ) {
			richness += rvals[k] * this.resources[k];
			}
		let resource_mod = 2; 
		// establish a base economic rate based on planet resources
		let target_PCI = richness * this.energy * resource_mod;
		// taxes modify the base rate
		target_PCI *= Math.pow( utils.MapToRange( this.tax_rate, 0, 0.5, 2.0, 0.2 ), 1.5 );
    
// 		let ecoscale = 1.0; // for balancing
// 		let base = total * ecoscale;
// 		if ( base < 1 ) { base = 1; }
		let min_PCI = 0.1; 
		this.econ.target_PCI = Math.pow( target_PCI, 0.65 ); // diminishing returns
		if ( this.econ.target_PCI < min_PCI ) { this.econ.target_PCI = min_PCI; }
		
		// grow economy in stages
		let diff = this.econ.target_PCI - this.econ.PCI;
		let growth = diff ? (0.2 * Math.pow( Math.abs(diff), 0.75 ) ) : 0; // rubber band growth
		this.econ.PCI += ( diff > 0 ) ? growth : -growth ;	
		this.econ.GDP = this.total_pop * this.econ.PCI;
		this.econ.tax_rev = this.econ.GDP * this.tax_rate;
		}
		
		
	GrowPop() { 
		// popmax is actually our current infrastructure level from Housing zones.
		// This means that if Housing zones are removed or underfunded, infrastructure
		// crumbles and we can have more pops than popmax (causing unhappiness).
		this.maxpop = this.popmax_contrib + this.size + this.Adaptation( this.owner );
		this.maxpop = this.mods.Apply( this.maxpop, 'maxpop' );
		this.popmax_contrib = 0;
		// growth rate is square root of difference between max pop and current pop, divided by 60.
		let diff = this.maxpop - this.total_pop; 
		let divisor = 60.0; // 
		if ( diff > 0 ) { // pop growth
			let max_diff = 50.0;
			let rate  = ( Math.sqrt( diff > max_diff ? max_diff : diff ) / divisor ) + 1.0;
			rate = this.mods.Apply(rate,'pop_growth');
			this.total_pop = (this.total_pop * rate) + 0.05; // the 0.05 just helps it move along
			}
		else if ( diff < 0 ) { // pop decline - we outstripped allowable space somehow
			this.total_pop *= 1.0 - ((( this.total_pop / this.maxpop ) - 1.0) * 0.2);
			}
		this.total_pop = Math.max( 0.1, this.total_pop );
		}
		
	// temp => atm
	static EnvNames() {
		return [
		// THIN ---------------------------------------------------- DENSE
		['Bleak',		'Barren',	'Polar',		'Frozen',	'Iceball'], //	COLD
		['Dead',		'Glacial',	'Mountainous',	'Tundra',	'Arctic'],
		['Dune',		'Steppe',	'Temperate',	'Jungle',	'Ocean'],
		['Wasteland',	'Desert',	'Arid',			'Swamp',	'Volatile'],
		['Inferno',		'Scorched',	'Parched',		'Torrid',	'Venutian'] //	HOT	
		]; }
	static GravNames() {
		return ['Weak','Light','Midweight','Heavy','Crushing' ]; 
		}
		
	static AttributeSelector() { 
		let data = Object.keys(PlanetAttrs)
			.filter( k => PlanetAttrs[k].chance > 0 )
			.map( k => [PlanetAttrs[k],PlanetAttrs[k].chance] );
		return new RandomPicker(data);
		}
	
	get envDisplayName() {
		return Planet.EnvNames()[this.temp][this.atm];
		}
	get gravDisplayName() {
		return Planet.GravNames()[this.grav];
		}
		
	// gives a value score from the perspective of the civ.
	// useful for AI functions in determining where to 
	// colonize or capture
	ValueTo( civ ) {
		// even habitable?
		if ( !this.Habitable( civ ) ) { 
			return 0;
			}
		// not in range? not worth anything 
		if ( !civ.InRangeOf(this.star.xpos, this.star.ypos) ) { 
			return 0;
			}
		// natural environmental score
		let score = this.score;
		// adaptation
		score += this.Adaptation( civ ) * 3; 
		// distance from emperical center (not actually that important)
		let bx = civ.empire_box.x1 + ( ( civ.empire_box.x2 - civ.empire_box.x1 ) * 0.5 );
		let by = civ.empire_box.y1 + ( ( civ.empire_box.y2 - civ.empire_box.y1 ) * 0.5 );
		let dist = utils.DistanceBetween( this.star.xpos, this.star.ypos, bx, by );
		if ( dist ) { score += ( 1 / dist ) * 7000; }
		// population	
		score += (this.total_pop ? this.total_pop : 1 ) * 0.1;
		// TODO local economy
		return score;
		}
		
	// owner must be a civ object, not an index ID
	Settle( owner ) {
		this.owner = owner;
		this.total_pop = 0.5;
		this.settled = true;
		this.explored = true;
		this.econ.GDP = 0;
		this.econ.PCI = this.base_PCI + this.bonus_PCI;
		this.econ.GF = 1.0;
		this.UpdateOwnership();
		this.maxpop = this.size + this.Adaptation( this.owner );
		this.maxpop = this.mods.Apply( this.maxpop, 'maxpop' );
		if ( !this.zones.length ) { 
			if ( owner.planets.length <= 1 ) { 
				this.AddZone( 'CIVCAPITOL', 1 ); 
				}
			else {
				this.AddZone( 'PLANETCAPITOL', 1 ); 
				}
			}
		this.AddBuildQueueMakeworkProject('tradegoods');
		this.established = App.instance.game.turn_num;
		if ( !App.instance.options.soak && this.owner.is_player ) { 
			App.instance.game.RecalcStarRanges();
			}
		this.owner.DiplomaticEffectOfAcquiringPlanet(this);
		}
		
	// Used to wipe the planet clean to make it ready for the next residents.
	// Use in case empire is destroyed or some accident happens.
	// Also removes planet from owner's list of planets
	Reset( keep_pop=true ) {
		if ( this.owner ) {
			for ( let a of this.physattrs ) { 
				if ( 'onUnsettle' in a ) a.onUnsettle(this);
				}
			let i = this.owner.planets.indexOf( this );
			if ( i > -1 ) { this.owner.planets.splice( i, 1 ); } 		
			if ( --this.star.accts.get(this.owner).planets == 0 ) { 
				this.owner.AI_RemoveStagingPoint(this.star);
				this.owner.RecalcEmpireBox();
				}
			this.mods.parent = null;
			this.owner = null;
			}
		this.prod_q.splice(0,this.prod_q.length);
		this.troops.splice(0,this.troops.length);
		this.established = 0;
		this.ship_dest = null;
		this.acct_ledger = [];
		this.acct_total = {};
		this.acct_hist = [];
		this.sectors = this.size;
		if ( !keep_pop ) { 
			this.total_pop = 0;
			this.settled = false;
			this.econ.GDP = 0;
			this.econ.PCI = 0;
			this.econ.GF = 1.0;
			this.maxpop = 0;
			this.zoned = 0;
			this.zones.splice(0,this.zones.length);
			this.morale = 1.0;
			this.output_rec = { $:0, o:0, s:0, m:0, r:0, g:0, b:0, c:0, v:0, y:0, ship:0, def:0, hou:0, esp:0, res:0 };
			this.resource_rec = { $:0, o:0, s:0, m:0, r:0, g:0, b:0, c:0, v:0, y:0, };
			}
		this.star.UpdateOwnershipTitleColorCSS();
		}

	RemoveDeadTroops() { 
		this.troops = this.troops.filter( t => t.hp );
		}
				
	BeConqueredBy( invader ) {
		let previous_owner = this.owner;
		this.Reset(true); // keep population
		this.AddBuildQueueMakeworkProject('tradegoods'); 
		this.owner = invader;
		this.UpdateOwnership();
		// strip out any zones that do not meet our adaptation level.
		// this happens when conquering an advanced civilization. 
		// We may actually want to retain this as a "feature", but not sure.
		let adapt = this.Adaptation(this.owner);
		for ( let i = this.zones.length-1; i >= 0; i-- ) {
			if ( this.zones[i].type == 'government' ) { continue; }
			if ( this.zones[i].minsect > adapt ) { this.zones.splice(i,1); }
			else if ( this.zones[i].sect > adapt ) { this.zones[i].Trim( this.zones[i].sect - adapt ); }
			}
		if ( !App.instance.options.soak && ( previous_owner.isplayer && this.star.accts.get(previous_owner).planets == 0 ) ) { 
			App.instance.game.RecalcStarRanges();
			}
		this.owner.DiplomaticEffectOfAcquiringPlanet(this);
		// this function can also be called from diplo trade deals, so must force "explored" if player
		if ( this.owner.is_player ) {
			this.star.explored = true;
			} 
		// TODO: morale penalty?
		}
		
	// in case of a change in ownership, call this function to run 
	// necessary housekeeping stuff
	UpdateOwnership() {
		// do NOT lower the sector size if the previous resident had a sector size bonus.
		// consider this as being like the spoils of war. Shrinking int back down also
		// causes weird logical issues with upgrading zones when you are over the sector limit.
		// we'll call this a feature and not a bug. In the future, we may better represent
		// this feature by directly referencing the inhabiting race type and not the owning civ.
		this.sectors = Math.max( this.sectors, this.owner.mods.Apply( this.size, 'sectors' ) );
		this.owner.planets.push( this );
		this.star.UpdateOwnershipTitleColorCSS();
		if ( this.star.accts.has(this.owner) ) {
			this.star.accts.get(this.owner).planets++;
			}
		else {
			this.star.AddAccount( this.owner ); 
			}
		this.owner.RecalcEmpireBox();	
		this.mods.parent = this.owner.mods;
		this.ship_dest = this.owner.is_player ? null : '@';
		// homeworlds are AI staging points by default
		if ( !this.owner.is_player && this.owner.planets.length==1 ) { 
			this.owner.AI_AddStagingPoint( this.star );
			}
		for ( let a of this.physattrs ) { 
			if ( 'onSettle' in a ) a.onSettle(this);
			}
		if ( !App.instance.options.soak && ( this.owner.is_player && this.star.accts.get(this.owner).planets == 1 ) ) { 
			App.instance.game.RecalcStarRanges();
			}	
		}
		
	ListUniqueGroundUnits() { 
		let data = new Map;
		for ( let t of this.troops ) { 
			let v = data.get(t.bp) || 0;
			data.set(t.bp,v+1);
			}
		return data;
		}
		
	// owning civ's parked fleet
	OwnerFleet() { 
		if ( this.owner ) { 
			for ( let f of this.star.fleets ) { 
				if ( f.owner == this.owner && !f.dest ) { 
					return f;
					}
				}
			}
		return null;
		}
		
	DoZoning() {
		// nudge the throttle towards its goal
		this.MoveThrottle();
		// do mergers, if any. find all eligible zones for merging:
		const adaptation = this.Adaptation();
		let zones = this.zones.filter( z => z.val===1 && z.sect < z.maxsect && z.sect < adaptation ).sort( (a,b) => b.sect - a.sect );
		while ( zones.length ) { 
			let zone = zones.shift(); // start with the biggest one
			// find the smallest eligible mate
			let maxsect = Math.min( zone.maxsect, adaptation ) - zone.sect;
			let mate = zones.filter( z => z.key===zone.key && z.sect <= maxsect  ).sort( (a,b) => b.sect - a.sect ).pop();
			if ( mate ) {
				// calculate the new value of the zone with its newly increased size
				mate.MergeInto(zone);
				// remove mate from main zones list
				zones.splice( zones.indexOf(mate), 1 );
				this.zones.splice( this.zones.indexOf(mate), 1 );
				}
			}
		// zones all produce stuff 
		for ( let z of this.zones ) { z.Do(this); }
		}
	
	// This completely zones the planet. Can be used for AI or automation settings
	ZonePlanet() {
		let ai = new AIPlanetsObjective();
		ai.ZonePlanet(this);
		}
		
	RecordHistory() { 
		let rec = {};
		for ( let k of ['$','ship','def','hou','res','o','s','m','r','g','b','c','y','v'] ) { 
			rec[k] = this.acct_total[k] || 0 ;
			}
		rec.pop = this.total_pop;
		rec.morale = this.morale;
		rec.pci = this.econ.pci;
		this.acct_hist.push( rec );
		// if ( p.acct_hist.length > 200 ) { p.shift(); } 
		}
				
	}

export const PlanetAttrs = {
	PHARMACOPIA: { 
		name: 'Pharmacopia',
		desc: '+50% population growth',
		chance: 100,
		mods: [ new Mod( 'pop_growth', '*', 1.5, '', this ) ],
		},
	TOXIC_FLORA: { 
		name: 'Toxic Flora',
		desc: '-50% population growth',
		chance: 100,
		mods: [ new Mod( 'pop_growth', '*', 0.5, '', this ) ],
		},
	RARE_MINERALS: { 
		name: 'Rare Minerals',
		desc: '+50% economy zones',
		chance: 200,
		mods: [ new Mod( 'zone_output_economy', '*', 1.5, '', this ) ],
		},
	RARE_METALS: { 
		name: 'Rare Metals',
		desc: '+100% economy zones',
		chance: 100,
		mods: [ new Mod( 'zone_output_economy', '*', 2.0, '', this ) ],
		},
	RARE_ELEMENTS: { 
		name: 'Rare Elements',
		desc: '+150% economy zones',
		chance: 50,
		mods: [ new Mod( 'zone_output_economy', '*', 2.5, '', this ) ],
		},
	CAVERNOUS: { 
		name: 'Cavernous',
		desc: '+40 max pop. +2 ground combat. -50% zone growth.',
		chance: 100,
		mods: [ 
			new Mod( 'maxpop', '+', 40, '', this ) ,
			new Mod( 'ground_roll', '+', 2, '', this ),
			new Mod( 'zone_growth', '*', 0.5, '', this )
			],
		},
	ARTIFACTS: { 
		name: 'Ancient Artifacts',
		desc: '+50% research',
		chance: 50,
		mods: [ 
			new Mod( 'zone_output_research', '*', 1.5, '', this )
			],
		},
	FLAT: { 
		name: 'Flat',
		desc: '+100% housing, +50% mining, -1 ground combat',
		chance: 50,
		mods: [ 
			new Mod( 'zone_output_housing', '*', 2, '', this ) ,
			new Mod( 'zone_output_mining', '*', 1.5, '', this ),
			new Mod( 'ground_roll', '-', 1, '', this ) 
			],
		},
	UNSTABLE: { 
		name: 'Unstable',
		desc: '-25% military, housing, and ship production.',
		chance: 100,
		mods: [ 
			new Mod( 'zone_output_stardock', '*', 0.75, '', this ) ,
			new Mod( 'zone_output_military', '*', 0.75, '', this ) ,
			new Mod( 'zone_output_housing', '*', 0.75, '', this ),
			],
		},
	RINGS: { 
		name: 'Rings',
		desc: '+100% mining and military.',
		chance: 100,
		mods: [ 
			new Mod( 'zone_output_mining', '*', 2, '', this ) ,
			new Mod( 'zone_output_military', '*', 2, '', this )
			],
		},
	CORROSIVE: { 
		name: 'Corrosive Atmosphere',
		desc: '-50% zone growth.',
		chance: 100,
		mods: [ 
			new Mod( 'zone_growth', '*', 0.5, '', this )
			],
		},
	MOONS: { 
		name: 'Moons',
		desc: '+100% military and ship production.',
		chance: 100,
		mods: [ 
			new Mod( 'zone_output_stardock', '*', 2.0, '', this ),
			new Mod( 'zone_output_military', '*', 2.0, '', this )
			],
		},
	TESSERA1: { 
		name: 'Tessera Planet',
		desc: 'A planet formerly part of the ancient Tessera Constellation.',
		chance: 0,
		score: 100,
		mods: [],
		onSettle(planet){
			if ( planet.owner ) {
				planet.owner.victory_ingredients.push( VictoryIngredients['TESSERA1'] );
				}
			},
		onUnsettle(planet){
			if ( planet.owner ) {
				let i = planet.owner.victory_ingredients.indexOf( VictoryIngredients['TESSERA1'] );
				if ( i > -1 ) { planet.owner.victory_ingredients.splice(i,1); }
				}
			},
		},
	TESSERA2: { 
		name: 'Tessera Planet',
		desc: 'A planet formerly part of the ancient Tessera Constellation.',
		chance: 0,
		score: 100,
		mods: [],
		onSettle(planet){
			if ( planet.owner ) {
				planet.owner.victory_ingredients.push( VictoryIngredients['TESSERA2'] );
				}
			},
		onUnsettle(planet){
			if ( planet.owner ) {
				let i = planet.owner.victory_ingredients.indexOf( VictoryIngredients['TESSERA2'] );
				if ( i > -1 ) { planet.owner.victory_ingredients.splice(i,1); }
				}
			},
		},
	TESSERA3: { 
		name: 'Tessera Planet',
		desc: 'A planet formerly part of the ancient Tessera Constellation.',
		chance: 0,
		score: 100,
		mods: [],
		onSettle(planet){
			if ( planet.owner ) {
				planet.owner.victory_ingredients.push( VictoryIngredients['TESSERA3'] );
				}
			},
		onUnsettle(planet){
			if ( planet.owner ) {
				let i = planet.owner.victory_ingredients.indexOf( VictoryIngredients['TESSERA3'] );
				if ( i > -1 ) { planet.owner.victory_ingredients.splice(i,1); }
				}
			},
		},
	TESSERA4: { 
		name: 'Tessera Planet',
		desc: 'A planet formerly part of the ancient Tessera Constellation.',
		chance: 0,
		score: 100,
		mods: [],
		onSettle(planet){
			if ( planet.owner ) {
				planet.owner.victory_ingredients.push( VictoryIngredients['TESSERA4'] );
				}
			},
		onUnsettle(planet){
			if ( planet.owner ) {
				let i = planet.owner.victory_ingredients.indexOf( VictoryIngredients['TESSERA4'] );
				if ( i > -1 ) { planet.owner.victory_ingredients.splice(i,1); }
				}
			},
		},
		
// 			{name: 'Ecliptic', chance: 100, note: '+range, +vis, +res', fx: {} },
// 			{name: 'Beautiful', chance: 200, note: '+econ, +mig, +morale', fx: {} },
// 			{name: 'Dangerous', chance: 200, note: '+def, --mig', fx: {} },
// 			{name: 'Volcanic', chance: 100, note: '-inf', fx: {} },
// 			{name: 'Accessible', chance: 100, note: '++prod, +mig', fx: {} },
// 			{name: 'Bread Basket', chance: 200, note: '+mig, +morale, +pop', fx: {} },
// 			{name: 'Asteroid Belt', chance: 60, note: '++prod', fx: {} },
// 			{name: 'Hostile Lifeforms', chance: 150, note: '-pop, -prod, -mig', fx: {} },
// 			{name: 'Unusual Weather', chance: 90, note: '+res, -prod, -mig', fx: {} },
// 			{name: 'Abundant Life', chance: 180, note: '+morale, +res', fx: {} },
// 			{name: 'Rich Soil', chance: 200, note: '+pop', fx: {} },
//			{name: 'Poor Soil', chance: 200, note: '-pop', fx: {} },
// 			{name: 'Perfect Alignment', chance: 60, note: '++prod, -mig', fx: {} },
// 			{name: 'Short Days', chance: 70, note: '-prod', fx: {} },
// 			{name: 'Legendary', chance: 20, note: '+++everything', fx: {} },

	}

// key the attributes list and add default values
for ( let k in PlanetAttrs ) {
	PlanetAttrs[k].key = k;
	if ( !( 'score' in PlanetAttrs[k] ) ) { 
		PlanetAttrs[k].score = 10;
		}
	for ( let m of PlanetAttrs[k].mods ) {
		m.label = PlanetAttrs[k].name;
		}
	}