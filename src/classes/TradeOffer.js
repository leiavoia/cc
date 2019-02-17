import Star from './Star';
import Civ from './Civ';
import Fleet from './Fleet';
import * as utils from '../util/utils';
import {Ship,ShipBlueprint} from './Ship';
import {Treaties,Treaty} from './Treaties';
import * as Tech from './Tech';
import {App} from '../app';

export default class TradeOffer {
	from = null;
	to = null;
	offer = [];
	ask = [];
	tone = 'neutral'; // threat, insist, neutral, favor, beg
	status = 'pending'; // pending, accepted, declined, countered
	score = 0; // how recipient valued the deal
	hash = 0; // for quickly comparing two deals
	
	constructor( from, to, offer, ask, tone = 'neutral' ) { 
		this.from = from;
		this.to = to;
		this.offer = offer || [];
		this.ask = ask || [];
		this.tone = tone;
		// TODO: broken, cyclic references
// 		this.hash = utils.hash( `${from.id}-${to.id}-` + JSON.stringify(offer) + JSON.stringify(ask) + tone );
		}
		
	// returns true, false, or counter-offer (new TradeOffer)
	Evaluate() { 
		let acct = this.to.diplo.contacts.get(this.from);
		
		// can these two civ's contact each other?
		if ( !this.from.InRangeOfCiv(this.to) ) { 
			this.status = 'out of range'; 
			return false; 
			}
		// can they communicate?
		if ( this.from.CommOverlapWith( this.to ) <= 0 ) { 
			this.status = 'can\'t communicate'; 
			return false; 
			}
		// attention span?
		if ( this.to.diplo.contacts.get(this.from).attspan < 0.05 ) { 
			this.status = 'annoyed'; 
			return false; 
			}
		
		// do we like the deal?
		this.score = this.to.AI_ScoreTradeOffer(this);
		let result = false;
		
		// accepted
		if ( this.score >= this.to.diplo.offer_ok_at ) {
			result = true;
			this.status = 'accepted';
			// TODO bonus if we got a sweet deal
			this.Exchange();
			}
			
		// countered
		else if ( this.score >= this.to.diplo.offer_counter_at ) {
			result = this.MakeCounterOffer();
			this.status = 'countered';
			}
		
		// declined
		else if ( this.score >= this.to.diplo.offer_bad_at ) {
			result = false;
			// TODO malus if this was a real stinker
			this.status = 'declined';
			}
		
		// TODO +/- relationship for tone
		
		// be annoyed
		acct.attspan -= 0.4;
		if ( acct.attspan < 0 ) { acct.attspan = 0; }
		
		return result;
		}
		
	// finalizes the deal and handles who gets what
	Exchange() {
		// this.to receives this.offer
		if ( this.offer.length ) { this.Dispurse( this.from, this.to, this.offer ); }
		// this.from receives this.ask
		if ( this.ask.length ) { this.Dispurse( this.to, this.from, this.ask ); }
		}
		
	Dispurse( from, to, items ) { 
		for ( let i of items ) { 
			switch ( i.type ) {
				case 'technode': {
					to.CompleteTechNode( i.obj, from, false );
					break;
					}
				case 'cash': {
					from.treasury -= i.amount;
					to.treasury += i.amount;
					break;
					}
				case 'treaty': {
					// NOTE: the treaty type is actually a string as `i.obj`
					const turn_num = App.instance.game.turn_num;
					if ( !from.diplo.contacts.get(to).treaties.has( i.obj ) ) { 
						const t1 = Treaty( i.obj, from, to, turn_num );
						from.diplo.contacts.get(to).treaties.set( i.obj, t1 );
						if ( 'Init' in t1 ) { t1.Init(); }
						}
					if ( !to.diplo.contacts.get(from).treaties.has( i.obj ) ) { 
						const t2 = Treaty( i.obj, to, from, turn_num );
						to.diplo.contacts.get(from).treaties.set( i.obj, t2 );
						if ( 'Init' in t2 ) { t2.Init(); }
						}
					// TODO: unilateral actions (may be a different item type altogether)
					break;
					}
				case 'planet': {
					i.obj.BeConqueredBy(to);
					break;
					}
				}
			}
		}
		
	MakeCounterOffer() {
		return new TradeOffer(
			this.to, 
			this.from,
			this.ask,
			this.offer // + more stuff
			);
		}
	}
