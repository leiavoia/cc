
export let Techs = {
	SHIPSPEED1: {
		name: "Warp Booster",
		desc: '<b>+200 Ship Speed</b>. Makes ships go faster.',
		img: 'img/workshop/tech/techmock.jpg',
		onComplete( civ ) { civ.ship_speed += 75; }
		},
	SHIPSPEED2: {
		name: "Warp Blaster",
		desc: '<b>+300 Ship Speed</b>. Makes ships go way faster.',
		img: 'img/workshop/tech/techmock.jpg',
		onComplete( civ ) { civ.ship_speed += 100; }
		},
	SHIPSPEED3: {
		name: "HyperBlaster",
		desc: '<b>+400 Ship Speed</b>. Makes ships go screaming fast.',
		img: 'img/workshop/tech/techmock.jpg',
		onComplete( civ ) { civ.ship_speed += 125; }
		},
		
	SHIPRANGE1: {
		name: "Improved Warp Drive",
		desc: '<b>1000 Ship Range</b>. Basic FTL, or "warp drive", got us into deep space. Now improvements on this basic system will allows us to explore further into space.',
		img: 'img/workshop/tech/techmock.jpg',
		onComplete( civ ) { civ.ship_range = 1000; civ.RecalcEmpireBox(); }
		},
	SHIPRANGE2: {
		name: "Advanced Warp Drive",
		desc: '<b>1250 Ship Range</b>. Further refinements in warp drive technology have yielded this pinnacle achievement. This is likely as far as we can take warp technology without rethinking FTL entirely.',
		img: 'img/workshop/tech/techmock.jpg',
		onComplete( civ ) { civ.ship_range = 1250; civ.RecalcEmpireBox(); }
		},
	SHIPRANGE3: {
		name: "Hyperdrive",
		desc: '<b>1750 Ship Range</b>. Hyperdrives work on entirely different principal than Warp Drives, using low areas in hypersapce topology to quickly navigate through normal space.',
		img: 'img/workshop/tech/techmock.jpg',
		onComplete( civ ) { civ.ship_range = 1750; civ.RecalcEmpireBox(); }
		},
	SHIPRANGE4: {
		name: "Turbo Hyperdrive",
		desc: '<b>2500 Ship Range</b>. This ultra-advanced Hyperdrive uses predictive hyperspace pathfinding to squeeze every bit of efficiency out of hyperspace travel. In a nutshell, it\'s wicked fast.',
		img: 'img/workshop/tech/techmock.jpg',
		onComplete( civ ) { civ.ship_range = 2500; civ.RecalcEmpireBox(); }
		},
		
	HABITATION1: {
		name: "Improved Habitation",
		desc: '<b>+1 Habitation</b>. Living on alien planets can be difficult and expensive. These new habitation techniques will allow us to colonize even more hostile planets. With further refinements, we can live just about anywhere.',
		img: 'img/workshop/tech/techmock.jpg',
		onComplete( civ ) { civ.race.env.habitation += 1; } /* TODO: hibitation tech should not affect the civ's race directly */
		},
	HABITATION2: {
		name: "Advanced Habitation",
		desc: '<b>+1 Habitation</b>. Breakthroughs in engineering and materials science has given us the ability to settle on particularly ugly planets. They are ugly now, but someday they will be wonderful.',
		img: 'img/workshop/tech/techmock.jpg',
		onComplete( civ ) { civ.race.env.habitation += 1; } /* TODO: hibitation tech should not affect the civ's race directly */
		},
	HABITATION3: {
		name: "Superior Habitation",
		desc: '<b>+1 Habitation</b>. Living on alient planets is easy with new pre-fabricated, self-assembling shelters. It\'s still a dismal life, but it\'s one less colony our neighbors will get.',
		img: 'img/workshop/tech/techmock.jpg',
		onComplete( civ ) { civ.race.env.habitation += 1; } /* TODO: hibitation tech should not affect the civ's race directly */
		},
		
	ADAPTATION1: {
		name: "Basic Terraforming",
		desc: '<b>+1 Adaptation</b>.',
		img: 'img/workshop/tech/techmock.jpg',
		onComplete( civ ) { civ.race.env.adaptation += 1; } /* TODO: hibitation tech should not affect the civ's race directly */
		},
	ADAPTATION2: {
		name: "Advanced Terraforming",
		desc: '<b>+1 Adaptation</b>.',
		img: 'img/workshop/tech/techmock.jpg',
		onComplete( civ ) { civ.race.env.adaptation += 1; } /* TODO: hibitation tech should not affect the civ's race directly */
		},
	ADAPTATION3: {
		name: "Superior Terraforming",
		desc: '<b>+1 Adaptation</b>.',
		img: 'img/workshop/tech/techmock.jpg',
		onComplete( civ ) { civ.race.env.adaptation += 1; } /* TODO: hibitation tech should not affect the civ's race directly */
		},
		
	XENOCOMM1: {
		name: "Xeno Communication Skills",
		desc: '<b>+1 Communication</b>.',
		img: 'img/workshop/tech/techmock.jpg',
		onComplete( civ ) { civ.diplo.skill += 0.1; } 
		},
	XENOCOMM2: {
		name: "Xeno Linguistic Mastery",
		desc: '<b>+1 Communication</b>.',
		img: 'img/workshop/tech/techmock.jpg',
		onComplete( civ ) { civ.diplo.skill += 0.1; } 
		},
	XENOCOMM3: {
		name: "Alien Negotiation Skills",
		desc: '<b>+1 Communication</b>.',
		img: 'img/workshop/tech/techmock.jpg',
		onComplete( civ ) { civ.diplo.skill += 0.1; } 
		}
		
		
		
		
// 	TECH1: { 
// 		name: "Tech 1",
// 		desc: "TODO DESCRIPTION",
// 		img: 'img/workshop/tech/techmock.jpg',
// 		onComplete( civ ) { console.log(`${this.name} tech onComplete() for ${civ.name}`); }
// 		},
// 	TECH2: { 
// 		name: "Tech 2",
// 		desc: "TODO DESCRIPTION",
// 		img: 'img/workshop/tech/techmock.jpg',
// 		onComplete( civ ) { console.log(`${this.name} tech onComplete() for ${civ.name}`); }
// 		},
// 	TECH3: { 
// 		name: "Tech 3",
// 		desc: "TODO DESCRIPTION",
// 		img: 'img/workshop/tech/techmock.jpg',
// 		onComplete( civ ) { console.log(`${this.name} tech onComplete() for ${civ.name}`); }
// 		},
// 	TECH4: { 
// 		name: "Tech 4",
// 		desc: "TODO DESCRIPTION",
// 		img: 'img/workshop/tech/techmock.jpg',
// 		onComplete( civ ) { console.log(`${this.name} tech onComplete() for ${civ.name}`); }
// 		},
// 	TECH5: { 
// 		name: "Tech 5",
// 		desc: "TODO DESCRIPTION",
// 		img: 'img/workshop/tech/techmock.jpg',
// 		onComplete( civ ) { console.log(`${this.name} tech onComplete() for ${civ.name}`); }
// 		},
// 	TECH6: { 
// 		name: "Tech 6",
// 		desc: "TODO DESCRIPTION",
// 		img: 'img/workshop/tech/techmock.jpg',
// 		onComplete( civ ) { console.log(`${this.name} tech onComplete() for ${civ.name}`); }
// 		},
// 	TECH7: { 
// 		name: "Tech 7",
// 		desc: "TODO DESCRIPTION",
// 		img: 'img/workshop/tech/techmock.jpg',
// 		onComplete( civ ) { console.log(`${this.name} tech onComplete() for ${civ.name}`); }
// 		},
// 	TECH8: { 
// 		name: "Tech 8",
// 		desc: "TODO DESCRIPTION",
// 		img: 'img/workshop/tech/techmock.jpg',
// 		onComplete( civ ) { console.log(`${this.name} tech onComplete() for ${civ.name}`); }
// 		},
// 	TECH9: { 
// 		name: "Tech 9",
// 		desc: "TODO DESCRIPTION",
// 		img: 'img/workshop/tech/techmock.jpg',
// 		onComplete( civ ) { console.log(`${this.name} tech onComplete() for ${civ.name}`); }
// 		}
	};
	
export let TechNodes = {
	SHIPSPEED1: { 
		name: "Warp Booster",
		desc: "Description Goes Here",
		img: 'img/workshop/tech/techmock.jpg',
		icon: 'img/workshop/icons/star.png',
		rp: 5,
		requires: [], 
		yields: ['SHIPSPEED1'],
		},
	SHIPSPEED2: { 
		name: "Warp Blaster",
		desc: null,
		img: 'img/workshop/tech/techmock.jpg',
		icon: 'img/workshop/icons/star.png',
		rp: 50,
		requires: ['SHIPSPEED1'], 
		yields: ['SHIPSPEED2'],
		},
	SHIPSPEED3: { 
		name: "HyperBlaster",
		desc: null,
		img: 'img/workshop/tech/techmock.jpg',
		icon: 'img/workshop/icons/star.png',
		rp: 100,
		requires: ['SHIPSPEED2','SHIPRANGE3'], 
		yields: ['SHIPSPEED3'],
		},

	SHIPRANGE1: { 
		name: "Improved Warp Drive",
		desc: null,
		img: 'img/workshop/tech/techmock.jpg',
		icon: 'img/workshop/icons/star.png',
		rp: 4,
		requires: [], 
		yields: ['SHIPRANGE1'],
		},
	SHIPRANGE2: { 
		name: "Advanced Warp Drive",
		desc: null,
		img: 'img/workshop/tech/techmock.jpg',
		icon: 'img/workshop/icons/star.png',
		rp: 40,
		requires: ['SHIPRANGE1'], 
		yields: ['SHIPRANGE2'],
		},
	SHIPRANGE3: { 
		name: "Hyperdrive",
		desc: null,
		img: 'img/workshop/tech/techmock.jpg',
		icon: 'img/workshop/icons/star.png',
		rp: 150,
		requires: ['SHIPRANGE2'], 
		yields: ['SHIPRANGE3'],
		},
	SHIPRANGE4: { 
		name: "Turbo Hyperdrive",
		desc: null,
		img: 'img/workshop/tech/techmock.jpg',
		icon: 'img/workshop/icons/star.png',
		rp: 300,
		requires: ['SHIPRANGE3'], 
		yields: ['SHIPRANGE4'],
		},
		
	HABITATION1: { 
		name: "Improved Habitation",
		desc: null,
		img: 'img/workshop/tech/techmock.jpg',
		icon: 'img/workshop/icons/star.png',
		rp: 20,
		requires: [], 
		yields: ['HABITATION1'],
		},
	HABITATION2: { 
		name: "Advanced Habitation",
		desc: null,
		img: 'img/workshop/tech/techmock.jpg',
		icon: 'img/workshop/icons/star.png',
		rp: 120,
		requires: ['HABITATION1'], 
		yields: ['HABITATION2'],
		},
	HABITATION3: { 
		name: "Superior Habitation",
		desc: null,
		img: 'img/workshop/tech/techmock.jpg',
		icon: 'img/workshop/icons/star.png',
		rp: 220,
		requires: ['HABITATION2'], 
		yields: ['HABITATION3'],
		},
		
	ADAPTATION1: { 
		name: "Basic Terraforming",
		desc: null,
		img: 'img/workshop/tech/techmock.jpg',
		icon: 'img/workshop/icons/star.png',
		rp: 140,
		requires: [], 
		yields: ['ADAPTATION1'],
		},
	ADAPTATION2: { 
		name: "Advanced Terraforming",
		desc: null,
		img: 'img/workshop/tech/techmock.jpg',
		icon: 'img/workshop/icons/star.png',
		rp: 480,
		requires: ['ADAPTATION1'], 
		yields: ['ADAPTATION2'],
		},
	ADAPTATION3: { 
		name: "Superior Terraforming",
		desc: null,
		img: 'img/workshop/tech/techmock.jpg',
		icon: 'img/workshop/icons/star.png',
		rp: 900,
		requires: ['ADAPTATION2'], 
		yields: ['ADAPTATION3'],
		},
		
	XENOCOMM1: { 
		name: "Xeno Communication Skills",
		desc: null,
		img: 'img/workshop/tech/techmock.jpg',
		icon: 'img/workshop/icons/star.png',
		rp: 35,
		requires: [], 
		yields: ['XENOCOMM1'],
		},
	XENOCOMM2: { 
		name: "Xeno Linguistic Mastery",
		desc: null,
		img: 'img/workshop/tech/techmock.jpg',
		icon: 'img/workshop/icons/star.png',
		rp: 95,
		requires: ['XENOCOMM1'], 
		yields: ['XENOCOMM2'],
		},
	XENOCOMM3: { 
		name: "Alien Negotiation Skills",
		desc: null,
		img: 'img/workshop/tech/techmock.jpg',
		icon: 'img/workshop/icons/star.png',
		rp: 225,
		requires: ['XENOCOMM2'], 
		yields: ['XENOCOMM3'],
		}
		
		
		
		
// 	NODE0: { 
// 		name: "Node 0 - Mother Node",
// 		desc: "TODO DESCRIPTION",
// 		img: 'img/workshop/tech/techmock.jpg',
// 		icon: 'img/workshop/icons/star.png',
// 		rp: 0,
// 		requires: ['INACCESSIBLE'], // other TechNodes
// 		yields: [], // actual techs from the tech list. may include probabilities
// 		// turns left
// 		// tag
// 		},
// 	NODE1: { 
// 		name: "Node 1",
// 		desc: "TODO DESCRIPTION",
// 		img: 'img/workshop/tech/techmock.jpg',
// 		icon: 'img/workshop/icons/star.png',
// 		rp: 200,
// 		requires: [], // other TechNodes
// 		yields: ['TECH1'], // actual techs from the tech list. may include probabilities
// 		// turns left
// 		// tag
// 		},
// 	NODE2: { 
// 		name: "Node 2",
// 		desc: "TODO DESCRIPTION",
// 		img: 'img/workshop/tech/techmock.jpg',
// 		icon: 'img/workshop/icons/star.png',
// 		rp: 250,
// 		requires: [], // other TechNodes
// 		yields: ['TECH2'], // actual techs from the tech list. may include probabilities
// 		// turns left
// 		// tag
// 		},
// 	NODE3: { 
// 		name: "Node 3",
// 		desc: "TODO DESCRIPTION",
// 		img: 'img/workshop/tech/techmock.jpg',
// 		icon: 'img/workshop/icons/star.png',
// 		rp: 135,
// 		requires: ['NODE1'], // other TechNodes
// 		yields: ['TECH3','TECH4'], // actual techs from the tech list. may include probabilities
// 		// turns left
// 		// tag
// 		},
// 	NODE4: { 
// 		name: "Node 4",
// 		desc: "TODO DESCRIPTION",
// 		img: 'img/workshop/tech/techmock.jpg',
// 		icon: 'img/workshop/icons/star.png',
// 		rp: 225,
// 		requires: ['NODE2'], // other TechNodes
// 		yields: ['TECH5'], // actual techs from the tech list. may include probabilities
// 		// turns left
// 		// tag
// 		},
// 	NODE5: { 
// 		name: "Node 5",
// 		desc: "TODO DESCRIPTION",
// 		img: 'img/workshop/tech/techmock.jpg',
// 		icon: 'img/workshop/icons/star.png',
// 		rp: 333,
// 		requires: ['NODE1','NODE2'], // other TechNodes
// 		yields: ['TECH6'], // actual techs from the tech list. may include probabilities
// 		// turns left
// 		// tag
// 		},
// 	NODE6: { 
// 		name: "Node 6",
// 		desc: "TODO DESCRIPTION",
// 		img: 'img/workshop/tech/techmock.jpg',
// 		icon: 'img/workshop/icons/star.png',
// 		rp: 375,
// 		requires: ['NODE3'], // other TechNodes
// 		yields: ['TECH7'], // actual techs from the tech list. may include probabilities
// 		// turns left
// 		// tag
// 		},
// 	NODE7: { 
// 		name: "Node 7",
// 		desc: "TODO DESCRIPTION",
// 		img: 'img/workshop/tech/techmock.jpg',
// 		icon: 'img/workshop/icons/star.png',
// 		rp: 400,
// 		requires: ['NODE6'], // other TechNodes
// 		yields: [], // actual techs from the tech list. may include probabilities
// 		// turns left
// 		// tag
// 		},
// 	NODE8: { 
// 		name: "Node 8",
// 		desc: "TODO DESCRIPTION",
// 		img: 'img/workshop/tech/techmock.jpg',
// 		icon: 'img/workshop/icons/star.png',
// 		rp: 450,
// 		requires: ['NODE4','NODE5'], // other TechNodes
// 		yields: ['TECH8','TECH9'], // actual techs from the tech list. may include probabilities
// 		// turns left
// 		// tag
// 		}
		
	};
