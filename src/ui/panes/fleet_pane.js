import * as Signals from '../../util/signals';
export class FleetPane {

	fleet = null;
	bps = null; // Map
	
	activate(data) {
		if ( !data ) { return false; }
		this.app = data.app;
		this.fleet = data.obj;
		this.bps = this.fleet.ListUniqueModels();
		}
		
	ClosePanel() {
		this.app.CloseMainPanel();
		}
		
	}
