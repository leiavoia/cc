import {bindable} from 'aurelia-framework';

export class ColonizePane {
	 @bindable app = null;
	 @bindable planet = null;

	 ClickDone() {
		this.app.CloseMainPanel();
		this.app.SwitchSideBar(this.planet);
		}
	}
