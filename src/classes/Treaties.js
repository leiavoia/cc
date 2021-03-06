import Star from './Star';
import Civ from './Civ';
import {App} from '../app';
import * as utils from '../util/utils';

// NOTES: treaties are reciprocal. Each civ keeps a 
// separate copy of the treaty and each copy is evaluated
// independently. So if a treaty is added, updated, removed
// or broken, it likely will need two actions to handle, 
// one from each civ.

// Creates a treaty (does not require `new` keyword). 
// Remember to call Init() afterwards if there is one.
export function Treaty( type, us, them, turn_num, ttl = -1 ) { 
	let obj = Object.create( Treaties[type] );
	obj.us = us;
	obj.them = them;
	obj.turn_num = turn_num;
	obj.created_on = turn_num;
	obj.ttl = ttl;
	// wrap the turn function with some TTL code to expire old treaties	
	let f = obj.onTurn;
	obj.onTurn = function (turn_num) { 
		this.turn_num++;
		if ( typeof(f) === 'function' ) { f.call( this, turn_num ); }
		if ( this.ttl > 0 ) { this.ttl--; }
		return this.ttl === 0;
		}
	return obj;
	}

export const Treaties = {
	// note: `type` attribute is added afterwards automatically
	NON_AGGRESSION : { 
		label: 'Non-Aggression Pact',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.lovenub >= 0.25 && !acct.treaties.has(this.type) && acct.comm >= 0.2;
			},
		// call this every turn. override to do anything you want.
		// returns FALSE if it expired and needs removal.
		onTurn: function ( turn_num ) {
			},
		Init: function() {
			this.us.RemoveDiploLogEntry( this.them, 'CEASEFIRE' ); // replaces a ceasefire
			this.us.RemoveDiploLogEntry( this.them, this.type );
			this.us.LogDiploEvent( this.them, 15, this.type, this.label, true );
			// no hard feelin's
			for ( let i = this.us.ai.objectives.length-1; i >= 0; i-- ) { 
				let o = this.us.ai.objectives[i];
				if ( ['invade','intercept','berzerk','bombard'].contains(o.type) ) {
					if ( 'fleet' in o && o.fleet ) { o.fleet.ai = null; }
					this.us.ai.objectives.splice(i,1);
					}
				}
			}
		},
	SURVEIL : { 
		label: 'Surveillance Agreement',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.lovenub >= 0.6 && !acct.treaties.has(this.type) && acct.comm >= 0.5;
			},
		onTurn: function ( turn_num ) {
			},
		Init: function() {
			this.us.RemoveDiploLogEntry( this.them, this.type );
			this.us.LogDiploEvent( this.them, 5, this.type, this.label, true );
			if ( this.us.is_player ) { 
				App.instance.game.RecalcStarRanges();
				App.instance.game.RecalcFleetRanges();
				}
			}
		},
	RESEARCH : { 
		label: 'Research Sharing Agreement',
		income_last_turn: 0,
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.lovenub >= 0.65 && !acct.treaties.has(this.type) && acct.comm >= 0.7;
			},
		onTurn: function ( turn_num ) {
			const maxpct = 0.15; // 15% of our per-turn RP when fully vested
			let mod = utils.Clamp( ( turn_num - this.created_on ) / 50, 0, 1 );
			const amount = Math.ceil( this.them.research_income * mod * maxpct );
			this.us.research += amount; // running game total
			this.us.research_income += amount; // this turn total
			this.income_last_turn = amount;
			// NOTE: unlike money, `research_income` is processed based on income 
			// from that turn. it would become self-referencing here, but it also 
			// resets each turn, so seems to be okay, but not ideal.
			},
		Init: function() { 
			this.us.RemoveDiploLogEntry( this.them, this.type );
			this.us.LogDiploEvent( this.them, 10, this.type, this.label, true );
			}
		},
	TRADE : { 
		label: 'Trade Agreement',
		income_last_turn: 0,
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.lovenub >= 0.35 && !acct.treaties.has(this.type) && acct.comm >= 0.3;
			},
		onTurn: function ( turn_num ) {
			const maxpct = 0.15; // 15% of our per-turn revenue when fully vested
			let mod = utils.Clamp( ( turn_num - this.created_on ) / 50, 0, 1 );
			const amount = Math.ceil( this.them.econ.income * mod * maxpct );
			this.us.resources.$ += amount;
			this.income_last_turn = amount;
			// Civ::DoAccounting() handles the rest
			},
		Init: function() { 
			this.us.RemoveDiploLogEntry( this.them, this.type );
			this.us.LogDiploEvent( this.them, 10, this.type, this.label, true );
			}
		},
	TECH_BROKERING : { 
		label: 'Technology Rights Agreement',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.lovenub >= 0.41 && !acct.treaties.has(this.type) && acct.comm >= 0.5;
			},
		onTurn: function ( turn_num ) {
			},
		Init: function() { 
			this.us.RemoveDiploLogEntry( this.them, this.type );
			this.us.LogDiploEvent( this.them, 5, this.type, this.label, true );
			}
		},
	NO_STAR_SHARING : { 
		label: 'Stellar Exclusivity Agreement',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.lovenub >= 0.2 && !acct.treaties.has(this.type) && acct.comm >= 0.3;
			},
		onTurn: function ( turn_num ) {
			},
		Init: function() { 
			this.us.RemoveDiploLogEntry( this.them, this.type );
			this.us.LogDiploEvent( this.them, 5, this.type, this.label, true );
			}
		},
	ALLIANCE : { 
		label: 'Political Alliance',
		desc: 'Both parties agree to come to each other\'s aid in times of war.',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.lovenub >= 0.7 && !acct.treaties.has(this.type) && acct.comm >= 0.6;
			},
		onTurn: function ( turn_num ) {
			},
		Init: function() { 
			this.us.RemoveDiploLogEntry( this.them, this.type );
			this.us.LogDiploEvent( this.them, 50, this.type, this.label, true );
			}
		},
	TECH_ALLIANCE : { 
		label: 'Technology Alliance',
		desc: '',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.lovenub >= 0.75 && !acct.treaties.has(this.type) && acct.comm >= 0.8;
			},
		onTurn: function ( turn_num ) {
			},
		Init: function() {
			this.us.RemoveDiploLogEntry( this.them, this.type );
			this.us.LogDiploEvent( this.them, 25, this.type, this.label, true );
			let SwapFunc = function ( civ1, civ2 ) { 
				// trade all techs between civs
				for ( let t of civ1.tech.compl ) { 
					// trading partner already has this? 
					if ( civ2.tech.compl_keys[t.node.key] ) { continue; }
					// tech brokering agreement in effect?
					if ( 'source' in t && t.source ) {
						const acct = civ1.diplo.contacts.get( t.source );
						if ( acct && acct.treaties.has('TECH_BROKERING') ) {
							continue;
							}
						}
					civ2.CompleteTechNode( t, civ1, false );
					}
				}
			SwapFunc( this.us, this.them );
			SwapFunc( this.them, this.us );
			}
		},
	CEASEFIRE : { 
		label: 'Cease-Fire',
		desc: 'Both parties agree not to assault or invade each other.',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.treaties.has('WAR');
			},
		onTurn: function ( turn_num ) {
			},
		Init: function() {
			this.us.RemoveDiploLogEntry( this.them, this.type );
			this.us.RemoveDiploLogEntry( this.them, 'WAR' );
			this.us.RemoveDiploLogEntry( this.them, 'recent_war' );
			this.us.LogDiploEvent( this.them, 15, this.type, this.label, true );
			this.us.LogDiploEvent( this.them, -50, 'recent_war', 'Recently at war.' );
			this.us.EndTreaty('WAR',this.them);
			// no hard feelin's
			for ( let i = this.us.ai.objectives.length-1; i >= 0; i-- ) { 
				let o = this.us.ai.objectives[i];
				if ( ['invade','intercept','berzerk','bombard'].contains(o.type) ) {
					if ( 'fleet' in o && o.fleet ) { o.fleet.ai = null; }
					this.us.ai.objectives.splice(i,1);
					}
				}
			}
		},
	WAR : { 
		label: 'War',
		desc: 'Parties are at war.',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return !acct.treaties.has('WAR');
			},
		onTurn: function ( turn_num ) {
			},
		Init: function() {
			const acct = this.us.diplo.contacts.get(this.them);
			// cancel all treaties
			if ( acct ) {
				for ( let [type,treaty] of acct.treaties ) { 
					if ( type != 'WAR' ) { 
						acct.treaties.delete(type);
						this.them.diplo.contacts.get(this.us).treaties.delete(type);
						// clean out any sticky treaties in the reputation log. 
						// nobody cares how nice you USED to be!
						this.them.RemoveDiploLogEntry( this.us, type );
						this.us.RemoveDiploLogEntry( this.them, type );
						this.us.RemoveDiploLogEntry( this.them, 'recent_war' );
						}
					}
				}
			// [!]TODO it KINDA matters who started the war in the first place
			this.us.LogDiploEvent( this.them, -100, this.type, this.label, 'true' );
			// [!]TODO How to handle alliances and love triangles?
			}
		},
// 	ECON_ALLIANCE : { 
// 		label: 'Economic Alliance',
// 		desc: '',
// 		AvailTo: function (a,b) { 
// 			const acct = a.diplo.contacts.get(b);
// 			return acct.lovenub >= 0.85 && !acct.treaties.has(this.type);
// 			},
// 		onTurn: function ( turn_num ) {
// 			// TODO
// 			},
// 		Init: function() {
// 			}
// 		},
// 	EXPLORATION : { 
// 		label: 'Exploration Agreement',
// 		AvailTo: function (a,b) { 
// 			const acct = a.diplo.contacts.get(b);
// 			return acct.status >= 0 && !acct.treaties.has(this.type);
// 			},
// 		onTurn: function ( turn_num ) {
// 			}
// 		},
// 	RESOURCE : { 
// 		label: 'Resource Exchange Agreement',
// 		AvailTo: function (a,b) { 
// 			const acct = a.diplo.contacts.get(b);
// 			return acct.status >= 0 && !acct.treaties.has(this.type);
// 			},
// 		onTurn: function ( turn_num ) {
// 			},
// 		Init: function() { }
// 		},
// 	CULTURE : { 
// 		label: 'Cultural Exchange Program',
// 		AvailTo: function (a,b) { 
// 			const acct = a.diplo.contacts.get(b);
// 			return acct.status >= 0 && !acct.treaties.has(this.type);
// 			},
// 		onTurn: function ( turn_num ) {
// 			},
// 		Init: function() { }
// 		},
// 	ESPIONAGE : { 
// 		label: 'Espionage Exchange',
// 		AvailTo: function (a,b) { 
// 			const acct = a.diplo.contacts.get(b);
// 			return acct.status >= 1 && !acct.treaties.has(this.type);
// 			},
// 		onTurn: function ( turn_num ) {
// 			},
// 		Init: function() { }
// 		},
	}
	
// add keys to objects themselves for later self-reference
for ( let k in Treaties ) { Treaties[k].type = k; }
