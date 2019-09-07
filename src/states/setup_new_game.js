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
		
		// create initial state
		this.app.ResetEverything();
		this.app.game = new Game(this.app);
		this.app.game.InitGalaxy();
		
		// small UI tweek
		if ( this.app.options.setup.density == 0.05 ) { this.app.options.setup.density = 0; }
		this.app.SaveOptions();
		
		this.app.ChangeState('play');
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
		this.app.ChangeState('title_screen');
		}
	}

	
	
	
