import Fleet from '../../classes/Fleet';
import {bindable} from 'aurelia-framework';

export class FleetDetailPane {
	mode = 'fleet';
	can_colonize = false;
	can_send = false;
	can_bomb = false;
	can_research = false;
	can_invade = false;
	mission_turns = 10;
	
	@bindable fleet = null;
	app = null;

	activate(data) {
		this.app = data.app;
		this.fleet = data.obj;
		// manually trigger our binding function because
		// this element is normally built through <compose>
		this.fleetChanged( this.fleet, null );
		}
		
	unbind() { 
		// stop leaking callbacks
		this.app.RegisterStarClickCallback(null);
		}
		
	constructor() { 
		};
		
	// aurelia automatic function called when fleet object gets changed
	fleetChanged( new_fleet, old_fleet ) {
		if ( new_fleet instanceof Fleet ) { 
			new_fleet.SetOnUpdate( () => this.UpdateStats() );
			this.SelectAll(); 
			this.UpdateStats();
			}
		if ( old_fleet instanceof Fleet ) { 
			old_fleet.SetOnUpdate(null);
			}
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
			this.Recalc();
			// TODO: speed, strength, etc
			}
		}
	SelectShip(ship) {
		ship.selected = !ship.selected;
		this.Recalc();
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
		this.Recalc();
		}
	SelectNone() { 
		for ( let ship of this.fleet.ships ) { 
			ship.selected = false;
			}
		this.Recalc();
		}
	SelectInvert() { 
		for ( let ship of this.fleet.ships ) { 
			ship.selected = ship.selected ? false : true;
			}
		this.Recalc();
		}
	ClickSend() {
		if ( this.can_send==2 ) {
			this.app.RegisterStarClickCallback( (star) => this.StarClickCallback(star) );
			this.mode = 'awaiting_star_click';
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
	Recalc() { 
		// for each stat, distinguish between ability of the
		// fleet as a whole (1) or the specific selection (2)
		// or no ability at all (0)
		this.num_selected = 0;
		this.can_colonize = false;
		this.can_bomb = false;
		this.can_invade = false;
		this.can_research = this.fleet.star ? 0 : false; // is parked
		this.can_send = this.fleet.star ? 1 : false; // is parked
		// some abilities depend on what we might be parked over.
		// mark abilites with ===0 as a signal to look further
		if ( this.fleet.star && 'planets' in this.fleet.star && this.fleet.star.planets.length ) {
			for ( let p of this.fleet.star.planets ) { 
				if ( p.owner === false && p.Habitable( this.fleet.owner.race ) ) { 
					this.can_colonize = 0; 
					}
				else if ( p.owner != this.fleet.owner.race ) { 
					this.can_bomb = 0; 
					this.can_invade = 0; 
					}
				}
			}
		for ( let s of this.fleet.ships ) { 
			if ( this.can_send !== false && this.can_send < 2 ) 				{ 
				this.can_send = Math.max( this.can_send, (s.selected ? 2 : 1) ); 
				}
			if ( this.can_colonize !== false && this.can_colonize < 2 && s.colonize )	{ 
				this.can_colonize = Math.max( this.can_colonize, (s.selected ? 2 : 1) ); 
				}
			if ( this.can_bomb !== false && this.can_bomb < 2 && s.bomb_pow )		{ 
				this.can_bomb = Math.max( this.can_bomb, (s.selected ? 2 : 1) ); 
				}
			if ( this.can_research !== false && this.can_research < 2 && s.research )	{ 
				this.can_research = Math.max( this.can_research, (s.selected ? 2 : 1) ); 
				}
			if ( this.can_invade !== false && this.can_invade < 2 && s.invade )		{ 
				this.can_invade = Math.max( this.can_invade, (s.selected ? 2 : 1) ); 
				}
			if ( s.selected ) { this.num_selected++; }
			}
		}
	AnomalyResearch() { 
		if ( this.fleet.star && !this.fleet.dest && this.fleet.star.objtype == 'anom' ) { 
			return this.fleet.star.AmountResearched( this.fleet.owner ) / this.fleet.star.size;
			}
		return 0;
		}
	ClickColonize() {
		if ( this.can_colonize==2 ) { 
			this.mode = 'colonize';
			}
		}
	ClickChooseMission() {
		if ( this.can_research==2 ) { 
			this.mission_turns = 10;
			this.mode = 'mission';
			}
		}
	ClickStartMission() {
		if ( this.mode == 'mission' ) { 
			// if we are sending all ships, just move the entire fleet.
			// otherwise we have to split the fleet.
			let total_ships = this.fleet.ships.length;
			let ships_leaving = [];
			for ( let i=total_ships-1; i >= 0; i-- ) {
				if ( this.fleet.ships[i].selected ) { 
					//this.fleet.ships[i].selected = false;
					// tech note: using unshift instead of push maintains order
					ships_leaving.unshift( this.fleet.ships.splice( i, 1 )[0] );
					}
				}
			if ( ships_leaving.length ) { 
				// send the entire fleet
				if ( ships_leaving.length == total_ships ) { 
					this.fleet.ships = ships_leaving;
					this.app.SwitchSideBar( this.fleet.star );
					this.fleet.SendOnMission( this.app.game.galaxy, this.mission_turns );
					}
				// send a splinter fleet
				else {
					let f = new Fleet( this.fleet.owner, this.fleet.star );
					f.ships = ships_leaving;
					f.ReevaluateStats();
					this.app.SwitchSideBar( this.fleet.star );
					f.SendOnMission( this.app.game.galaxy, this.mission_turns );
					}
				this.Recalc();
				}
			this.fleet.FireOnUpdate();
			}
		this.mode = 'fleet';
		}
	ClickCancel() {
		this.mode = 'fleet';
		this.app.RegisterStarClickCallback( null );
		}
	ClickScrap() {
		// first check if there is anything to scrap
		if ( this.num_selected ) {
			// TODO
			}
		// tell them nothing to scrap
		else {
			// TODO
			}
		}
	StarClickCallback( star ) { 
		if ( this.mode == 'awaiting_star_click' ) { 
			// if we are sending all ships, just move the entire fleet.
			// otherwise we have to split the fleet.
			let total_ships = this.fleet.ships.length;
			let ships_leaving = [];
			for ( let i=total_ships-1; i >= 0; i-- ) {
				if ( this.fleet.ships[i].selected ) { 
					//this.fleet.ships[i].selected = false;
					// tech note: using unshift instead of push maintains order
					ships_leaving.unshift( this.fleet.ships.splice( i, 1 )[0] );
					}
				}
			if ( ships_leaving.length ) { 
				// send the entire fleet
				if ( ships_leaving.length == total_ships ) { 
					this.fleet.ships = ships_leaving;
					this.fleet.SetDest( star );
					this.app.SwitchSideBar( this.fleet );
					}
				// send a splinter fleet
				else {
					let f = new Fleet( this.fleet.owner, this.fleet.star );
					f.ships = ships_leaving;
					f.SetDest( star );
					f.ReevaluateStats();
					this.app.SwitchSideBar( f );
					}
				this.Recalc();
				}
			this.fleet.FireOnUpdate();
			}
		this.mode = 'fleet';
		}
	}
