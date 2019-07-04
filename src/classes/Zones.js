export class Zone {
	
	constructor( key ) { 
		this.key = key;
		// Category of zone - determines UI colors and symbols.
		// One of: ['special','housing','research','military','espionage','government','stardock','mining']
		this.type = 'housing';
		// how many sectors the zone occupies
		this.size = 1;
		// Growth Factor - turns required to mature.
		// Modified by a planet's energy level when calculating growth.
		this.gf = 10;
		// inputs and outputs are normalized per-sector and are
		// multiplied by the zone's size when calculating activity
		this.val = 0;
		this.insuf = false;
		this.inputs = {};
		this.outputs = {};
		this.output_rec = {}
		this.resource_rec = {};
		this.resource_estm = {}; // we may want this some day, but saves memory if we dont
		Object.assign( this, ZoneList[key] );
		for ( let k in this.outputs ) { this.output_rec[k]=0; } ; // prepopulate keys
		for ( let k in this.inputs ) { this.resource_rec[k]=0; } ; // prepopulate keys
		for ( let k in this.inputs ) { this.resource_estm[k]=0; } ; // prepopulate keys
		}
		
	Do( planet ) { 
		// evaluate our allotment of resources in case there is a global shortage
		// ( you're only as good as your most limited resource )
		let min_resource_ratio = 1.0;
		for ( let k of Object.keys(this.inputs) ) {
			min_resource_ratio = Math.min( planet.owner.resource_supply[k], min_resource_ratio, 1.0 );
			}
		// lack of funding or lack of resources determine how much work we can actually do
		let ratio = min_resource_ratio * planet.spending; // game already took into account +/- spending levels
		// ideally we want enough resources to do our job and grow the maximum allowed amount.
		let amount_receiving = ( this.val + Math.min( planet.energy/this.gf, 1.0 - this.val ) ) * ratio;
		// reduce resources of civ
		for ( let k of Object.keys(this.inputs) ) {
			// NOTE: planet environmental effects are applied here to +/- resources costs, 
			// but not to the work formula itself. Costs change but work stays the same.
			let amount = this.inputs[k] * this.size * amount_receiving * planet.zone_hab_mod;
			planet.owner.resources[k] -= amount;
			this.resource_rec[k] = amount;
			planet.resource_rec[k] += amount; // assume it gets zero'd out before this function is called
			}
		// output
		let work = amount_receiving;
		// EXCEPTION: for housing zones, the "work" is the current zone value itself.
		// This represents housing availability current being provided for by the zone.
		if ( this.type == 'housing' ) { work = this.val; }
		this.Output( planet, work );
		// grow or shrink depending on our funding
		let diff = amount_receiving - this.val;
		this.val += (diff >= 0) ? (diff * planet.spending) : (diff * (1/this.gf) * 2);
		this.val = this.val.clamp(0,1);
		// if we shrank, warn player
		this.insuf = diff < 0;
		}
		
	Output( planet, work ) { 
		if ( work ) { 
			for ( let type of Object.keys(this.outputs) ) { 
				if ( typeof(standard_outputs[type]) === 'function' ) {
					let amount = this.outputs[type] * this.size * work;
					// If this is a mining zone, the output is modified by local resource availabilty.
					// However it is also possible to synthesize new resources as outputs that
					// do NOT depend on local natural availability. If mining zones synthesize new
					// outputs instead of converting resources, add `zone.synth: true`
					if ( planet.resources.hasOwnProperty(type) ) {
						if ( !this.hasOwnProperty('synth') || !this.synth ) {
							amount *= planet.resources[type];
							}
						}
					standard_outputs[type]( planet, amount ); // do it
					this.output_rec[type] = amount; 
					planet.output_rec[type] += amount; // assume it gets zero'd out before this function is called
					}
				}
			}
		}
		
	EstimateResources( planet ) { 
		// ideally we want enough resources to do our job and grow the maximum allowed amount.
		let amount_requesting = planet.zone_hab_mod * planet.spending * ( this.val + Math.min( planet.energy/this.gf, 1.0 - this.val ) );
		for ( let k of Object.keys(this.inputs) ) {
			this.resource_estm[k] = this.inputs[k] * this.size * amount_requesting;
		}
		return this.resource_estm;
		}	
			
	};

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
		outputs: { hou: 20 }, // TODO Do() something special instead
		size: 2,
		gf: 0, // instant
		perma: true
		},
	PLANETCAPITOL: {
		name: 'Planetary Capitol',
		type: 'government',
		desc: 'Provides basic services to new colonies',
		inputs: { $: 50 },
		outputs: { hou: 5 },
		size: 1,
		gf: 0, // instant
		perma: true
		},
	GOV01: {
		name: 'Government Office',
		type: 'government',
		desc: 'Increases beaurocracy.',
		inputs: { $: 10 },
		size: 1,
		},		
		
	// ------[ HOUSING ]-----------------\/------------------------
	HOUSING0A: {
		name: 'Colonial Settlement',
		type: 'housing',
		desc: 'Provides basic civil services, allowing population to grow.',
		inputs: { o: 1, s: 1, m: 1 },
		outputs: { hou: 4 },
		size: 1,
		gf: 10
		},
	HOUSING0B: {
		name: 'High Density Settlement',
		type: 'housing',
		desc: 'Improved higher density housing requires more metal but less cash.',
		inputs: { o: 1, s: 1, m: 2 },
		outputs: { hou: 6 },
		size: 2,
		gf: 15
		},
	HOUSING1A: {
		name: 'City',
		type: 'housing',
		desc: 'Cities house more population than settlements, but require added resources.',
		inputs: { o: 1.5, s: 1.5, m: 1.5 },
		outputs: { hou: 8 },
		size: 2,
		gf: 20
		},
	HOUSING1B: {
		name: 'High Density City',
		type: 'housing',
		desc: 'Efficiently planned cities build upward instead of outward, but require Redium.',
		inputs: { o: 1, s: 1, m: 1, r:1 },
		outputs: { hou: 11 },
		size: 2,
		gf: 30
		},
	HOUSING2A: {
		name: 'Metropolis',
		type: 'housing',
		desc: 'A metropolis is expensive to maintain but greatly increases maximum population.',
		inputs: { o: 2, s: 2, m: 2, b: 1 },
		outputs: { hou: 12 },
		size: 4,
		gf: 30
		},
	HOUSING2B: {
		name: 'High Density Metropolis',
		type: 'housing',
		desc: 'AI-planned metropolii makes efficient use of limited space.',
		inputs: { o: 2, s: 2, m: 2, b: 2, r:1 },
		outputs: { hou: 16 },
		size: 4,
		gf: 40
		},
	HOUSING3A: {
		name: 'Megalopolis',
		type: 'housing',
		desc: 'A thriving region that maximizes population.',
		inputs: { o: 2.5, s: 2.5, m: 2.5, c: 2 },
		outputs: { hou: 20 },
		size: 8,
		gf: 40
		},
	HOUSING3B: {
		name: 'Megalopolis',
		type: 'housing',
		desc: 'A thriving region that maximizes population.',
		inputs: { o: 2.5, s: 2.5, m: 2.5, c: 3, v: 3 },
		outputs: { hou: 26 },
		size: 8,
		gf: 50
		},
	HOUSING4A: {
		name: 'Ecumenopolis',
		type: 'housing',
		desc: 'A planet-spanning city is the ultimate housing development.',
		inputs: { o: 4, s: 4, m: 4, c: 2, v: 2 },
		outputs: { hou: 40 },
		size: 12,
		gf: 60
		},
		
	// ------[ MINING ]-----------------\/--------------------------
	MINE0A: {
		name: 'Basic Resource Processor',
		type: 'mining',
		desc: 'Entry-level mining operation that can process local metals, silicates, and organic materials.',
		inputs: { $: 10 },
		outputs: { o: 2, s: 2, m: 2 },
		size: 4,
		gf: 15
		},
	MINE0B: {
		name: 'Basic Resource Nano-Cluster',
		type: 'mining',
		desc: 'Next generation mining operations are more expensive but improve output with a smaller footprint.',
		inputs: { $: 15 },
		outputs: { o: 3, s: 3, m: 3 },
		size: 2,
		gf: 30
		},
	MINE0C: {
		name: 'Basic Resource Mega-Cluster',
		type: 'mining',
		desc: 'Cost effective, high yield mining if you can make space for it.',
		inputs: { $: 5 },
		outputs: { o: 5, s: 5, m: 5 },
		size: 8,
		gf: 50
		},
	MINE1A: {
		name: 'Xeno Resource Processor',
		type: 'mining',
		desc: 'Mines Redium, Verdagen, and Bluetonium.',
		inputs: { $: 15 },
		outputs: { r: 2, g: 2, b: 2 },
		size: 4,
		gf: 20
		},
	MINE1B: {
		name: 'Xeno Resource Nano-Cluster',
		type: 'mining',
		desc: 'Improved output on Redium, Verdagen, and Bluetonium mining.',
		inputs: { $: 25, o: 1 },
		outputs: { r: 3, g: 3, b: 3 },
		size: 2,
		gf: 35
		},
	MINE1C: {
		name: 'Xeno Resource Mega-Cluster',
		type: 'mining',
		desc: 'Cost effective, high yield mining of Redium, Verdagen, and Bluetonium.',
		inputs: { $: 10, o: 1 },
		outputs: { r: 5, g: 5, b: 5 },
		size: 8,
		gf: 50
		},
	MINE2A: {
		name: 'Exotic Resource Processor',
		type: 'mining',
		desc: 'Mines Cyanite, Yellotron, and Violetronium.',
		inputs: { $: 20 },
		outputs: { c: 2, y: 2, v: 2 },
		size: 4,
		gf: 20
		},
	MINE2B: {
		name: 'Exotic Resource Nano-Cluster',
		type: 'mining',
		desc: 'Improved output on Cyanite, Yellowtron, and Violetronium mining.',
		inputs: { $: 30, r: 1 },
		outputs: { c: 3, y: 3, v: 3 },
		size: 2,
		gf: 35
		},
	MINE2C: {
		name: 'Exotic Resource Mega-Cluster',
		type: 'mining',
		desc: 'Cost effective, high yield mining of Cyanite, Yellowtron, and Violetronium.',
		inputs: { $: 15, r: 1 },
		outputs: { c: 5, y: 5, v: 5 },
		size: 8,
		gf: 60
		},
		
	// ------[ RESEARCH ]-----------------\/------------------------
	RES0: {
		name: 'Research Lab',
		type: 'research',
		desc: 'Adds to scientific research projects.',
		inputs: { $: 10 },
		outputs: { res: 5 },
		size: 1,
		gf: 10
	},
	RES1: {
		name: 'Research Center',
		type: 'research',
		desc: 'Adds to scientific research projects.',
		inputs: { $: 15 },
		outputs: { res: 10 },
		size: 2,
		gf: 15
	},
	RES2: {
		name: 'Research Complex',
		type: 'research',
		desc: 'Adds to scientific research projects.',
		inputs: { $: 15, g: 2 },
		outputs: { res: 15 },
		size: 3,
		gf: 20
	},
	RES3: {
		name: 'Research Network',
		type: 'research',
		desc: 'Adds to scientific research projects.',
		inputs: { $: 20, g: 2, y: 1 },
		outputs: { res: 25 },
		size: 5,
		gf: 30
	},
	
	
	// ------[ ECONOMIC ]-----------------\/------------------------
	ECON0: {
		name: 'Planetary Bank',
		type: 'economy',
		desc: 'Helps the local economy, boosting tax income.',
		inputs: { $: 10 },
		outputs: { $: 20 },
		size: 1,
		gf: 10
	},
	
	// ------[ SHIP BUILDING / STARDOCK ]-----------------\/---------
	SHIP0: {
		name: 'Basic Stardock',
		type: 'stardock',
		desc: 'Allows planet to build fighter-scale spacecraft.',
		inputs: { $: 5, m: 5, o: 1 },
		outputs: { ship: 1 },
		size: 1,
		gf: 10
	},
	SHIP1: {
		name: 'Orbital Shipyard',
		type: 'stardock',
		desc: 'Allows planet to build cruiser-scale spacecraft.',
		inputs: { $: 8, m: 5, o: 1 },
		outputs: { ship: 2 },
		size: 2,
		gf: 15
	},
	SHIP2: {
		name: 'Orbital Foundry',
		type: 'stardock',
		desc: 'Allows planet to build destroyer-scale spacecraft.',
		inputs: { $: 10, m: 3, b: 2 },
		outputs: { ship: 3 },
		size: 4,
		gf: 20
	},
	SHIP3: {
		name: 'Naval Mega-Factory',
		type: 'stardock',
		desc: 'Allows planet to build battleship-scale spacecraft.',
		inputs: { $: 15, m: 2, b: 2, c: 1 },
		outputs: { ship: 5 },
		size: 8,
		gf: 30
	},
	SHIP4: {
		name: 'Naval Giga-Factory',
		type: 'stardock',
		desc: 'Allows planet to build dreadnought-scale spacecraft.',
		inputs: { $: 20, m: 2, b: 5, c: 2 },
		outputs: { ship: 8 },
		size: 12,
		gf: 40
	},
		
	// ------[ ESPIONAGE ]-----------------\/------------------------
	SPY0: {
		name: 'Intelligence Office',
		type: 'espionage',
		desc: 'Allows us to launch espionage campaigns.',
		inputs: { $: 10 },
		outputs: { esp: 1 },
		size: 1,
		gf: 10
		},
		
	// ------[ MILITARY ]-----------------\/------------------------
	MIL0: {
		name: 'Military Base',
		type: 'military',
		desc: 'Allows troops to be trained.',
		inputs: { $: 8 },
		outputs: { def: 1 },
		size: 2,
		gf: 10
		},
		
	// ------[ SPECIALS ]-----------------\/------------------------
	SPECIAL0: {
		name: 'Special Area',
		type: 'special',
		desc: 'Placeholder for your hopes and dreams.',
		inputs: {},
		size: 1,
		gf: 10
		},
	};

for ( let k in ZoneList ) {
	ZoneList[k].key = k; // add keys to objects themselves for later self-reference
	ZoneList[k].type = ZoneList[k].type || 'housing';
	ZoneList[k].desc = ZoneList[k].desc || 'missing description';
	ZoneList[k].name = ZoneList[k].name || 'UNKNOWN';
	ZoneList[k].size = ZoneList[k].size || 1;
	ZoneList[k].gf = ZoneList[k].gf || 10;
	ZoneList[k].inputs = ZoneList[k].inputs || {};
	ZoneList[k].outputs = ZoneList[k].outputs || {};
	}