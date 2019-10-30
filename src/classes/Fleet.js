import * as Signals from '../util/signals';
import {Mod,Modlist} from './Mods';
import * as utils from '../util/utils';

export default class Fleet {
	
	killme = false; // true if the fleet needs to be treated as deleted
	merged_with = null; // if fleet merges into another fleet, set to receiving fleet
	
	id = 0;
	star = null;
	dest = null;
	xpos = 0;
	ypos = 0;
	speed = 50.0;
	colonize = false;
	owner = null; // null indicates unowned. zero can be an index
	in_range = false; // UI hint for visibility - only matters for player perspective
	ships = [];
	research = false;
	fp = 0; // firepower total
	fp_remaining = 0; // firepower remaining
	milval = 0; // AI military value
	bulk = 0; // combined "bodyweight" of all ships
	troopcap = 0; // max capacity
	troops = 0; // current total
	health = 0; // current hit points
	healthmax = 0; // max hit points
	ai = null; // ai objective
	get reserved_milval() { return ( this.ai && 'reserved_milval' in this.ai ) ? this.ai.reserved_milval : 0; }	
	MilvalAvailable() { return ( this.ai && 'reserved_milval' in this.ai ) ? ( this.milval - this.ai.reserved_milval ).clamp(0,null) : this.milval; }	
	
	onUpdate = null; // callback
	SetOnUpdate( callback ) { // function or NULL
		if ( callback instanceof Function || callback === null ) { 
			this.onUpdate = callback;
			}
		}
	FireOnUpdate() { 
		if ( this.onUpdate instanceof Function ) { 
			this.onUpdate( this );
			// no more updates for you 
			if ( this.killme || this.merged_with ) { 
				this.onUpdate = null;
				}
			}		
		}
				
	// also supports 'fromJSON' style data bundle as first arg
	constructor( owner, star ) {
		// data bundle 
		if ( 'owner' in owner ) {
			Object.assign( this, owner );
			}
		// regular constructor
		else {
			this.star = star;	
			this.xpos = star ? star.xpos : 0;
			this.ypos = star ? star.ypos : 0;
			this.id = utils.UUID();
			this.owner = owner;
			this.owner.fleets.push(this);
			Fleet.all_fleets.push( this ); // [!] not sure how this works in save/load scenario
			if ( star ) { star.fleets.push(this); }
			this.mods = new Modlist( this.owner );
			this.ReevaluateStats();
			}
		}

	toJSON() { 
		let obj = Object.assign( {}, this ); 
		obj._classname = 'Fleet';
		obj.star = this.star ? this.star.id : null;
		obj.dest = this.dest ? this.dest.id : null;
		obj.owner = this.owner ? this.owner.id : null;
		obj.merged_with = this.merged_with ? this.merged_with.id : null;
		obj.ships = this.ships.map( x => x.id );	
		obj.mods = this.mods.toJSON();
		obj.ai = null;
		obj.mission = null;
		if ( this.mission ) { 
			obj.mission = Object.assign( {}, this.mission );
			obj.mission.targets = obj.mission.targets.map( x => x.id ); // list of Anoms
			}
		return obj;
		}
		
	Pack( catalog ) { 
		if ( !( this.id in catalog ) ) { 
			catalog[ this.id ] = this.toJSON(); 
			for ( let x of this.ships ) { x.Pack(catalog); }
			}
		}	

	Unpack( catalog ) {
		this.star = this.star ? catalog[this.star] : null;
		this.dest = this.dest ? catalog[this.dest] : null;
		this.owner = catalog[this.owner];
		this.merged_with = catalog[this.merged_with];
		this.ships = this.ships.map( x => catalog[x] );
		this.mods = new Modlist(this.mods);
		this.mods.Unpack(catalog);
		this.mods.parent = this.owner.mods;
		if ( this.mission ) { 
			this.mission.targets = this.mission.targets.map( x => catalog[x] ); // list of Anoms
			}
		// NOTE: AI is hooked back up by CivAI::Unpack()
		}
		
	// use this if ships are added or removed.
	ReevaluateStats() { 
		this.colonize = false;
		this.research = 0;
		this.speed = 1000000;
		this.fp = 0;
		this.fp_remaining = 0;
		this.bulk = 0;
		this.troops = 0;
		this.troopcap = 0;
		this.milval = 0;
		for ( let ship of this.ships ) { 
			// check if there are colony ships
			if ( ship.bp.colonize ) { this.colonize = true; }
			// check if there are research ships
			if ( ship.bp.research ) { this.research += ship.bp.research; }
			// find our lowest speed
			if ( ship.bp.speed < this.speed ) { this.speed = ship.bp.speed; }
			// cumulative firepower and bulk stats
			this.fp += ship.bp.fp;
			this.fp_remaining += ship.CalcFirepowerRemaining();
			this.bulk += ship.bp.hull + ship.bp.armor;
			// troops and carriers
			this.troops += ship.troops.length;
			this.troopcap += ship.bp.troopcap;
			// AI milval level
			this.milval += ship.bp.milval;
			// fleet health
			this.health += ship.hull + ship.armor;
			this.healthmax += ship.bp.hull + ship.bp.armor;
			}
		this.speed = this.mods.Apply( this.speed, 'speed' );
		this.FireOnUpdate();
		}
		
	AddShip(ship) { 
		this.ships.push(ship);
		this.ReevaluateStats();
		}
		
	RemoveShip( ship ) { 
		let i = this.ships.indexOf(ship);
		if ( i > -1 ) { this.ships.splice( i, 1 ); }
		this.ReevaluateStats();
		}
		
	// Creates a new fleet from the array of `ships`.
	// The `ships` array are ships currently in this fleet.
	// `dest` is the star you want to send them to.
	// RETURNS: new fleet.
	Split( ships, dest ) { 
		if ( !ships.length || !this.ships.length ) { return null; }
		if ( this.killme || this.mission || (this.dest && !this.star) ) { return null; }
		if ( ships.length == this.ships.length ) { 
			if ( dest ) { this.SetDest(dest); }
			return this;
			}
		let f = new Fleet( this.owner, this.star );
		for ( let s of ships ) { 
			let i = this.ships.indexOf(s);
			if ( i >= 0 ) { 
				f.ships.push(s);
				this.ships.splice(i,1);
				}
			}
		this.ReevaluateStats();
		f.ReevaluateStats();
		if ( dest ) { f.SetDest(dest); }
		return f;
		}
		
	// Creates a new fleet from a filter callback function.
	// `dest` is the star you want to send them to.
	// RETURNS: new fleet.
	SplitBy( cb, dest ) { 
		let ships = this.ships.filter(cb);
		return this.Split(ships,dest);
		}
		
	ReloadAllShipWeapons() { 
		this.ships.forEach( s => {
			s.weapons.forEach( w => w.shotsleft = w.shots );
			});
		}
		
	RemoveDeadShips() { 
		this.ships = this.ships.filter( ship => ship.hull );
		this.ReevaluateStats();
		}
		
	RemoveDeadTroops() { 
		for ( let s of this.ships ) { 
			s.troops = s.troops.filter( t => t.hp );
			}
		this.ReevaluateStats();
		}
		
	// removes this fleet from all fleet lists,
	// because javascript does not have a formal destructor()
	Kill() {
		if ( this.star ) { 
			let pos = this.star.fleets.indexOf(this);
			if ( pos !== -1 ) { 
				this.star.fleets.splice( pos, 1 );
				}
			}
		this.star = null;
		this.dest = null;
		this.xpos = -1000;
		this.ypos = -1000;
		this.ai = null;
		// signal to other processes to ignore/cleanup 
		// if they still have references to this fleet
		this.killme = true; 
		this.owner.fleets.splice( this.owner.fleets.indexOf(this), 1 );
		Fleet.all_fleets.splice( Fleet.all_fleets.indexOf(this), 1 );
		this.FireOnUpdate();
		this.SetOnUpdate(null);
		}
		
	static KillAll() {
		for ( let i = Fleet.all_fleets.length-1; i >=0; i-- ) { 
			Fleet.all_fleets[i].Kill();	
			}	
		Fleet.all_fleets = [];
		}
		
	// returns true if the fleet moved
	MoveFleet() {
		let moved = false;
		if ( this.dest && !this.mission ) { // don't move fleets on deep space missions 
			moved = true;
			// move the ship closer to goal
			let dist = Math.sqrt( 
				( (this.xpos - this.dest.xpos) * (this.xpos - this.dest.xpos) )
				+ 
				( (this.ypos - this.dest.ypos) * (this.ypos - this.dest.ypos) )
				);
			// for a cleaner look, strip off 75px from each end.
// 			let STRIP_LENGTH = 0;
// 			dist -= STRIP_LENGTH;
			// arrived?
			if ( dist <= this.speed ) { 
				this.star = this.dest;
				this.dest = null;
				this.ParkOnStar();
				}
			else {
				// if leaving our star, unhook
				if ( this.star ) { this.star = null; }
				// scootch forward
				let ratio = dist ? (this.speed / dist) : 0; // catch div by zero
				this.xpos = ((1.0-ratio)*this.xpos) + (ratio*this.dest.xpos);
				this.ypos = ((1.0-ratio)*this.ypos) + (ratio*this.dest.ypos);
				this.UpdateDestLine();
				}
			this.FireOnUpdate();
			}
		return moved;
		}

	// Utility function. Either puts the fleet in orbit or merges with an existing fleet.
	// Returns TRUE if parked, FALSE on merged (signal to kill fleet).
	ParkOnStar() { 
		// check to see if we are merging into an existing fleet
		for ( let f of this.star.fleets )  {
			if ( f != this && f.owner == this.owner ) { 
				f.ships = f.ships.concat( this.ships );
				f.ReevaluateStats();
				this.ships = [];
				this.merged_with = f; // hint for UI
				// AI objectives: decide what to do if we both have objectives
				if ( f.ai && this.ai ) { 
					// if we are arriving at our mission target, we take priority
					if ( this.ai.target && 'star' in this.ai.target && this.ai.target.star == this.star ) {
						f.ai.fleet = null;
						f.ai = null;
						}
					// if the stationed fleet is on guard duty, cancel it.
					else if ( f.ai.type == 'guard' ) { 
						f.ai.fleet = null;
						f.ai = null;
						}
					// default is to kill the objective for this fleet and keep the objective of the stationed fleet.
					else { this.ai.fleet = null; }
					}
				f.ai = f.ai || this.ai;
				if ( f.ai ) { f.ai.fleet = f; }
				this.Kill();
				break;
				}
			}
		// otherwise, call it home.
		if ( !this.merged_with && this.star.fleets.indexOf(this) == -1 ) { 
			this.star.fleets.push( this );
			}
		}
		
	SetDest( dest ) { 
		if ( !dest ) { return; }
		// check to see if we're already there
		if ( this.star && this.dest == this.star || dest == this.star ) { 
			this.dest = null;
			this.xpos = 0;
			this.ypos = 0;
			this.ParkOnStar();		
			}
		else {
			this.dest = dest;
			let STRIP_LENGTH = 0;
			if ( this.star ) { 
				this.xpos = this.star.xpos;
				this.ypos = this.star.ypos;
				// NOTE: the final unhooking code is performed in the Move() function.
				// this means that fleets with both a star and a dest indicates 
				// the fleet is "getting ready to leave" but not yet left. However,
				// the fleet is removed from the planetary fleet list immediately.
				let pos = this.star.fleets.indexOf(this);
				if ( pos !== -1 ) { 
					this.star.fleets.splice( pos, 1 );
					}
				}
			// if you want to offset the ship from the star for visual effect, do so here.
// 			let dist = Math.sqrt( Math.abs( (this.xpos - this.dest.xpos) * (this.ypos - this.dest.ypos) ) );
// 			let ratio = 0 ; // STRIP_LENGTH / dist;
// 			this.xpos = ((1.0-ratio)*this.xpos) + (ratio*this.dest.xpos);
// 			this.ypos = ((1.0-ratio)*this.ypos) + (ratio*this.dest.ypos);	
			this.UpdateDestLine();
			}
		this.FireOnUpdate();
		}
		
	UpdateDestLine() { 
		if ( this.dest ) { 
			this.dest_line_length = Math.sqrt(((this.dest.xpos-this.xpos) * (this.dest.xpos-this.xpos)) + ((this.dest.ypos-this.ypos) * (this.dest.ypos-this.ypos)));
			this.dest_line_angle = Math.atan2((this.dest.ypos-this.ypos),(this.dest.xpos-this.xpos))*(180/Math.PI);		
			}
		}
		
	// returns a Map of [ ShipBlueprint => count ]
	ListUniqueModels() { 
		let data = new Map;
		for ( let s of this.ships ) { 
			let v = data.get(s.bp) || 0;
			data.set(s.bp,v+1);
			}
		return data;
		}
		
	// returns a Map of [ GroundUnitBlueprint => count ]
	ListUniqueGroundUnits() { 
		let data = new Map;
		for ( let s of this.ships ) { 
			for ( let t of s.troops ) { 
				let v = data.get(t.bp) || 0;
				data.set(t.bp,v+1);
				}
			}
		return data;
		}
		
	// returns a flat array of ground units
	ListGroundUnits() { 
		let data = [];
		for ( let s of this.ships ) { 
			for ( let t of s.troops ) { 
				data.push(t);
				}
			}
		return data;
		}
		
	SendOnMission( galaxy, duration ) { 
		if ( this.star ) { 
			// keep a reference to the star we were parked at, but detach from the list
			let pos = this.star.fleets.indexOf(this);
			if ( pos !== -1 ) { 
				this.star.fleets.splice( pos, 1 );
				}
			// cancel all trips
			this.dest = null;
			// find deepspace anomalies within range
			let targets = [];
			let myrange = this.owner.ship_range * this.owner.ship_range; // avoiding sqrt 
			for ( let a of galaxy.anoms ) { 
				if ( !a.onmap && !a.collected && !a.ResearchIsCompleted(this.owner) && a.vis_level <= this.owner.vis_level ) { 
					let dist = 
						Math.pow( Math.abs(a.xpos - this.xpos), 2) +
						Math.pow( Math.abs(a.ypos - this.ypos), 2)
						;
					if ( myrange >= dist ) { 
						targets.push( a );
						}
					}
				}
			// sort targets by their prescribed order
			targets.sort( (a,b) => { return (a.order < b.order) ? -1 : ((a.order > b.order) ? 1 : 0 ); } );
			// create the mission. ("status": 0 = in progress / no report, -1 = failed, +1 = success )
			let time = Math.max( duration, 3 );
			this.mission = { 
				targets, 
				time,
				bonus: ( ( ( Math.max(time,10) - 10 ) / 10 ) + 1.0 ),
				status: 0, 
				completed: 0, 
				remaining: 0 
				};
			}
		}
	
	AIWantToAttackFleet( fleet ) {
		// ai intercept mission? fight to the death
		if ( this.ai && this.ai.target == fleet ) { return true; }
		// space monsters always attack; its what they live for
		if ( this.owner.race.is_monster || fleet.owner.race.is_monster ) { return true; }
		// check treaties
		const contact = this.owner.diplo.contacts.get(fleet.owner);
		if ( contact && contact.treaties.has('NON_AGGRESSION') ) { return false; }		
		if ( contact && contact.treaties.has('ALLIANCE') ) { return false; }		
		// at war
		if ( contact && contact.treaties.has('WAR') ) {
			return this.fp_remaining >= fleet.fp_remaining;
			}
		// if we are neither at war nor peace, decide if we need to act in self defense.
		const our_turf = 'planets' in this.star && this.star.planets.filter( p => p == this.owner ).length > 0;
		const their_turf = 'planets' in this.star && this.star.planets.filter( p => p == fleet.owner ).length > 0;
		// self defense 
		if ( our_turf && !their_turf && ( !contact || contact.lovenub < (this.owner.ai.strat.posture * 0.5) ) ) {
			return this.fp_remaining >= fleet.fp_remaining * ( 1.5 - this.owner.ai.strat.risk );
			}
		// outland skirmish
		else if ( !our_turf && !their_turf && ( !contact || contact.lovenub < (this.owner.ai.strat.posture * 0.3) ) ) {
			return this.fp_remaining >= fleet.fp_remaining + ( fleet.fp_remaining * this.owner.ai.strat.risk );
			}
		// people we don't like much anyway
		else if ( !contact || contact.lovenub < (this.owner.ai.strat.posture * 0.2) ) {
			return this.fp_remaining >= fleet.fp_remaining + ( fleet.fp_remaining * this.owner.ai.strat.risk );
			}
		// *shrug* just felt like punching somebody
		else if ( Math.random() > 0.5 ) {
			return this.fp_remaining >= fleet.fp_remaining + ( fleet.fp_remaining * this.owner.ai.strat.risk );
			}
    	}
	    
	// invade a specific planet?
	AIWantToInvadePlanet( planet ) {
		// see: AI::AI_TroopsNeededToInvade
		let invasion_pow = Math.ceil( planet.troops.length * (1.25 - this.owner.ai.strat.risk * 0.5) ) || 1;
		return this.ai 
			&& this.ai.type == 'invade'
			&& this.ai.target == planet
			&& planet.owner 
			&& this.owner != planet.owner 
			&& this.troops 
			&& this.troops >= invasion_pow
			;
    	}
	    
	// returns a mission report for any completed deepspace missions
	DoResearch() {
		if ( !this.research ) { return; }
		let report = null;
		// fleet is on a deepspace research mission
		if ( this.mission ) { 
			// check to see if someone else swiped our targets since last turn
			while ( this.mission.targets.length && this.mission.targets[0].collected ) { 
				this.mission.targets.shift();
				}
			// I not dead and have any valid targets?
			if ( this.mission.targets.length && this.mission.status != -1 ) { 
				// TODO: Add danger/conflict logic here
				if ( Math.random() <= 0.03 ) { 
					this.mission.status = -1; // we've lost
					this.mission.targets = []; // give up
// 					console.log(`Fleet#${this.id} lost in space`);
					}
				else {
					let completed = this.mission.targets[0].AddResearch( this.owner, this.research * this.mission.bonus );
					// console.log(`Fleet#${this.id} researched ${this.mission.targets[0].name}`);
					if ( completed ) { 
// 						console.log(`Fleet#${this.id} FINISHED researching ${this.mission.targets[0].name}`);
						this.mission.completed++;
						let t = this.mission.targets.shift();
						t.onComplete(this);
						Signals.Send('anom_complete', {anom:t, fleet:this});
						}
					}
				}
			this.mission.time--;
// 			console.log(`Fleet#${this.id} returns in T-${this.mission.time}`);
			if ( this.mission.time <= 0 ) {
				// mission complete; wrap up and put back on star
				if ( this.mission.status > -1 ) { this.mission.status = this.mission.completed ? 1 : 0 };
				report = { 
					fleet: this, 
					completed: this.mission.completed, 
					remaining: this.mission.targets.length, 
					status: this.mission.status,
					note: '' // possibly add a captain's note here for flavor
					};
				// if there was more to research, put a tasty tidbit in
				if ( this.mission.targets.length ) { 
					report.note = `The team captain described their latest find: ${this.mission.targets[0].pre_desc}`;
					}
				let failed = this.mission.status == -1;
				this.mission = null;
				if ( !failed ) { this.ParkOnStar(); } // only the lucky ones come home
				else { this.Kill(); } // U R DED
				}
			}	
		// parked fleets with research ships do research
		else if ( this.star && !this.dest ) { 
			// if the ship is parked on an anomaly, research directly
			if ( this.star.objtype == 'anom' && !this.star.collected && !this.star.ResearchIsCompleted(this.owner) ) { 
				// TODO: Add danger/conflict
				let completed = this.star.AddResearch( this.owner, this.research );
				if ( completed ) { 
					this.star.onComplete( this );
					Signals.Send('anom_complete', {anom:this.star, fleet:this});
					}
				}
			// if the ship is parked in a system, do orbital research
			else if ( this.star.objtype == 'star' ) { 
				// TODO - orbital research
				}
			}
		return report;
		}
		
	// dumps all troops from a planet into the fleet.
	// returns number transferred.
	TransferTroopsFromPlanet( planet, max ) {
		if ( planet.owner != this.owner 
			|| this.troops == this.troopcap 
			|| !this.troopcap 
			|| !planet.troops.length 
			) { return 0; }
		let moved = 0;
		if ( !max ) { max = this.troopcap; }
		max = Math.min( max, this.troopcap );
		let ships = this.ships.filter( s => s.bp.troopcap > s.troops.length );
		while ( planet.troops.length && this.troopcap > this.troops && moved <= max ) { 
			let t = planet.troops[0];
			let s = ships[0];
			if ( s.bp.troopcap > s.troops.length ) { 
				s.troops.push( t );
				planet.troops.shift(); // remove from planet
				this.troops++;
				moved++;
				}
			else { ships.shift(); }
			}
		return moved;
		}
		
	// dumps all troops from a fleet onto a planet
	TransferTroopsToPlanet( planet ) {
		for ( let s of this.ships ) {
			if ( s.troops.length ) { 
				while ( s.troops.length ) { 
					planet.troops.push(
						s.troops.pop()
						);
					}
				}
			}
		this.troops = 0;
		}
		
	SortShips() { 
		this.ships.sort( (a,b) => {
			if ( a.bp.fp > b.bp.fp ) { return -1; }
			else if ( a.bp.fp < b.bp.fp ) { return 1; }
			else if ( a.colonize && !b.colonize ) { return -1; }
			else if ( !a.colonize && b.colonize ) { return 1; }
			else if ( a.troops.length && !b.troops.length ) { return -1; }
			else if ( !a.troops.length && b.troops.length ) { return 1; }
			return 0;
			});
		}
	}
	
Fleet.all_fleets = []; 
