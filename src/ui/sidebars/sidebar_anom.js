// import Planet from './classes/Planet';
// import {bindable} from 'aurelia-framework';

export class AnomDetailPane {
	anom = null;
	app = null;
	editing_name = false;
	
	activate(data) {
		this.app = data.app;
		this.anom = data.obj;
		}
		
	}
