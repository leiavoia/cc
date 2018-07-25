import {bindable} from 'aurelia-framework';
import ShipCombat from './classes/ShipCombat';

export class ShipCombatPane {
	@bindable app = null;
	@bindable combatdata = null; // { attacker, defender, planet }

	constructor() { 
		if ( this.combatdata ) { 
			this.combat = new ShipCombat( this.combatdata.attacker, this.combatdata.defender, this.combatdata.planet );
			}
	    }
	    
	ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		this.combat.End();
		// tell game this battle is over and remove from list
		this.app.game.PresentNextPlayerShipCombat( this.combatdata );
		}

	}
