import {inject} from 'aurelia-framework';
import {App} from '../app';

@inject(App)
export class TitleState {
	constructor( app ) {
		this.app = app;
		}

	ClickNewGame() {
		this.app.ChangeState('setup_new_game');
		}
		
	ClickLoadGame() {
		this.app.LoadGame();
		}

	ClickHeadless() {
		this.app.ChangeState('headless');
		}
		
	}

	
	
	
