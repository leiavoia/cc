import GroundCombat from '../../classes/GroundCombat';
import {Mod,Modlist} from '../../classes/Mods';

export class GroundCombatPane {

	constructor() { 
		this.combat = null;
		this.processing = false;
		this.turn_delay = 500; // ms
		this.last_turnlog = { attacker: null, defender:null };
		this.combat_speed = 0.5; // multiplier
		this.winner = '';
		this.player_team = null;
		this.player_won = false;
		this.finished = false;
		this.odds = 0; // improved odds
		this.oddscost = 0; // cost of improved odds. connected to slider
	    this.oddscost_slider = 0;
	    }
	   
	get oddscost_slider() { return this.oddscost; }
	set oddscost_slider( v ) { 
		if ( this.player_team ) { 
			v = parseFloat(v);
			this.oddscost = v;
			this.odds = 1 + Math.sqrt( v / this.player_team.odds_base_cost );
			this.player_team.mods.RemoveMatching( 'ground_roll', null, this );
			if ( this.oddscost ) {  
				let m = new Mod( 'ground_roll', '*', this.odds, 'Command Override', this );
				this.player_team.mods.Add( m );	
				this.combat.CalcOdds();
				}
			
			
			}
		}
	activate(data) {
		this.app = data.app;
		this.combatdata = data.obj;
		this.onChangeCombatdata();
		}
		
	bind() { 
		//this.onChangeCombatdata();
		}
		
	onChangeCombatdata() { 
		if ( this.combatdata ) { 
			this.combat = new GroundCombat( this.combatdata.attacker, this.combatdata.planet );
			// which team is the human playing?
			this.player_team = this.combat.teams[0].fleet.owner.is_player ? this.combat.teams[0] : this.combat.teams[1];
			// make labels
			this.combat.teams.forEach( team => { 
				team.modlist_labels = [];
				for ( let m of team.mods.Query('ground_roll',true) ) { 
					team.modlist_labels.push( m.toDisplay(1) );
					}
				} );
			// if the defender has no defenses, end combat now
			if ( !this.combat.teams[1].planet.troops.length ) { 
				this.FinishCombat();
				}
			}
		}
		
	ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		// finish up the battles
		this.FinishCombat();
		// tell game this battle is over and continue with other battles
		// NOTE: we actually trigger additional SHIP combats, which need
		// to occur first, and the ship combat routines will automatically
		// start cycling through ground combats if there are no ship
		// combats left in the queue.
		this.app.game.PresentNextPlayerShipCombat(); // not a typo!
		}


	FinishCombat() { 
		if ( this.finished ) { return; }
		else  { 
			this.finished = true;
			if ( !this.combat.status ) { 
				this.processing = false;
				this.combat.Run(false); // drain the queue
				}
			this.last_turnlog = null; // ends hiliting
			this.FormatResolutionLabel();
			// note successfull invasions
			if ( this.combat.winner == 'ATTACKER' && this.app.options.notify.combat ) { 
				if ( this.combatdata.attacker.owner.is_player ) { 
					this.app.AddNote(
						'good',
						`Victory at ${this.combatdata.planet.name}!`,
						`Our invasion was a success. You may inspect the new planet.`,
						() => this.app.SwitchSideBar( this.combatdata.planet )
						);
					}
				else {
					this.app.AddNote( 'bad', `Colony at ${this.combatdata.planet.name} has been lost.` );
					}
				this.app.game.CheckForCivDeath();
				}
			}
		}

	ChangeTargetPriority( p ) { 
// 		this.player_target_priority = p;
// 		this.player_team.target_priority = p;
// 		this.combat.SortTargets(this.player_team);
		}
		
	FormatResolutionLabel() { 
		// reformat the combat status to be from the player's point of view
		if ( this.combat.status && this.combat.winner && this.combat.status != 'ANNIHILATION' ) {
			this.player_won =
				( this.combat.winner == 'ATTACKER' && this.combatdata.attacker.owner.is_player ) 
				|| ( this.combat.winner == 'DEFENDER' && this.combatdata.planet.owner.is_player ) 
				;
			this.combat.status = this.player_won ? 'VICTORY!' : 'DEFEAT!' ;
			}	
		}

	PlayCombat() {
		// player-purchased odds
		if ( this.oddscost ) { 
			this.player_team.owner.resources.$ -= this.oddscost;
			}
		this.processing = true;
		this.PlayNextAttack();
		}
		
	PlayNextAttack( with_delta = 0 ) {
		if ( !this.processing ) { return false; } 
		// make attack
		this.last_turnlog = this.combat.Run(true); // one item at a time
		if ( this.last_turnlog && this.last_turnlog.length ) { 
			this.last_turnlog = this.last_turnlog[0];
			}
		this.DoWeaponFX();
		// if combat resolved or no more items to play this round, stop
		if ( this.combat.status || !this.last_turnlog ) {
			this.FinishCombat();
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
		let attacker_el = document.querySelector( '#groundunit-' + log.unit.id.toString() + ' IMG');
		let defender_el = document.querySelector( '#groundunit-' + log.target.id.toString() + ' IMG' );
		let rect = attacker_el.getBoundingClientRect();
		let x1 = rect.left + ( (rect.right - rect.left) / 2 );
		let y1 = rect.top + ( (rect.bottom - rect.top) / 2 );
		rect = defender_el.getBoundingClientRect();
		let x2 = rect.left + ( (rect.right - rect.left) / 2 );
		let y2 = rect.top + ( (rect.bottom - rect.top) / 2 );
		// let length = Math.sqrt( Math.pow( Math.abs( x1 - x2 ), 2 ) + Math.pow( Math.abs( y1 - y2 ), 2 ) );
		// let angle = Math.atan2( (y2-y1),(x2-x1)) * (180/Math.PI);		

		// make weapon FX
		// let el = document.createElement("div"); 
		// el.style.transformOrigin = '0 50%';
	    // el.style.transform = `rotate(${angle}deg)`;
		// el.style.position = 'absolute';
		// el.style.top = y1 + 'px';
		// el.style.left = x1 + 'px';
		// el.style.zIndex = '1000';
	    // el.style.transition = ( (this.turn_delay / 1000) * this.combat_speed) + "s transform linear";		
		// // weapon specific goodies
		// el.style.background = log.weapon.fx.bg;
		// el.style.height = log.weapon.fx.h + 'px';
		// el.style.width = log.weapon.fx.w + 'px';
		// if ( 'borderRadius' in log.weapon.fx ) {  el.style.borderRadius = log.weapon.fx.borderRadius; }
		
		let pane = document.getElementById('combat_pane');
		// pane.appendChild(el); 
		// el.focus();
		
	    // el.style.transform = `rotate(${angle}deg) translateX(${length-log.weapon.fx.w}px) `;
	    
	    // remove element after animation runs
	    // setTimeout( () => el.remove(), this.turn_delay * this.combat_speed );
	   
	   	// explosionses!
	    if ( log.died ) { 
			let x = document.createElement("div"); 
			x.className = 'explosion';
			x.style.position = 'absolute';
			x.style.top = y1 + 'px';
			x.style.left = x1 + 'px';
			x.style.zIndex = '1000';
			pane.appendChild(x);
			setTimeout( () => { x.remove();}, 500 ); // 500 is hard set by explosion class
			}
	    if ( log.target_died ) { 
			let x = document.createElement("div"); 
			x.className = 'explosion';
			x.style.position = 'absolute';
			x.style.top = y2 + 'px';
			x.style.left = x2 + 'px';
			x.style.zIndex = '1000';
			pane.appendChild(x);
			setTimeout( () => { x.remove();}, 500 ); // 500 is hard set by explosion class
			}
			
		}
				
	}
