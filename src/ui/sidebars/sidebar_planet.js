import {Ship,ShipBlueprint} from '../../classes/Ship';
import {GroundUnit,GroundUnitBlueprint} from '../../classes/GroundUnit';
import * as Signals from '../../util/signals';

export class PlanetDetailPane {

	constructor() { 
		this.local_fleet = null;
		this.turn_subscription = Signals.Listen('turn', data => this.planetChanged() );
		}
		
	activate(data) {
		this.app = data.app;
		this.planet = data.obj;
		this.planetChanged( this.planet );
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
		this.build_queue_items = [];
		this.local_fleet = null;
		this.ground_units = this.planet.ListUniqueGroundUnits(); // Map		
		// NOTE 1: Numbers displayed are from the point of view of the
		// race of the player, NOT the owner of the planet
		// NOTE 2: Aurelia has race conditions with switching dynamic 
		// elements (the sidebar) and binding its data. 
		// Sniff the "planet" to make sure it really is such.
		if ( planet && 'size' in planet ) { 
			this.adaptation = planet.Adaptation( this.app.game.myciv.race );
			this.habitable = planet.Habitable( this.app.game.myciv.race );
			this.local_fleet = planet.star.FleetFor( this.app.game.myciv );
			this.CompileBuildQueueItemList();
			this.ground_units = planet.ListUniqueGroundUnits(); // Map
			// if a zone was selected for viewing, make sure still exists
			if ( this.sel_zone ) { 
				if ( !planet.zones.contains(this.sel_zone) ) {
					this.sel_zone = null;
					}
				else {
					this.CheckIfSelectedZoneHasUpgrades();
					}
				}
			}
		else {
			this.sel_build_item = null;
			this.sel_zone = null;
			this.sel_zone_upgrade_avail = false;
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
		let i = planets.indexOf(this.planet) + 1;
		if ( i >= planets.length ) { i = 0; }
		this.app.SwitchSideBar( planets[i] );
		if ( this.app.main_panel_mode == "planetinfo" ) { 
			this.app.SwitchMainPanel( "planetinfo", planets[i] );
			}		
		}

	PressPrevPlanetButton() { 
		let planets = this.planet.star.planets;
		let i = planets.indexOf(this.planet) - 1;
		if ( i < 0 ) { i = planets.length-1; }
		this.app.SwitchSideBar( planets[i] );
		if ( this.app.main_panel_mode == "planetinfo" ) { 
			this.app.SwitchMainPanel( "planetinfo", planets[i] );
			}
		}
		
	PressLocalFleetButton() { 
		if ( this.local_fleet ) { 
			this.app.SwitchSideBar( this.local_fleet );
			this.app.CloseMainPanel();
			}
		}
		
	PressStarButton() { 
		this.app.SwitchSideBar( this.planet.star );
		this.app.CloseMainPanel();
		}
		
	OpenDetailsPane() { 
		this.app.SwitchMainPanel( 'planetinfo', this.planet, null, false, false );
		}
		
	OpenZonePane( z = null ) { 
		this.app.SwitchMainPanel( 'zone', this.planet, {zone:z}, false, false);
		}
		
	CheckIfSelectedZoneHasUpgrades() {
		if ( this.sel_zone.perma ) { 
			this.sel_zone_upgrade_avail = false;
			return;
			}
		this.sel_zone_upgrade_avail = this.app.game.myciv.avail_zones.filter( z => 
			z.type == this.sel_zone.type 
			&& z.key != this.sel_zone.key 
			&& z.minsect <= this.sel_zone.sect
			).length > 0;
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
			this.CheckIfSelectedZoneHasUpgrades();
			}
		this.app.CloseMainPanel();
		}
	ClearSelectedZone( match=null ) {
		if ( !match || match == this.sel_zone ) { 
			this.sel_zone = null;	
			}
		}	
	ClickEmptyZone() {
		this.app.CloseMainPanel();
		this.OpenZonePane();
		this.sel_zone = null;
		}
	TrimZone() {
		if ( this.sel_zone ) { 
			let i = this.planet.zones.indexOf( this.sel_zone );
			this.planet.TrimZone( this.sel_zone ); 
			if ( !this.sel_zone.sect ) {
				// move to next zone
				if ( i >= 0 && this.planet.zones.length ) {
					if ( i === this.planet.zones.length ) { i--; }
					this.sel_zone = this.planet.zones[i];
					}
				else {	
					this.sel_zone = null;
					}
				}
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
	ColonizePlanet() {
		if ( !this.planet || this.planet.settled || this.planet.owner || !this.local_fleet
			|| !this.planet.Habitable(this.local_fleet.owner.race) ) { return false; }
		let ship = this.local_fleet.ships.find( s => s.bp.colonize );
		if ( ship ) { 
			this.planet.Settle( this.local_fleet.owner );
			this.local_fleet.RemoveShip( ship );
			if ( !this.local_fleet.ships.length ) { 
				this.local_fleet.Kill();
				}
			else {
				this.local_fleet.FireOnUpdate();
				}
			this.app.CloseSideBar();
			this.app.SwitchMainPanel('colonize',this.planet);
			}		
		}
	// for clicking attack planet with a local player fleet
	AttackTargetWithLocalFleet() { 
		if ( !this.planet.settled || this.planet.owner.is_player || !this.local_fleet || !this.local_fleet.fp_remaining ) { return false; }
		// do this no matter what
		let cb = () => {	
			// figure out if we can attack the planet directly 
			// or if we have to battle a fleet as well
			let enemy_fleet = this.planet.OwnerFleet();
			// Design note: if we check for enemy fleet remaining firepower,
			// that would let a ground invasion fleet bypass the defending fleet
			// by simply occupying them until they run out of guns to shoot with.
			// This is realistic, but leads to gamey circumvention we dont want.
			// Defending fleet must be completely annihilated.
			if ( enemy_fleet && enemy_fleet.fp /*&& enemy_fleet.fp_remaining*/ ) {		
				this.app.game.QueueShipCombat( this.local_fleet, enemy_fleet, this.planet );
				}
			else { this.app.game.QueueGroundCombat( this.local_fleet, this.planet ); }
			this.app.game.ProcessUIQueue();
			};
		// check treaties and warn player
		const contact = this.local_fleet.owner.diplo.contacts.get(this.planet.owner);
		let warn = !this.planet.owner.race.is_monster && contact && !contact.treaties.has('WAR');
		if ( warn ) {
			this.app.ShowDialog(
				`Attack ${this.planet.owner.name}?`,
				`<p>Attacking the ${this.planet.owner.name} may cause a diplomatic kerfuffle. Are you sure?</p>`,
				[ { text: "Attack!", class: "alt", cb: cb }, { text: "Never Mind...", class: "bad", cb: null }, ]
				);			
			}
		else { cb(); }
		}		
	}
