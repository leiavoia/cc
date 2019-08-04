import {inject} from 'aurelia-framework';
import * as utils from '../util/utils';
import {App} from '../app';
import Game from '../classes/Game';
import Civ from '../classes/Civ';

@inject(App)
export class SetupNewGameState {
	show_pane = 'galaxy';
	
	constructor( app ) {
		this.app = app;
		}

	ChangePanel(panel) {
		this.show_pane = panel;
		}
	ConfirmSetup() {
		
		this.app.options.setup.galaxy_size = Number.parseInt( this.app.options.setup.galaxy_size );
		this.app.options.setup.galaxy_age = Number.parseFloat( this.app.options.setup.galaxy_age );
		this.app.options.setup.density = Number.parseFloat( this.app.options.setup.density );
		this.app.options.setup.crazy = Number.parseFloat( this.app.options.setup.crazy );
		this.app.options.setup.AIs = Number.parseInt( this.app.options.setup.AIs );
		
		// randomize stuff
		if ( this.app.options.setup.galaxy_age_randomize ) { 
			this.app.options.setup.galaxy_age = (utils.RandomInt(0,10) / 10).toPrecision(1); 
			}
		if ( this.app.options.setup.density_randomize ) { 
			this.app.options.setup.density = (utils.RandomInt(0,10) / 10).toPrecision(1); 
			}
		if ( this.app.options.setup.crazy_randomize ) { 
			this.app.options.setup.crazy = (utils.RandomInt(0,10) / 10).toPrecision(1); 
			}
		if ( this.app.options.setup.AIs_randomize ) { 
			this.app.options.setup.AIs = utils.RandomInt(1,23); 
			}
		// galaxy size randomness is considered "up to" and not a totally random number.
		// This helps the galaxy size from exploding poor computers.
		const galaxy_size = 
			this.app.options.setup.galaxy_size_randomize
			? utils.RandomInt(16,this.app.options.setup.galaxy_size)
			: this.app.options.setup.galaxy_size
			;

		// create initial state
		this.app.ResetEverything();
		this.app.game = new Game(this.app);
		this.app.game.InitGalaxy();
		
		// take sqrt of the number of sectors
		let min_edge = 4; // 4 sectors along side = 1600px
		let edge1 = Math.ceil( Math.sqrt( galaxy_size ) * 2 );
		let edge2 = Math.ceil( utils.BiasedRand(min_edge, (edge1-min_edge), (edge1*0.5), (1.0-this.app.options.setup.crazy)  ) );
		edge1 -= edge2;
		// calculate num stars based on density and number of sectors we have
		if ( this.app.options.setup.density == 0 ) { this.app.options.setup.density = 0.05; }
		let stars = Math.ceil( galaxy_size * this.app.options.setup.density );
		this.app.game.galaxy.Make( 
			(edge1 > edge2 ? edge1 : edge2), // longest edge is horizontal. better screen ergonomics
			(edge1 > edge2 ? edge2 : edge1), 
			stars,
			this.app.options.setup.galaxy_age,
			this.app.options.setup.crazy
			);
		// TODO: change AddExploreDemo to something more robust when code matures.
		let mystar = this.app.game.galaxy.AddExploreDemo( this.app.options.setup.AIs + 1 );
		// TODO: difficulty level: when assigning homeworlds, give player more or less
		// room, and better or worse position as defined by the natural score of all
		// planets within a "starting circle", then sort star systems by their totals.
		this.app.game.SetMyCiv( 0 );
		this.app.game.RecalcStarRanges();
		this.app.game.RecalcFleetRanges();
		this.app.game.RecalcCivContactRange();
		this.app.hilite_star = mystar;
		this.app.ChangeState('play');
		console.log( 
			`New Galaxy:\n\tedges: ${edge2} x ${edge1}`
			+ `\n\tsectors: ${galaxy_size}`
			+ `\n\tdensity: ${this.app.options.setup.density}`
			+ `\n\tstars: ` + this.app.game.galaxy.stars.length
			+ `\n\tanoms: ` + this.app.game.galaxy.anoms.length
			+ `\n\tage: ${this.app.options.setup.galaxy_age}`
			+ `\n\tcraziness: ${this.app.options.setup.crazy}`
			+ `\n\tSandbox civs: ` + this.app.game.galaxy.civs.filter( c => !c.race.is_monster ).length
			);
		// small UI tweek
		if ( this.app.options.setup.density == 0.05 ) { this.app.options.setup.density = 0; }
		this.app.SaveOptions();
		// at this point there is some fudge time until the PlayState
		// widget actually gets created and placed into the layout.
		// Trying to perform functions directly on the PlayState will
		// fail because it doesn't exist yet. Let PlayState handle
		// anything it needs by itself. Just give it the data it needs.
		// [!]TODO - Consider adding an App::OnStateChange callback
		// that States can call when they are done loading. Kinda like 
		// an app-level event lifecycle.
		}
	CancelSetup() {
		this.app.ChangeState('title');
		}
	}

	
	
	
