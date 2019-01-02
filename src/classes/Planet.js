import Star from './Star';
import Hyperlane from './Hyperlane';
import Fleet from './Fleet';
import RandomPicker from '../util/RandomPicker';
import RandomName from '../util/RandomName';
import * as utils from '../util/utils';
import {computedFrom} from 'aurelia-framework';
import {Ship,ShipBlueprint} from './Ship';
import {GroundUnit,GroundUnitBlueprint} from './GroundUnit';
import {Mod,Modlist} from './Mods';

export default class Planet {
	
	// UI and DATA ---------------------------------------
	ui_color = 'inherit'; // this way you can set defaults in CSS and override inline
	star = null;
	explored = false;
	owner = false; // false indicates unowned. zero can be an index
	name = 'UNKNOWN';
	total_pop = 0;
	pop = [];
	morale = 1.0;	// multiplier, default 1.0, range 0-2
	age = 0;
	age_level = 0;
	troops = []; // list of GroundUnits defending planet.
	prod_q = [];
	
	// PHYSICAL ATTRIBUTES -------------------------------
	energy = 1.0; // represents production bonus
	rich = 0;
	size = 0;
	atm = 0;
	temp = 0;
	grav = 0;
	physattr = [];
	slots = [];
	maxslots = 0;
	
	// AI ------------------------------------------------
	score = 0; // AI score of natural attributes
	ai_value = 0;
	ai_threat = 0;
	ai_defense = 0;
	
	// ECONOMY -------------------------------------------
	tax_rate = 0.2;
	treasury_contrib = 0; // contributions or allowances from the global treasury
	use_global_tax_rate = false;
	spending = 0.75;
	max_spending = 2.0 // may be modable with technology improvements
	buildings = [];
	building_fund = 0;
	base_PCI = 10.0; // per capita income
	bonus_PCI = 0.0;	
	warehouse = 0;
	min_warehouse = 100; // minimum amount to keep in store before exporting
	mp_need = 0; // total material points needed to fuel all activity
	mp_export = 0; // how much we import (-) or export (+) this turn
	mp_need_met = 1.0; // 0..1, how much of what we requested for import was actually delivered. 
	econ = {
		expenses: {
			total: 0,
			sectors: 0
			},
		tradegoods: 0, // not sure what this does yet
		GDP: 1.0, // gross domestic product
		PCI: 1.0, // per-capita income
		GF: 1.0, // growth factor
		mine_export: 0, // can be pos or neg, depending on if planet has a need or excess
		mine_import: 0, // the actual amount being imported, if needed. number may differ from need above
		};
			
	// ACTIVITY SECTORS ----------------------------------
	// 	vars:
	//		pct: the percentage of the planetary spending allocated to this sector
	//		relpct: the relative percent of spending, used to work with UI sliders.
	//		pow: efficiency of sector at producing work.
	//		work: raw work being produced (global spending * pct * pow)
	//		inf: current level of developed infrastructure for this sector
	//		output: product, after factoring in growth of infrastructure
	//		growth: amount by which sector grew or shrank last turn.
	//	
	//	Production Formula: 
	//		global spending = pop * amount per pop (i.e. tax)
	//		sector spending = global spending * pct
	//		work = sector spending * pow
	//		output = min( inf, work )
	//		growth = 0.2 * ( work - inf ) ^ 0.75
	//		inf += growth
	sect = {
		mine:{ pct: 0.20, relpct: 0.20, pow: 1.0, work: 0.0, output: 0.0, inf: 1.0, growth: 0.0, cost: 2.50 },
		prod:{ pct: 0.35, relpct: 0.35, pow: 1.0, work: 0.0, output: 0.0, inf: 1.0, growth: 0.0, cost: 2.50 },
		sci:	{ pct: 0.35, relpct: 0.35, pow: 1.0, work: 0.0, output: 0.0, inf: 1.0, growth: 0.0, cost: 2.50 },
		def:	{ pct: 0.10, relpct: 0.10, pow: 1.0, work: 0.0, output: 0.0, inf: 1.0, growth: 0.0, cost: 2.50 },
		esp:	{ pct: 0.0, relpct: 0.0, pow: 1.0, work: 0.0, output: 0.0, inf: 1.0, growth: 0.0, cost: 2.50 },
// 		gov:	{ pct: 0.15, relpct: 0.15, pow: 1.0, work: 0.0, output: 0.0, inf: 1.0, growth: 0.0, cost: 2.50 },
// 		com:	{ pct: 0.00, relpct: 0.00, pow: 1.0, work: 0.0, output: 0.0, inf: 1.0, growth: 0.0, cost: 0 },
// 		sup:	{ pct: 0.0, relpct: 0.0, pow: 1.0, work: 0.0, output: 0.0, inf: 1.0, growth: 0.0, cost: 2.50 },
// 		civ:	{ pct: 0.0, relpct: 0.0, pow: 1.0, work: 0.0, output: 0.0, inf: 1.0, growth: 0.0, cost: 2.50 },
		};

	// POLICIES -------------------------------------------
	// Ship Destination: Where to send ships when they are built.
	// Valid options: NULL (here), '@' (nearest rondezvous point), Star (object)
	ship_dest = null; 
	
	ProduceBuildQueueItem( item ) {
		// ships
		if ( item.type == 'ship' ) { 
			let ship = item.obj.Make();
			// if this is a troop carrier, autoload troops if any available
			if ( ship.troopcap ) { // TODO: Make optional, but no access to app.options here???
				while ( this.troops.length ) { 
					ship.troops.push( this.troops.pop() );
					}
				}
			// find my local fleet
			let myfleet = this.OwnerFleet();
			if ( !myfleet || this.ship_dest ) { 
				myfleet = new Fleet( this.owner, this.star );
				}
			myfleet.AddShip( ship );
			if ( this.ship_dest ) { 
				if ( typeof(this.ship_dest)==='object' ) { 
					if ( this.ship_dest.accts.has(this.owner) ) { 
						myfleet.SetDest(this.ship_dest);
						}
					}
				else if ( this.ship_dest == '@' ) { 
					let closest = null;
					let best_length = 100000000;
					for ( let star of this.owner.ai.staging_pts ) { 
						if ( star.accts.has(this.owner) ) { 
							let dist = utils.DistanceBetween( star.xpos, star.ypos, this.star.xpos, this.star.ypos, true );
							if ( dist < best_length ) { 
								best_length = dist;
								closest = star;
								}
							}
						// remove from staging point list while we're here
						else {
							this.owner.AI_RemoveStagingPoint(star);
							}
						}
					if ( closest ) { 
						myfleet.SetDest(closest);
						console.log('set course for ' + closest.name);
						}
					}
				}
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
		
	AddBuildQueueShipBlueprint( bp ) { 
		let item = {
			type: 'ship',
			obj: bp,
			name: bp.name,
			labor: bp.labor, // "cost" in hammers
			mp: bp.mass, // material points
			spent: 0,
			qty: 1,
			turns_left: 0,
			pct: 0
			};
		this.prod_q.push(item);
		this.BuildQueueShuffleDownInfiniteProjects();
		}
		
	AddBuildQueueGroundUnitBlueprint( bp ) { 
		let item = {
			type: 'groundunit',
			obj: bp,
			name: bp.name,
			labor: bp.labor, // "cost" in hammers
			mp: bp.mass, // material points
			spent: 0,
			qty: 1,
			turns_left: 0,
			pct: 0
			};
		this.prod_q.push(item);
		this.BuildQueueShuffleDownInfiniteProjects();
		}
		
	AddBuildQueueMakeworkProject( type = 'tradegoods' ) { 
		// TODO differentiate makework types. only tradegoods for now
		let item = null;
		switch ( type ) { 
			case 'tradegoods' : 
			default : { 
				item = {
					type: 'makework',
					name: 'Trade Goods',
					obj: 'tradegoods',
					labor: 3, // "cost" in hammers
					mp: 1, // material points
					spent: 0,
					qty: -1, // default infinity
					turns_left: 0,
					pct: 0,
					ProduceMe: function ( planet ) {
						// TODO: add to accounting records
						planet.owner.treasury += 10;	
						planet.econ.tradegoods += 10;
						}
					};
				break;
				}
			}
		this.prod_q.push(item);
		this.BuildQueueShuffleDownInfiniteProjects();
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
			{type: 'tradegoods', name: 'Trade Goods'},
			];
		}
		
	AgePlanet() { 
		this.age_level = Math.min( Math.floor( ++this.age / 40 ), 5 );
		}
  	// returns an integer value which may be negative
	Adaptation( race ) { 
		return -( 
			(Math.abs( this.atm - race.env.atm ) + Math.abs( this.temp - race.env.temp ) + Math.abs( this.grav - race.env.grav )  )
	 		- race.env.adaptation 
	 		) ;
		}
  	// returns true if the planet can be settled by the race
	Habitable( race ) { 
		return ( (Math.abs( this.atm - race.env.atm ) + Math.abs( this.temp - race.env.temp )  + Math.abs( this.grav - race.env.grav ) )
	 		- race.env.adaptation 
	 		) <= race.env.habitation;	
		}
	HabitationBonus( race ) { 
		let x = this.Adaptation( race );
// 		let y = ( 2 / ( 1 + Math.pow( Math.exp(1), -0.52*x ) ) ) - 1; // sigmoid function
// 		return Math.round( y * 20 ) / 20; // this part rounds off to the nearest 5%
		// lets keep this simple: -20% for each negative, +10% for each positive
		if ( x < 0 ) { return utils.Clamp( x*0.2, -0.9, 0 ); }
		else if ( x > 0 ) { return utils.Clamp( x*0.1, 0, 1.0 ); }
		return 0;
		}
	
	_MaxPop( race ) {
		let a = this.age_level * 0.05; // age bonus
		let b = 0.0; // this.HabitationBonus( race );
		return ( this.size * (1+b+a) ) / race.size;
		}
		
	@computedFrom('age_level','owner','size','owner.adaptation')
	get maxpop () { 
		return this.owner ? this._MaxPop( this.owner.race ) : this.size;
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
		this.RecalcSectors();
		}
	set slider_mine(x) { 
		this.sect.mine.relpct = parseFloat(x);
		this.RecalcSpendingSliders();
		}
// 	set slider_gov(x) { 
// 		this.sect.gov.relpct = parseFloat(x);
// 		this.RecalcSpendingSliders();
// 		}
	set slider_prod(x) { 
		this.sect.prod.relpct = parseFloat(x);
		this.RecalcSpendingSliders();
		}
	set slider_sci(x) { 
		this.sect.sci.relpct = parseFloat(x);
		this.RecalcSpendingSliders();
		}
	set slider_com(x) { 
		this.sect.com.relpct = parseFloat(x);
		this.RecalcSpendingSliders();
		}
	set slider_civ(x) { 
		this.sect.civ.relpct = parseFloat(x);
		this.RecalcSpendingSliders();
		}
	set slider_def(x) { 
		this.sect.def.relpct = parseFloat(x);
		this.RecalcSpendingSliders();
		}
	set slider_sup(x) { 
		this.sect.sup.relpct = parseFloat(x);
		this.RecalcSpendingSliders();
		}
	set slider_esp(x) { 
		this.sect.esp.relpct = parseFloat(x);
		this.RecalcSpendingSliders();
		}
	set slider_taxrate(x) { 
		this.tax_rate = parseFloat(x);
		this.RecalcSpendingSliders();
		}
	@computedFrom('sect.mine.relpct')	
	get slider_mine() { return this.sect.mine.relpct; }
	
// 	@computedFrom('sect.gov.relpct')	
// 	get slider_gov() { return this.sect.gov.relpct; }
	
	@computedFrom('sect.prod.relpct')	
	get slider_prod() { return this.sect.prod.relpct; }
	
	@computedFrom('sect.sci.relpct')	
	get slider_sci() { return this.sect.sci.relpct; }
	
	@computedFrom('sect.com.relpct')	
	get slider_com() { return this.sect.com.relpct; }
	
	@computedFrom('sect.civ.relpct')	
	get slider_civ() { return this.sect.civ.relpct; }
	
	@computedFrom('sect.def.relpct')	
	get slider_def() { return this.sect.def.relpct; }
	
	@computedFrom('sect.sup.relpct')	
	get slider_sup() { return this.sect.sup.relpct; }
	
	@computedFrom('sect.esp.relpct')	
	get slider_esp() { return this.sect.esp.relpct; }
	
	@computedFrom('tax_rate')	
	get slider_taxrate() { return this.tax_rate; }
		
	RecalcSpendingSliders() { 
		// get some stats
		let t = 0; // sum of all sliders
		let n = 0; // number of sectors
		for ( let s in this.sect ) { 
			t += this.sect[s].relpct; 
			n++;
			}
		if ( t ) { 
			for ( let s in this.sect ) { 
				this.sect[s].pct = this.sect[s].relpct / t; 
				}	
			}
		// if everything is zero, divide evenly
		else {
			for ( let s in this.sect ) { 
				this.sect[s].pct = 1.0 / n; 
				}
			}
		// recalc expenses
		this.RecalcSectors();
		}
	RecalcSectors() { 
		let taxes = this.tax;
		let cost = 0;
		this.econ.expenses.sectors = 0;
		this.mp_need = 0; // material points (MP)
		for ( let k in this.sect ) {
			let s = this.sect[k];
			s.work = this.total_pop * this.spending * s.pct * s.pow;
			cost += s.work * ( s.cost * (1-(this.age_level*0.05)) ) ; // we dont work for free. 
			this.econ.expenses.sectors += s.work * s.cost;
			s.output = Math.min(s.inf,s.work);
			let diff = s.work - s.inf;
			s.growth = diff ? (0.2 * Math.pow( Math.abs(diff), 0.75 ) ) : 0;
			if ( diff < 0 ) {  s.growth = -s.growth; } // invert if needed
			if ( s.growth > 0 ) { this.mp_need += s.growth; } // growing infrastructure takes material
			else if ( s.growth < 0 && s.inf == 1.0 ) { s.growth = 0; } // 1.0 is minimum infrastructure.
			}
		// how much money we are making or losing
		this.treasury_contrib = taxes - cost;	
		// add production queue item MP requirements
		// (count tradegoods income while we're here too)
		if ( this.sect.prod.output ) { 
			this.econ.tradegoods = 0; // reset
			let labor_available = this.sect.prod.output;
			outerloop:
			for ( let item of this.prod_q ) {
				// each queue item also has a quantity
				let qty = (item.qty > 0) ? item.qty : 100000; // account for infinite qty "-1"
				for ( let n = 0; n < qty; n++ ) { 
					// how much can i build next turn?
					let labor_per_mp = item.labor / item.mp;
					let mp_remaining = item.mp - ( n==0 ? item.spent : 0 );
					let labor_needed = mp_remaining * labor_per_mp;
					// can i build the whole thing?
					if ( labor_needed < labor_available ) { 
						labor_available -= labor_needed;
						this.mp_need += mp_remaining;
						}
					// can only build a portion.
					// how many MP can i buy with this many hammers?
					else {
						this.mp_need += labor_available / labor_per_mp;
						labor_available = 0; // pedantic
						break outerloop;
						}
					}
				}
			}
		// do we need to import or export stuff?
		this.mp_export = 0;
		// import
		if ( this.mp_need > this.sect.mine.output + this.warehouse ) { 
			this.mp_export = (this.sect.mine.output + this.warehouse) - this.mp_need; // negative means we need to import
			}
		// export
		else if ( this.sect.mine.output + this.warehouse > this.min_warehouse ) { 
			let total = (this.sect.mine.output + this.warehouse) - this.mp_need;
			if ( total > this.min_warehouse ) { 
				this.mp_export = total - this.min_warehouse;
				}
			}
		}
	DoMining() { 
		this.warehouse += this.sect.mine.output;
		// let the turn processor handle resource import/export
		}
	DoProduction( ) { 
		//
		// TODO:
		// Mining resources are required for building infrastructure and production
		// (and possibly robots), so these functions need to coordinate any
		// potential MP deficiencies so that one function does not steal everything.
		//
		if ( this.sect.prod.output && this.prod_q.length && this.warehouse ) { 
			// produce as many items in the queue as we can 
			let labor_available = this.sect.prod.output;
			let ok = true;
			while ( ok ) { 
				let item = this.prod_q[0];
// 				console.log(item);
				// each queue item also has a quantity
				if ( item.qty ) { 
					// how much can i build next turn?
					let labor_per_mp = item.labor / item.mp;
					let mp_remaining = item.mp - item.spent;
					let mp_committed = Math.min( mp_remaining, this.warehouse ); // can't use resources we dont have
					let labor_needed = mp_committed * labor_per_mp;
// 					console.log(`${item.labor}H / ${item.mp}MP, labor_per_mp = ${labor_per_mp}, mp_remaining = ${mp_remaining}, mp_committed = ${mp_committed}, labor_needed = ${labor_needed}, `);
					// can't use labor we dont have either
					if ( labor_needed > labor_available ) { 
// 						console.log(`don't have enough labor to finish project (${labor_available}H), so only comitting ${mp_committed} MP  (${labor_needed}H)`);
						mp_committed = labor_available / labor_per_mp;
						}
					// do some work
					labor_available -= labor_needed;
					this.warehouse -= mp_committed;	
					item.spent += mp_committed;
					// did something get built?
					if ( item.spent >= (item.mp - 0.0001) ) { // slop room
// 						console.log(`item completed.`);
						this.ProduceBuildQueueItem( item );
						// reset
						item.spent = 0;
						item.pct = 0;
						item.turns_left = 0; // Math.ceil( item.cost / this.sect.prod.output ) ;
						// decrement if they wanted more than one
						if ( item.qty > 0 ) {
							item.qty -= 1;
							}
						// pop from list if we reached zero
						if ( item.qty == 0 ) {
// 							console.log(`popped from list`);
							this.prod_q.shift()
// 							this.buildings.push( this.prod_q.shift() );
							}
						}
					// update the stats
					else {
// 						console.log(`item unfinished. item.turns_left = ${item.turns_left}, item.pct = ${item.pct}`);
						item.turns_left = Math.ceil( ((item.mp - item.spent) * labor_per_mp) / this.sect.prod.output ) ;
						item.pct = ( item.spent / item.mp) * 100;
						}
					// exhausted?
					if ( this.warehouse <= 0 || labor_available <= 0 || !this.prod_q.length ) {
// 						console.log(`labor exhausted. done building for this turn.`);
						ok = false;
						}
					}
				else { ok = false; }
				}
			}	
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
			fx: 1 + this.HabitationBonus( this.owner.race ),
			weight: 5.0
			};
		// crowding (sigmoid function)
		// see: https://www.desmos.com/calculator/5uo3t7mqnj
		// TODO: factor in multiracial
		factors.crowding = { 
			fx: ( 1.5 / ( 1 + Math.pow( Math.E, (-6 + (9*( this.total_pop/this.maxpop )) ) ) ) ) + 0.5,
			weight: 4.0
			};
    	// age level - TODO: might change this to just 'age' for more granularity
		factors.age = { 
			fx: ( 1 + ( this.age_level / 5 ) ),
			weight: 5.0
			};
    	// military defense - makes people feel safe
		factors.age = { 
			fx: ( 1 + ( utils.Clamp(this.sect.def.output,0,100) / 100 ) ),
			weight: 5.0
			};
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
			// connectivity / hyperlanes
			
		// we want PCI=10 for new vanilla colonies
		let resource_mod = 20; 
		// establish a base economic rate based on planet resources
		let target_PCI = ((this.rich + this.energy) / 2) * resource_mod;
		// adjust by the planet's age (doubles after 100 turns)
		target_PCI *= 1 + (this.age/50);
		// taxes modify the base rate
		target_PCI *= Math.pow( utils.MapToRange( this.tax_rate, 0, 0.5, 2.0, 0.2 ), 1.5 );
    
// 		let ecoscale = 1.0; // for balancing
// 		let base = total * ecoscale;
// 		if ( base < 1 ) { base = 1; }
		let min_PCI = 0.1; 
		this.econ.target_PCI = Math.pow( target_PCI, 0.65 ); // diminishing returns
		if ( this.econ.target_PCI < min_PCI ) { this.econ.target_PCI = min_PCI; }
		
		// grow economy in stages, like sector infrastructure, but faster
		let diff = this.econ.target_PCI - this.econ.PCI;
		let growth = diff ? (0.4 * Math.pow( Math.abs(diff), 0.75 ) ) : 0; // rubber band growth
		this.econ.PCI += ( diff > 0 ) ? growth : -growth ;	
		this.econ.GDP = this.total_pop * this.econ.PCI; // fun stat, does nothing
		}
		
		
	GrowPop() { 
		// growth rate is square root of difference between max pop and current pop, divided by 50.
		let maxpop = this.maxpop; // TODO: factor in multiracial
		let diff = maxpop - this.total_pop; 
		let divisor = 60.0;
		let hitmaxpop = false;
		if ( diff > 0 ) { // pop growth
			let max_diff = 50.0;
			let rate  = ( Math.sqrt( diff > max_diff ? max_diff : diff ) / divisor ) + 1.0;
			this.total_pop = (this.total_pop * rate) + 0.05; // the 0.05 just helps it move along
			if ( this.total_pop >= maxpop ) {
				hitmaxpop = true;
				}
			}
// 		else if ( diff < -5 ) { // pop decline - we outstripped allowable space somehow
// 			this.total_pop *= 1.0 - ((( this.total_pop / maxpop ) - 1.0) * 0.2);
// 			}
		if ( this.total_pop > maxpop ) { this.total_pop = maxpop; }
		return hitmaxpop; // let the app know if we hit max pop and maybe issue a message
		}
		
	// temp => atm
	static EnvNames() {
		return [
		// THIN ---------------------------------------------------- DENSE
		['Bleak',		'Barren',		'Polar',		'Frozen',	'Iceball'], //	COLD
		['Dead',		'Glacial',	'Mountainous',	'Tundra',	'Arctic'],
		['Dune',		'Steppe',		'Temperate',	'Jungle',	'Ocean'],
		['Wasteland',	'Desert',		'Arid',		'Swamp',	'Sauna'],
		['Inferno',	'Scorched',	'Parched',	'Torrid',	'Cauldron'] //	HOT	
		]; }
	static GravNames() {
		return ['Weak','Light','Medium','Heavy','Crushing' ]; 
		}
		
	static AttributeSelector() { 
		let attrs = Planet.AttributesList();
		let data = [];
		let n = attrs.length;
		for ( let i=0; i < n; i++ ) { 
			data.push( [ attrs[i], attrs[i].chance ] );	
			}
		return new RandomPicker(data);
		}
	
	static AttributesList() {
		return [
			// attributes
			{name: 'Ecliptic', chance: 100, note: '+range, +vis, +res', fx: {} },
			{name: 'Rare Minerals', chance: 100, note: '+prod, +econ', fx: {} },
			{name: 'Rare Metals', chance: 100, note: '++prod', fx: {} },
			{name: 'Rare Gems', chance: 100, note: '++econ', fx: {} },
			{name: 'Cavernous', chance: 100, note: '+def, +mig, +inf', fx: {} },
			{name: 'Beautiful', chance: 200, note: '+econ, +mig, +morale', fx: {} },
			{name: 'Dangerous', chance: 200, note: '+def, --mig', fx: {} },
			{name: 'Volcanic', chance: 100, note: '-inf', fx: {} },
			{name: 'Geo-Unstable', chance: 200, note: '--inf', fx: {} },
			{name: 'Flat', chance: 200, note: '+inf, -mig', fx: {} },
			{name: 'Accessible', chance: 100, note: '++prod, +mig', fx: {} },
			{name: 'Hyper-Perfect', chance: 50, note: '++hyperlanes, +mig', fx: {} },
			{name: 'Hyper-Ideal', chance: 80, note: '+hyperlanes, +mig', fx: {} },
			{name: 'Bread Basket', chance: 200, note: '+mig, +morale, +pop', fx: {} },
			{name: 'Pharmacopia', chance: 100, note: '++pop', fx: {} },
			{name: 'Rings', chance: 120, note: '+prod', fx: {} },
			{name: 'Asteroid Belt', chance: 60, note: '++prod', fx: {} },
			
			{name: 'Ancient Cultures', chance: 60, note: '+res, +morale, +mig', fx: {} },
			{name: 'Hostile Lifeforms', chance: 150, note: '-pop, -prod, -mig', fx: {} },
			{name: 'Unusual Weather', chance: 90, note: '+res, -prod, -mig', fx: {} },
			{name: 'Abundant Life', chance: 180, note: '+morale, +res', fx: {} },
			{name: 'Rich Soil', chance: 200, note: '+pop', fx: {} },
// 			{name: 'Poor Soil', chance: 200, note: '-pop', fx: {} },
			{name: 'Toxic Flora', chance: 80, note: '-pop', fx: {} },
			{name: 'Corrosive Atmosphere', chance: 200, note: '--inf, -pop', fx: {} },
			{name: 'Perfect Alignment', chance: 60, note: '++prod, -mig', fx: {} },
			{name: 'Short Days', chance: 70, note: '-prod', fx: {} },
			{name: 'Legendary', chance: 20, note: '+++everything', fx: {} },
			// special resources
			{name: 'Neutronium', chance: 50, note: 'special resource', fx: {} },
			{name: 'Anti-Matter', chance: 40, note: 'special resource', fx: {} },
			{name: 'Temporal Elements', chance: 30, note: 'special resource', fx: {} },
			{name: 'Quantoids', chance: 20, note: 'special resource', fx: {} },
			{name: 'Q-Plasma', chance: 20, note: 'special resource', fx: {} },
			]; 
		}
		
	get envDisplayName() {
		return Planet.EnvNames()[this.temp][this.atm];
		}
	get gravDisplayName() {
		return Planet.GravNames()[this.grav];
		}
			
	static NextUniqueID() {
		if( !this.next_uid && this.next_uid!==0 ){
			this.next_uid=1;
			}
		else{
			this.next_uid++;
			}
		return this.next_uid;
		}
		
		
	constructor( star, name ) { 
		this.star = star;	
		this.name = ( name || RandomName() ).uppercaseFirst();
		this.id = Planet.NextUniqueID();
		this.mods = new Modlist;
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
			
		let rarity = Math.abs( planet.atm - planet.temp ); // high number = more off the main line of probability.
		
		// galaxy age influences the richness of the planet.
		// younger galaxies have less resources.
		let rich_salt = 0.8 + (star_age - 0.5);
		if ( star.color == 'purple' ) { rich_salt += 0.6; }
		if ( star.color == 'black' ) { rich_salt += 0.8; }
		if ( star.color == 'green' ) { rich_salt += 1.0; } 
		planet.rich = Math.pow( utils.BiasedRand(0.3, 1.732, rich_salt, 1.0), 2 );
		// rarer planet types get a direct boost to richness to make them worth colonizing.
		if ( rarity == 3 ) { planet.rich += utils.RandomFloat( 0.5, 2.5 ); }
		else if ( rarity == 4 ) { planet.rich += utils.RandomFloat( 1.0, 5.0 ); }
		planet.rich = parseFloat( planet.rich.toFixed(1) );
		planet.sect.mine.pow = planet.rich;
		
		// younger stars have more energy potential, making them better for industry
		let energy_salt = 0.8 + ((1.0-star_age) - 0.5);
		planet.energy = Math.pow( utils.BiasedRand(0.3, 1.732, energy_salt, 0.8), 2 );
		// rare planet types are just totally wacky
		if ( star.color == 'purple' ) { planet.energy = utils.RandomFloat( 0.2, 3.0 ); }
		if ( star.color == 'black' ) { planet.energy = utils.RandomFloat( 0.2, 5.0 ); }
		if ( star.color == 'green' ) { planet.energy = utils.RandomFloat( 0.2, 8.0 ); } 
		planet.energy = parseFloat( planet.energy.toFixed(1) );
		planet.sect.prod.pow = planet.energy;
		
		// size is not dependent on star or galaxy. just random.
		planet.size = ( Math.floor( utils.standardRandom() * 14 ) + 1 ) * 10 ;
		// ... unless you are a special color
		if ( star.color == 'purple' ) { planet.size += 20; }
		else if ( star.color == 'black' ) { planet.size += 40; }
		else if ( star.color == 'green' ) { planet.size += 60; }
		
		// gravity generally coralates with size, except for weird stars
		if ( star.color == 'black' || star.color == 'purple' || star.color == 'green' ) { 
			planet.grav = utils.RandomInt(0,4);
			}
		else {
			planet.grav = utils.Clamp( utils.BiasedRandInt(0, 4, ((planet.size-30)/100)*4.0, 1.0), 0, 4);
			}
			
		// for reasons beyond science, other market sectors have random powers
		if ( Math.random() < 0.5 ) { planet.sect.sci.pow = parseFloat( (1.5 - utils.BiasedRand(0.0, 1.0, 0.75, 0.5)).toFixed(1) ); }
		if ( Math.random() < 0.5 ) { planet.sect.def.pow = parseFloat( (1.5 - utils.BiasedRand(0.0, 1.0, 0.75, 0.5)).toFixed(1) ); }
		if ( Math.random() < 0.5 ) { planet.sect.esp.pow = parseFloat( (1.5 - utils.BiasedRand(0.0, 1.0, 0.75, 0.5)).toFixed(1) ); }
		
		// special attributes (AKA "goodies")
		let selector = Planet.AttributeSelector();
		let attr_randnum = Math.random();
		// special and rare stars get more goodies
		if ( star.color == 'purple' ) { attr_randnum *= 2.0; }
		else if ( star.color == 'black' ) { attr_randnum *= 3.0; }
		else if ( star.color == 'green' ) { attr_randnum *= 4.0; }
		else if ( rarity == 3 ) { attr_randnum *= 2.0; }
		else if ( rarity == 4 ) { attr_randnum *= 3.0; }
		let num_attrs = 0;
		if ( attr_randnum >= 0.97 ) { num_attrs = 3; } 
		else if ( attr_randnum >= 0.90 ) { num_attrs = 2; } 
		else if ( attr_randnum >= 0.60 ) { num_attrs = 1; } 
		for ( let n=0; n < num_attrs; n++ ) { 
			planet.physattr.push( selector.Pick() );
			}
		planet.physattr;// = planet.physattr.unique();		
		
		// feature slots
		planet.maxslots = utils.BiasedRandInt(0, 5, 1, 0.5);
		
		// calculate natural score
		for ( let k of Object.keys(planet.sect) ) { 
			planet.score += planet.sect[k].pow * 2;
			}
		planet.score += planet.size * 0.1;
		planet.score += planet.maxslots *0.25;
		// TODO calculate goodies
		
		return planet;
		}
		
	// gives a value score from the perspective of the civ.
	// useful for AI functions in determining where to 
	// colonize or capture
	ValueTo( civ ) {
		// even habitable?
		if ( !this.Habitable( civ.race ) ) { 
			return 0;
			}
		// not in range? not worth anything 
		if ( !civ.InRangeOf(this.star.xpos, this.star.ypos) ) { 
			return 0;
			}
		// natural environmental score
		let score = this.score;
		// adaptation
		score += this.Adaptation( civ.race ) * 3; 
		// distance from emperical center (not actually that important)
		let bx = civ.empire_box.x1 + ( ( civ.empire_box.x2 - civ.empire_box.x1 ) * 0.5 );
		let by = civ.empire_box.y1 + ( ( civ.empire_box.y2 - civ.empire_box.y1 ) * 0.5 );
		let dist = utils.DistanceBetween( this.star.xpos, this.star.ypos, bx, by );
		if ( dist ) { score += ( 1 / dist ) * 7000; }
		// population	
		score += this.total_pop * 0.1;
		// local economy
		for ( let s of Object.keys(this.sect) ) { 
			score += this.sect[s].output * 0.05;
			}
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
		
		this.AddBuildQueueMakeworkProject('tradegoods');
			
		this.RecalcSectors();	
		this.UpdateOwnership();
		} // end Settle

	RemoveDeadTroops() { 
		this.troops = this.troops.filter( t => t.hp );
		}
		
	BeConqueredBy( invader ) {
		this.star.accts.get(this.owner).planets--;
		let i = this.owner.planets.indexOf( this );
		if ( i > -1 ) { this.owner.planets.splice( i, 1 ); } 
		this.owner = invader;
		this.UpdateOwnership();
		// TODO: morale penalty?
		}
		
	// in case of a change in ownership, call this function to run 
	// necessary housekeeping stuff
	UpdateOwnership() { 
		this.owner.planets.push( this );
		this.star.UpdateOwnershipTitleColorCSS();
		if ( this.star.accts.has(this.owner) ) {
			this.star.accts.get(this.owner).planets++;
			}
		else {
			this.star.AddAccount( this.owner ); 
			}
		this.owner.RecalcEmpireBox();	
		this.ui_color = `rgb( ${this.owner.color_rgb[0]}, ${this.owner.color_rgb[1]}, ${this.owner.color_rgb[2]} )` ;
		this.mods.parent = this.owner.mods;
		this.ship_dest = this.owner.is_player ? null : '@';
		// homeworlds are AI staging points by default
		if ( !this.owner.is_player && this.owner.planets.length==1 ) { 
			this.owner.AI_AddStagingPoint( this.star );
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
		
	}
