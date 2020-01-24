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
			let msg = 'We made a fair trade.';
			this.from.BumpLoveNub(0.025);
			// sweet deal / gift
			if ( this.score >= this.to.diplo.offer_ok_at + 0.5 ) { 
				this.from.BumpLoveNub(0.075);
				msg = 'You gave us a generous trade.';
				}
			let diploscore = 5 + 3 * ( this.score - this.to.diplo.offer_ok_at );
			this.to.LogDiploEvent( this.from, diploscore, 'good_trade', msg );
			this.from.LogDiploEvent( this.to, 5, 'good_trade', 'You accepted our offer.' );
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
			let msg = 'You refused our offer';
			if ( this.score < this.to.diplo.offer_bad_at ) {
				this.from.BumpLoveNub(-0.05);
				msg = 'Your offer was an insult.';
				}
			let diploscore = -5 - 3 * ( this.to.diplo.offer_bad_at - this.score );
			this.to.LogDiploEvent( this.from, diploscore, 'no_trade', msg );
			this.from.LogDiploEvent( this.to, -3, 'no_trade', 'You refused our offer.' );
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
					to.CompleteTechNode( {node:i.obj, rp:i.obj.rp}, from, false );
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
