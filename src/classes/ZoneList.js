export const ZoneList = {
	CIVCAPITOL: {
		name: 'Civilization Capitol',
		type: 'capitol',
		desc: 'Provides bonuses for your home planet.',
		consumes: {},
// 		yield: {},
		max_level: 1,
		max_size: 1,
		upgrades: [],
		Do( planet ) { 
			console.log(`${this.key} zone Do() for ${planet.name}`);
			}
		},
	HOUSING01: {
		name: 'Colonial Settlement',
		type: 'housing',
		desc: 'Provides basic civil services, allowing population to grow.',
		consumes: {},
// 		yield: {},
		max_level: 1,
		max_size: 1,
		upgrades: [],
		Do( planet ) { 
			console.log(`${this.key} zone Do() for ${planet.name}`);
			}
		},
	MINE01: {
		name: 'Basic Resource Processor',
		type: 'mining',
		desc: 'Entry-level mining operation that can process metals, silicates, and organic materials.',
		consumes: {},
// 		yield: {},
		max_level: 3,
		max_size: 2,
		upgrades: [],
		Do( planet ) { 
			console.log(`${this.key} zone Do() for ${planet.name}`);
			}
		},
	SHIP01: {
		name: 'Basic Stardock',
		type: 'stardock',
		desc: 'Allows planet to build spacecraft.',
		consumes: {},
// 		yield: {},
		max_level: 1,
		max_size: 1,
		upgrades: [],
		Do( planet ) { 
			console.log(`${this.key} zone Do() for ${planet.name}`);
			}
		},
	SPY01: {
		name: 'Intelligence Office',
		type: 'espionage',
		desc: 'Allows us to launch espionage campaigns.',
		consumes: {},
// 		yield: {},
		max_level: 1,
		max_size: 1,
		upgrades: [],
		Do( planet ) { 
			console.log(`${this.key} zone Do() for ${planet.name}`);
			}
		},
	MIL01: {
		name: 'Military Base',
		type: 'military',
		desc: 'Allows troops to be trained.',
		consumes: {},
// 		yield: {},
		max_level: 1,
		max_size: 1,
		upgrades: [],
		Do( planet ) { 
			console.log(`${this.key} zone Do() for ${planet.name}`);
			}
		},
	ECON01: {
		name: 'Planetary Bank',
		type: 'economy',
		desc: 'Helps the local economy, boosting tax income.',
		consumes: {},
// 		yield: {},
		max_level: 1,
		max_size: 1,
		upgrades: [],
		Do( planet ) { 
			console.log(`${this.key} zone Do() for ${planet.name}`);
			}
		},
	SPECIAL01: {
		name: 'Special Area',
		type: 'special',
		desc: 'Placeholder for your hopes and dreams.',
		consumes: {},
// 		yield: {},
		max_level: 1,
		max_size: 1,
		upgrades: [],
		Do( planet ) { 
			console.log(`${this.key} zone Do() for ${planet.name}`);
			}
		},
	GOV01: {
		name: 'Government Office',
		type: 'government',
		desc: 'Increases beaurocracy.',
		consumes: {},
// 		yield: {},
		max_level: 1,
		max_size: 1,
		upgrades: [],
		Do( planet ) { 
			console.log(`${this.key} zone Do() for ${planet.name}`);
			}
		},
	RES01: {
		name: 'Research Center',
		type: 'research',
		desc: 'Adds to scientific research projects.',
		consumes: {},
// 		yield: {},
		max_level: 1,
		max_size: 1,
		upgrades: [],
		Do( planet ) { 
			console.log(`${this.key} zone Do() for ${planet.name}`);
			}
		},
	};

// add keys to objects themselves for later self-reference
for ( let k in ZoneList ) {
	ZoneList[k].key = k;
	}
