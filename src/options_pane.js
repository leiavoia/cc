import {bindable} from 'aurelia-framework';

export class OptionsPane {
	 @bindable app = null;

	 ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		}
		
		
	}
