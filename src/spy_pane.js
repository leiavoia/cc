import {bindable} from 'aurelia-framework';

export class SpyPane {
	 @bindable app = null;

	 ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		}
	}
