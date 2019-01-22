import {inject} from 'aurelia-framework';
import * as utils from '../util/utils';
import {App} from '../app';
import Game from '../classes/Game';
import Civ from '../classes/Civ';

@inject(App)
export class SetupNewGameState {
	show_pane = 'galaxy';
	settings = {
		galaxy_size: 70, // in "sectors" (400px^2)
		galaxy_age: 0.5,
		num_stars: 0.5,
		crazyness: 0.5,
		events_freq: 0.5,
		diff: 0.5,
		num_civs: 6,
		scenario: 'Post-Warp Sandbox',
		victory: {
			baseball: true,
			cc: true,
			whatever: true,
			}
		};
	
	constructor( app ) {
		this.app = app;
		}

	ChangePanel(panel) {
		this.show_pane = panel;
		}
	ConfirmSetup() {
		console.log('confirmed');
		
		// create initial state
		this.app.ResetEverything();
		this.app.game = new Game(this.app);
		this.app.game.InitGalaxy();
		
		// take sqrt of the number of sectors
		let min_edge = 4; // 4 sectors along side = 1600px
		let edge1 = Math.ceil( Math.sqrt( this.settings.galaxy_size ) * 2 );
		let edge2 = Math.ceil( utils.BiasedRand(min_edge, (edge1-min_edge), (edge1*0.5), (1.0-this.settings.crazyness)*1.5  ) );
		edge1 -= edge2;
		// calculate num stars based on density and number of sectors we have
		if ( this.settings.num_stars == 0 ) { this.settings.num_stars = 0.05; }
		let stars = Math.ceil( this.settings.galaxy_size * this.settings.num_stars );
		console.log( `edge1 = ${edge1}, edge2 = ${edge2}, stars was ` + stars);
		this.app.game.galaxy.Make( 
			(edge1 > edge2 ? edge1 : edge2), // longest edge is horizontal. better screen ergonomics
			(edge1 > edge2 ? edge2 : edge1), 
			stars,
			this.settings.galaxy_age
			);
		// TODO: change AddExploreDemo to something more robust when code matures.
		let mystar = this.app.game.galaxy.AddExploreDemo(this.settings.num_civs);
		// TODO: difficulty level: when assigning homeworlds, give player more or less
		// room, and better or worse position as defined by the natural score of all
		// planets within a "starting circle", then sort star systems by their totals.
		this.app.game.SetMyCiv( 0 );
		this.app.game.RecalcStarRanges();
		this.app.game.RecalcFleetRanges();
		this.app.game.RecalcCivContactRange();
		this.app.hilite_star = mystar;
		this.app.ChangeState('play');
		console.log( 'total civs: ' + Civ.total_civs );
		// small UI tweek
		if ( this.settings.num_stars == 0.05 ) { this.settings.num_stars = 0; }
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

	
	
	
