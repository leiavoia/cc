export function Zone( key ) {
	let o = Object.create( ZoneList[key] );
	o.val = 0;
	o.level = 0;
	o.insuf = false;
	o.output_rec = {}
	o.resource_rec = {};
	o.resource_estm = {}; // we may want this some day, but saves memory if we dont
	for ( let k in o.outputs ) { o.output_rec[k]=0; } ; // prepopulate keys
	for ( let k in o.inputs ) { o.resource_rec[k]=0; } ; // prepopulate keys
	for ( let k in o.inputs ) { o.resource_estm[k]=0; } ; // prepopulate keys
	return o;
	};

let ZoneProto = {
	key: 'UNKNOWN',
	// Catgegory of zone - determines UI colors and symbols.
	// One of: ['special','housing','research','military','espionage','government','stardock','mining']
	type: 'unknown',
	// how many sectors the zone occupies
	size: 1,
	// Maximum number of levels, generally 1..9 to cooperate with UI.
	levels: 1,
	// Bonus - increase in output (per level). 
	// Example: 
	// 		bonus=0.1, level=5, then:
	// 		output += (output * 0.5)
	bonus: 0,
	// Growth Factor - amount of one level zone will grow each turn
	// recommended growth factor levels:
	//		0.2 : 5 turns per level (rapid)
	//		0.1 : 10 turns per level (fast)
	//		0.05 : 20 turns per level (normal)
	//		0.033 : 30 turns per level (slow)
	//		0.025 : 40 turns per level (very slow)
	//		0.02 : 50 turns per level (glacial)
	gf: 0.1, 		
	upgrades: [],
	inputs: {},
	outputs: {},
	Do( planet ) { 
		// TODO: planet energy
		// evaluate our allotment of resources in case there is a global shortage
		// ( you're only as good as your most limited resource )
		let min_resource_ratio = 1.0;
		for ( let k of Object.keys(this.inputs) ) {
			min_resource_ratio = Math.min( planet.owner.resource_supply[k], min_resource_ratio, 1.0 );
			}
		// lack of funding or lack of resources determine how much work we can actually do
		let ratio = min_resource_ratio * planet.spending; // game already took into account +/- spending levels
		// ideally we want enough resources to do our job and grow the maximum allowed amount.
		let amount_requesting = this.val + Math.min( this.gf, this.levels - this.val );
		let amount_receiving = amount_requesting * ratio;
		// reduce resources of civ
		for ( let k of Object.keys(this.inputs) ) {
			let amount = this.inputs[k] * amount_receiving;
			planet.owner.resources[k] -= amount;
			this.resource_rec[k] = amount;
			planet.resource_rec[k] += amount; // assume it gets zero'd out before this function is called
			}
		// output
		let work = 
			amount_receiving // normal value
			+ ( amount_receiving * this.bonus * (this.level||0) ) // level bonus
			;
		// EXCEPTION: for housing zones, the "work" is the current zone value itself.
		// This represents housing availability current being provided for by the zone.
		if ( this.type == 'housing' ) { work = this.val; }
		this.Output( planet, work );
		// grow or shrink depending on our funding
		let diff = amount_receiving - this.val;
		this.val += (diff >= 0) ? (diff * planet.spending) : (diff * this.gf * 2);
		this.val = this.val.clamp(0,this.levels);
		this.level = Math.min( this.levels, Math.floor(this.val) ); // >100% spending can send level over max
		// if we shrank, warn player
		this.insuf = diff < 0;
		},
	Output( planet, work ) { 
		if ( work ) { 
			for ( let type of Object.keys(this.outputs) ) { 
				if ( typeof(this.standard_outputs[type]) === 'function' ) {
					let amount = this.outputs[type] * work;
					// If this is a mining zone, the output is modified by local resource availabilty.
					// However it is also possible to synthesize new resources as outputs that
					// do NOT depend on local natural availability. If mining zones synthesize new
					// outputs instead of converting resources, add `zone.synth: true`
					if ( planet.resources.hasOwnProperty(type) ) {
						if ( !this.hasOwnProperty('synth') || !this.synth ) {
							amount *= planet.resources[type];
							}
						}
					this.standard_outputs[type]( planet, amount ); // do it
					this.output_rec[type] = amount; 
					planet.output_rec[type] += amount; // assume it gets zero'd out before this function is called
					}
				}
			}
		},
	EstimateResources( planet ) { 
		// TODO: planet energy?
		// ideally we want enough resources to do our job and grow the maximum allowed amount.
		let amount_requesting = planet.spending * ( this.val + Math.min( this.gf, this.levels - this.val ) );
		for ( let k of Object.keys(this.inputs) ) {
			this.resource_estm[k] = this.inputs[k] * amount_requesting;
			}
		return this.resource_estm;
		},
	// used for internal reference
	standard_outputs: {
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
		},	
	}
	
export const ZoneList = {
	CIVCAPITOL: {
		name: 'Civilization Capitol',
		type: 'government',
		desc: 'Provides bonuses for your home planet.',
		inputs: {},
		outputs: { $: 10 }, // TODO Do() something special instead
		levels: 9,
		size: 2,
		bonus: 0.1, // +5% per level
		gf: 0.025, // 2.5% of one unit per turn 
		},
	HOUSING00: {
		name: 'Colonial Settlement',
		type: 'housing',
		desc: 'Provides basic civil services, allowing population to grow.',
		inputs: { $: 1 },
		outputs: { hou: 2 },
		levels: 2,
		size: 1,
		gf: 0.05
		},
	HOUSING10: {
		name: 'City',
		type: 'housing',
		desc: 'Planned cities house more population than settlements, but require added resources.',
		inputs: { $: 2, o: 1, s: 2, m: 1 },
		outputs: { hou: 6 },
		levels: 2,
		size: 2,
		gf: 0.05
		},
	HOUSING20: {
		name: 'Metropolis',
		type: 'housing',
		desc: 'A metropolis is expensive to maintain but greatly increases maximum population.',
		inputs: { $: 5, o: 2, s: 5, m: 3 },
		outputs: { hou: 16 },
		levels: 3,
		size: 4,
		gf: 0.033
		},
	HOUSING30: {
		name: 'Megalopolis',
		type: 'housing',
		desc: 'A thriving region that maximizes population.',
		inputs: { $: 10, o: 4, s: 12, m: 8 },
		outputs: { hou: 24 },
		levels: 4,
		size: 8,
		gf: 0.033
		},
	HOUSING40: {
		name: 'Ecumenopolis',
		type: 'housing',
		desc: 'A planet-spanning city is the ultimate housing development.',
		inputs: { $: 25, o: 5, s: 9, m: 14 },
		outputs: { hou: 36 },
		levels: 5,
		size: 12,
		gf: 0.025
		},
	MINE01: {
		name: 'Basic Resource Processor',
		type: 'mining',
		desc: 'Entry-level mining operation that can process local metals, silicates, and organic materials.',
		inputs: { $: 5 },
		outputs: { o: 1, s: 1, m: 1 },
		levels: 3,
		size: 1,
		gf: 0.1
		},
	SHIP01: {
		name: 'Basic Stardock',
		type: 'stardock',
		desc: 'Allows planet to build spacecraft.',
		inputs: { $: 5, m: 5, o: 1 },
		outputs: { ship: 1 },
		levels: 1,
		size: 1,
		},
	SPY01: {
		name: 'Intelligence Office',
		type: 'espionage',
		desc: 'Allows us to launch espionage campaigns.',
		inputs: { $: 10 },
		outputs: { esp: 1 },
		levels: 1,
		size: 1,
		},
	MIL01: {
		name: 'Military Base',
		type: 'military',
		desc: 'Allows troops to be trained.',
		inputs: { $: 8 },
		outputs: { def: 1 },
		levels: 1,
		size: 1,
		},
	ECON01: {
		name: 'Planetary Bank',
		type: 'economy',
		desc: 'Helps the local economy, boosting tax income.',
		inputs: { $: 10 },
		outputs: { $: 20 },
		levels: 1,
		size: 1,
		},
	SPECIAL01: {
		name: 'Special Area',
		type: 'special',
		desc: 'Placeholder for your hopes and dreams.',
		inputs: {},
		levels: 1,
		size: 1,
		},
	GOV01: {
		name: 'Government Office',
		type: 'government',
		desc: 'Increases beaurocracy.',
		inputs: { $: 10 },
		levels: 1,
		size: 1,
		},
	RES01: {
		name: 'Research Center',
		type: 'research',
		desc: 'Adds to scientific research projects.',
		inputs: { $: 10 },
		outputs: { res: 5 },
		levels: 1,
		size: 1,
		},
	};

// upgrade each data blob into a full-fledged ZonePrototype
for ( let k in ZoneList ) {
	let o = Object.create( ZoneProto );
	o = Object.assign( o, ZoneList[k] );
	ZoneList[k] = o;
	ZoneList[k].key = k; // add keys to objects themselves for later self-reference
	}
