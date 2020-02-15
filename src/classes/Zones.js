export class Zone {
	
	constructor( key ) {
		// 'fromJSON' style data bundle as first argument
		if ( typeof(key)==='object' && 'key' in key ) {
			Object.assign( this, ZoneList[key.key] );
			Object.assign( this, key );
			}
		// regular constructor
		else {  
			Object.assign( this, ZoneList[key] );
			// inputs and outputs are normalized per-sector and are
			// multiplied by the zone's stacked-size when calculating activity
			this.sect = this.minsect || 1;
			this.size = FastFactorial( this.sect );
			this.val = 0;
			this.insuf = false;
			this.output_rec = {}
			this.resource_rec = {};
			this.resource_estm = {}; // we may want this some day, but saves memory if we dont
			}
		for ( let k in this.outputs ) { this.output_rec[k]=0; } ; // prepopulate keys
		for ( let k in this.inputs ) { this.resource_rec[k]=0; } ; // prepopulate keys
		for ( let k in this.inputs ) { this.resource_estm[k]=0; } ; // prepopulate keys
		}
		
	Do( planet ) {
		
		let accounting = { name:this.name, type:'zone', subcat:this.type }; // start acounting record for UI
		
		// evaluate our allotment of resources in case there is a global shortage
		// ( you're only as good as your most limited resource )
		let min_resource_ratio = 1.0;
		for ( let k of Object.keys(this.inputs) ) {
			min_resource_ratio = Math.min( planet.owner.resource_supply[k], min_resource_ratio, 1.0 );
			}
			
		// growth percentage that we want to increase zone value by, assuming resources permit.
		// ideally we want enough resources to do our job and grow the maximum allowed amount.
		const growth_pct = Math.min( 
			planet.mods.Apply(
				(planet.throttle_speed * planet.energy ) / ( this.gf * (this.size / this.sect ) ),
				'zone_growth'
				), 
			1.0 - this.val 
			);
			
		// reduce resources of civ
		let funding_pct = ( this.val + growth_pct ) * min_resource_ratio;
		for ( let k of Object.keys(this.inputs) ) {
			let amount = this.inputs[k] * this.size * funding_pct * planet.throttle_input;
			amount = planet.mods.Apply( amount, `resources_consumed` );
			this.resource_rec[k] = amount;
			planet.resource_rec[k] += amount; // assume it gets zero'd out before this function is called
			planet.acct_total[k] = (planet.acct_total[k] || 0 ) - amount;
			accounting[k] = -amount;
			planet.owner.resources[k] -= amount;
			planet.owner.resource_spent[k] += amount;
			}
			
		// output
		let work = funding_pct * this.size * planet.throttle_output;
		// EXCEPTION: for housing zones, the "work" is the current zone value itself.
		// This represents housing availability current being provided for by the zone.
		if ( this.type == 'housing' ) { work = this.val * this.size * planet.throttle_output; }
		this.Output( planet, work, accounting );
		planet.acct_ledger.push( accounting );
		
		// grow or shrink depending on our funding
		let diff = funding_pct - this.val;
		
		if ( this.log ) { console.log('Do()',
			'min_resource_ratio:',min_resource_ratio,
			'growth_pct:',growth_pct,
			'funding_pct:',funding_pct,
			'work:',work,
			'this.val:',this.val,
			'diff:',diff,
			); }
		
		this.val += (diff >= 0) ? growth_pct : (diff * (1/this.gf) * 2);
		this.val = this.val.clamp(0,1);
		
		// if we shrank, warn player
		this.insuf = diff < 0;
		}
		
	Output( planet, work, accounting ) { 
		if ( work ) { 
			for ( let type of Object.keys(this.outputs) ) {
				if ( typeof(standard_outputs[type]) === 'function' ) {
					let amount = this.outputs[type] * work;
					// If this is a mining zone, the output is modified by local resource availabilty.
					// However it is also possible to synthesize new resources as outputs that
					// do NOT depend on local natural availability. If mining zones synthesize new
					// outputs instead of converting resources, add `zone.synth: true`
					if ( this.type=='mining' && ( !this.hasOwnProperty('synth') || !this.synth ) ) { 
						amount *= planet.resources.hasOwnProperty(type) ? planet.resources[type] : 0;
						}
					// check planetary and civ mods
					amount = planet.mods.Apply( amount, `zone_output_${this.type}` );
					amount = planet.mods.Apply( amount, `zone_output` );
					standard_outputs[type]( planet, amount ); // do it
					this.output_rec[type] = amount; 
					planet.output_rec[type] += amount; // assume it gets zero'd out before this function is called
					planet.owner.resource_income[type] += amount;
					accounting[type] = (accounting[type]||0) + amount;
					planet.acct_total[type] = ( planet.acct_total[type] || 0 ) + amount;
					}
				}
			}
		}
		
	EstimateResources( planet ) {
		// ideally we want enough resources to do our job and grow the maximum allowed amount.
		const growth = Math.min( 
			(planet.throttle_speed * planet.energy) / ( this.gf * (this.size / this.sect ) ), 
			1.0 - this.val 
			);
		let ratio_requesting = planet.throttle_input * ( this.val + growth );
		for ( let k of Object.keys(this.inputs) ) {
			let amount = this.inputs[k] * this.size * ratio_requesting;
			amount = planet.mods.Apply( amount, `resources_consumed` );
			this.resource_estm[k] = amount;
			}
		if ( this.log ) { console.log('Estimate, growth:',growth,'ratio_requesting:',ratio_requesting); }
		return this.resource_estm;
		}	
				
	MergeInto( z ) { 
		let v = (this.val * this.size) + (z.val * z.size);
		z.sect += this.sect;
		z.size = FastFactorial( z.sect );	
		z.val = v / z.size;
		}
				
	Trim( n=1 ) { 
		if ( this.sect > this.minsect ) { 
			let v = this.val * this.size;
			this.sect -= n;
			this.size = FastFactorial( this.sect );	
			// uncomment if you want to preserve developed infrastructure:
			// this.val = Math.max( 1, v / this.size );
			}
		}
				
	Grow( n ) {
		n = Math.min( n, this.maxsect - this.sect );
		if ( n > 0 ) { 
			let v = this.val * this.size;
			this.sect += n;
			this.size = FastFactorial( this.sect );	
			this.val = Math.max( 1, v / this.size );
			}
		}
	
	};

// utility math function. accepts 0..24 only
let FastFactorial = function (x) {
	return factorials[ Math.min( 24, Math.max( 0, x ) ) ];
	}
let factorials = {
	0: 0,
	1: 1,
	2: 3,
	3: 6,
	4: 10,
	5: 15,
	6: 21,
	7: 28,
	8: 36,
	9: 45,
	10: 55,
	11: 66,
	12: 78,
	13: 91,
	14: 105,
	15: 120,
	16: 136,
	17: 153,
	18: 171,
	19: 190,
	20: 210,
	21: 231,
	22: 253,
	23: 276,
	24: 300
	}

// used for internal reference
let standard_outputs = {
	$: 		function( planet, amount ) { planet.owner.resources.$ += amount },
	o: 		function( planet, amount ) { planet.owner.resources.o += amount },
	s: 		function( planet, amount ) { planet.owner.resources.s += amount },
	m: 		function( planet, amount ) { planet.owner.resources.m += amount },
	r: 		function( planet, amount ) { planet.owner.resources.r += amount },
	g: 		function( planet, amount ) { planet.owner.resources.g += amount },
	b: 		function( planet, amount ) { planet.owner.resources.b += amount },
	c: 		function( planet, amount ) { planet.owner.resources.c += amount },
	v: 		function( planet, amount ) { planet.owner.resources.v += amount },
	y: 		function( planet, amount ) { planet.owner.resources.y += amount },
	ship: 	function( planet, amount ) { planet.ship_labor += amount }, // TODO
	def: 	function( planet, amount ) { planet.def_labor += amount }, // TODO
	res: 	function( planet, amount ) { planet.owner.research_income += amount },
	esp: 	function( planet, amount ) { planet.owner.esp_labor += amount }, // TODO
	hou: 	function( planet, amount ) { planet.popmax_contrib += amount },
	};
		
export const ZoneList = {
	
	// ------[ GOVERNMENT ]-----------------\/------------------------
	CIVCAPITOL: {
		name: 'Civilization Capitol',
		type: 'government',
		desc: 'Provides bonuses for your home planet.',
		inputs: {},
		outputs: { hou: 20 },
		minsect:2,
		maxsect: 2,
		gf: 0, // instant
		perma: true,
		tier: 0
		},
	PLANETCAPITOL: {
		name: 'Planetary Capitol',
		type: 'government',
		desc: 'Provides basic services to new colonies',
		inputs: { $: 50 },
		outputs: { hou: 10 },
		minsect:1,
		maxsect:1,
		gf: 0, // instant
		perma: true,
		tier: 0
		},
	GOV01: {
		name: 'Government Office',
		type: 'government',
		desc: 'Increases beaurocracy.',
		inputs: { $: 10 },
		minsect:1,
		maxsect:1,
		tier: 0
		},		
		
	// ------[ HOUSING ]-----------------\/------------------------
	HOUSING0A: {
		name: 'Low-Density Housing',
		type: 'housing',
		desc: 'Provides basic civil services, allowing population to grow.',
		inputs: { o: 1, s: 1, m: 1 },
		outputs: { hou: 2 },
		minsect:1,
		maxsect:8,
		gf: 10,
		tier: 0
		},
	HOUSING0B: {
		name: 'High-Density Housing',
		type: 'housing',
		desc: 'Improved higher density housing requires more metal but less cash.',
		inputs: { o: 2, s: 2, m: 1 },
		outputs: { hou: 4 },
		minsect:2,
		maxsect:12,
		gf: 20,
		tier: 1
		},
	HOUSING1A: {
		name: 'Metropolis',
		type: 'housing',
		desc: 'A metropolis is expensive to maintain but greatly increases maximum population.',
		inputs: { o: 2, s: 2, m: 2, g:1 },
		outputs: { hou: 7 },
		minsect:4,
		maxsect:16,
		gf: 30,
		tier: 2
		},
	HOUSING2A: {
		name: 'Megalopolis',
		type: 'housing',
		desc: 'A thriving region that maximizes population.',
		inputs: { o: 2, s: 2, m: 2, g:2, y:2 },
		outputs: { hou: 10 },
		minsect:8,
		maxsect:20,
		gf: 50,
		tier: 3
		},
		
	// ------[ MINING ]-----------------\/--------------------------
	MINE0A: {
		name: 'Basic Resource Processor',
		type: 'mining',
		desc: 'Entry-level mining operation that can process local metals, silicates, and organic materials.',
		inputs: { $: 10 },
		outputs: { o: 2, s: 2, m: 2 },
		minsect:1,
		maxsect:8,
		gf: 15,
		tier: 0
		},
	MINE1A: {
		name: 'Xeno Resource Processor',
		type: 'mining',
		desc: 'Mines Redium, Verdagen, and Bluetonium.',
		inputs: { $: 15 },
		outputs: { r: 2, g: 2, b: 2 },
		minsect:1,
		maxsect:8,
		gf: 15,
		tier: 1
		},
	MINE2A: {
		name: 'Exotic Resource Processor',
		type: 'mining',
		desc: 'Mines Cyanite, Yellotron, and Violetronium.',
		inputs: { $: 20 },
		outputs: { c: 2, y: 2, v: 2 },
		minsect:1,
		maxsect:8,
		gf: 15,
		tier: 2
		},
		
	// ------[ RESEARCH ]-----------------\/------------------------
	RES0: {
		name: 'Research Lab',
		type: 'research',
		desc: 'Adds to scientific research projects.',
		inputs: { $: 10 },
		outputs: { res: 5 },
		minsect:1,
		maxsect:8,
		gf: 20,
		tier: 0
	},
	RES1: {
		name: 'Research Complex',
		type: 'research',
		desc: 'Adds to scientific research projects.',
		inputs: { $: 15, b: 2 },
		outputs: { res: 15 },
		minsect:2,
		maxsect:12,
		gf: 35,
		tier: 1
	},
	RES2: {
		name: 'Research Network',
		type: 'research',
		desc: 'Adds to scientific research projects.',
		inputs: { $: 20, b: 2, c: 1 },
		outputs: { res: 25 },
		minsect:4,
		maxsect:16,
		gf: 50,
		tier: 2
	},
	
	
	// ------[ ECONOMIC ]-----------------\/------------------------
	ECON0: {
		name: 'Planetary Bank',
		type: 'economy',
		desc: 'Helps the local economy, boosting tax income.',
		inputs: { $: 10 },
		outputs: { $: 20 },
		minsect:1,
		maxsect:4,
		gf: 15,
		tier: 0
	},
	
	// ------[ SHIP BUILDING / STARDOCK ]-----------------\/---------
	SHIP0: {
		name: 'Shipyard',
		type: 'stardock',
		desc: 'Allows planet to build fighter-scale spacecraft.',
		inputs: { $: 5, m: 5, o: 1 },
		outputs: { ship: 15 },
		minsect:1,
		maxsect:8,
		gf: 30,
		tier: 0
	},
	SHIP1: {
		name: 'Orbital Foundry',
		type: 'stardock',
		desc: 'Allows planet to build destroyer-scale spacecraft.',
		inputs: { $: 10, m: 3, r: 2 },
		outputs: { ship: 50 },
		minsect:2,
		maxsect:12,
		gf: 40,
		tier: 1
	},
	SHIP2: {
		name: 'Naval Mega-Factory',
		type: 'stardock',
		desc: 'Allows planet to build battleship-scale spacecraft.',
		inputs: { $: 15, m: 2, r: 2, v: 1 },
		outputs: { ship: 80 },
		minsect:4,
		maxsect:16,
		gf: 50,
		tier: 2
	},
		
	// ------[ ESPIONAGE ]-----------------\/------------------------
	SPY0: {
		name: 'Intelligence Office',
		type: 'espionage',
		desc: 'Allows us to launch espionage campaigns.',
		inputs: { $: 10 },
		outputs: { esp: 1 },
		minsect:1,
		maxsect:8,
		gf: 15,
		tier: 0
		},
		
	// ------[ MILITARY ]-----------------\/------------------------
	MIL0: {
		name: 'Military Base',
		type: 'military',
		desc: 'Allows troops to be trained.',
		inputs: { $: 8 },
		outputs: { def: 10 },
		minsect:1,
		maxsect:8,
		gf: 15,
		tier: 0
		},
	MIL1: {
		name: 'Military Fortress',
		type: 'military',
		desc: 'Allows troops to be trained.',
		inputs: { $: 16, g:1, b:1, c:1 },
		outputs: { def: 30 },
		minsect:3,
		maxsect:12,
		gf: 25,
		tier: 1
		},
		
	// ------[ SPECIALS ]-----------------\/------------------------
	SPECIAL0: {
		name: 'Special Area',
		type: 'special',
		desc: 'Placeholder for your hopes and dreams.',
		inputs: {},
		minsect:1,
		maxsect:1,
		gf: 10,
		tier: 0
		},
	};

for ( let k in ZoneList ) {
	ZoneList[k].key = k; // add keys to objects themselves for later self-reference
	ZoneList[k].type = ZoneList[k].type || 'housing';
	ZoneList[k].desc = ZoneList[k].desc || 'missing description';
	ZoneList[k].name = ZoneList[k].name || 'UNKNOWN';
	ZoneList[k].tier = ZoneList[k].tier || 0;
	ZoneList[k].minsect = ZoneList[k].minsect || 1;
	ZoneList[k].maxsect = ZoneList[k].maxsect || 1;
	ZoneList[k].gf = (ZoneList[k].gf >= 0 ? ZoneList[k].gf : 10); // zero allowed to indicate instant growth
	ZoneList[k].inputs = ZoneList[k].inputs || {};
	ZoneList[k].outputs = ZoneList[k].outputs || {};
	}
	
