// import {bindable} from 'aureliza-framework';

export class ConstellationDetailPane {
	constel = null;
	app = null;

	activate(data) {
		this.app = data.app;
		this.constel = data.obj;
		}
		
	ClickStar(s) { 
		this.app.SwitchSideBar( s );
		}
			
	}
