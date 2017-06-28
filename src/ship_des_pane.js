import {bindable} from 'aurelia-framework';

export class ShipDesignPane {
	 @bindable app = null;

	 ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		}
	}
