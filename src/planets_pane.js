// import {bindable} from 'aurelia-framework';
import {inject} from 'aurelia-framework';
import {App} from 'app';

@inject(App)
export class PlanetsPane {
	app = null;
	myciv = null;
	planets = [];
	
	show_mine = true;
	show_foreign = false;
	show_unclaimed	= false;

	constructor( app ) {
		this.app = app;
		// build planet list
		this.myciv = this.app.game.myciv;
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
