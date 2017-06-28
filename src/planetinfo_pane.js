import {bindable} from 'aurelia-framework';

export class PlanetinfoPane {
	 @bindable app = null;
	 @bindable planet = null;

	 ClosePanel() {
		this.app.CloseMainPanel();
		}
	}
