

	
// for internal use
export const VictoryRecipes = {
	TESSERA: {
		name: 'Tessera Constellation',
		desc: `Ages ago, an advanced civilization created a network of hidden star systems 
			to escape the violence of a decaying galaxy. Today these systems are 
			unknown, perhaps invisible, or perhaps lost forever...`,
		requires: ['TESSERA1','TESSERA2','TESSERA3','TESSERA4'],
		provides: ['GALAXYPEARL']
		},
	TEST1: {
		name: 'Test Victory Recipe',
		desc: `Find the galaxy pearl and that's it; you win. YOU WIN!`,
		requires: ['GALAXYPEARL'],
		provides: [],
		},
	TEST2: {
		name: 'Test Victory Recipe',
		desc: `Find the two ancient test victory ingredients left by a crazy programmer to win the game.`,
		requires: ['TEST1','TEST2'],
		provides: ['GALAXYPEARL']
		},
	};
	
	
export const VictoryIngredients = {
	TEST1: {
		name: 'Test Victory Ingredient #1',
		desc: 'This victory ingredient is here to test the Victory Recipes subsystem. It feels like wet glass.',
		img: '',
		AddToGame: function ( game ) { 
			// TODO
			}
		},
	TEST2: {
		name: 'Test Victory Ingredient #2',
		desc: 'This victory ingredient is here to test the Victory Recipes subsystem. It tastes like cyan pepper.',
		img: '',
		AddToGame: function ( game ) { 
			// TODO
			}
		},
	TESSERA1: {
		name: 'Tessera Alpha',
		desc: 'The first of the star systems created by an ancient civilization.',
		img: '',
		AddToGame: function ( game ) { 
			// TODO
			}
		},
	TESSERA2: {
		name: 'Tessera Beta',
		desc: 'The second of the star systems created by an ancient civilization.',
		img: '',
		AddToGame: function ( game ) { 
			// TODO
			}
		},
	TESSERA3: {
		name: 'Tessera Theta',
		desc: 'The third star system created by an ancient civilization.',
		img: '',
		AddToGame: function ( game ) { 
			// TODO
			}
		},
	TESSERA4: {
		name: 'Tessera Delta',
		desc: 'The last of the star systems created by an ancient civilization.',
		img: '',
		AddToGame: function ( game ) { 
			// TODO
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
				console.log('Adding special anom "' +  this.name + '"');
				a.name = this.name;
				a.order = 75; // for exploration
				a.onmap = true;
				a.vis_level = 0; // 0..2
				a.size = 100; // measure of how much it takes to research this anom
				a.pre_desc = 'A light gravitational anomaly detected in open space indicates a large object invisible to direct observation.';
				a.post_desc = this.desc;
				a.onComplete = fleet => { 
					fleet.owner.victory_ingredients.push( this );
					console.log(`ACQUIRED: ${this.name}`);
					};
				}
			}
		},
	};
	
// add keys to objects themselves for later self-reference
for ( let k in VictoryRecipes ) {
	VictoryRecipes[k].tag = k;
	}
for ( let k in VictoryIngredients ) {
	VictoryIngredients[k].tag = k;
	}
