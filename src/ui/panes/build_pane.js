export class BuildPane {

	activate(data) {
		this.app = data.app;
		this.planet = data.obj;
		// make a list of things we can build
		this.ships = this.app.game.myciv.ship_blueprints;
		this.groundunits = this.app.game.myciv.groundunit_blueprints;
		this.makework = this.planet.ListMakeworkProjects();
		}
		
	ClickShip( x, qty=1 ) {
		this.planet.AddBuildQueueShipBlueprint( x, qty );
		this.app.CloseMainPanel();
		}
		
	ClickGroundUnit( x, qty=1 ) {
		this.planet.AddBuildQueueGroundUnitBlueprint( x, qty );
		this.app.CloseMainPanel();
		}
		
	ClickMakeworkProject( x ) {
		this.planet.AddBuildQueueMakeworkProject( x.type );
		this.app.CloseMainPanel();
		}
		
	ClosePanel() {
		this.app.CloseMainPanel();
		}
				
	IsBuildable( bp ) { 
		for ( let k in bp.cost ) {
			if ( this.planet.owner.resources[k] < 1 || this.planet.owner.resource_income < 1 ) {
				return false;
				}
			}
		return true;
		}	
		
	}
