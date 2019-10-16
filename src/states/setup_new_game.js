import {inject} from 'aurelia-framework';
import {App} from '../app';
import Game from '../classes/Game';
import * as Signals from '../util/signals';

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
		
		// create initial state
		this.app.ResetEverything();
		this.app.game = new Game(this.app);
		this.app.game.InitGalaxy();
		
		// small UI tweek
		if ( this.app.options.setup.density == 0.05 ) { this.app.options.setup.density = 0; }
		this.app.SaveOptions();
		
		this.app.ChangeState('play', /* optional post-loading callback here */ );
		}
	CancelSetup() {
		this.app.ChangeState('title_screen');
		}

	attached() {
		Signals.Send('state_changed', this );
		}
	}

	
	
	
