import {PlanetAttrs} from './Planet';

export const VictoryRecipes = {
	TESSERA: {
		name: 'Tessera Constellation',
		desc: `Ages ago, an advanced civilization created a network of hidden star systems 
			to escape the violence of a decaying galaxy. Today these systems are 
			unknown, perhaps invisible, or perhaps lost forever...`,
		requires: ['TESSERA1','TESSERA2','TESSERA3','TESSERA4'],
		provides: [/*'GALAXYPEARL'*/]
		},
	};
	
export const VictoryIngredients = {
	TESSERA1: {
		name: 'Tessera Alpha',
		desc: 'The first of the star systems created by an ancient civilization.',
		img: '',
		AddToGame: function ( game ) { 
			let stars = game.galaxy.stars.shuffle();
			outer: 
			for ( let s of stars ) { 
				for ( let p of s.planets ) { 
					if ( !p.owner && !p.name.match(/tessera/i) ) { 
						p.physattrs.push( PlanetAttrs['TESSERA1'] );
						p.score += 500;
						p.name = 'Tessera Alpha';
						break outer;
						}
					}
				} 
			}
		},
	TESSERA2: {
		name: 'Tessera Beta',
		desc: 'The second of the star systems created by an ancient civilization.',
		img: '',
		AddToGame: function ( game ) { 
			let stars = game.galaxy.stars.shuffle();
			outer: 
			for ( let s of stars ) { 
				for ( let p of s.planets ) { 
					if ( !p.owner && !p.name.match(/tessera/i) ) { 
						p.physattrs.push( PlanetAttrs['TESSERA2'] );
						p.score += 500;
						p.name = 'Tessera Beta';
						break outer;
						}
					}
				} 
			}
		},
	TESSERA3: {
		name: 'Tessera Gamma',
		desc: 'The third star system created by an ancient civilization.',
		img: '',
		AddToGame: function ( game ) { 
			let stars = game.galaxy.stars.shuffle();
			outer: 
			for ( let s of stars ) { 
				for ( let p of s.planets ) { 
					if ( !p.owner && !p.name.match(/tessera/i) ) { 
						p.physattrs.push( PlanetAttrs['TESSERA3'] );
						p.score += 500;
						p.name = 'Tessera Gamma';
						break outer;
						}
					}
				} 
			}
		},
	TESSERA4: {
		name: 'Tessera Delta',
		desc: 'The last of the star systems created by an ancient civilization.',
		img: '',
		AddToGame: function ( game ) { 
			let stars = game.galaxy.stars.shuffle();
			outer: 
			for ( let s of stars ) { 
				for ( let p of s.planets ) { 
					if ( !p.owner && !p.name.match(/tessera/i) ) { 
						p.physattrs.push( PlanetAttrs['TESSERA4'] );
						p.score += 500;
						p.name = 'Tessera Delta';
						break outer;
						}
					}
				} 
			}
		},
	GALAXYPEARL: {
		name: 'The Galaxy Pearl',
		desc: `A kilometer wide, solid sphere made of a diamond-like structure 
			and found orbiting a brown dwarf star in otherwise empty space. 
			This marvel of engineering appears to be a kind of super-telescope, 
			but now sits abandoned.`,
		img: '',
		AddToGame: function ( game ) { 
			// trade out one of the galaxy's anomalies for the galaxy pearl
			let a = game.galaxy.anoms[0];
			if ( a ) { 
				a.name = this.name;
				a.order = 75; // for exploration
				a.onmap = true;
				a.vis_level = 0; // 0..2
				a.size = 100; // measure of how much it takes to research this anom
				a.pre_desc = 'A light gravitational anomaly detected in open space indicates a large object invisible to direct observation.';
				a.post_desc = this.desc;
				a.onComplete = fleet => { 
					fleet.owner.victory_ingredients.push( this );
					};
				}
			}
		},
	};
	
// add keys to objects themselves for later self-reference
for ( let k in VictoryRecipes ) {
	VictoryRecipes[k].key = k;
	}
for ( let k in VictoryIngredients ) {
	VictoryIngredients[k].key = k;
	}
