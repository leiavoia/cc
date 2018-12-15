import {WeaponList} from './WeaponList';
import {Mod,Modlist} from './Mods';
import {ShipComponentList} from './ShipComponentList';
import {computedFrom} from 'aurelia-framework';



export class Ship {

	// Use this constructor for behind the scenes work.
	// To "manufacture" ships, use ShipBlueprint::Make()
	// which also handles internal recordkeeping.
	constructor( blueprint ) { 
		this.id = ++Ship.next_id;
		this.bp = blueprint;
		this.hull = blueprint.hull;
		this.armor = blueprint.armor;
		this.xp = 0; // crew experience
		this.xplevel = 0; // crew experience level
		this.kills = 0;
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
		// chance to hit: 
		let to_hit = weapon.accu - ( target.bp.drive / 10 );
		if ( to_hit < 0 ) { to_hit = 0; }
		if ( Math.random() <= to_hit ) { 
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
					if ( !target.hull ) { 
						log.killed = true;
						this.kills++;
						}
					else {
					
						}
					}
				}
			}
		else {
			log.missed = true;
			}
		return log;
		}
		
	CalcFirepowerRemaining() { 
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
Ship.next_id = 0;


export class ShipBlueprint {
	constructor() {
		this.id = ++ShipBlueprint.next_id;
		this.name = 'Ship Name';
		this.weapons = [];
		this.mass = 0;
		this.hull = 1;
		this.armor = 1;
		this.shield = 0;
		this.drive = 1;
		this.img = 'img/ships/ship1_mock.png';
		this.speed = 100; // [!]HACK see: owner.ship_speed
		this.comps = []; // non-weapon ship components. 
		this.mods = new Modlist; // value modifiers, often from components
		this.colonize = false;
		this.research = 0;    
		this.troopcap = 0; // number of ground units we can carry    
		this.fp = 0; // calculated firepower
		// Calculated size class makes it easier to relate to humans.
		// Uses letters 'A','B','C' ...
		this.sizeclass = 'A'; 
		// costs go down as we build more of them. 
		// this gives an incentive to build smaller ships.
		this.num_built = 0;
		this.bulk_discount = 0; // percentage, for UI only
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
		this.labor = 0;
		this.weapons.forEach( w => { 
			this.mass += w.mass * w.qty; 
			this.labor += w.labor * w.qty; 
			});
		this.mass = Math.ceil( this.mods.Apply( this.mass, 'mass', parent ) );
		this.labor = Math.ceil( this.mods.Apply( this.labor, 'labor', parent ) );
		if ( !this.mass ) { this.mass = 1; }
		if ( !this.labor ) { this.labor = 1; }
		// TODO: evaluate to see if this feels right
		// however, adding armor also adds mass, but armor itself adds mass, which adds to the hull ...
		this.hull = this.mass; 
		
		this.armor = Math.floor( this.mods.Apply( this.hull, 'armor', null ) ) - this.hull;
		this.shield = Math.floor( this.mods.Apply( 0, 'shield', parent ) );
		this.drive = Math.floor( this.mods.Apply( 1, 'drive', parent ) );
		this.speed = Math.floor( this.mods.Apply( 100, 'speed', parent ) );
		this.colonize = Math.floor( this.mods.Apply( 0, 'colonize', parent ) );
		this.research = Math.floor( this.mods.Apply( 0, 'research', parent ) ); 
		this.troopcap = Math.floor( this.mods.Apply( 0, 'troopcap', parent ) ); 
		this.fp = this.CalcFirepowerTotal();
		// class size
		this.sizeclass ='A';
		let sizes = ['A','B','C','D','E','F','G','H','I','J','K','L'];
		for ( let max=50, i=1; this.hull > max; max*=2, i++ ) {
			this.sizeclass = sizes[i];
			}
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
ShipBlueprint.next_id = 0;
