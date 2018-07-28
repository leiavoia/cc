import {WeaponList} from './WeaponList';
import {computedFrom} from 'aurelia-framework';

export class ShipBlueprint {
constructor() {
	this.id = ++ShipBlueprint.next_id;
	this.name = 'Ship';
	this.weapons = [];
	this.comps = [];
	this.hull = 1;
	this.armor = 1;
	this.shield = 0;
	this.drive = 1;
	this.img = 'img/ships/ship1_mock.png';
	this.speed = 100; // [!]HACK see: owner.ship_speed
	this.colonize = false;
	this.research = 50;    
}

AddWeapon( tag, qty = 1 ) {
	let o = Object.create( WeaponList[tag] );
	o.qty = qty; // default, user can change later
	this.weapons.push(o);
}
//   AddComponant( c ) { 
//     this.comps.push( c );	
//   }
};
ShipBlueprint.next_id = 0;

export class Ship {

	constructor( blueprint ) { 
		this.id = ++Ship.next_id;
		this.bp = blueprint;
		this.hull = blueprint.hull;
		this.armor = blueprint.armor;
		this.xp = 1; // crew experience
		this.xplevel = 1; // crew experience level
		this.kills = 0;
		this.weapons = [];
		this.selected = true; // for UI
		for ( const w of blueprint.weapons ) { 
			// use weapon itself as prototype. saves memory.
			let o = Object.create( w );
			o.shotsleft = o.shots;
			o.online = true;
			this.weapons.push(o);
			}
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
			let dmg = Math.ceil( Math.random() * ( weapon.maxdmg - weapon.mindmg ) + weapon.mindmg );
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
		
	@computedFrom('hull','bp.hull')
	get health_class() {
		if ( !this.hull ) { return 'd'; }
		let pct = this.hull / this.bp.hull;
		if ( pct >= 0.7 ) { return 'h'; }
		else if ( pct >= 0.35 ) { return 'm'; }
		else { return 'l'; }
		}
		
	};
Ship.next_id = 0;
