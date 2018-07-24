import {bindable} from 'aurelia-framework';

export class ShipCombatPane {
	@bindable app = null;

	ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		}

	}
