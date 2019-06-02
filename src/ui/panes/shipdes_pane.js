import {Ship,ShipBlueprint} from '../../classes/Ship';

export class ShipDesignPane {

	constructor() { 
	 	this.bp = null; // the blueprint in focus
	 	this.mode = null; // used to switch panes
	 	this.subpanel = null; // indicates which, if any, subpanel is visible
	 	this.newbp = null; // unsaved blueprint used for making new ones
	 	this.max_hull_size = 0;
	 	this.scrap_delete_all = false;
	 	this.scrap_remove_from_queues = false;
		// key click events
		this.keypressCallback = (e) => { this.KeyPress(e); };
	 	}

	activate(data) {
		this.app = data.app;
		this.bps = this.app.game.myciv.ship_blueprints.reverse();
	 	if ( this.bps.length ) {
	 		this.bp = this.bps[0];
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
		}
	ClickAddComponent( comp ) {
		this.newbp.AddComponent(comp.tag);
		}
		
	StartNewBlueprint() { 
		this.newbp = new ShipBlueprint;
		this.newbp.img = this.avail_imgs[0];
		this.mode = 'new';
		this.subpanel = null;
		}
		
	CommitNewBlueprint() { 
		this.bps.push( this.newbp );
		this.bp = this.newbp;
		this.newbp = null;
		this.mode = null;
		this.subpanel = null;
		}
		
	CancelNewBlueprint() { 
		this.newbp = null;
		this.mode = null;
		this.subpanel = null;
		}
		
	CopyBlueprint() { 
		this.newbp = this.bp.Copy();
		this.mode = 'new';
		}
		
	ScrapBlueprint() { 
		// delete existing ships and refund some cash back to treasury
		if ( this.scrap_delete_all ) { 
			this.app.game.myciv.fleets.forEach( f => { 
				let num_before = f.ships.length;
				f.ships = f.ships.filter( s => this.bp != s.bp );
				let num_scrapped = num_before - f.ships.length;
				if ( num_scrapped ) {
					this.app.game.myciv.resources.cash += num_scrapped * 0.1 * this.bp.mass; // or whatever
					if ( !f.ships.length ) { f.Kill(); }
					}
				});
			}
		// delete from build queues
		if ( this.scrap_remove_from_queues ) { 
			this.app.game.myciv.planets.forEach( p => { 
				p.prod_q = p.prod_q.filter( i => i.type!='ship' || i.obj.bp != this.bp );
				});
			}
		// remove from available blueprints
		this.bps.splice(
			this.bps.indexOf( this.bp ),
			1 );
		this.bp = null;
		// hilite next ship
		if ( this.bps.length ) {
	 		this.bp = this.bps[0];
	 		}
		this.newbp = null;
		this.mode = null;
		this.subpanel = null;
		this.scrap_remove_from_queues = false;
		this.scrap_delete_all = false;
		}
		
	SelectShipImg( img ) { 
		this.newbp.img = img;
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
