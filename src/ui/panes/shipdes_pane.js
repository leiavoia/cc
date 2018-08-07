import {Ship,ShipBlueprint} from '../../classes/Ship';

export class ShipDesignPane {

	constructor() { 
	 	this.bp = null; // the blueprint in focus
	 	this.mode = null; // used to switch panes
	 	this.newbp = null; // unsaved blueprint used for making new ones
	 	this.max_hull_size = 0;
		// key click events
		this.keypressCallback = (e) => { this.KeyPress(e); };
	 	}

	activate(data) {
		this.app = data.app;
	 	if ( this.app.game.myciv.ship_blueprints.length ) {
	 		this.bp = this.app.game.myciv.ship_blueprints[0];
	 		}
		this.max_hull_size = this.app.game.myciv.max_hull_size;
		// HACK FOR DEVELOPMENT - Ship images
		this.avail_imgs = [];
		for ( let i=1; i < 35; i++ ) { 
			this.avail_imgs.push(
				'img/ships/ship' + ("000" + i.toString()).slice(-3) + '_mock.png'
				);
			}
		// listen for hotkeys
		window.addEventListener('keypress', this.keypressCallback, false);
		}
		
	unbind() {
		// stop listening for hotkeys
		window.removeEventListener('keypress', this.keypressCallback);
		}
	 	
	ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		this.bp = null;
		this.newbp = null;
		}
		
	ClickBlueprint( bp ) { 
		this.bp = bp;
		}
		
	// BUG: Aurelia has a known bug where it doesn't track the
	// weapon.qty value if the weapon is added, removed, and re-added.
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
		this.newbp.AddWeapon(weapon.tag);
		this.mode = 'new';
		}
	ClickAddComponent( comp ) {
		this.newbp.AddComponent(comp.tag);
		this.mode = 'new';
		}
		
	StartNewBlueprint() { 
		this.newbp = new ShipBlueprint;
		this.newbp.img = this.avail_imgs[0];
		this.mode = 'new';
		}
		
	CommitNewBlueprint() { 
		this.app.game.myciv.ship_blueprints.push( this.newbp );
		this.bp = this.newbp;
		this.newbp = null;
		this.mode = null;
		}
		
	SelectShipImg( img ) { 
		this.newbp.img = img;
		this.mode = 'new';
		}
		
	KeyPress( event ) { 
		switch ( event.keyCode || event.which ) { 
			case 27: { // escape
				event.preventDefault(); 
				if ( this.mode ) { this.mode = null; }
				else { this.ClosePanel(); }
				return true;
				}
			}
		}
		
	ClickPrevImg() { 
		let i = this.avail_imgs.indexOf( this.newbp.img );
		if ( --i < 0 ) { i = this.avail_imgs.length-1; }
		this.newbp.img = this.avail_imgs[i];
		}
	ClickNextImg() { 
		let i = this.avail_imgs.indexOf( this.newbp.img );
		if ( ++i == this.avail_imgs.length ) { i = 0; }
		this.newbp.img = this.avail_imgs[i];
		}
	}
