import {bindable} from 'aurelia-framework';
import * as utils from '../util/utils';

export class SetupNewGameState {
	@bindable app = null;
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
	
	constructor() {
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
		this.app.ChangeState('play').then( () => {
			this.app.hilite_star = mystar;
			this.app.FocusMap(mystar);
			} );
		}
	Cancel() {
		this.app.ChangeState('title');
		}
	}

	
	
	
