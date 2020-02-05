import * as utils from '../../util/utils';
import TradeOffer from '../../classes/TradeOffer';

export class AudiencePane {
		
	constructor() {
		this.comm = 0; // communication skills overlap with other civ;
		this.their_dialog = ''; // what they say to us
		this.our_text = ''; // our text to them, if any
		this.ambassador_present = true;
		this.options = [];	
		this.app = null;
		this.civ = null;
		this.acct = null; // diplomatic contact account
		this.data = null; // extra data in case we need to set up a situation
		this.on_exit = ''; // can be '' or 'diplo' or any other main panel 
		// --------------------
		this.mode = 'intro';
		this.info_panel_mode = 'info';
		this.mood = ''; // for portrait visual FX
		this.our_trade_items = [];
		this.their_trade_items = [];
		}

	// "data" is an object with info about what the audiences is going to be about.
	// It must include an "app" reference, a civ "obj".
	// It MAY includes anything else you want to stuff into it.
	// data.message will present a custom greeting.
	// data.offer is a pre-meditated trade offer the AI is presenting to the player.
	activate(data) {
		if ( this.civ || !data || !data.app || !data.obj || !data.obj.diplo || !data.obj.alive ) return false; 
		
		this.app = data.app;
		this.civ = data.obj;
		this.data = data.data;
		
		this.acct = this.app.game.myciv.diplo.contacts.get(this.civ);
		if ( !this.acct ) {
			this.app.CloseMainPanel();
			return false;
			}
		this.comm = this.acct.comm;
		this.their_text = '';
		this.our_text = '';
		this.GetResponse();
		this.SetStandardOptions();
		
		// show anger if at war
		if ( this.acct && this.acct.treaties.has('WAR') ) {
			this.mood = 'mad';
			}			
		// check for trade offers
		if ( this.data && 'offer' in this.data ) {
			this.their_text = `<p>Please consider this offer.</p>`;
			this.offer = this.data.offer;
			this.mode = 'offer_countered';
			}
		// check for preset messages
		if ( this.data && 'message' in this.data ) {
			this.their_text = `<p>${this.data.message}</p>`;
			}
		// check for where to send player after audience concludes
		if ( this.data && 'on_exit' in this.data ) {
			this.on_exit = this.data.on_exit;
			}
		}
		
	// this helps with repeat-activation problems
	determineActivationStrategy() {
		return "replace";
		}
				
	ClickInfo( civ ) {
		this.info_panel_mode = 'info';
		}
		
	ClickLog( civ ) {
		this.info_panel_mode = 'log';
		}
		
	ClickAbout( civ ) {
		this.info_panel_mode = 'about';
		}
		
	ClickRelations( civ ) {
		this.info_panel_mode = 'relations';
		}
						
	CreateTradeItemLists() { 
		this.our_trade_items = this.app.game.myciv.AI_ListItemsForTrade( this.civ );
		this.their_trade_items = this.civ.AI_ListItemsForTrade( this.app.game.myciv );
		// for improved UI intuition, we only put the treaties in the ASK column.
		this.our_trade_items = this.our_trade_items.filter( i => i.type != 'treaty' );
		}
			
	GetResponse() {
		// jibberish if no communication overlap
		if ( this.comm == 0 ) { 
			// [!]TODO base jibberish on race type
			switch ( utils.RandomInt(0,20) ) { // make integers
				// organic
				case 0: { this.their_text = `<p>Obok je akn si po. Koiu bi-bi appuatt je sop bann. Skk pobsh cli wa we je. Ko!</p>`; break; }
				case 1: { this.their_text = `<p>Kai ki ni ti ta kek tak. Takkek ka ti ke ot kekt tuttukne kuta kutei. Kenneketo ki ka na tettet keno.</p>`; break; }
				case 2: { this.their_text = `<p>Bouiasuyu muyu ambu patete? Babayabasuptu busu waime arrabouyapsu ke so. A be so susu ubutnubes.</p>`; break; }
				// plant
				case 3: { this.their_text = `<p>ssS &nbsp; &nbsp; &nbsp; &nbsp; sS &nbsp; &nbsp;s &nbsp; &nbsp;s &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp; &nbsp; &nbsp; S &nbsp;&nbsp; &nbsp; &nbsp; s &nbsp; &nbsp; s &nbsp; &nbsp;s &nbsp;sss &nbsp;&nbsp;&nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;S. S &nbsp; &nbsp; &nbsp; &nbsp; sS &nbsp; &nbsp;s &nbsp; &nbsp;s &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp; &nbsp; &nbsp; S &nbsp;&nbsp; &nbsp; &nbsp; s &nbsp; &nbsp; s &nbsp; &nbsp;s &nbsp;sss &nbsp;&nbsp;&nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;S. </p>`; break; }
				case 4: { this.their_text = `<p>\` &nbsp; &nbsp; ~ ~ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;t H &nbsp; &nbsp; &nbsp; &nbsp; ~ &nbsp; &nbsp;~ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; th &nbsp; &nbsp; h &nbsp; TH  ! &nbsp; &nbsp; &nbsp;\` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;!h &nbsp;&nbsp; &nbsp; &nbsp; ~ ~ &nbsp; &nbsp;t &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;h &nbsp; &nbsp; &nbsp;!! ~ &nbsp; &nbsp; &nbsp;h &nbsp; ~ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;h &nbsp; ~ \`</p>`; break; }
				case 5: { this.their_text = `<p>H &nbsp; &nbsp; &nbsp; &nbsp;h &nbsp; &nbsp;hhh&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; h &nbsp; h &nbsp;h &nbsp; &nbsp; &nbsp; X &nbsp; &nbsp; &nbsp;h &nbsp; h &nbsp; x &nbsp; &nbsp;X</p>`; break; }
				// cyborg
				case 6: { this.their_text = `<p>*bp* Oggoggtet jess pokt. *K* O-. SinNe G-090 hectacol Hh *4*. Segeg %1111. *K*</p>`; break; }
				case 7: { this.their_text = `<p>Vvvvvv V vvvv vV vvvvvvv Vvvvvvvvvvv V V Vvvvvv V Vvvvvv vvv VVvVvV  V Vvvvvv Vvvvvvvvvvvv v v vV v V v VVV VvV VV VVVv</p>`; break; }
				case 8: { this.their_text = `<p>- - ------- - -- -------- ----- - --- --- - ----- ---- --- --- - - ---- -- -- ----- --- - - - -</p>`; break; }
				// robots
				case 9: { this.their_text = `<p>01101001 01100110 00100000 01111001 01101111 01110101 00100000 01100011 01100001 01101110 00100000 01110010 01100101 01100001 01100100 00100000 01110100 01101000 01101001 01110011 00100000 01110100 01101000 01100001 01101110 01101011 00100000 01100001 00100000 01110010 01101111 01100010 01101111 01110100 </p>`; break; }
				case 10: { this.their_text = `<p>F6 E8 30 3A BC 44 60 F9 07 E3 7B 20 47 C5 21 CD A4 4C CA C4 52 88 B8 8F 7D 30 40 4E 06 00 29 AD 43 7C A6 F8 8E 9C EA BC 6F 8F 9C 92 EE AB B7 B7 B7 57 8E 11 6F 4A 47 F8 29 CF 3D 30 F7 9C 03 E8 69 28 E2 45 F2 AE F2 4F 68 B7 0B 5A 94 2E 13 09 41 42 46 13 6C D9 A1 1B C9 C6 0E 9F 90 23 BB 69 14 63 89 12 B0 4A 4B 16 4E 16 A5 90 73 4E 5A 2B D3 9E 0E 53 F1 46 F5 A5 9A AD 4B DC 25 82 42 34 73 60 5B 2E 7F 7B AD 4D 81 B4 10 EA 25 44 E9 32 8D CE 67 99 46 A3 18 D8 54 14 8B A0 50 04 DD 90 62 6D E4 88 6F C7 10 44 CA 8F 9C D1 67 19 73 44 17 48 C1 09 A9 27 B5 9B A2 8A 58 13 7D CE EB 4A 5C 63 0D 48 E0 8F E0 FF</p>`; break; }
				case 11: { this.their_text = `<p>.-- . / ..-. .. -. -.. / -.-- --- ..- .-. / .-.. .- -.-. -.- / --- ..-. / -- --- .-. ... . / -.-. --- -.. . / ... -.- .. .-.. .-.. ... / -.. .. ... .- .--. .--. --- .. -. - .. -. --. .-.-.- / -- --- .-. ... . / -.-. --- -.. . / .. ... / - .... . / .-.. .- -. --. ..- .- --. . / --- ..-. / --- ..- .-. / .--. . --- .--. .-.. . .-.-.-</p>`; break; }
				// rocks
				case 12: { this.their_text = `<p>XkkXkkk KKXKXKkxK KxKxkxkKXkxKXkKx KXkkxkxkKKXK kxkXkKXKK xkxkxKX KXKKXKX kkxkxKKX XKkxkxKXKX xkxk xKX xkkxkXK xkXxkkxkK xK xKkx kKXk xKkxkkXKkkx kk XKk K kk kxKxk x kxkkx XxkKkxXKXx kx k</p>`; break; }
				case 13: { this.their_text = `<p>OooOo OO OOoOo ooooO ooO o OO Oo Oo o ooooooo O o OoOoooo O ooo OOO ooo O O oOoo oo oooO OoOo o o Oo Oo OooO o Oo oooOoo OO oOo OOoooooOooOo oooOOO OOOoO oOOo O OoOoO oO Oo</p>`; break; }
				case 14: { this.their_text = `<p>IIIIII XXXXIIXIII XII IIXI IIIXXXIIIIIIII IIXI III III II XXXXX IIIIXIXIIII II XIII IIX IIIXXII IIXIIII III IIII IXI I III IIIXIXXII IIIIIII IIIIIIIXX II IIIIXIIIIIIIII</p>`; break; }
				// energy
				case 15: { this.their_text = `<p>•••••●•••••●●••••• •••●••• •••••• •••• •●••••••••• ••••• •••●••●●●••••• ••••••●••••••● •••••• • •••●•••●•• •••●●•••••••●•●••••••• •• • ● ••••••●••••●•••</p>`; break; }
				case 16: { this.their_text = `<p>◀★▶◀★★▶★ ▶▶▶★◀◀ ★▶  ★◀ ★▶★◀ ★★◀ ◀▶▶★★ ▶★ ★ ★◀★ ◀▶★★ ★◀▶◀▶◀▶ ★◀★▶ ★◀★★★ ▶▶◀★★▶ ★★ ▶★▶★▶★★ ★★◀★★▶</p>`; break; }
				case 17: { this.their_text = `<p>▶▷►▻ ▻►►►▶▻▷►▷▷▻▷▶▻►▶▷ ▶▻▻▷▶► ▷ ▻►▶ ▻▷►▻▶  ▶►►▻▻▶▶ ▻►►▻▷▷►▷▻▶▷▻▶▻▶▻ ▶► ▻▷▻▷▻▶▻►▻►▷▷▻ ▶▷►▻▻▻▻▻▻▻▻ ▶▻ ►▻▶▶►▷▶ ▶►▷▶▶▷►►▶ ▻▻▻▻►▻▶ ▶▷▻▶► ▻▶▷▶▶▷ ▻▷▻►►▻▻►▶ ▶▻</p>`; break; }
				// transdimensional
				case 18: { this.their_text = `<p>◢◣◤◥◥◤◣◥◢◤◤ ◥◣◣◥◥◢◤◥◢◢◤◢◢◥◣◣◢◢◤◥◢◢◤◣◢◢ ◢◥◤◣ ◤◥◥◥ ◢◢◤◣◥◢◤◣◤◥◢◢ ◢◥◤◣◤◣◥◢◢◢◥◤◥◣◢◤ ◤ ◥◢◤◥◢◣  ◥◣◤◥◥◤ ◢◤◢◢◥◣◢◢◤◢ ◢◥◣◢◥◤ ◤◢◥◣◢◥◥◢◤◤ ◥◢◣◤◣◥◤◣◥◣◤◤◣◥ ◣</p>`; break; }
				case 19: { this.their_text = `<p>✿ ❂ ❀ ❁ ✿ ❁ ❁ ❀ ✿ ✿ ❁ ❄ ❃ ❄ ❀ ✿ ❁ ❂ ❂ ❀ ❄ ❄ ❃ ✿ ❁ ❁ ❀ ✿ ❄ ❂ ❄ ❃ ❀ ✿ ❀ ❄ ❁ ✿ ❄ ❀ ✿ ❂ ❃ ❃ ❄ ❂ ✿ ❀ ❂ ❁ ✿ ❄ ❁ ❀ ❀ ✿ ❀ ❄ ❃ ❀ ✿ ❀ ❄ ❁ ❃ ❄ ❀ ❄ ✿ ❁ ❂ ❃ ❄ ❃ ❁ ✿ ❀ ✿ ❀ ❄ ❂ ❄ ✿ ❃ ❀ ❁ ✿ ❄ ❂ ❁ ✿ ❀ ❄</p>`; break; }
				case 20: { this.their_text = `<p>◐◑◒◓●◔◕◖◗ ◕◓ ◖◔◒◑◗ ●◒◔◖◓◑◐●◕●◗◓ ◒◖◐◔◖◒◑◕◔●●◒ ◑◖◔● ●◗◖◕◕◖◔◓◗◑◒ ◑◔◐●◕◖◓●◒ ◔◗◒ ●◒◐◕◔◑●◔◓◗◓◒ ●●◒◔◕◕◗●◓◑◒ ◖◔● ◒◓◕◔◑◖◑◐ ●◔◗◗◖◔◔ ◕◑● ◒◓◐◔◕◗◐◖● ◑●◓◓◖◕◕◒◖◒●◗◐◐◔● ◓◗●◔◕● ◑◔◐◖◒ ◓◕ ◖◗ ◓◑●◗◖◒◒◓◐●◑◑ ◕◖◖  ●◗◑◖◕◐◔◒◓◕●●◐ ◑◔◔◖◐●◗◕◒◒ ●◑◐◗◗◓◓◕◖◓●</p>`; break; }
				};	
			switch ( this.civ.id % 6 ) { // make integers
				case 0: { this.our_text = '<p>We have been over this again and again. We can not make any sense of this strange language. Perhaps researching <i>communications skills</i> would help?</p>'; break; } 
				case 1: { this.our_text = '<p>Clearly, we are having a hard time understanding their ... "words"? Perhaps with better <i>communication skills</i> we can one day come to understand them.</p>'; break; } 
				case 2: { this.our_text = '<p>Their language is just as weird as they are. There is nothing to be gained from further meetings at this time. Maybe we can come to understand them with time and <i>communication skills</i> research.</p>'; break; } 
				case 3: { this.our_text = '<p>After studying their "language" for months, we have all but given up. Their bizarre stream of clicks and whistles does not correspond to any known form of communication. With more study in <i>communication skills</i> we may one day understand them.</p>'; break; } 
				case 4: { this.our_text = '<p>This species does not use any known form of communication. In fact, we are not even sure if they <i>are</i> communicating. Let\'s just assume they are. Better <i>communication skills</i> may yield better results in the future.</p>'; break; } 
				case 5: { this.our_text = '<p>Uh..... right. None of that makes any sense. There is nothing more we can do with these "things" right now. Perhaps one day better <i>communication skills</i> will enable our species to somehow relate to theirs.</p>'; break; } 
				}
			}
		// first contact
		else if ( this.data && this.data.is_greeting ) { 
			switch ( Math.floor( this.app.game.myciv.LoveNub( this.civ ) / .33333 ) ) { // make integers
				case 0: { this.their_text = `<p>We have no interest in dealing with lesser beings. Do not bother us unless you come bearng gifts.</p>`; break; }
				case 1: { this.their_text = `<p>We look forward to the mutual benefit of our two civilizations.</p>`; break; }
				default: { this.their_text = `<p>We are delighted to meet you and your people.</p>`; break; }
				};
			}
		// not interested in talking right now
		else if ( this.acct.attspan == 0 ) { 
			this.their_text = `<p>I have no time for anything more today.</p>`;
			}
		// intro based on lovenub
		else { 
			switch ( Math.round( this.acct.lovenub * 10 ) ) { // make integers
				case 0: { this.their_text = `<p>Enough of your blather. Get to the point.</p>`; break; }
				case 1: { this.their_text = `<p>It is only due to my great patience that this audience is granted. My time is costly and you are wasting it. Speak.</p>`; break; }
				case 2: { this.their_text = `<p>You are wearing our patience thin. Be brief and then be gone.</p>`; break; }
				case 3: { this.their_text = `<p>Please keep your inquiries to a minimum. I have many meetings today after this one.</p>`; break; }
				case 4: { this.their_text = `<p>What is it you seek from us?</p>`; break; }
				case 5: { this.their_text = `<p>What can we do for you?</p>`; break; }
				case 6: { this.their_text = `<p>What brings the ${this.app.game.myciv.name} to visit us today?</p>`; break; }
				case 7: { this.their_text = `<p>Greetings. To what do we owe this honor?</p>`; break; }
				case 8: { this.their_text = `<p>I have been looking forward to our visit. Let me know what is on your mind.</p>`; break; }
				case 9: { this.their_text = `<p>Hello friend. It is a pleasure to see the <i>${this.app.game.myciv.name}</i> people again. How may we be of assistance?</p>`; break; }
				case 10: { this.their_text = `<p>Always a pleasure to meet with the <i>${this.app.game.myciv.name}</i>. What great things can we accomplish today?</p>`; break; }
				};
			}
		}
		
	DeclareWar() {
		if ( !this.acct.treaties.has('WAR') ) { 
			this.app.game.myciv.CreateTreaty( 'WAR', this.civ ); // this also cancels all other treaties					
			}	
		this.their_text = `<p>You will regret this.</p>`;
		this.options = [ { text:"End audience.", func: () => this.Exit() } ];
		this.mood = 'mad';
		this.offer = null;
		this.mode = 'intro';
		}
		
	ListTreatiesToEnd() {
		this.their_text = null;
		this.our_text = `<p>Which should we end?</p>`;
		this.options = [];
		if ( this.acct ) { 
			for ( const [k,v] of this.acct.treaties ) { 
				this.options.push( { text:v.label, func: () => this.EndTreaty(k) } );
				}
			}	
		this.offer = null;
		this.mode = 'intro';
		}
		
	EndTreaty( type ) {
		this.app.game.myciv.EndTreaty( type, this.civ, true );
		this.their_text = `<p>We are greatly disappointed.</p>`;
		this.our_text = null;
		this.BeMoody('mad');
		this.ReturnToMainMenu();
		}
		
	SetStandardOptions() { 
		this.options = [];
		if ( this.acct && this.comm > 0 ) { 
			if ( this.acct.attspan >= 0.1 ) {
				this.options.push({ text:"Let's make a deal.", func: () => this.StartTradeOffer() });
				}
			if ( this.acct.treaties.size && !this.acct.treaties.has('WAR') ) {
				this.options.push({ text:"End Treaty", func: () => this.ListTreatiesToEnd() });
				}
			if ( !this.acct.treaties.has('WAR') ) { 
				this.options.push({ text:"Declare War", func: () => this.DeclareWar() });
				}
			}
		this.options.push({ text:"End audience.", func: () => this.Exit() });
		};
		
	StartTradeOffer() {
		this.CreateTradeItemLists();
		this.offer = new TradeOffer( this.app.game.myciv, this.civ );
		this.mode = 'create_offer';
		}
		
	AcceptOffer() {
		this.offer.Exchange();
		this.BeMoody('happy');
		this.their_text = `<p>Very well!</p>`;
		this.our_text = '';
		this.ReturnToMainMenu();
		}
		
	DeclineOffer() {
		this.offer = null;
		this.BeMoody('mad');
		this.their_text = `<p>So be it.</p>`;
		this.our_text = '';
		this.ReturnToMainMenu();
		}
		
	CounterOffer() {
		this.CreateTradeItemLists();
		this.offer = new TradeOffer( this.offer.to, this.offer.from, this.offer.ask, this.offer.offer );
		for ( let item of this.offer.offer ) {
			let i = this.our_trade_items.indexOf( item );
			if ( i > -1 ) { this.our_trade_items.splice(i,1); }
			}
		for ( let item of this.offer.ask ) {
			let i = this.their_trade_items.indexOf( item );
			if ( i > -1 ) { this.their_trade_items.splice(i,1); }
			}
		this.mode = 'create_offer';
		}
		
	SubmitOffer() {
		this.mode = 'consider_offer';
		this.mood = 'away';
		setTimeout( () => {
			this.mood = '';
			let result = this.offer.Evaluate();
			this.LogOffer( this.offer );
			if ( this.offer.status == 'countered' ) { 
				this.offer = result;
				this.mode = 'offer_countered';
				this.their_text = `<p>Your offer is intriguing. Would you consider this instead?</p>`;
				}
			else {
				if ( result ) { 
					this.BeMoody('happy'); 
					this.their_text = `<p>We happily accept your offer.</p>`;
					}
				else {
					this.their_text = `<p>Your offer does not appeal to us at this time.</p>`;
					}
				this.ReturnToMainMenu();
				}
			}, 2500 );
		}
		
	LogOffer( offer ) { 
		if ( offer && this.app.options.debug ) {
			console.log(
				'score', offer.score,
				'offer score', offer.offer_score,
				'ask score', offer.ask_score,
				'total score', offer.total_score,
				'weight', offer.importance
				);
			}
		}
		
	PutTradeItem( item, fromlist, tolist, event ) {
		// handle nested slider
		if ( event && event.target.tagName.toLowerCase() == 'input' ) { 
			event.stopPropagation(); 
			return; 
			}
		// regular functionality
		let i = fromlist.indexOf(item);
		if ( i > -1 ) { fromlist.splice(i,1); }
		tolist.push(item);
		// TODO: Sort lists?
		}
		
	BeMoody( mood ) { 
		let was = this.mood;
		this.mood = mood;
		setTimeout( () => this.mood=was, 2000 );
		}
		
	ReturnToMainMenu() {
		this.SetStandardOptions();
		this.offer = null;
		this.mode = 'intro';
		}
		
	Exit() { 
		if ( this.civ && this.acct ) { 
			this.acct.last_aud = this.app.game.turn_num;
			this.civ.diplo.contacts.get(this.app.game.myciv).last_aud = this.app.game.turn_num;
			this.acct.attspan -= (1-this.civ.diplo.focus) * 0.2; // cost of audience
			if ( this.acct.attspan < 0 ) { this.acct.attspan = 0; }
			}	
		this.app.SwitchMainPanel( this.on_exit );
		}
	}
