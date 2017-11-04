import {bindable} from 'aurelia-framework';

export class DiploPane {
	@bindable app = null;

	ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		}

	SpeakTo( civ ) { 
		this.app.SwitchMainPanel( 'audience', civ );
		}

	}
