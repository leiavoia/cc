import {bindable} from 'aurelia-framework';

export class PlanetsPane {
	 @bindable app = null;

	 ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		}
	}
