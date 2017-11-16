import Fleet from '../../classes/Fleet';
import {bindable} from 'aurelia-framework';

export class FleetDetailPane {
	mode = 'fleet';
	can_colonize = false;
	can_send = false;
	star_select_mode = false;
	
	@bindable fleet = null;
	app = null;

	activate(data) {
		this.app = data.app;
		this.fleet = data.obj;
		// manually trigger our binding function because
		// this element is normally built through <compose>
		this.fleetChanged( this.fleet, null );
		}
		
	constructor() { 
		this.mode = 'fleet';
		this.can_colonize = false;
		};
		
	// aurelia automatic function called when fleet object gets changed
	fleetChanged( new_fleet, old_fleet ) {
		if ( new_fleet instanceof Fleet ) { 
			new_fleet.SetOnUpdate( () => this.UpdateStats() );
			this.UpdateStats();
			}
		if ( old_fleet instanceof Fleet ) { 
			old_fleet.SetOnUpdate(null);
			}
		this.star_select_mode = false;
		this.mode = 'fleet';
		}
	PlanetSizeCSS( planet ) {
		let size = Math.round(planet.size * 0.572);
		if ( planet.size < 130 ) {
			let pos = 35 - (size * 0.5);
			return `background-size: ${size}px; background-position: ${pos}px 0%`;
			}
		else {
			let pos = 0; //75 - size;
			return `background-size: ${size}px; background-position: ${pos}px 0%`;
			}
		}		
	UpdateStats() { 
		// fleet will have killme flag if it needs to be treated as deleted
		if ( this.fleet.merged_with instanceof Fleet ) { 
			this.app.SwitchSideBar( this.fleet.merged_with );
			}
		else if ( this.fleet.killme == true ) { 
			this.mode = 'fleet';
			this.app.CloseSideBar();
			}
		else {
			this.UpdateCanColonize();
			this.can_send = this.fleet.star && this.AtLeastOneShipSelected();
			// TODO: speed, strength, etc
			}
		}
	SelectShip(ship) {
		ship.selected = ship.selected ? false : true;
		this.can_send = this.fleet.star && this.AtLeastOneShipSelected();
		}
	GetHealthClass(ship) {
		let pct = ship.hp / ship.maxhp;
		if ( pct >= 0.7 ) { return 'h'; }
		else if ( pct >= 0.35 ) { return 'm'; }
		else { return 'l'; }
		}
	SelectAll() { 
		for ( let ship of this.fleet.ships ) { 
			ship.selected = true;
			}
		this.can_send = true;
		}
	SelectNone() { 
		for ( let ship of this.fleet.ships ) { 
			ship.selected = false;
			}
		this.can_send = false;
		}
	SelectInvert() { 
		for ( let ship of this.fleet.ships ) { 
			ship.selected = ship.selected ? false : true;
			}
		this.can_send = this.fleet.star && this.AtLeastOneShipSelected();
		}
	AtLeastOneShipSelected() {
		for ( let ship of this.fleet.ships ) { 
			if ( ship.selected ) { 
				return true;
				}
			}
		return false;
		}
	ClickSend() {
		// first check if there is anything to send
		if ( this.AtLeastOneShipSelected() ) {
			this.app.RegisterStarClickCallback( (star) => this.StarClickCallback(star) );
			this.star_select_mode = true;
			}
		}
	GetFirstColonyShip() {
		// we want either the first colony ship that is selected
		// or the first colony ship if there or no selections at all.
		let selected = null;
		let first = null;
		if ( this.fleet && this.fleet.ships.length ) { 
			for ( let ship of this.fleet.ships ) { 
				if ( ship.colonize ) { 
					if ( !first ) { first = ship; }
					if ( ship.selected && !selected ) { selected = ship; }
					}
				if ( selected && first ) { break; } 
				}
			}
		return selected || first;
		}
	ChoosePlanetToColonize( p ) { 
		let ship = this.GetFirstColonyShip();
		if ( ship ) { 
			p.Settle( this.app.game.MyCiv() );
			// [!]OPTIMIZE: we only need to do this:
			// - if we dont already have a planet in this system
			// - only for our own civ, not all of them
// 			this.app.RecalcCivContactRange();
// 			this.app.RecalcStarRanges();
			
			this.fleet.RemoveShip( ship );
			if ( !this.fleet.ships.length ) { 
				this.fleet.Kill();
				}
			else {
				this.fleet.FireOnUpdate();
				}
			this.mode = 'fleet';
			this.app.CloseSideBar();
			this.app.SwitchMainPanel('colonize',p);
			}
		//
		// TODO: destroy all refs to the ship
		//
		}
	UpdateCanColonize() { 
		this.can_colonize = false;
		this.fleet.colonize = this.GetFirstColonyShip() ? true : false;
		if ( this.fleet.star && this.fleet.star.planets.length && this.fleet.colonize ) {
			for ( let p of this.fleet.star.planets ) { 
				if ( p.owner === false ) { 
					this.can_colonize = true; 
					}
				}
			}
		}
	ClickColonize() {
		if ( this.can_colonize ) { 
			this.mode = 'colonize';
			}
		}
	ClickCancelChoosePlanet() {
		this.mode = 'fleet';
		}
	ClickScrap() {
		// first check if there is anything to scrap
		if ( this.AtLeastOneShipSelected() ) {
			// TODO
			}
		// tell them nothing to scrap
		else {
			// TODO
			}
		}
	ClickSendCancel() {
		this.app.RegisterStarClickCallback( null );
		this.star_select_mode = false;
		}
	StarClickCallback( star ) { 
		this.star_select_mode = false;
		// if we are sending all ships, just move the entire fleet.
		// otherwise we have to split the fleet.
		let total_ships = this.fleet.ships.length;
		let ships_leaving = [];
		for ( let i=total_ships-1; i >= 0; i-- ) {
			if ( this.fleet.ships[i].selected ) { 
				this.fleet.ships[i].selected = false;
				// tech note: using unshift instead of push maintains order
				ships_leaving.unshift( this.fleet.ships.splice( i, 1 )[0] );
				}
			}
		if ( ships_leaving.length ) { 
			if ( ships_leaving.length == total_ships ) { 
				this.fleet.ships = ships_leaving;
				this.fleet.SetDest( star );
				this.app.SwitchSideBar( this.fleet );
				}
			else {
				let f = new Fleet( this.fleet.owner, this.fleet.star );
				f.ships = ships_leaving;
				f.SetDest( star );
				f.ReevaluateStats();
				this.app.SwitchSideBar( f );
				}
			this.can_colonize = false;
			}
		this.fleet.FireOnUpdate();
		}
	}
