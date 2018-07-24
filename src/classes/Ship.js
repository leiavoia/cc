import {WeaponList} from './WeaponList';

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
  Attack( targets, weapon ) {
    let log = [];
    if ( !weapon.shotsleft || !targets.length ) { return log; }
    weapon.shotsleft--;
    let ship = targets[0];
    for ( let i=0; i < weapon.qty; i++ ) { 
      let logentry = { ship:this, target:ship, weapon:weapon, hull:0, armor:0, shield:0, missed:false, killed:false };
      // 			let str = `  Ship ${this.id} fires ${weapon.name} at Target ${ship.id}: `;
      // chance to hit: 
      let to_hit = weapon.accu - ( ship.bp.drive / 10 );
      if ( to_hit < 0 ) { to_hit = 0; }
      if ( Math.random() <= to_hit ) { 
        // damage roll
        let dmg = Math.ceil( Math.random() * ( weapon.maxdmg - weapon.mindmg ) + weapon.mindmg );
        // damage reduced by shielding
        dmg -= ship.bp.shield;
        logentry.shield = ship.bp.shield;
        if ( dmg < 0 ) { dmg = 0; }
        if ( dmg > 0 ) { 
          // strike armor first
          if ( ship.armor ) { 
            const armor_dmg = Math.min( ship.armor, dmg );
            ship.armor -= armor_dmg;
            dmg -= armor_dmg;
            logentry.armor = armor_dmg;
            // 						str += ` A: ${armor_dmg}`;
          }
          // carryover damage to the hull
          if ( dmg ) { 
            const hull_dmg = Math.min( ship.hull, dmg );
            ship.hull -= hull_dmg;
            logentry.hull= hull_dmg;
            // 						str += ` H: ${hull_dmg}`;
            if ( !ship.hull ) { 
              logentry.killed = true;
              // 							str += ' ***SHIP DESTROYED***';
              this.kills++;
              targets.shift();
              ship = targets.length ? targets[0] : null;
              if ( !ship ) { break; }
            }
            else {
              // 							str += ` [HULL: ${ship.hull}/${ship.bp.hull}]`;
            }
          }
        }
      }
      else {
        // 				str += ' missed';
        logentry.missed = true;
      }
      // 			console.log(str);
      log.push(logentry);
    }
    if ( !weapon.shotsleft ) {
      // 			console.log('    <out of ammo>');
    }
    return log;
  }
};
Ship.next_id = 0;
