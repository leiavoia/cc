import {bindable} from 'aurelia-framework';

export class FleetsPane {
	 @bindable app = null;

	 ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		}
		
	ClickObject(o) { 
		this.app.SwitchSideBar(o);
		this.app.FocusMap(o);	
		}
		
	}
