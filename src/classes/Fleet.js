import * as Signals from '../util/signals';

export default class Fleet {
	
	killme = false; // true if the fleet needs to be treated as deleted
	
	id = 0;
	star = null;
	dest = null;
	lane = null;
	xpos = 0;
	ypos = 0;
	speed = 50.0;
	colonize = false;
	owner = false; // false indicates unowned. zero can be an index
	ui_color = 'rgb(255,255,255)';
	in_range = false; // UI hint for visibility - only matters for player perspective
	ships = [];
	research = false;
	
	onUpdate = null; // callback
	SetOnUpdate( callback ) { 
		if ( callback instanceof Function ) { 
			this.onUpdate = callback;
			}
		}
	FireOnUpdate() { 
		if ( this.onUpdate instanceof Function ) { 
			this.onUpdate( this );
			}		
		}
		
	static NextUniqueID() {
		if( !this.next_uid && this.next_uid!==0 ){
			this.next_uid=1;
			}
		else{
			this.next_uid++;
			}
		return this.next_uid;
		}
		
	constructor( owner, star ) { 
		this.star = star;	
		this.xpos = star ? star.xpos : 0;
		this.ypos = star ? star.ypos : 0;
		this.id = Fleet.NextUniqueID();
		this.owner = owner;
		this.ui_color = `rgb( ${owner.color_rgb[0]}, ${owner.color_rgb[1]}, ${owner.color_rgb[2]} )` ;
		this.owner.fleets.push(this);
		Fleet.all_fleets.push( this );
		if ( star ) { star.fleets.push(this); }
		this.ReevaluateStats();
		}

	// use this if ships are added or removed.
	ReevaluateStats() { 
		this.colonize = false;
		this.research = 0;
		this.speed = 1000000;
		for ( let ship of this.ships ) { 
			// check if there are colony ships
			if ( ship.colonize ) { this.colonize = true; }
			// check if there are research ships
			if ( ship.research ) { this.research += ship.research; }
			// find our lowest speed
			if ( ship.speed < this.speed ) { this.speed = ship.speed; }
			}
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
		
	// removes this fleet from all fleet lists,
	// because javascript does not have a formal destructor()
	Kill() {
		if ( this.star ) { 
			let pos = this.star.fleets.indexOf(this);
			if ( pos !== -1 ) { 
// 				console.log(`unhooking F${this.id} from ${this.star.name} in pos ${pos}`);
				this.star.fleets.splice( pos, 1 );
				}
			}
		this.star = null;
		this.dest = null;
		this.xpos = -1000;
		this.ypos = -1000;
		this.killme = true;
		this.owner.fleets.splice( this.owner.fleets.indexOf(this), 1 );
		Fleet.all_fleets.splice( Fleet.all_fleets.indexOf(this), 1 );
		this.FireOnUpdate();
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
// 			console.log(`F${this.id}: I'm going to ${dest.name}! (departing from ${this.star?this.star.name:'--'})`);
			}
		this.FireOnUpdate();
		}
		
	UpdateDestLine() { 
		if ( this.dest ) { 
			this.dest_line_length = Math.sqrt(((this.dest.xpos-this.xpos) * (this.dest.xpos-this.xpos)) + ((this.dest.ypos-this.ypos) * (this.dest.ypos-this.ypos)));
			this.dest_line_angle = Math.atan2((this.dest.ypos-this.ypos),(this.dest.xpos-this.xpos))*(180/Math.PI);		
			}
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
			console.log(targets);
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
					console.log(`Fleet#${this.id} researched ${this.mission.targets[0].name}`);
					if ( completed ) { 
// 						console.log(`Fleet#${this.id} FINISHED researching ${this.mission.targets[0].name}`);
						this.mission.completed++;
						Signals.Send('anom_complete', {anom:this.mission.targets[0], fleet:this});
						this.mission.targets.shift().onComplete(this);
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
					Signals.Send('anom_complete', {anom:this.star, fleet:this});
					this.star.onComplete( this );
					}
				}
			// if the ship is parked in a system, do orbital research
			else if ( this.star.objtype == 'star' ) { 
				// TODO - orbital research
				}
			}
		return report;
		}
	}
	
Fleet.all_fleets = []; 
