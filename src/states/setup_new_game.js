import {inject} from 'aurelia-framework';
import * as utils from '../util/utils';
import {App} from '../app';

@inject(App)
export class SetupNewGameState {
	show_pane = 'galaxy';
	settings = {
		galaxy_size: 15, // in "sectors" (1000px^2)
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
	Confirm() {
		// take sqrt of the number of sectors
		let min_edge = 2; // 2 sectors along side = 2000px
		let edge1 = Math.sqrt( this.settings.galaxy_size ) * 2;
		let edge2 = utils.BiasedRand(min_edge, (edge1-min_edge), (edge1*0.5), (1.0-this.settings.crazyness)*1.5  );
		edge1 -= edge2;
		// calculate num stars based on density and number of sectors we have
		let thinnest = 1.0 / 3.0;
		let thickest = 4.0 / 1.0;
		let width = thickest - thinnest;
		if ( this.settings.num_stars == 0 ) { this.settings.num_stars = 0.05; }
		let stars = this.settings.galaxy_size * this.settings.num_stars * width;
		
		this.app.game.galaxy.Make( 
			(edge1 > edge2 ? edge1 : edge2)*1000, // longest edge is horizontal. better screen ergonomics
			(edge1 > edge2 ? edge2 : edge1)*1000, 
			stars,
			this.settings.galaxy_age
			);
		let mystar = this.app.game.galaxy.AddExploreDemo();
		this.app.game.SetMyCiv( 0 ); // could switch using debug stuff
		this.app.ChangeState('play');
		this.app.hilite_star = mystar;
		// at this point there is some fudge time until the PlayState
		// widget actually gets created and placed into the layout.
		// Trying to perform functions directly on the PlayState will
		// fail because it doesn't exist yet. Let PlayState handle
		// anything it needs by itself. Just give it the data it needs.
		// [!]TODO - Consider adding an App::OnStateChange callback
		// that States can call when they are done loading. Kinda like 
		// an app-level event lifecycle.
		}
	Cancel() {
		this.app.ChangeState('title');
		}
	}

	
	
	
