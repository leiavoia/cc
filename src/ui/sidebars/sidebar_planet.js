import {Ship,ShipBlueprint} from '../../classes/Ship';
import {GroundUnit,GroundUnitBlueprint} from '../../classes/GroundUnit';
import * as Signals from '../../util/signals';

export class PlanetDetailPane {

	constructor() { 
		this.playerHasLocalFleet = false;
		this.build_queue_items = [];
		}
		
	activate(data) {
		this.app = data.app;
		this.planet = data.obj;
		this.planetChanged( this.planet );
		this.sel_build_item = null;
		this.turn_subscription = Signals.Listen('turn', data => this.planetChanged() );
		this.sel_zone = null;
		this.show_add_zone_panel = false;
		this.zone_to_add = null;
		}
		
	unbind() { 	
		this.turn_subscription.dispose();
		}

	prod_q_repeat_vals = [
		{ value: -1, name: '∞'},
		{ value: 1, name: '1x'},
		{ value: 2, name: '2x'},
		{ value: 3, name: '3x'},
		{ value: 4, name: '4x'},
		{ value: 5, name: '5x'},
		];
		
	// update some calculated values whenever planet changes
	planetChanged( planet ) { 
		if ( !planet ) { planet = this.planet; }			
		// NOTE 1: Numbers displayed are from the point of view of the
		// race of the player, NOT the owner of the planet
		// NOTE 2: Aurelia has race conditions with switching dynamic 
		// elements (the sidebar) and binding its data. 
		// Sniff the "planet" to make sure it really is such.
		if ( planet && 'size' in planet ) { 
			this.habitat = planet.Adaptation( this.app.game.myciv.race );
			this.habitable = planet.Habitable( this.app.game.myciv.race );
			this.habitat_bonus = planet.HabitationBonus( this.app.game.myciv.race );
			this.playerHasLocalFleet = planet.star.PlayerHasLocalFleet;
			this.CompileBuildQueueItemList();
			}
		}
		
	CompileBuildQueueItemList() {
		if ( !this.planet.owner || !this.planet.owner.is_player ) { return; }
		this.build_queue_items.splice(0,this.build_queue_items.length);
		let turns = 1;
		let output = 0;
		for ( let bp of this.planet.owner.ship_blueprints ) { 
			let maxpct = 1;
			for ( let k in bp.cost ) {
				output = ( k == 'labor' ) ? this.planet.output_rec.ship : this.planet.owner.resources[k];
				maxpct = Math.min( maxpct, 1, output / bp.cost[k] );
				}
			turns = Math.max( 0, Math.min( 999, Math.ceil(1/maxpct) ) );
			// TODO: size constraint;
			this.build_queue_items.push( { bp, turns } );
			}
		for ( let bp of this.planet.owner.groundunit_blueprints ) { 
			let maxpct = 1;
			for ( let k in bp.cost ) {
				let output = ( k == 'labor' ) ? this.planet.output_rec.def : this.planet.owner.resources[k];
				maxpct = Math.min( maxpct, 1, output / bp.cost[k] );
				// TODO: size constraint;
				}
			turns = Math.max( 0, Math.min( 999, Math.ceil(1/maxpct) ) );
			this.build_queue_items.push( { bp, turns } );
			}
		for ( let bp of this.planet.ListMakeworkProjects() ) { 
			let maxpct = 1;
			for ( let k in bp.cost ) {
				let output = ( k == 'labor' ) ? (this.planet.output_rec.ship + this.planet.output_rec.def) : this.planet.owner.resources[k];
				maxpct = Math.min( maxpct, 1, output / bp.cost[k] );
				}
			turns = Math.max( 0, Math.min( 999, Math.ceil(1/maxpct) ) );
			this.build_queue_items.push( { bp, turns } );
			}	
		}
		
	PressNextPlanetButton() { 
		let planets = this.planet.star.planets;
		let i = 0;
		// find me in the array
		for ( var my_index=0; my_index < planets.length; my_index++ ) {
			if ( planets[my_index].id == this.planet.id ) { break; }
			}
		// find the next planet
		if ( my_index + 1 < planets.length ) { i = my_index + 1; }
		// first in the list
		else if ( my_index > 0 ) { i = 0; }
		this.app.SwitchSideBar( planets[i] );
		if ( this.app.main_panel_mode == "planetinfo" ) { 
			this.app.SwitchMainPanel( "planetinfo", planets[i] );
			}		
		}

	PressPrevPlanetButton() { 
		let planets = this.planet.star.planets;
		let i = 0;
		// find me in the array
		for ( var my_index=0; my_index < planets.length; my_index++ ) {
			if ( planets[my_index].id == this.planet.id ) { break; }
			}
		// find the prev planet
		if ( my_index - 1 >= 0 ) { i = my_index - 1; }
		// last in the list
		else if ( planets.length - 1 > 0 ) { i = planets.length - 1; }
		this.app.SwitchSideBar( planets[i] );
		if ( this.app.main_panel_mode == "planetinfo" ) { 
			this.app.SwitchMainPanel( "planetinfo", planets[i] );
			}
		}

	PressStarButton() { 
		this.app.SwitchSideBar( this.planet.star );
		this.app.CloseMainPanel();
		}
		
	OpenDetailsPane() { 
		this.app.SwitchMainPanel( 'planetinfo', this.planet );
		}
		
	ToggleStagingPoint() { 
		this.planet.owner.AI_ToggleStagingPoint( this.planet.star );
		}
		
	ClickZone(z,sticky) {
		if ( this.sel_zone == z ) { 
			this.sel_zone = null;
			}
		else {
			this.sel_zone = z;
			}
		this.show_add_zone_panel = false;
		}
	ClearSelectedZone( match=null ) {
		if ( !match || match == this.sel_zone ) { 
			this.sel_zone = null;	
			}
		}	
	ClickEmptyZone() { 
		this.sel_zone = null;
		this.show_add_zone_panel = !this.show_add_zone_panel;
		this.zone_to_add = this.planet.owner.avail_zones[0];
		}
	AddZone() {
		if ( this.zone_to_add ) { 
			this.planet.AddZone( this.zone_to_add.key ); 
			}
		}
	RemoveZone() {
		if ( this.sel_zone ) { 
			this.planet.RemoveZone( this.sel_zone ); 
			this.sel_zone = null;
			}
		}
	BuildQueueMoveItemUp( index ) {
		// tech note: aurelia doesn't recognize that anything changed if you 
		// use the old fashioned "swap from temp" technique
		this.planet.prod_q.splice( index-1, 0,
			this.planet.prod_q.splice( index, 1 )[0]
			);
		}
	BuildQueueMoveItemDown( index ) {
		// tech note: aurelia doesn't recognize that anything changed if you 
		// use the old fashioned "swap from temp" technique
		this.planet.prod_q.splice( index+1, 0,
			this.planet.prod_q.splice( index, 1 )[0]
			);		
		}
	BuildQueueRemoveItem( index ) {
		this.planet.prod_q.splice( index, 1 );
		}
	AddSelectedItemToBuildQueue() { 
		// ships
		if ( this.sel_build_item.bp instanceof ShipBlueprint ) {
			this.planet.AddBuildQueueShipBlueprint( this.sel_build_item.bp );
			}
		else if ( this.sel_build_item.bp instanceof GroundUnitBlueprint ) {
			this.planet.AddBuildQueueGroundUnitBlueprint( this.sel_build_item.bp );
			}
		else if ( typeof(this.sel_build_item.bp) == 'object' && 'type' in this.sel_build_item.bp ) { 
			this.planet.AddBuildQueueMakeworkProject( this.sel_build_item.bp.type );
			}
		}
	// for clicking attack planet with a local player fleet
	AttackTargetWithLocalFleet() { 
		if ( !this.planet.settled || this.planet.owner.is_player || !this.planet.star.PlayerHasLocalFleet ) { return false; } 
		// TODO: check if we have treaties, etc. in the future
		// find my local fleet
		let myfleet = null;
		for ( let f of this.planet.star.fleets ) { 
			if ( f.owner.is_player ) {
				myfleet = f; 
				break;
				}
			}
		if ( !myfleet ) { return false; } 	
		// now figure out if we can attack the planet directly 
		// or if we have to battle a fleet as well
		let enemy_fleet = null;
		for ( let f of this.planet.star.fleets ) { 
			if ( f.owner == this.planet.owner ) {
				enemy_fleet = f; 
				break;
				}
			}	
		// Design note: if we check for enemy fleet remaining firepower,
		// that would let a ground invasion fleet bypass the defending fleet
		// by simply occupying them until they run out of guns to shoot with.
		// This is realistic, but leads to gamey circumvention we dont want.
		// Defending fleet must be completely annihilated.
		if ( enemy_fleet /*&& enemy_fleet.fp_remaining*/ ) {
			// our fleet needs something to fight with
			if ( !myfleet.fp_remaining ) {
				this.app.ShowDialog( 'No Firepower Remaining', 'There is a defending fleet and we have nothing to fight them with. Weapons reload at the start of each turn.' );
				return false;
				}			
			else { 
				this.app.game.QueueShipCombat( myfleet, enemy_fleet, this.planet );
				this.app.game.ProcessUIQueue();
				}
			}
		else {
			this.app.game.QueueGroundCombat( myfleet, this.planet );
			this.app.game.ProcessUIQueue();
			}
		}		
	}
