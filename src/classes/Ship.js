import {WeaponList} from './WeaponList';
import {Mod,Modlist} from './Mods';
import {ShipComponentList} from './ShipComponentList';
import {computedFrom} from 'aurelia-framework';
import * as utils from '../util/utils';

export class Ship {

	// Use this constructor for behind the scenes work.
	// To "manufacture" ships, use ShipBlueprint::Make()
	// which also handles internal recordkeeping.
	constructor( blueprint ) { 
		// 'fromJSON' style data bundle as first arg
		if ( 'bp' in blueprint ) { 
			Object.assign( this, blueprint );
			this.weapons = [];
			}
		// regular constructor
		else {
			this.id = utils.UUID();
			this.bp = blueprint;
			this.hull = blueprint.hull;
			this.armor = blueprint.armor;
			this.xp = 0; // crew experience
			this.xplevel = 0; // crew experience level
			this.weapons = [];
			this.troops = []; // list of GroundUnits onboard
			this.selected = true; // for UI
			for ( const w of blueprint.weapons ) { 
				// use weapon itself as prototype. saves memory.
				let o = Object.create( w );
				o.shotsleft = o.shots;
				o.online = true;
				this.weapons.push(o);
				}
			}
		}

	toJSON() { 
		let obj = Object.assign( {}, this ); 
		obj._classname = 'Ship';
		obj.bp = this.bp.id;
		obj.troops = this.troops.map( x => x.id );	
		// dont save weapon status - 
		// just rehydrate from blueprint with full health when unpacking
		delete(obj.weapons);
		return obj;
		}
		
	Pack( catalog ) { 
		// console.log('packing Ship ' + this.id);
		if ( !( this.id in catalog ) ) { 
			catalog[ this.id ] = this.toJSON(); 
			for ( let x of this.troops ) { x.Pack(catalog); }
			this.bp.Pack(catalog);
			}
		}	

	Unpack( catalog ) {
		this.bp = catalog[this.bp];
		this.bp.Unpack(catalog); // ensures blueprint weapons are available
		this.troops = this.troops.map( x => catalog[x] );
		for ( const w of this.bp.weapons ) {
			// use weapon itself as prototype. saves memory.
			let o = Object.create( w );
			o.shotsleft = o.shots;
			o.online = true;
			this.weapons.push(o);
			}
		}
				
	AwardXP( xp ) {
		this.xp += xp;
		if 		( this.xp > 1000 ) { this.xplevel = 5; } 
		else if ( this.xp > 800 ) { this.xplevel = 4; } 
		else if ( this.xp > 500 ) { this.xplevel = 3; } 
		else if ( this.xp > 200 ) { this.xplevel = 2; } 
		else if ( this.xp > 100 ) { this.xplevel = 1; } 
		else { this.xplevel = 0; } 
		}
		
	// returns combat log
	Attack( target, weapon  ) {
		if ( !weapon.shotsleft || !target || !target.hull ) { return null; }
		let log = { ship:this, target:target, weapon:weapon, hull:0, armor:0, shield:0, missed:false, killed:false };
		// chance to hit: This is an unevan bet between the attacker's weapon, size, and targetting
		// against the defender's size, combatspeed, and jamming technology.
		// Ship experience also makes a difference.
		let hit = weapon.accu + this.xplevel;
		let evade = target.bp.combatspeed + this.xplevel;
		let sizediff = Math.max( target.bp.mass, this.bp.mass ) / Math.min( target.bp.mass, this.bp.mass );
		if ( target.bp.mass < this.bp.mass ) { evade += sizediff; }
		else { hit += sizediff; }
		hit = this.bp.mods.Apply( hit, 'hit' );
		hit = this.bp.mods.Apply( hit, `hit_${weapon.type}` ); 
		evade = target.bp.mods.Apply( evade, 'evade' );
		evade = target.bp.mods.Apply( evade, `evade_${weapon.type}` ); 
		let to_hit = utils.RandomFloat( -evade, +hit );
		if ( to_hit >= 0 ) { 
			// damage roll
			let dmg = Math.ceil( (Math.random() * ( weapon.maxdmg - weapon.mindmg )) + weapon.mindmg );
			// damage reduced by shielding
			dmg -= target.bp.shield;
			log.shield = target.bp.shield;
			if ( dmg < 0 ) { dmg = 0; }
			if ( dmg > 0 ) { 
				// strike armor first
				if ( target.armor ) { 
					const armor_dmg = Math.min( target.armor, dmg );
					target.armor -= armor_dmg;
					dmg -= armor_dmg;
					log.armor = armor_dmg;
					}
				// carryover damage to the hull
				if ( dmg ) { 
					const hull_dmg = Math.min( target.hull, dmg );
					target.hull -= hull_dmg;
					log.hull= hull_dmg;
					if ( !target.hull ) { log.killed = true; }
					}
				}
			}
		else {
			log.missed = true;
			}
		return log;
		}
		
	CalcFirepowerRemaining() { 
		if ( !this.weapons.length ) { return 0; }
		return Math.floor( this.weapons.reduce( ( accum, weapon ) => {
			// average firepower of weapon
			let fp = ((weapon.maxdmg - weapon.mindmg)/2) + weapon.mindmg;
			// with number of shots, assuming it may not live long enough to use them all
			//fp = Math.pow( fp, 0.65 ); // yes, magic number
			// times number of weapons equiped on ship
			fp *= weapon.qty;
			fp *= weapon.shotsleft;
			return accum + fp;
			}, 0 ) );	
		}
		
	// [D]ead, [A]rmor Remaining, [H]igh, [M]edium, [L]ow
	@computedFrom('hull','bp.hull')
	get health_class() {
		if ( !this.hull ) { return 'd'; }
		if ( this.armor ) { return 'a'; }
		let pct = this.hull / this.bp.hull;
		if ( pct >= 0.7 ) { return 'h'; }
		else if ( pct >= 0.35 ) { return 'm'; }
		else { return 'l'; }
		}
		
	};


export class ShipBlueprint {
	constructor( data ) {
		// 'fromJSON' style single data bundle 
		if ( data ) { 
			Object.assign( this, data );
			}
		else {
			this.id = utils.UUID();
			this.name = 'Ship Name';
			this.role = 'scout'; // helps AI. ['scout','combat','colonizer','carrier','research']
			this.weapons = [];
			this.comps = []; // non-weapon ship components. 
			this.mass = 0;
			this.hull = 1;
			this.armor = 1;
			this.shield = 0;
			this.combatspeed = 1;
			this.img = 'img/ships/ship1_mock.png';
			this.speed = 100;
			this.mods = new Modlist; // value modifiers, often from components
			this.cost = {}; // calculated from individual components
			this.colonize = false;
			this.research = 0;    
			this.troopcap = 0; // number of ground units we can carry    
			this.fp = 0; // calculated firepower
			this.milval = 0; // calculated military value for AI
			// Calculated size class makes it easier to relate to humans.
			// Uses letters 'A','B','C' ...
			this.sizeclass = 'A'; 
			// costs go down as we build more of them. 
			// this gives an incentive to build smaller ships.
			this.num_built = 0;
			this.bulk_discount = 0; // percentage, for UI only
			}
		}

	toJSON() { 
		let obj = Object.assign( {}, this ); 
		obj._classname = 'ShipBlueprint';
		// // weapons have a tacked on 'qty' stat
		obj.weapons = this.weapons.map( x => ({ tag:x.tag, qty:x.qty }) );	
		obj.comps = this.comps.map( x => x.tag );
		obj.mods = this.mods.toJSON();
		return obj;
		}
		
	Pack( catalog ) { 
		// console.log('packing ShipBlueprint ' + this.id);
		if ( !( this.id in catalog ) ) { 
			catalog[ this.id ] = this.toJSON(); 
			}
		}	

	Unpack( catalog ) {
		// can be called multiple times from different sources, 
		// so check to to make sure only unpacked once.
		if ( this.mods instanceof Modlist ) { return; }
		this.comps = this.comps.map( x => ShipComponentList[x.tag] );
		this.weapons = this.weapons.map( x => {
			let o = Object.create( WeaponList[x.tag] );
			o.qty = x.qty; // default, user can change later
			return o;
			} );
		this.mods = new Modlist(this.mods);
		this.mods.Unpack(catalog);
		}
				
	Make() { 
		let s = new Ship( this );
		this.IncNumBuilt();
		return s;
		};
		
	// returns true on success, false on failure
	AddWeapon( tag, qty = 1 ) {
		// check for existing weapons, just add qty
		for ( let i = 0; i < this.weapons.length; i++ ) { 
			if ( this.weapons[i].tag == tag ) { 
				this.weapons[i].qty += qty;
				if ( this.weapons[i].qty <= 0 ) {
					this.RemoveWeapon( this.weapons[i] );
					}
				this.RecalcStats(); // TODO: parent?
				return true;
				}
			}			
		// NOTE: BUG: using object.assign avoids aurelia binding bugs
		// but also radically increases memory usage for ships. Switch 
		// these lines if memory performance isn't a problem and we
		// still can't find a solution for aurelia bugs.
// 		let o = Object.assign( {}, WeaponList[tag] );
		let o = Object.create( WeaponList[tag] );
		o.qty = qty; // default, user can change later
		this.weapons.push(o);
		this.RecalcStats(); // TODO: parent?
		return true;
		}
	
	// returns true on success, false on failure
	RemoveWeapon( w ) {
		let i = this.weapons.indexOf(w);
		if ( i >= 0 ) { 
			this.weapons.splice( i, 1 );
			this.RecalcStats(); // TODO: parent?
			return true;
			}
		return false;
		}
				
	// returns true on success, false on failure
	AddComponent( tag ) { 
		// Because we are not adding data, no need to clone object like weapons.
		let c = ShipComponentList[tag];
		// check for existing components
		for ( let i = 0; i < this.comps.length; i++ ) { 
			if ( this.comps[i].tag == tag ) { 
				return false;
				}
			// also check to see if there are mutually exclusive components installed.
			if ( c.hasOwnProperty('mx') && this.comps[i].hasOwnProperty('mx') && this.comps[i].mx == c.mx ) {
				return false;
				}
			}
		// ok to add
		this.comps.push( c );	
		// add component's mods to our local list for future evaluation
		c.mods.forEach( m => { this.mods.Add(m); });
		this.RecalcStats(); // TODO: parent?
		return true;
		}	
		
	// returns true on success, false on failure
	RemoveComponent( c ) {
		let i = this.comps.indexOf(c);
		if ( i >= 0 ) { 
			this.mods.RemoveMatching( null, null, c, null ); 
			this.comps.splice( i, 1 );
			this.RecalcStats(); // TODO: parent?
			return true;
			}
		return false;
		}
		
	RecalcStats( parent = null ) { 
		this.mass = 0;
		for ( let k in this.cost ) { this.cost[k] = 0; } // not reassigning entire object preserves auralia binding.
		this.weapons.forEach( w => { 
			this.mass += w.mass * w.qty; 
			for ( let k in w.cost ) { 
				if ( !(k in this.cost) ) { this.cost[k] = 0; }
				this.cost[k] += w.cost[k] * w.qty; 
				} 
			});
		this.mass = Math.ceil( this.mods.Apply( this.mass, 'mass', parent ) );
		if ( !this.mass ) { this.mass = 1; }
		if ( !this.cost.labor ) { this.cost.labor = 1; }
		this.comps.forEach( c => { 
			for ( let k in c.cost ) { 
				if ( !(k in this.cost) ) { this.cost[k] = 0; }
				this.cost[k] += c.cost[k] * ( c.scaled ? this.mass : 1 ); 
				} 
			});
		this.cost.labor = this.mods.Apply( this.cost.labor, 'labor', parent );
		for ( let k in this.cost ) { 
			this.cost[k] = Math.ceil( this.cost[k] );
			}
		for ( let k in this.cost ) { 
			if ( !this.cost[k] ) {
				delete this.cost[k]; 
				} //delete zeros
			}
		
		// TODO: evaluate to see if this feels right
		// however, adding armor also adds mass, but armor itself adds mass, which adds to the hull ...
		this.hull = this.mass; 
		
		this.armor = Math.floor( this.mods.Apply( this.hull, 'armor', null ) ) - this.hull;
		this.shield = Math.floor( this.mods.Apply( 0, 'shield', parent ) );
		this.combatspeed = Math.floor( this.mods.Apply( 1, 'combatspeed', parent ) );
		this.speed = Math.floor( this.mods.Apply( 100, 'speed', parent ) );
		this.colonize = Math.floor( this.mods.Apply( 0, 'colonize', parent ) );
		this.research = Math.floor( this.mods.Apply( 0, 'research', parent ) ); 
		this.troopcap = Math.floor( this.mods.Apply( 0, 'troopcap', parent ) ); 
		this.fp = this.CalcFirepowerTotal();
		this.milval = this.CalcMilitaryValue();
		// class size
		this.sizeclass ='A';
		let sizes = ['A','B','C','D','E','F','G','H','I','J','K','L'];
		for ( let max=50, i=1; this.hull > max; max*=2, i++ ) {
			this.sizeclass = sizes[i];
			}
		// primary role
		if ( this.colonize ) { this.role = 'colonizer'; }
		else if ( this.research ) { this.role = 'research'; }
		else if ( this.troopcap ) { this.role = 'carrier'; }
		else if ( this.fp ) { this.role = 'combat'; }
		else { this.role = 'scout'; }
		}
	
	CalcMilitaryValue() { 
		// raw firepower
		let fp = Math.floor( this.weapons.reduce( ( accum, weapon ) => {
			// average firepower of weapon
			let x = ((weapon.maxdmg - weapon.mindmg)/2) + weapon.mindmg;
			// times number of shots, assuming it may not live long enough to use them all
			x *= Math.pow( weapon.shots, 0.45 );
			// times number of weapons equiped on ship
			x *= weapon.qty;
			// times shots that will likely land a hit (0..1)
			x *= weapon.accu;
			// quick draws have a huge advantage in combat
			// if this is too severe, also try ( 4 / weapon.reload )
			x *= 16 / (weapon.reload * weapon.reload);
			return accum + x;
			}, 0 ) );	
		// how long this thing can stick around in combat.
		// lets use 100 as a baseline for a "normal ship"
		let body = ( this.hull + this.armor ) / 100; // [!]MAGICNUMBER
		body = Math.pow( body, 1+(this.shield/50) );
		return Math.round( ( fp * body ) / 10 );
		}
	
	CalcFirepowerTotal() { 
		return Math.floor( this.weapons.reduce( ( accum, weapon ) => {
			// average firepower of weapon
			let fp = ((weapon.maxdmg - weapon.mindmg)/2) + weapon.mindmg;
			// with number of shots, assuming it may not live long enough to use them all
			//fp = Math.pow( fp, 0.65 ); // yes, magic number
			// times number of weapons equiped on ship
			fp *= weapon.qty;
			fp *= weapon.shots;
			return accum + fp;
			}, 0 ) );	
		}
		
	IncNumBuilt() { 
		this.num_built++;
		// retract our previous mod
		this.mods.RemoveMatching('labor', null, 'bulk_discount');
		// add a new one
		let rate = 1.0
		for ( let max=5; this.num_built >= max && rate > 0.05; max*=2, rate-=0.05 ) { ;; }
		this.bulk_discount = Math.round( ( 1.0 - rate ) * 100 );
		this.mods.Add( new Mod( 'labor', '*', rate, 'Mass Production Discount', 'bulk_discount' ) );
		}
		
	Copy() { 
		let newbp = new ShipBlueprint();
		newbp.name = this.name + ' Copy';
		newbp.img = this.img;
		this.weapons.forEach( w => { newbp.AddWeapon( w.tag, w.qty ); });
		this.comps.forEach( c => { newbp.AddComponent( c.tag ); });
		return newbp;
		}
	};
