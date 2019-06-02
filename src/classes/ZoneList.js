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
	COLONY: {
		name: 'Colonial Settlement',
		type: 'capitol',
		desc: 'Provides basic services for your new colony.',
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
	};

// add keys to objects themselves for later self-reference
for ( let k in ZoneList ) {
	ZoneList[k].key = k;
	}
