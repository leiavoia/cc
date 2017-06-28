import {bindable} from 'aurelia-framework';

export class TitleState {
	@bindable app = null;
	
	constructor() {
		
		}

	ClickNewGame() {
		this.app.ChangeState('setup_new');
		}
		
	}

	
	
	
