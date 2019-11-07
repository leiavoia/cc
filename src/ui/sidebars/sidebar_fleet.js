import Fleet from '../../classes/Fleet';
import {bindable} from 'aurelia-framework';
import * as Signals from '../../util/signals';

export class FleetDetailPane {
	mode = 'fleet'; // fleet, mission, attack, troopswap, colonize, invade
	can_colonize = false;
	can_send = false;
	can_bomb = false;
	can_research = false;
	can_invade = false;
	can_pickup_troops = false;
	mission_turns = 10;
	selected_planet = null; // used for UI interaction
	starclick_subsc = null;
	waiting_for_starclick = false; // usually for move orders
	turn_subscription = null;
	playerHasLocalFleet = false;
	ship_grid_packing = 1; // controls density of ships on UI. [1,2,4,9,16,25,36]
	show_defenses = false;
	@bindable fleet = null;
	app = null;

	trooplist = []; // temporary array when in troop-transfer UI
	
	activate(data) {
		this.app = data.app;
		this.fleet = data.obj;
		// manually trigger our binding function because
		// this element is normally built through <compose>
		this.fleetChanged( this.fleet, null );
		// listen for hotkeys
		window.addEventListener('keypress', this.keypressCallback, false);
		// listen for star clicks from the map
		if ( !this.starclick_subsc ) { 
			this.starclick_subsc = Signals.Listen('starclick', 
				info => { 
					if ( info.event.which > 1 || this.waiting_for_starclick ) { 
						this.StarClickCallback(info.star);
						}
					}
				);
			}
		if ( !this.turn_subscription ) { 
			this.turn_subscription = Signals.Listen( 'turn', info => this.UpdateStats() );
			}
		}
		
	unbind() { 	
		if ( this.fleet ) { this.fleet.SetOnUpdate(null); }
		// stop listening for starclicks
		this.starclick_subsc.dispose();
		this.turn_subscription.dispose();
		// stop listening for hotkeys
		window.removeEventListener('keypress', this.keypressCallback);
		this.app.options.show_range = false; // turn off indicator
		}
				
	constructor() { 
		this.keypressCallback = (e) => this.KeyPress(e);
		};
		
	CaptureStarClicks() { 
		this.mode = 'fleet';
		this.IndicateRange();
		}
	StopCaptureStarClicks() { 
		this.IndicateRange();
		}
		
	IndicateRange() {
		let on = false;
		if ( this.mode == 'fleet' && this.can_send==2 
			&& !( !this.fleet.star && this.fleet.dest ) ) {
			on = true;
			}
		this.app.options.show_range = on;
		}
		 
	// aurelia automatic function called when fleet object gets changed
	fleetChanged( new_fleet, old_fleet ) {
		if ( new_fleet instanceof Fleet ) { 
			new_fleet.SetOnUpdate( () => this.UpdateStats() );
			if ( new_fleet.owner.is_player ) { 
				this.SelectAll(); 
				}
			else {
				this.SelectNone(); 
				}
			this.UpdateStats();
			}
		if ( old_fleet instanceof Fleet ) { 
			old_fleet.SetOnUpdate(null);
			}
		// assume we start in move-fleet mode to save clicks, unless we are en route
		if ( this.fleet.dest && !this.fleet.star ) {
			this.mode = 'fleet';
			}
		else {
			this.CaptureStarClicks();
			}
		this.IndicateRange();
		}
	PlanetSizeCSS( planet ) {
		let size = Math.min( 75, Math.round( Math.pow(planet.size-3,0.45)*16 ) );
		let pos = Math.max( 0, 35 - (size * 0.5) );
		return `background-size: ${size}px; background-position: ${pos}px 0%`;
		}		
	UpdateStats() { 
		// if fleet merged into another fleet, change focus to receiving fleet
		if ( this.fleet.merged_with instanceof Fleet ) { 
			this.fleet.SetOnUpdate(null);
			this.app.SwitchSideBar( this.fleet.merged_with );
			}
		// fleet will have killme flag if it needs to be treated as deleted
		else if ( this.fleet.killme === true ) { 
			this.fleet.SetOnUpdate(null);
			this.app.CloseSideBar();
			this.app.options.show_range = false;
			}
		else {
			this.Recalc();
			}
		}
	SelectShip(ship) {
		if ( this.fleet.owner.is_player ) { 
			ship.selected = !ship.selected;
			this.Recalc();
			this.IndicateRange();
			}
		}
	GetHealthClass(ship) {
		let pct = ship.hull / ship.bp.hull;
		if ( pct >= 0.7 ) { return 'h'; }
		else if ( pct >= 0.35 ) { return 'm'; }
		else { return 'l'; }
		}
	SelectAll() { 
		for ( let ship of this.fleet.ships ) { 
			ship.selected = true;
			}
		this.Recalc();
		this.IndicateRange();
		}
	SelectNone() { 
		for ( let ship of this.fleet.ships ) { 
			ship.selected = false;
			}
		this.Recalc();
		this.IndicateRange();
		}
	SelectInvert() { 
		for ( let ship of this.fleet.ships ) { 
			ship.selected = ship.selected ? false : true;
			}
		this.Recalc();
		this.IndicateRange();
		}
	GetFirstColonyShip() {
		// we want either the first colony ship that is selected
		// or the first colony ship if there or no selections at all.
		let selected = null;
		let first = null;
		if ( this.fleet && this.fleet.ships.length ) { 
			for ( let ship of this.fleet.ships ) { 
				if ( ship.bp.colonize ) { 
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
			p.Settle( this.app.game.myciv );
			this.fleet.RemoveShip( ship );
			if ( !this.fleet.ships.length ) { 
				this.fleet.Kill();
				}
			else {
				this.fleet.FireOnUpdate();
				}
			this.app.options.show_range = false;
			this.mode = 'fleet';
			this.app.CloseSideBar();
			this.app.SwitchMainPanel('colonize',p);
			}
		}
	Recalc() { 
		this.playerHasLocalFleet = this.fleet.star && this.fleet.star.PlayerHasLocalFleet;

		// calculate ideal ship packing for UI
		let num_ships = this.fleet.ships.length;
		this.ship_grid_packing = 1;
		while ( num_ships/15 > this.ship_grid_packing * this.ship_grid_packing ) { 
			this.ship_grid_packing++;
			}
		if ( this.ship_grid_packing > 36 ) { this.ship_grid_packing = 6; } // lets be sane	
		this.ship_grid_packing *= this.ship_grid_packing;
		
		// for each stat, distinguish between ability of the
		// fleet as a whole (1) or the specific selection (2)
		// or no ability at all (0)
		this.num_selected = 0;
		this.can_colonize = false;
		this.can_bomb = false;
		this.can_invade = false;
		this.can_research = this.fleet.star ? 0 : false; // is parked
		this.can_send = this.fleet.star ? 1 : false; // is parked
		this.can_pickup_troops = false;
		this.can_drop_troops = false;
		// some abilities depend on what we might be parked over.
		// mark abilites with ===0 as a signal to look further
		if ( this.fleet.star && 'planets' in this.fleet.star && this.fleet.star.planets.length ) {
			for ( let p of this.fleet.star.planets ) { 
				if ( !p.owner && p.Habitable( this.fleet.owner.race ) && !this.fleet.owner.race.is_monster ) { 
					this.can_colonize = 0; 
					}
				else if ( p.owner && !p.owner.is_player ) { 
					this.can_bomb = 0; 
					this.can_invade = 0;
					}
				else if ( p.owner && p.owner.is_player ) {
					this.can_drop_troops = 0;
					if ( p.troops.length ) { 
						this.can_pickup_troops = 0; 
						}
					}
				}
			}
		// scan each ship to make a per-ship determination
		for ( let s of this.fleet.ships ) { 
			if ( this.can_send !== false && this.can_send < 2 ) 				{ 
				this.can_send = Math.max( this.can_send, (s.selected ? 2 : 1) ); 
				}
			if ( this.can_colonize !== false && this.can_colonize < 2 && s.bp.colonize )	{ 
				this.can_colonize = Math.max( this.can_colonize, (s.selected ? 2 : 1) ); 
				}
			if ( this.can_bomb !== false && this.can_bomb < 2 && s.bp.bomb_pow )		{ 
				this.can_bomb = Math.max( this.can_bomb, (s.selected ? 2 : 1) ); 
				}
			if ( this.can_research !== false && this.can_research < 2 && s.bp.research )	{ 
				this.can_research = Math.max( this.can_research, (s.selected ? 2 : 1) ); 
				}
			if ( this.can_invade !== false && this.can_invade < 2 && s.troops.length )		{ 
				this.can_invade = Math.max( this.can_invade, (s.selected ? 2 : 1) ); 
				}
			if ( this.can_drop_troops !== false && this.can_drop_troops < 2 && s.troops.length )		{ 
				this.can_drop_troops = Math.max( this.can_drop_troops, (s.selected ? 2 : 1) ); 
				}
			if ( s.selected ) { this.num_selected++; }
			}
		// finally, see if we have room for troops as a whole
		this.can_pickup_troops = 
			this.can_pickup_troops === 0 
			&& (this.fleet.troops < this.fleet.troopcap) 
			? true : false;
		this.IndicateRange();
		}
	AnomalyResearch() { 
		if ( this.fleet.star && !this.fleet.dest && this.fleet.star.objtype == 'anom' ) { 
			return this.fleet.star.AmountResearched( this.fleet.owner ) / this.fleet.star.size;
			}
		return 0;
		}
	ClickColonize() {
		if ( this.can_colonize==2 ) { 
			this.StopCaptureStarClicks();
			this.mode = 'colonize';
			}
		}
	ClickChooseMission() {
		if ( this.can_research==2 ) { 
			this.mission_turns = 10;
			this.StopCaptureStarClicks();
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
		// dont revert to move-fleet mode. we're done moving this fleet.
		this.mode = 'fleet'; 
		this.StopCaptureStarClicks();
		this.app.CloseSideBar();
		this.app.options.show_range = false;
		}
	ClickClose() {
		this.StopCaptureStarClicks();
		this.app.CloseSideBar();
		this.app.options.show_range = false;
		}
	ClickAttack() {
		if ( this.fleet.fp && this.fleet.star && this.fleet.star.fleets.length > 1 ) {
			this.mode = "attack";
			this.IndicateRange();
			}
		}
	// for clicking attack target from player fleet
	SelectAttackTarget( target ) {
		// TODO: check if we have treaties, etc. in the future
		// Check to see if there is a planet to defend. 
		// It's stupid for a fleet to offer itself in combat if
		// it can hide behind a planet that may assist in combat
		let planet = null;
		for ( let p of this.fleet.star.planets ) {
			if ( target.owner == p.owner ) { 
				planet = p;
				break;
				}
			}
		this.app.game.QueueShipCombat( this.fleet, target, planet );
		this.app.game.ProcessUIQueue();
		}
	ClickCancelChooseAttackTarget() {
		this.mode = 'fleet';
		this.IndicateRange();
		}
	// for clicking attack fleet from star with a local player fleet
	AttackTargetWithLocalFleet() { 
		if ( !this.fleet || !this.fleet.star ) { return false; } 
		// TODO: check if we have treaties, etc. in the future
		// find my local fleet
		let myfleet = null;
		for ( let f of this.fleet.star.fleets ) { 
			if ( f.owner.is_player ) {
				myfleet = f; 
				break;
				}
			}
		if ( !myfleet ) { return false; } 
		// our fleet needs something to fight with
		if ( !myfleet.fp_remaining ) {
			this.app.ShowDialog( 'No Firepower Remaining', 'Weapons reload at the start of each turn.' );
			return false;
			}
		// Check to see if there is a planet to defend. 
		// It's stupid for a fleet to offer itself in combat if
		// it can hide behind a planet that may assist in combat
		let planet = null;
		for ( let p of this.fleet.star.planets ) {
			if ( this.fleet.owner == p.owner ) { 
				planet = p;
				break;
				}
			}		
		this.app.game.QueueShipCombat( myfleet, this.fleet, planet );
		this.app.game.ProcessUIQueue();
		}
	ClickCancel() {
		// revert to move-fleet mode
		this.selected_planet = null;
		this.CaptureStarClicks();
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
	ClickInvade() {
		if ( this.can_invade ) { 
			this.trooplist = this.fleet.ListGroundUnits();
			this.mode = 'invade';
			this.IndicateRange();
			}
		}
	ClickMove() {
		if ( this.can_send==2 ) {
			this.waiting_for_starclick = !this.waiting_for_starclick;
			}
		}
	ClickPlanetToInvade(p) { 
		this.app.game.QueueGroundCombat( this.fleet, p );
		this.app.game.ProcessUIQueue();	
		}
	CalculateChanceOfGroundVictory( p ) { 
		let trooplist = this.fleet.ListGroundUnits();
		let f = ( a, b ) => a + ( b.bp.maxdmg * b.bp.hp );			
		let our_avg = trooplist.length ? (trooplist.reduce( f, 0 ) / trooplist.length) : 0;
		let their_avg = p.troops.length ? (p.troops.reduce( f, 0 ) / p.troops.length) : 0;
		let total = our_avg + their_avg;
		return total ? ( our_avg / total ) : 1; 
		}
		
	// closes the troop transfer subscreen
	ClickAcceptTroopTransfer() { 
		this.mode = 'fleet';
		this.IndicateRange();
		}
	// switches into troop transfer mode
	ClickTransferTroops() {
		if ( this.can_pickup_troops || this.can_drop_troops ) { 
			this.trooplist = this.fleet.ListGroundUnits();
			// automatically select the first friendly planet as a move target,
			// and deselect all other friendly planets
			for ( let p of this.fleet.star.planets ) { 
				if ( p.owner.is_player ) { 
					this.selected_planet = p;
					}
				}
			this.mode = 'troopswap';
			this.IndicateRange();
			}
		}
	// selects a planet
	ClickPlanetForTroops(target) {
		this.selected_planet = target;
		}
	// moves a specific troop
	ClickTroop( troop, objfrom ) { 
		// if `objfrom` is our fleet, move to planet, no size restrictions.
		if ( objfrom == this.fleet ) { 
			// remove unit from ship it rides on.
			for ( let s of this.fleet.ships ) { 
				let i = s.troops.indexOf(troop);
				if ( i >= 0 ) { 
					s.troops.splice(i,1);
					break;
					}
				}
			// remove from UI troop list
			let i = this.trooplist.indexOf(troop);
			if ( i >= 0 ) { this.trooplist.splice(i,1); }
			// move to selected planet
			this.selected_planet.troops.push(troop);
			}
		// if the objfrom is a planet, move into fleet, check capacity first
		else { 
			if ( this.fleet.troopcap > this.fleet.troops ) { 
				// find a ship that can hold this unit
				for ( let s of this.fleet.ships ) { 
					if ( s.bp.troopcap > s.troops.length ) { 
						s.troops.push( troop );
						// remove from planet
						let i = objfrom.troops.indexOf(troop);
						if ( i >= 0 ) { objfrom.troops.splice(i,1); }
						// add to UI troop list
						this.trooplist.push(troop);
						break;
						}
					}
				}
			}
		this.fleet.ReevaluateStats();
		}
	// dumps all troops from a planet into the fleet
	TransferTroopsFromPlanet() {
		while ( this.selected_planet.troops.length && this.fleet.troopcap > this.fleet.troops ) { 
			let t = this.selected_planet.troops[0];
			// find a ship that can hold this unit
			for ( let s of this.fleet.ships ) {
				if ( s.bp.troopcap > s.troops.length ) { 
					s.troops.push( t );
					// remove from planet
					this.selected_planet.troops.shift();
					// add to UI troop list
					this.trooplist.push(t);
					this.fleet.ReevaluateStats();
					}
				}
			}
		}
	// dumps all troops from a fleet onto a planet
	TransferTroopsToPlanet() {
		for ( let s of this.fleet.ships ) {
			if ( s.troops.length ) { 
				while ( s.troops.length ) { 
					this.selected_planet.troops.push(
						s.troops.pop()
						);
					}
				}
			}
		this.trooplist.splice(0,this.trooplist.length);
		this.fleet.ReevaluateStats();
		}
		
	// returns false if no action taken (out of range, self-click, not routable, etc)
	StarClickCallback( star ) { 
		if ( this.mode == 'fleet' && this.can_send==2 ) {
			// let app know we dont want it to change sidepanel
			this.app.starclick_echo = true;
			this.waiting_for_starclick = false;
			// dont let fleet route to the planet its parked at
			if ( !( star == this.fleet.star && !this.fleet.dest ) ) { 
				// check if in range. TODO: possibly indicate to player out of range
				if ( !this.fleet.owner.InRangeOf( star.xpos, star.ypos ) ) { return false; }
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
				return true;
				}
			}
		return false;
		}
		
	KeyPress( event ) { 
		switch ( event.keyCode || event.which ) { 
			case 27: { // escape
				this.app.CloseSideBar();
				this.app.options.show_range = false;
				event.preventDefault(); return false;
				}
			case 105: { // I
				this.SelectInvert();
				this.IndicateRange();
				event.preventDefault(); return false;
				}
			case 97: { // A
				this.SelectAll();
				this.IndicateRange();
				event.preventDefault(); return false;
				}
			case 110: { // N
				this.SelectNone();
				this.IndicateRange();
				event.preventDefault(); return false;
				}
// 			default: { console.log(`${event.which} was pressed`); }
			}
		}
	}
