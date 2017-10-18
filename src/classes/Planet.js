import Star from './Star';
import Hyperlane from './Hyperlane';
import Constellation from './Constellation';
import RandomPicker from '../util/RandomPicker';
import RandomName from '../util/RandomName';
import * as utils from '../util/utils';

export default class Planet {
	
	// UI and DATA ---------------------------------------
	ui_color = 'inherit'; // this way you can set defaults in CSS and override inline
	star = null;
	explored = false;
	owner = false; // false indicates unowned. zero can be an index
	// constellations are groups of connected stars of the same civ. 
	// it's easier to put a link to the constellation on the indv colonies
	// than to link it to the star, because contellations of different
	// civs in the same star systems may overlap
// 	constel = null;
	name = 'UNKNOWN';
	inf = 0;
	total_pop = 0;
	pop = [];
	morale = 1.0;	
	
	
	// PHYSICAL ATTRIBUTES -------------------------------
	energy = 1.0; // represents production bonus
	rich = 0;
	size = 0;
	atm = 0;
	temp = 0;
	physattr = [];
	
	
	// ECONOMY -------------------------------------------
	tax_rate = 0.2;
	use_global_tax_rate = false;
	spending = 0.75;
	buildings = [];
	building_fund = 0;
	base_PCI = 10.0; // per capita income
	bonus_PCI = 0.0;	
	warehouse = 0;
	econ = {
		GDP: 0, // gross domestic product
		PCI: 0, // per-capita income
		GF: 0, // growth factor
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
		mine:{ pct: 0.5, relpct: 0.5, pow: 1.0, work: 0, output: 0.0, inf: 0.0, growth: 0.0 },
		prod:{ pct: 0.5, relpct: 0.5, pow: 1.0, work: 0, output: 0.0, inf: 0.0, growth: 0.0 },
		sci:	{ pct: 0.0, relpct: 0.0, pow: 1.0, work: 0, output: 0.0, inf: 0.0, growth: 0.0 },
		com:	{ pct: 0.0, relpct: 0.0, pow: 1.0, work: 0, output: 0.0, inf: 0.0, growth: 0.0 },
		gov:	{ pct: 0.0, relpct: 0.0, pow: 1.0, work: 0, output: 0.0, inf: 0.0, growth: 0.0 },
		spy:	{ pct: 0.0, relpct: 0.0, pow: 1.0, work: 0, output: 0.0, inf: 0.0, growth: 0.0 },
		sup:	{ pct: 0.0, relpct: 0.0, pow: 1.0, work: 0, output: 0.0, inf: 0.0, growth: 0.0 },
		civ:	{ pct: 0.0, relpct: 0.0, pow: 1.0, work: 0, output: 0.0, inf: 0.0, growth: 0.0 },
		def:	{ pct: 0.0, relpct: 0.0, pow: 1.0, work: 0, output: 0.0, inf: 0.0, growth: 0.0 }	
		};



	// PRODUCTION --------------------------	
	prod_q = [
		{
			type: 'building',
			obj: {
				name: 'Orbital Defense Platform',
				unique: true,
				},
			cost: 50,
			spent: 12,
			quantity: 1,
			turns_left: 4,
			pct: (12.0/50.0)*100
			},
		{
			type: 'ship',
			obj: {
				name: 'Defender mkIII',
				unique: false,
				},
			cost: 40,
			spent: 0,
			quantity: 3,
			turns_left: 3,
			pct: 0
			},
		{
			type: 'building',
			obj: {
				name: 'Breakfast',
				unique: true,
				},
			cost: 30,
			spent: 8,
			quantity: 1,
			turns_left: 2,
			pct: (8.0/30.0)*100
			}
		];
	
	build_opts = [
		{
			name: "Thing 1",
			},
		{
			name: "Thing 2",
			},
		{
			name: "Thing 3",
			},
		];
			
		
	get tax() { 
		return this.total_pop * this.tax_rate * this.econ.PCI;
		}
// 	get spending() { 
// 		return this.spending;
// 		}
// 	set spending(x) { 
// 		this.spending = x.clamp(0,200);
// 		this.RecalcSectors();
// 		}
	set slider_mine(x) { 
		this.sect.mine.relpct = parseFloat(x);
		this.RecalcSpendingSliders();
		}
	set slider_gov(x) { 
		this.sect.gov.relpct = parseFloat(x);
		this.RecalcSpendingSliders();
		}
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
	set slider_spy(x) { 
		this.sect.spy.relpct = parseFloat(x);
		this.RecalcSpendingSliders();
		}
	get slider_mine() { 
		return this.sect.mine.relpct;
		}
	get slider_gov() { 
		return this.sect.gov.relpct;
		}
	get slider_prod() { 
		return this.sect.prod.relpct;
		}
	get slider_sci() { 
		return this.sect.sci.relpct;
		}
	get slider_com() { 
		return this.sect.com.relpct;
		}
	get slider_civ() { 
		return this.sect.civ.relpct;
		}
	get slider_def() { 
		return this.sect.def.relpct;
		}
	get slider_sup() { 
		return this.sect.sup.relpct;
		}
	get slider_spy() { 
		return this.sect.spy.relpct;
		}
	RecalcSpendingSliders() { 
		// get some stats
		let t = 0; // sum of all sliders
		let n = 0; // number of sectors
		for ( let s of this.sect ) { 
			t += s.relpct; 
			n++;
			}
		if ( t ) { 
			for ( let s of this.sect ) { 
				s.pct = s.relpct / t; 
				}	
			}
		// if everything is zero, divide evenly
		else {
			for ( let s of this.sect ) { 
				s.pct = 1.0 / n; 
				}
			}
		// recalc expenses
		this.RecalcSectors();
		}
		
	// ????
	CollectTax() { 
		return this.total_pop * this.tax_rate * this.econ.PCI;
		}
	DoMining() { 
		this.sect.mine.output = this.sect.mine.est_output;
		this.warehouse += this.sect.mine.output;
		this.sect.mine.cost = this.sect.mine.est_cost;
		}
	DoProduction() { 
		// actual output depends on available mining resources.
		this.building_fund += this.sect.prod.output;
		this.warehouse -= this.sect.prod.output;
		// record the actual cost for what was actually produced (and dont divide by zero)
		let pct = this.sect.prod.est_output > 0 ? (this.sect.prod.output / this.sect.prod.est_output) : 1.0;
		this.sect.prod.cost = this.sect.prod.est_cost * pct;
		// apply the production to the elements in the build queue
		while ( this.building_fund > 0 && this.prod_q.length ) {
			let amount = Math.min( this.building_fund, (this.prod_q[0].cost - this.prod_q[0].spent) );
			this.prod_q[0].spent += amount;
			this.building_fund -= amount;
			// item complete, remove from queue
			if ( this.prod_q[0].spent >= this.prod_q[0].cost ) { 
				// 
				// TODO: produce the item
				//
				// reset
				this.prod_q[0].spent = 0;
				this.prod_q[0].pct = 0;
				this.prod_q[0].turns_left = Math.ceil( this.prod_q[0].cost / this.sect.prod.output ) ;
				// decrement if they wanted more than one
				if ( this.prod_q[0].quantity > 0 ) {
					this.prod_q[0].quantity -= 1;
					}
				// pop from list if we reached zero
				if ( this.prod_q[0].quantity == 0 ) {
					this.buildings.push( this.prod_q.shift() );
					}
				}
			// update the stats
			else {
				let remaining = this.prod_q[0].cost - this.prod_q[0].spent;
				this.prod_q[0].turns_left = Math.ceil( remaining / this.sect.prod.output ) ;
				this.prod_q[0].pct = ( this.prod_q[0].spent / this.prod_q[0].cost) * 100;
				}
			}

		}
		
	ProcessSectors() { 
		this.RecalcSectors();
		for ( let s of this.sect ) {
			s.inf += s.growth;
			}
		}
	RecalcSectors() { 
		let taxes = this.tax;
		for ( let k in this.sect ) {
			let s = this.sect[k];
			let spending = taxes * this.spending * s.pct;
			s.work = spending * s.pow;
			s.output = Math.min(s.inf,s.work);
			s.growth = 0.2 * ( s.work - s.inf ) ^ 0.75;
			}
		}
		
	GrowEconomy() { 
		// morale and taxes affect the growth rate
		let min_PCI = 1.0 + this.bonus_PCI;
		let tax_baserate = 1.05;
		let tax_mod = tax_baserate - (this.tax_rate * this.tax_rate);
		let morale_baserate = 1.00;
		let morale_effect = 0.12;
		let morale_mod = morale_baserate + ((this.morale - 1.0) * morale_effect);
		this.econ.GF = Math.pow(tax_mod * morale_mod, (1.0 / this.econ.PCI) );
		this.econ.PCI *= this.econ.GF;
		if ( this.econ.PCI < min_PCI ) { this.econ.PCI = min_PCI; }
		this.econ.GDP = this.total_pop * this.econ.PCI;
		}
	GrowPop() { 
		// growth rate is square root of difference between max pop and current pop, divided by 50.
		// max pop is actually the current infrastructure number, up to the planet size.
		let diff = this.inf - this.total_pop; // <----- OOOO BAD INF!
		let divisor = 60.0;
		let maxpop = false;
		if ( diff > 0 ) { // pop growth
			let max_diff = 50.0;
			let rate  = ( Math.sqrt( diff > max_diff ? max_diff : diff ) / divisor ) + 1.0;
			this.total_pop = (this.total_pop * rate) + 0.05; // the 0.05 just helps it move along
			if ( this.total_pop >= this.size ) {
				maxpop = true;
				}
			}
		else if ( diff < -5 ) { // pop decline - we outstripped housing
			this.total_pop *= 1.0 - ((( this.total_pop / this.inf ) - 1.0) * 0.2);
			}
		if ( this.total_pop > this.size ) { this.total_pop = this.size; }
		return maxpop; // let the app know if we hit max pop and maybe issue a message
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
			}
		else {
			let star_age_mod = star_age + 1.0;
			planet.atm = utils.BiasedRandInt(0, 4, (1.0-star_age)*4.0, 0.3);
			planet.temp = utils.BiasedRandInt(0, 4, (1.0-star_age)*4.0, 0.3);
			}
			
		let rarity = Math.abs( planet.atm - planet.temp ); // high number = more off the main line of probability.
		
		// galaxy age influences the richness of the planet.
		// younger galaxies have less resoures.
		let rich_salt = 0.8 + (star_age - 0.5);
		if ( star.color == 'purple' ) { rich_salt += 0.6; }
		if ( star.color == 'black' ) { rich_salt += 0.8; }
		if ( star.color == 'green' ) { rich_salt += 1.0; } 
		planet.rich = Math.pow( utils.BiasedRand(0.3, 1.732, rich_salt, 1.0), 2 );
		// rarer planet types get a direct boost to richness to make them worth colonizing.
		if ( rarity == 3 ) { planet.rich += utils.RandomFloat( 0.5, 2.5 ); }
		else if ( rarity == 4 ) { planet.rich += utils.RandomFloat( 1.0, 5.0 ); }
		planet.rich = parseFloat( planet.rich.toFixed(1) );
		
		// younger stars have more energy potential, making them better for industry
		let energy_salt = 0.8 + ((1.0-star_age) - 0.5);
		planet.energy = Math.pow( utils.BiasedRand(0.3, 1.732, energy_salt, 0.8), 2 );
		// rare planet types are just totally wacky
		if ( star.color == 'purple' ) { planet.energy = utils.RandomFloat( 0.2, 3.0 ); }
		if ( star.color == 'black' ) { planet.energy = utils.RandomFloat( 0.2, 5.0 ); }
		if ( star.color == 'green' ) { planet.energy = utils.RandomFloat( 0.2, 8.0 ); } 
		planet.energy = parseFloat( planet.energy.toFixed(1) );
		
		// size is not dependent on star or galaxy. just random.
		planet.size = ( Math.floor( utils.standardRandom() * 14 ) + 1 ) * 10 ;
		// ... unless you are a special color
		if ( star.color == 'purple' ) { planet.size += 20; }
		else if ( star.color == 'black' ) { planet.size += 40; }
		else if ( star.color == 'green' ) { planet.size += 60; }
		
		// special attributes
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
		
		return planet;
		}
		
	// owner must be a civ object, not an index ID
	Settle( owner ) {
		
		let had_prev_acct = this.star.Acct(owner);
		
		this.settled = true;
		this.explored = true;
		this.owner = owner;
		this.total_pop = 0.5;
// 		this.sect.mine.pct = 0.5;
// 		this.sect.prod.pct = 0.5;
// 		this.sect.mine.relpct = 0.5;
// 		this.sect.prod.relpct = 0.5;
		
		this.econ.GDP = 0;
		this.econ.PCI = this.base_PCI + this.bonus_PCI;
		this.econ.GF = 1.0;
		
		this.ui_color = `rgb( ${owner.color_rgb[0]}, ${owner.color_rgb[1]}, ${owner.color_rgb[2]} )` ;
		
		this.owner.planets.push( this );
		this.star.UpdateOwnershipTitleColorCSS();
		
		// when a planet is settled, we have to refactor constellations, if any.
		// start by finding all connected systems to this one.
		if ( !had_prev_acct ) { 
			this.star.AddAccount( this.owner );
			Constellation.Refactor( this.owner ); 
			}
			
		this.RecalcSectors();
		} // end Settle
		
	}
