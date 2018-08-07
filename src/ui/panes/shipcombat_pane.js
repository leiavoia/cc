import ShipCombat from '../../classes/ShipCombat';

export class ShipCombatPane {

	constructor() { 
		this.combat = null;
		this.processing = false;
		this.turn_delay = 300; // ms
		this.turn_delta = 10; // "seconds" according to combat queue
		this.last_turnlog = { attacker: null, defender:null };
		this.combat_speed = 1.0; // multiplier
		this.turn = 0;
		this.winner = '';
		this.player_target_priority = 'size_desc';
		this.player_team = null;
	    }
	   
	activate(data) {
		this.app = data.app;
		this.combatdata = data.obj;
		this.onChangeCombatdata();
		}
		
	bind() { 
		this.onChangeCombatdata();
		}
		
	onChangeCombatdata() { 
		if ( this.combatdata ) { 
			this.combat = new ShipCombat( this.combatdata.attacker, this.combatdata.defender, this.combatdata.planet );
			this.turn = 0;		
			// deselect all ships
			for ( let ship of this.combatdata.attacker.ships ) { ship.selected = false; }			
			for ( let ship of this.combatdata.defender.ships ) { ship.selected = false; }
			// which team is the human playing?
			this.player_team = this.combat.teams[0].fleet.owner.is_player ? this.combat.teams[0] : this.combat.teams[1];
			this.player_target_priority = this.player_team.target_priority;
			this.combat.SortTargets(this.player_team);
			}
		}
		
	ClickShip( ship, team ) { 
		// only click enemy ships between turns
		if ( !this.processing && team != this.player_team ) { 
			ship.selected = !ship.selected;
			// sort targets only between turns
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

	Retreat() { 
		if ( !this.combat.status && !this.player_team.retreating ) { 
			this.combat.RetreatTeam(this.player_team);
			this.PlayTurn(10000000000);
			}
		}
		
	ChangeTargetPriority( p ) { 
		this.player_target_priority = p;
		this.player_team.target_priority = p;
		this.combat.SortTargets(this.player_team);
		}
		
	FormatResolutionLabel() { 
		// reformat the combat status to be from the player's point of view
		if ( this.combat.status && this.combat.winner ) {
			let i_win = 
				( this.combat.winner == 'ATTACKER' && this.combatdata.attacker.owner.is_player ) 
				|| ( this.combat.winner == 'DEFENDER' && this.combatdata.defender.owner.is_player ) 
				;
			// if i "lost" but technically have retreating ships, it's not really "Defeat"
			if ( !i_win && this.player_team.ships_retreated ) { 
				this.combat.status = 'ESCAPED' ;
				}
			else {
				this.combat.status = i_win ? 'VICTORY!' : 'DEFEAT!' ;
				}
			}	
		}
		
	PlayTurn( manual_turn_delta = 0 ) { 
		if ( this.combat && !this.processing ) {
			this.processing = true;
			// resort in case player did any target selection
			this.combat.SortTargets(this.player_team);
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
		if ( !this.last_turnlog || this.combat_speed <= 0.05 ) { return; }
		let log = Object.assign( {}, this.last_turnlog ); // can't rely on this with setTimeouts
		
		// origin and target points on screen
		let attacker_el = document.getElementById( 'ship-' + log.ship.id.toString() );
		let defender_el = document.getElementById( 'ship-' + log.target.id.toString() );
		let rect = attacker_el.getBoundingClientRect();
		let x1 = rect.left + ( attacker_el.offsetWidth / 2 );
		let y1 = rect.top + ( attacker_el.offsetHeight / 2 ) - 25;
		rect = defender_el.getBoundingClientRect();
		let x2 = rect.left + ( defender_el.offsetWidth / 2 ) - 25;
		let y2 = rect.top + ( defender_el.offsetHeight / 2 ) - 25;
		let length = Math.sqrt( Math.pow( Math.abs( x1 - x2 ), 2 ) + Math.pow( Math.abs( y1 - y2 ), 2 ) );
		let angle = Math.atan2( (y2-y1),(x2-x1)) * (180/Math.PI);		

		// make weapon FX
		let el = document.createElement("div"); 
		el.style.transformOrigin = '0 50%';
	    el.style.transform = `rotate(${angle}deg)`;
		el.style.position = 'absolute';
		el.style.top = y1 + 'px';
		el.style.left = x1 + 'px';
		el.style.zIndex = '1000';
	    el.style.transition = ( (this.turn_delay / 1000) * this.combat_speed) + "s transform linear";		
		// weapon specific goodies
		el.style.background = log.weapon.fx.bg;
		el.style.height = log.weapon.fx.h + 'px';
		el.style.width = log.weapon.fx.w + 'px';
		if ( 'borderRadius' in log.weapon.fx ) {  el.style.borderRadius = log.weapon.fx.borderRadius; }
		
		let pane = document.getElementById('shipcombat_pane');
		pane.appendChild(el); 
		el.focus();
		
	    el.style.transform = `rotate(${angle}deg) translateX(${length-log.weapon.fx.w}px) `;
	    
	    // remove element after animation runs
	    setTimeout( () => el.remove(), this.turn_delay * this.combat_speed );
	   
	   // optional explosion
	    if ( !log.missed ) { 
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
			
		// headsup hit stat
		if ( this.combat_speed > 0.1 ) {
		
			let MakeHitStat = (msg,classname) => {
				let x = document.createElement("div"); 
				x.appendChild( document.createTextNode( msg ) );
				x.className = 'shipcombat_hit_stat ' + classname;
				x.style.position = 'absolute';
				x.style.top = (y2-50) + 'px';
				x.style.left = x2 + 'px';
				x.style.zIndex = '1010';
				pane.appendChild(x);
				setTimeout( () => { x.remove();}, 1000 ); // 1000 is hard set by class
				};
				
			setTimeout( () => {
				// missed
				if ( log.missed ) {
					MakeHitStat('missed','missed');
					}
				// hull and/or armor damage
				else if ( log.killed ) { 
					MakeHitStat('destroyed!','killed');
					}
				else {
					// hull
					if ( log.hull ) {
						MakeHitStat( log.hull.toString(), 'hull' );
						}
					// armor
					if ( log.armor ) {
						MakeHitStat( log.armor.toString(), 'armor' );		
						}
					}
				}, this.turn_delay * this.combat_speed 
				);
			}
		}
				
	}
