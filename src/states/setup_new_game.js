import {inject} from 'aurelia-framework';
import {App} from '../app';
import Game from '../classes/Game';
import Planet from '../classes/Planet';
import * as Signals from '../util/signals';

@inject(App)
export class SetupNewGameState {
	mode = 'galaxy';
	mode_queue = ['galaxy','race','ui']; // improves UI experience by making user click through all panes
	
	constructor( app ) {
		this.app = app;
		// we need to work around aurelia's non-support for array[index] binding
		this.app.options.setup.color = this.app.options.setup.color.map( c => parseInt(c) );
		this.color_r = this.app.options.setup.color[0];
		this.color_g = this.app.options.setup.color[1];
		this.color_b = this.app.options.setup.color[2];
		this.shapes = ['attraction','shuffle','heightmap'];
		this.ClickNext(); // sets first mode view
		}

	ChangePanel(panel) {
		this.mode = panel;
		}
		
	ClickNext() {
		if ( !this.mode_queue.length ) {
			this.ConfirmSetup();
			}
		else { this.mode = this.mode_queue.shift(); }
		}
	
	ConfirmSetup() {
		this.app.options.setup.galaxy_size = Number.parseInt( this.app.options.setup.galaxy_size );
		this.app.options.setup.galaxy_age = Number.parseFloat( this.app.options.setup.galaxy_age );
		this.app.options.setup.density = Number.parseFloat( this.app.options.setup.density );
		this.app.options.setup.crazy = Number.parseFloat( this.app.options.setup.crazy );
		this.app.options.setup.AIs = Number.parseInt( this.app.options.setup.AIs );
		this.app.options.setup.race_atm = Number.parseInt( this.app.options.setup.race_atm );
		this.app.options.setup.race_temp = Number.parseInt( this.app.options.setup.race_temp );
		this.app.options.setup.race_grav = Number.parseInt( this.app.options.setup.race_grav );
		this.app.options.setup.race_adapt = Number.parseInt( this.app.options.setup.race_adapt );
		
		// put color array back together
		this.app.options.setup.color[0] = Number.parseInt( this.color_r );
		this.app.options.setup.color[1] = Number.parseInt( this.color_g );
		this.app.options.setup.color[2] = Number.parseInt( this.color_b );

		this.app.ChangeState('loading_screen', () => {
			setTimeout( () => { // allows loading screen to appear before CPU takes up thread creating galaxy
				// create initial state
				this.app.ResetEverything();
				this.app.game = new Game(this.app);
				this.app.game.InitGalaxy();
				
				// small UI tweek
				if ( this.app.options.setup.density == 0.05 ) { this.app.options.setup.density = 0; }
				this.app.SaveOptions();
				
				this.app.ChangeState('play');
				this.last_saved_game_key = '';
				}, 50 );
			});
		}
		
	CancelSetup() {
		this.app.ChangeState('title_screen');
		}

	attached() {
		Signals.Send('state_changed', this );
		}
		
	EnvDisplayName( a, t, g ) {
		return Planet.GravNames()[g] + ' ' + Planet.EnvNames()[t][a];
		}
		
	ClickShape( shape ) {
		this.app.options.setup.shape = shape;
		}
		
	}

	
	
	
