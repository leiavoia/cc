import {bindable} from 'aurelia-framework';

export class AudiencePane {
	 @bindable app = null;
	 @bindable civ = null;

	 ClosePanel() {
		this.app.CloseMainPanel();
		}
	}
