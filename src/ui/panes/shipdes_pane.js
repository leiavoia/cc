export class ShipDesignPane {

	constructor() { 
	 	this.bp = null; // the blueprint in focus
	 	this.mode = null; // used to switch panes
		// key click events
		this.keypressCallback = (e) => { this.KeyPress(e); console.log('clicky'); };
	 	}

	activate(data) {
		this.app = data.app;
	 	if ( this.app.game.myciv.ship_blueprints.length ) {
	 		this.bp = this.app.game.myciv.ship_blueprints[0];
	 		}
		// listen for hotkeys
		window.addEventListener('keypress', this.keypressCallback, false);
		}
		
	deactivate() {
		// stop listening for hotkeys
		window.removeEventListener('keypress', this.keypressCallback);
		}
	 	
	ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		this.bp = null;
		}
		
	ClickBlueprint( bp ) { 
		this.bp = bp;
		}
		
	IncWeaponQty( bp, weapon ) { 
		weapon.qty++;
		bp.RecalcStats();
		}
	DecWeaponQty( bp, weapon ) { 
		weapon.qty--;
		if ( weapon.qty < 1 ) { weapon.qty = 1; }
		bp.RecalcStats();
		}
		
	ClickAddWeapon( weapon ) {
		this.bp.AddWeapon(weapon.tag);
		this.mode = null;
		}
	ClickAddComponent( comp ) {
		this.bp.AddComponent(comp.tag);
		this.mode = null;
		}
		
	KeyPress( event ) { 
		switch ( event.keyCode || event.which ) { 
			case 27: { // escape
				event.preventDefault(); 
				if ( this.mode ) { this.mode = null; }
				else { this.ClosePanel(); }
				console.log('clicked ESC');
				return false;
				}
			}
		}
	}
