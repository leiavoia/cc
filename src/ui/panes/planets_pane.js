
export class PlanetsPane {
	app = null;
	myciv = null;
	planets = [];
	
	show_mine = true;
	show_foreign = false;
	show_unclaimed	= false;
	
	activate(data) {
		this.app = data.app;
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
	ClickPlanet(p) { 
		this.app.SwitchSideBar(p);
		this.app.FocusMap(p);	
		}
	}
