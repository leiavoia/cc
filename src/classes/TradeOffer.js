import Star from './Star';
import Civ from './Civ';
import Fleet from './Fleet';
import * as utils from '../util/utils';
import {Ship,ShipBlueprint} from './Ship';

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
		this.hash = utils.hash( from.id + to.id + JSON.stringify(offer) + JSON.stringify(ask) + tone );
		}
		
	// returns true, false, or counter-offer (new TradeOffer)
	Evaluate() { 
		// can these two civ's contact each other?
		if ( !this.from.InRangeOf(this.to) ) { 
			this.status = 'out of range'; 
			return false; 
			}
		// can they communicate?
		this.from.CommOverlapWith( this.to );
		// annoyance left?
		// TODO
		
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
		
		// TODO decrement annoyance level 
		
		return result;
		}
		
	// finalizes the deal and handles who gets what
	Exchange() {
		// this.to receives this.offer
		
		// this.from receives this.ask
		
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
