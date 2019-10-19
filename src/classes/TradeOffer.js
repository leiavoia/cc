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
	raw_diff = 0; // difference in scoring the deal. used for counter offers.
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
			this.from.BumpLoveNub(0.025);
			// sweet deal / gift
			if ( this.score >= this.to.diplo.offer_good_at + 0.5 ) { 
				this.from.BumpLoveNub(0.075);
				}
			this.Exchange();
			}
			
		// countered
		else if ( this.score >= this.to.diplo.offer_counter_at ) {
			result = this.to.AI_CreateCounterOffer( this );
			this.status = 'countered';
			}
		
		// declined
		else {
			result = false;
			this.status = 'declined';
			if ( this.score < this.to.diplo.offer_bad_at ) {
				this.from.BumpLoveNub(-0.05);
				}
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
					from.resources.$ -= parseFloat(i.amount);
					to.resources.$ += parseFloat(i.amount);
					break;
					}
				case 'resource': {
					from.resources[i.key] -= parseFloat(i.amount);
					to.resources[i.key] += parseFloat(i.amount);
					break;
					}
				case 'treaty': {
					// NOTE: the treaty type is actually a string as `i.obj`
					from.CreateTreaty( i.obj, to ); // automatically reciprocal
					break;
					}
				case 'planet': {
					i.obj.BeConqueredBy(to);
					break;
					}
				// TODO: unilateral actions (may be a different item type altogether)
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
