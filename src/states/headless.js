import {inject} from 'aurelia-framework';
import {App} from '../app';
import Game from '../classes/Game';
import * as Signals from '../util/signals';

@inject(App)
export class HeadlessState {
	
	game_num = 1;
	starting_civs = 0;
	start_time = 0;
	total_run_time = 0;
	current_run_time = 0;
	abort_after_turn = 2000;
	total_turns = 0;
	tps = 0;
	
	constructor( app ) {
		this.app = app;
		Signals.Listen('game_over', () => this.GameOver() );
		Signals.Listen('turn', turn_num => this.onTurn(turn_num) );
		this.app.options.setup.galaxy_size = Number.parseInt( this.app.options.setup.galaxy_size );
		this.app.options.setup.galaxy_age = Number.parseFloat( this.app.options.setup.galaxy_age );
		this.app.options.setup.density = Number.parseFloat( this.app.options.setup.density );
		this.app.options.setup.crazy = Number.parseFloat( this.app.options.setup.crazy );
		this.app.options.setup.AIs = Number.parseInt( this.app.options.setup.AIs );
		this.app.options.ai = true;
		this.app.options.soak = true;
		}

	unattach() { 
		this.app.ResetEverything();
		this.app.game = null;
		}
	
	attached() {
		Signals.Send('state_changed', this );
		}
	
	Start() { 
		if ( !this.app.game ) { this.NewGame(); }
		else {
			if ( !this.start_time ) { 
				this.start_time = Date.now();
				this.current_run_time = 0;
				this.starting_civs = this.app.game.galaxy.civs.filter( c => !c.race.is_monster ).length;
				}
			}
		if ( this.start_time ) { this.start_time = Date.now() - this.current_run_time; }
		if ( !this.app.game.autoplay ) this.app.game.ToggleAutoPlay(10);
		}
	
	Stop() { 
		if ( this.app.game && this.app.game.autoplay ) this.app.game.ToggleAutoPlay(10);
		}
	
	Toggle() {
		if ( this.app.game && this.app.game.autoplay ) { this.Stop(); } 	
		else { this.Start(); } 	
		}
	
	GameOver() {
		//
		// TODO: this is where the stat recording would go
		//
		this.Stop();
		let diff = Date.now() - this.start_time;
		this.total_run_time += diff;
		this.start_time = 0;
		this.NewGame();
		this.Start();
		} 
		
	NewGame() { 
		this.app.ResetEverything();
		this.app.game = new Game(this.app);
		this.app.game.InitGalaxy();
		this.starting_civs = this.app.game.galaxy.civs.filter( c => !c.race.is_monster ).length;
		this.game_num++;
		this.start_time = Date.now();
		this.current_run_time = 0;
		}
		
	onTurn( turn_num ) { 
		this.total_turns++;
		this.current_run_time = Date.now() - this.start_time;
		this.tps = this.total_turns / ((this.current_run_time + this.total_run_time) / 1000); 
		// abort if game does not resolve
		if ( turn_num >= this.abort_after_turn ) {
			this.GameOver();
			}
		}
		
	// dummy functions that App tries to connect to
	SetCaret( obj ) { }
	FocusMap( obj, snap = false ) { }
		
	}

	
	
	
