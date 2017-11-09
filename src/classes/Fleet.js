

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
	ships = [];
		
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
		this.speed = 1000000;
		for ( let ship of this.ships ) { 
			// check if there are colony ships
			if ( ship.colonize ) { this.colonize = true; }
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
		if ( this.dest ) { 
			moved = true;
			// move the ship closer to goal
			let dist = Math.sqrt( Math.abs( (this.xpos - this.dest.xpos) * (this.ypos - this.dest.ypos) ) );
			// for a cleaner look, strip off 75px from each end.
			let STRIP_LENGTH = 0;
			dist -= STRIP_LENGTH;
			// arrived?
			if ( dist <= this.speed ) { 
				this.star = this.dest;
				this.dest = null;
				// check to see if we are merging into an existing fleet
				for ( let f of this.star.fleets )  {
					if ( f.owner == this.owner ) { 
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
			else {
				// if leaving our star, unhook
				if ( this.star ) { this.star = null; }
				let ratio = this.speed / dist;
				this.xpos = (1.0-ratio)*this.xpos + ratio*this.dest.xpos;
				this.ypos = (1.0-ratio)*this.ypos + ratio*this.dest.ypos;
				this.UpdateDestLine();
				}
			this.FireOnUpdate();
			}
		return moved;
		}
		
	SetDest( dest ) { 
		// check to see if we're already there
		if ( !this.dest && this.star == dest ) { 
// 			console.log(`F${this.id}: I'm already where i want to be!`);
			return;
			}
		// check to see if i'm in the air and the user is issuing a return order
		else if ( this.dest && this.star ) { 
			this.dest = null;
			this.star = dest;
			this.xpos = 0;
			this.ypos = 0;
// 			console.log(`F${this.id}: I'm going nowhere!`);
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
			let dist = Math.sqrt( Math.abs( (this.xpos - this.dest.xpos) * (this.ypos - this.dest.ypos) ) );
			let ratio = STRIP_LENGTH / dist;
			this.xpos = (1.0-ratio)*this.xpos + ratio*this.dest.xpos;
			this.ypos = (1.0-ratio)*this.ypos + ratio*this.dest.ypos;	
			this.UpdateDestLine();
// 			console.log(`F${this.id}: I'm going to ${dest.name}!`);
			}
		this.FireOnUpdate();
		}
		
	UpdateDestLine() { 
		if ( this.dest ) { 
			this.dest_line_length = Math.sqrt(((this.dest.xpos-this.xpos) * (this.dest.xpos-this.xpos)) + ((this.dest.ypos-this.ypos) * (this.dest.ypos-this.ypos)));
			this.dest_line_angle = Math.atan2((this.dest.ypos-this.ypos),(this.dest.xpos-this.xpos))*(180/Math.PI);		
			}
		}
		
		
		
	}
	
Fleet.all_fleets = []; 
