import {bindable} from 'aurelia-framework';
import ShipCombat from './classes/ShipCombat';

export class ShipCombatPane {
	@bindable app = null;
	@bindable combatdata = null; // { attacker, defender, planet }

	constructor() { 
		this.combat = null;
		this.processing = false;
		this.turn_delay = 300; // ms
		this.turn_delta = 10; // "seconds" according to combat queue
		this.last_turnlog = { attacker: null, defender:null };
		this.combat_speed = 1.0; // multiplier
		this.turn = 0;
		this.winner = '';
	    }
	   
	bind() { 
		if ( this.combatdata ) { 
			this.combat = new ShipCombat( this.combatdata.attacker, this.combatdata.defender, this.combatdata.planet );
			this.turn = 0;
			// deselect all ships
			for ( let ship of this.combatdata.attacker.ships ) { ship.selected = false; }			
			for ( let ship of this.combatdata.defender.ships ) { ship.selected = false; }			
			}
		}
		
	onChangeCombatdata() { 
		if ( this.combatdata ) { 
			this.combat = new ShipCombat( this.combatdata.attacker, this.combatdata.defender, this.combatdata.planet );
			this.turn = 0;
			}
		}
		
	ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		// finish up the battles
		this.FinishCombat();
		this.combat.End(); // cleanup
		// tell game this battle is over and continue with other battles
		this.app.game.PresentNextPlayerShipCombat();
		}

	FinishCombat() { 
		if ( !this.combat.status ) { 
			this.processing = false;
			this.last_turnlog = null; // ends hiliting
			this.combat.ProcessQueue(10000000,false); // drain the queue
			}
		this.FormatResolutionLabel();
		}

	FormatResolutionLabel() { 
		// reformat the combat status to be from the player's point of view
		if ( this.combat.status && this.combat.winner ) {
			console.log('formatting status');
			let i_win = 
				( this.combat.winner == 'ATTACKER' && this.combatdata.attacker.owner.is_player ) 
				|| ( this.combat.winner == 'DEFENDER' && this.combatdata.defender.owner.is_player ) 
				;
			this.combat.status = i_win ? 'VICTORY!' : 'DEFEAT!' ;
			}	
		}
		
	PlayTurn( manual_turn_delta = 0 ) { 
		if ( this.combat ) {
			this.processing = true;
			this.turn++;
			this.PlayNextAttack( manual_turn_delta || this.turn_delta );
			this.FormatResolutionLabel();
			}
		}

	PlayNextAttack( with_delta = 0 ) {
		if ( !this.processing ) { return false; } 
		// make attack
		this.last_turnlog = this.combat.ProcessQueue(with_delta,true); // one item at a time		
		this.last_turnlog = this.last_turnlog.length ? this.last_turnlog[0] : null;
		this.DoWeaponFX();
		// if combat resolved or no more items to play this round, stop
		if ( this.combat.status || !this.last_turnlog ) { 
			this.processing = false;
			this.last_turnlog = null; // ends hiliting
			this.FormatResolutionLabel();
			}
		// otherwise next attack (animated)
		else if ( this.combat_speed ) { 
			setTimeout( () => {this.PlayNextAttack();}, this.turn_delay * this.combat_speed );
			}
		// (instant)
		else {
			this.PlayNextAttack();
			}
		}
		
	DoWeaponFX() { 
		if ( !this.last_turnlog || !this.combat_speed ) { return; }
		
		// origin and target points on screen
		let attacker_el = document.getElementById( 'ship-' + this.last_turnlog.ship.id.toString() );
		let defender_el = document.getElementById( 'ship-' + this.last_turnlog.target.id.toString() );
		let rect = attacker_el.getBoundingClientRect();
		let x1 = rect.left + ( attacker_el.offsetWidth / 2 );
		let y1 = rect.top + ( attacker_el.offsetHeight / 2 );
		rect = defender_el.getBoundingClientRect();
		let x2 = rect.left + ( defender_el.offsetWidth / 2 );
		let y2 = rect.top + ( defender_el.offsetHeight / 2 );
		let length = Math.sqrt( Math.pow( Math.abs( x1 - x2 ), 2 ) + Math.pow( Math.abs( y1 - y2 ), 2 ) );
		let angle = Math.atan2( (y2-y1),(x2-x1)) * (180/Math.PI);		

		// make weapon FX
		let el = document.createElement("div"); 
		el.style.transformOrigin = '0 50%';
	    el.style.transform = `rotate(${angle}deg)`;
		el.style.height = '5px';
		el.style.width = '100px'; // '100px';
		el.style.position = 'absolute';
		el.style.top = y1 + 'px';
		el.style.left = x1 + 'px';
		el.style.zIndex = '1000';
	    el.style.transition = ( (this.turn_delay / 1000) * this.combat_speed) + "s transform linear";		
		// weapon specific colors
		if ( this.last_turnlog.weapon.type == 'missile' ) {
			el.style.backgroundColor = "#FF4";
			}
		else if ( this.last_turnlog.weapon.type == 'kinetic' ) {
			el.style.backgroundColor = "#39E;";
			}
		else {
			el.style.backgroundColor = "red";
			}
			
		let pane = document.getElementById('shipcombat_pane');
		pane.appendChild(el); 
		el.focus();
		
	    el.style.transform = `rotate(${angle}deg) translateX(${length-100}px) `;
	    
	    // remove element after animation runs
	    setTimeout( () => el.remove(), this.turn_delay * this.combat_speed );
	    // optional explosion
	    if ( !this.last_turnlog.missed ) { 
			setTimeout( () => {
				let x = document.createElement("div"); 
				x.className = 'explosion';
				x.style.position = 'absolute';
				x.style.top = (y2-64) + 'px';
				x.style.left = (x2-64) + 'px';
				x.style.zIndex = '1000';
				pane.appendChild(x);
				setTimeout( () => { x.remove();}, 500 ); // 500 is hard set by explosion class
				}, this.turn_delay * this.combat_speed );
			}
		
		}
				
	}
