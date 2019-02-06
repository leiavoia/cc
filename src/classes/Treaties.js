import Star from './Star';
import Civ from './Civ';
import * as utils from '../util/utils';

// NOTES: treaties are reciprocal. Each civ keeps a 
// separate copy of the treaty and each copy is evaluated
// independently. So if a treaty is added, updaed, removed
// or broken, it likely will need two actions to handle, 
// one from each civ.

// Creates a treaty. Also calls any Init().
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
	// Fire it up
	if ( 'Init' in obj ) { obj.Init(); }
	return obj;
	}

export const Treaties = {
	// note: `type` attribute is added afterwards automatically
	NON_AGGRESSION : { 
		label: 'Non-Aggression Pact',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.status >= -1 && acct.status < 1 && !acct.treaties.has(this.type);
			},
		// call this every turn. override to do anything you want.
		// returns FALSE if it expired and needs removal.
		onTurn: function ( turn_num ) {
			// slight benefit to relations: 
			this.us.BumpLoveNub( this.them, 0.01 );
			// check for recent aggressions
				// setback in relations
				// audience warning *tsk tsk*
				// change status
			}
		},
	EXPLORATION : { 
		label: 'Exploration Agreement',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.status >= 0 && !acct.treaties.has(this.type);
			},
		onTurn: function ( turn_num ) {
			this.us.BumpLoveNub( this.them, 0.01 );
			}
		},
	SURVEIL : { 
		label: 'Surveillance Agreement',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.status >= 1 && !acct.treaties.has(this.type);
			},
		onTurn: function ( turn_num ) {
			// this.us.BumpLoveNub( this.them, 0.01 );
			},
		Init: function() { }
		},
	RESEARCH : { 
		label: 'Research Sharing Agreement',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.status >= 1 && !acct.treaties.has(this.type);
			},
		onTurn: function ( turn_num ) {
			// this.us.BumpLoveNub( this.them, 0.01 );
			},
		Init: function() { }
		},
	TRADE : { 
		label: 'Trade Agreement',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.status >= 0 && !acct.treaties.has(this.type);
			},
		onTurn: function ( turn_num ) {
			// this.us.BumpLoveNub( this.them, 0.01 );
			},
		Init: function() { }
		},
	RESOURCE : { 
		label: 'Resource Exchange Agreement',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.status >= 0 && !acct.treaties.has(this.type);
			},
		onTurn: function ( turn_num ) {
			// this.us.BumpLoveNub( this.them, 0.01 );
			},
		Init: function() { }
		},
	TECH_BROKERING : { 
		label: 'Technology Rights Agreement',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.status >= 0 && !acct.treaties.has(this.type);
			},
		onTurn: function ( turn_num ) {
			// this.us.BumpLoveNub( this.them, 0.01 );
			},
		Init: function() { }
		},
	CULTURE : { 
		label: 'Cultural Exchange Program',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.status >= 0 && !acct.treaties.has(this.type);
			},
		onTurn: function ( turn_num ) {
			// this.us.BumpLoveNub( this.them, 0.01 );
			},
		Init: function() { }
		},
	ESPIONAGE : { 
		label: 'Espionage Exchange',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.status >= 1 && !acct.treaties.has(this.type);
			},
		onTurn: function ( turn_num ) {
			// this.us.BumpLoveNub( this.them, 0.01 );
			},
		Init: function() { }
		},
	NO_STAR_SHARING : { 
		label: 'Stellar Exclusivity Agreement',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.status >= -1 && !acct.treaties.has(this.type);
			},
		onTurn: function ( turn_num ) {
			// this.us.BumpLoveNub( this.them, 0.01 );
			},
		Init: function() { }
		},
	ALLIANCE : { 
		label: 'Political Alliance',
		desc: 'Increases status to "Alliance". Both parties agree to work together closely and come to each other\'s aid in times of war. Allows deeper kinds of alliances.',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.status == 1 && !acct.treaties.has(this.type);
			},
		onTurn: function ( turn_num ) {
			this.us.BumpLoveNub( this.them, 0.01 );
			},
		Init: function() {
			this.us.UpdateDiploStatus( this.them, 2 );
			this.us.diplo.contacts(this.them).treaties.delete('FRIENDSHIP');
			this.them.diplo.contacts(this.us).treaties.delete('FRIENDSHIP');
			}
		},
	TECH_ALLIANCE : { 
		label: 'Technology Alliance',
		desc: '',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.status == 2 && !acct.treaties.has(this.type);
			},
		onTurn: function ( turn_num ) {
			this.us.BumpLoveNub( this.them, 0.01 );
			},
		Init: function() {
			this.us.UpdateDiploStatus( this.them, 2 );
			this.us.diplo.contacts(this.them).treaties.delete('FRIENDSHIP');
			this.them.diplo.contacts(this.us).treaties.delete('FRIENDSHIP');
			}
		},
	ECON_ALLIANCE : { 
		label: 'Economic Alliance',
		desc: '',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.status == 2 && !acct.treaties.has(this.type);
			},
		onTurn: function ( turn_num ) {
			this.us.BumpLoveNub( this.them, 0.01 );
			},
		Init: function() {
			this.us.UpdateDiploStatus( this.them, 2 );
			this.us.diplo.contacts(this.them).treaties.delete('FRIENDSHIP');
			this.them.diplo.contacts(this.us).treaties.delete('FRIENDSHIP');
			}
		},
	FRIENDSHIP : { 
		label: 'Friendship Agreement',
		desc: 'Increases status "Friendship". Makes a variety of sharing agreements possible.',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.status == 0 && !acct.treaties.has(this.type);
			},
		onTurn: function ( turn_num ) {
			this.us.BumpLoveNub( this.them, 0.01 );
			},
		Init: function() {
			this.us.UpdateDiploStatus( this.them, 1 );
			}
		},
	PEACE : { 
		label: 'Peace Treaty',
		desc: 'Ends hostilities between parties and puts them on "Neutral" status.',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.status == -1 && !acct.treaties.has(this.type);
			},
		onTurn: function ( turn_num ) {
			this.us.BumpLoveNub( this.them, 0.005 );
			},
		Init: function() {
			this.us.UpdateDiploStatus( this.them, 0 );
			this.us.diplo.contacts(this.them).treaties.delete('CEASEFIRE');
			this.them.diplo.contacts(this.us).treaties.delete('CEASEFIRE');
			}
		},
	CEASEFIRE : { 
		label: 'Cease-Fire',
		desc: 'Increases status to "Adversaries". Both parties agree not to assault, invade, or spy on each other.',
		AvailTo: function (a,b) { 
			const acct = a.diplo.contacts.get(b);
			return acct.status == -2 && !acct.treaties.has(this.type);
			},
		onTurn: function ( turn_num ) {
			this.us.BumpLoveNub( this.them, 0.005 );
			},
		Init: function() {
			this.us.UpdateDiploStatus( this.them, -1 );
			}
		},
	}
	
// add keys to objects themselves for later self-reference
for ( let k in Treaties ) { Treaties[k].type = k; }
