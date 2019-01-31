import Star from './Star';
import Civ from './Civ';
import Fleet from './Fleet';
import * as utils from '../util/utils';
import {Ship,ShipBlueprint} from './Ship';
import * as Tech from './Tech';

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
		// annoyance left?
		if ( this.to.diplo.contacts.get(this.from).annoyed < 0.05 ) { 
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
		acct.annoyed -= 0.4;
		if ( acct.annoyed < 0 ) { acct.annoyed = 0; }
		
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
					// dispurse any techs
					if ( i.obj.yields.length ) { 
						for ( let t of i.obj.yields ) { 
							to.tech.techs.set(t,Tech.Techs[t]);
							Tech.Techs[t].onComplete( to ); // run callback
							}
						}
					// move node into the completed pile
					console.log( to.name + ' is getting ' + i.obj.key );
					to.tech.nodes_compl.set( i.obj.key, i.obj );
					to.tech.nodes_avail.delete( i.obj.key );
					to.RecalcAvailableTechNodes();
					if ( to.tech.current_project == i.obj ) { 
						to.tech.current_project = null;
						to.AI_ChooseNextResearchProject();
						}
					console.log(to.tech.nodes_compl);
					break;
					}
				case 'cash': {
					from.treasury -= i.amount;
					to.treasury += i.amount;
					break;
					}
				case 'treaty': {
					// todo
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
