// import {bindable} from 'aurelia-framework';
import {inject} from 'aurelia-framework';
import {App} from 'app';

@inject(App)
export class PlanetsPane {
	app = null;
	planets = [];
	
	show_mine = true;
	show_foreign = false;
	show_unclaimed	= false;

	constructor( app ) {
		this.app = app;
		this.myciv = app.game.myciv;
		// build planet list
		for ( let star of this.app.game.galaxy.stars ) { 
			for ( let planet of star.planets ) { 
				this.planets.push( planet );
				}
			}
		}
	ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		}
		
	}
