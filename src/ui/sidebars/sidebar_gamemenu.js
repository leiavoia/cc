import Game from '../../classes/Game';

export class GameMenuPane {
	app = null;
	requesting_save_name = false;
	force_download = false;
	saved_game_name = '';
	activate(data) {
		this.app = data.app;
		let last_saved_game_name = this.app.last_saved_game_key.replace('Game: ','');
		this.saved_game_name = last_saved_game_name || `${this.app.game.myciv.name} saved game`;
		}
		
	Quit() {
		if ( this.app.game.turn_num == 0 || confirm("Quit current game?") ) { 
			this.app.ChangeState('title_screen');
			}
		}
		
	SaveGame() {
		let name = this.saved_game_name || 'Saved Game';
		let result = this.app.SaveGame(name,this.force_download);
		if ( result ) { 
			this.saved_game_name = name;
			this.app.ReturnToMap();
			this.app.AddNote( 'good', 'Game Saved', name, null, 2000 );
			}
		}
		
	SaveGameFast() {
		let result = this.app.SaveGame('Quick Save');
		if ( result ) { 
			this.saved_game_name = 'Quick Save';
			this.app.ReturnToMap();
			this.app.AddNote( 'good', 'Game Saved', name, null, 2000 );
			}
		}
		
	NewGame() { 
		if ( this.app.game.turn_num == 0 || confirm("Quit current game?") ) { 
			this.app.ChangeState('setup_new_game');
			}
		}
		
	FastNewGame() {
		if ( this.app.game.turn_num < 5 || confirm("Quit current game?") ) { 
			// this is kind of an encapsulation no-no, but hey, its javascript!
			this.app.ChangeState('loading_screen', () => {
				this.app.game = new Game(this.app);
				this.app.game.InitGalaxy();
				this.app.ChangeState('play');
				this.last_saved_game_key = '';
				});
			}
		}
		
	}
