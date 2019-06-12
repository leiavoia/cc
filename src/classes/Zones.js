export function Zone( key ) {
	// NOTE: BUG: using object.assign avoids aurelia binding bugs
	// but also radically increases memory usage. Switch 
	// these lines if memory performance isn't a problem and we
	// still can't find a solution for aurelia bugs.
// 		let o = Object.assign( {}, ZoneList[tag] );
	let o = Object.create( ZoneList[key] );
	o.val = 0;
	o.level = 0; // TODO might skip this / cosmetic only
	o.insuf = false;
	o.output_rec = {}
	o.resource_rec = {};
// 	o.resource_estm = {}; // we may want this some day, but saves memory if we dont
	for ( let k in o.outputs ) { o.output_rec[k]=0; } ; // prepopulate keys
	for ( let k in o.inputs ) { o.resource_rec[k]=0; } ; // prepopulate keys
	return o;
	};

let ZoneProto = {
	key: 'UNKNOWN',
	type: 'special',
	size: 1,
	levels: 1,
	bonus: 0,
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
		this.Output( planet, work );
		// grow or shrink depending on our funding
		let diff = amount_receiving - this.val;
		this.val += (diff >= 0) ? (diff * planet.spending) : (diff * this.gf * 2);
		this.val = this.val.clamp(0,this.levels);
		this.level = Math.min( this.levels, Math.floor(this.val) ); // >100% spending can send level over max
		// if we're not 100% funded, warn player
		this.insuf = ratio < 1.0;
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
		let resource_estm = {};
		for ( let k of Object.keys(this.inputs) ) {
			resource_estm[k] = this.inputs[k] * amount_requesting;
			}
		return resource_estm;
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
		pop: 	function( planet, amount ) { planet.pop_labor += amount }, // TODO HOW DOES HOUSING WORK?
		},	
	}
	
export const ZoneList = {
	CIVCAPITOL: {
		name: 'Civilization Capitol',
		type: 'capitol',
		desc: 'Provides bonuses for your home planet.',
		inputs: { s:1, m: 1, o: 1 },
		outputs: {}, // TODO Do() something special instead
		levels: 3,
		size: 2,
		bonus: 0.05, // +5% per level
		gf: 0.1, // 2.5% of one unit per turn 
		},
	HOUSING01: {
		name: 'Colonial Settlement',
		type: 'housing',
		desc: 'Provides basic civil services, allowing population to grow.',
		inputs: { $: 1, o: 1, s: 2, m: 1 },
		outputs: { pop: 1 },
		levels: 1,
		size: 1,
		},
	MINE01: {
		name: 'Basic Resource Processor',
		type: 'mining',
		desc: 'Entry-level mining operation that can process metals, silicates, and organic materials.',
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
