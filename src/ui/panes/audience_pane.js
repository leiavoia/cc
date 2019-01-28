import * as utils from '../../util/utils';

export class AudiencePane {
		
	constructor() {
		this.comm = 0; // communication skills overlap with other civ;
		this.text_response = ''; // what they say to us
		this.our_response = ''; // our text to them, if any
		this.ambassador_present = true;
		this.options = [];	
		this.app = null;
		this.civ = null;
		this.data = null; // extra data in case we need to set up a situation
		this.on_exit = 'diplo'; // can be '' or 'diplo' or any other main panel 
		}

	activate(data) {
		this.app = data.app;
		this.civ = data.obj;
		this.data = data.data;
		}
		
	ClosePanel() {
		this.app.CloseMainPanel();
		}	
	
	StartMeeting() { 
		this.ambassador_present = true;
		this.GetResponse();
		this.SetStandardOptions();
		}
		
	GetResponse() {
		if ( this.comm == 0 ) { 
			// [!]TODO base jibberish on race type
			switch ( utils.RandomInt(0,20) ) { // make integers
				// organic
				case 0: { this.text_response = `<p>Obok je akn si po. Koiu bi-bi appuatt je sop bann. Skk pobsh cli wa we je. Ko!</p>`; break; }
				case 1: { this.text_response = `<p>Kai ki ni ti ta kek tak. Takkek ka ti ke ot kekt tuttukne kuta kutei. Kenneketo ki ka na tettet keno.</p>`; break; }
				case 2: { this.text_response = `<p>Bouiasuyu muyu ambu patete? Babayabasuptu busu waime arrabouyapsu ke so. A be so susu ubutnubes.</p>`; break; }
				// plant
				case 3: { this.text_response = `<p>ssS &nbsp; &nbsp; &nbsp; &nbsp; sS &nbsp; &nbsp;s &nbsp; &nbsp;s &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp; &nbsp; &nbsp; S &nbsp;&nbsp; &nbsp; &nbsp; s &nbsp; &nbsp; s &nbsp; &nbsp;s &nbsp;sss &nbsp;&nbsp;&nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;S. S &nbsp; &nbsp; &nbsp; &nbsp; sS &nbsp; &nbsp;s &nbsp; &nbsp;s &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp; &nbsp; &nbsp; S &nbsp;&nbsp; &nbsp; &nbsp; s &nbsp; &nbsp; s &nbsp; &nbsp;s &nbsp;sss &nbsp;&nbsp;&nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;S. </p>`; break; }
				case 4: { this.text_response = `<p>\` &nbsp; &nbsp; ~ ~ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;t H &nbsp; &nbsp; &nbsp; &nbsp; ~ &nbsp; &nbsp;~ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; th &nbsp; &nbsp; h &nbsp; TH  ! &nbsp; &nbsp; &nbsp;\` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;!h &nbsp;&nbsp; &nbsp; &nbsp; ~ ~ &nbsp; &nbsp;t &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;h &nbsp; &nbsp; &nbsp;!! ~ &nbsp; &nbsp; &nbsp;h &nbsp; ~ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;h &nbsp; ~ \`</p>`; break; }
				case 5: { this.text_response = `<p>H &nbsp; &nbsp; &nbsp; &nbsp;h &nbsp; &nbsp;hhh&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; h &nbsp; h &nbsp;h &nbsp; &nbsp; &nbsp; X &nbsp; &nbsp; &nbsp;h &nbsp; h &nbsp; x &nbsp; &nbsp;X</p>`; break; }
				// cyborg
				case 6: { this.text_response = `<p>*bp* Oggoggtet jess pokt. *K* O-. SinNe G-090 hectacol Hh *4*. Segeg %1111. *K*</p>`; break; }
				case 7: { this.text_response = `<p>Vvvvvv V vvvv vV vvvvvvv Vvvvvvvvvvv V V Vvvvvv V Vvvvvv vvv VVvVvV  V Vvvvvv Vvvvvvvvvvvv v v vV v V v VVV VvV VV VVVv</p>`; break; }
				case 8: { this.text_response = `<p>- - ------- - -- -------- ----- - --- --- - ----- ---- --- --- - - ---- -- -- ----- --- - - - -</p>`; break; }
				// robots
				case 9: { this.text_response = `<p>01101001 01100110 00100000 01111001 01101111 01110101 00100000 01100011 01100001 01101110 00100000 01110010 01100101 01100001 01100100 00100000 01110100 01101000 01101001 01110011 00100000 01110100 01101000 01100001 01101110 01101011 00100000 01100001 00100000 01110010 01101111 01100010 01101111 01110100 </p>`; break; }
				case 10: { this.text_response = `<p>F6 E8 30 3A BC 44 60 F9 07 E3 7B 20 47 C5 21 CD A4 4C CA C4 52 88 B8 8F 7D 30 40 4E 06 00 29 AD 43 7C A6 F8 8E 9C EA BC 6F 8F 9C 92 EE AB B7 B7 B7 57 8E 11 6F 4A 47 F8 29 CF 3D 30 F7 9C 03 E8 69 28 E2 45 F2 AE F2 4F 68 B7 0B 5A 94 2E 13 09 41 42 46 13 6C D9 A1 1B C9 C6 0E 9F 90 23 BB 69 14 63 89 12 B0 4A 4B 16 4E 16 A5 90 73 4E 5A 2B D3 9E 0E 53 F1 46 F5 A5 9A AD 4B DC 25 82 42 34 73 60 5B 2E 7F 7B AD 4D 81 B4 10 EA 25 44 E9 32 8D CE 67 99 46 A3 18 D8 54 14 8B A0 50 04 DD 90 62 6D E4 88 6F C7 10 44 CA 8F 9C D1 67 19 73 44 17 48 C1 09 A9 27 B5 9B A2 8A 58 13 7D CE EB 4A 5C 63 0D 48 E0 8F E0 FF</p>`; break; }
				case 11: { this.text_response = `<p>.-- . / ..-. .. -. -.. / -.-- --- ..- .-. / .-.. .- -.-. -.- / --- ..-. / -- --- .-. ... . / -.-. --- -.. . / ... -.- .. .-.. .-.. ... / -.. .. ... .- .--. .--. --- .. -. - .. -. --. .-.-.- / -- --- .-. ... . / -.-. --- -.. . / .. ... / - .... . / .-.. .- -. --. ..- .- --. . / --- ..-. / --- ..- .-. / .--. . --- .--. .-.. . .-.-.-</p>`; break; }
				// rocks
				case 12: { this.text_response = `<p>XkkXkkk KKXKXKkxK KxKxkxkKXkxKXkKx KXkkxkxkKKXK kxkXkKXKK xkxkxKX KXKKXKX kkxkxKKX XKkxkxKXKX xkxk xKX xkkxkXK xkXxkkxkK xK xKkx kKXk xKkxkkXKkkx kk XKk K kk kxKxk x kxkkx XxkKkxXKXx kx k</p>`; break; }
				case 13: { this.text_response = `<p>OooOo OO OOoOo ooooO ooO o OO Oo Oo o ooooooo O o OoOoooo O ooo OOO ooo O O oOoo oo oooO OoOo o o Oo Oo OooO o Oo oooOoo OO oOo OOoooooOooOo oooOOO OOOoO oOOo O OoOoO oO Oo</p>`; break; }
				case 14: { this.text_response = `<p>IIIIII XXXXIIXIII XII IIXI IIIXXXIIIIIIII IIXI III III II XXXXX IIIIXIXIIII II XIII IIX IIIXXII IIXIIII III IIII IXI I III IIIXIXXII IIIIIII IIIIIIIXX II IIIIXIIIIIIIII</p>`; break; }
				// energy
				case 15: { this.text_response = `<p>•••••●•••••●●••••• •••●••• •••••• •••• •●••••••••• ••••• •••●••●●●••••• ••••••●••••••● •••••• • •••●•••●•• •••●●•••••••●•●••••••• •• • ● ••••••●••••●•••</p>`; break; }
				case 16: { this.text_response = `<p>◀★▶◀★★▶★ ▶▶▶★◀◀ ★▶  ★◀ ★▶★◀ ★★◀ ◀▶▶★★ ▶★ ★ ★◀★ ◀▶★★ ★◀▶◀▶◀▶ ★◀★▶ ★◀★★★ ▶▶◀★★▶ ★★ ▶★▶★▶★★ ★★◀★★▶</p>`; break; }
				case 17: { this.text_response = `<p>▶▷►▻ ▻►►►▶▻▷►▷▷▻▷▶▻►▶▷ ▶▻▻▷▶► ▷ ▻►▶ ▻▷►▻▶  ▶►►▻▻▶▶ ▻►►▻▷▷►▷▻▶▷▻▶▻▶▻ ▶► ▻▷▻▷▻▶▻►▻►▷▷▻ ▶▷►▻▻▻▻▻▻▻▻ ▶▻ ►▻▶▶►▷▶ ▶►▷▶▶▷►►▶ ▻▻▻▻►▻▶ ▶▷▻▶► ▻▶▷▶▶▷ ▻▷▻►►▻▻►▶ ▶▻</p>`; break; }
				// transdimensional
				case 18: { this.text_response = `<p>◢◣◤◥◥◤◣◥◢◤◤ ◥◣◣◥◥◢◤◥◢◢◤◢◢◥◣◣◢◢◤◥◢◢◤◣◢◢ ◢◥◤◣ ◤◥◥◥ ◢◢◤◣◥◢◤◣◤◥◢◢ ◢◥◤◣◤◣◥◢◢◢◥◤◥◣◢◤ ◤ ◥◢◤◥◢◣  ◥◣◤◥◥◤ ◢◤◢◢◥◣◢◢◤◢ ◢◥◣◢◥◤ ◤◢◥◣◢◥◥◢◤◤ ◥◢◣◤◣◥◤◣◥◣◤◤◣◥ ◣</p>`; break; }
				case 19: { this.text_response = `<p>✿ ❂ ❀ ❁ ✿ ❁ ❁ ❀ ✿ ✿ ❁ ❄ ❃ ❄ ❀ ✿ ❁ ❂ ❂ ❀ ❄ ❄ ❃ ✿ ❁ ❁ ❀ ✿ ❄ ❂ ❄ ❃ ❀ ✿ ❀ ❄ ❁ ✿ ❄ ❀ ✿ ❂ ❃ ❃ ❄ ❂ ✿ ❀ ❂ ❁ ✿ ❄ ❁ ❀ ❀ ✿ ❀ ❄ ❃ ❀ ✿ ❀ ❄ ❁ ❃ ❄ ❀ ❄ ✿ ❁ ❂ ❃ ❄ ❃ ❁ ✿ ❀ ✿ ❀ ❄ ❂ ❄ ✿ ❃ ❀ ❁ ✿ ❄ ❂ ❁ ✿ ❀ ❄</p>`; break; }
				case 20: { this.text_response = `<p>◐◑◒◓●◔◕◖◗ ◕◓ ◖◔◒◑◗ ●◒◔◖◓◑◐●◕●◗◓ ◒◖◐◔◖◒◑◕◔●●◒ ◑◖◔● ●◗◖◕◕◖◔◓◗◑◒ ◑◔◐●◕◖◓●◒ ◔◗◒ ●◒◐◕◔◑●◔◓◗◓◒ ●●◒◔◕◕◗●◓◑◒ ◖◔● ◒◓◕◔◑◖◑◐ ●◔◗◗◖◔◔ ◕◑● ◒◓◐◔◕◗◐◖● ◑●◓◓◖◕◕◒◖◒●◗◐◐◔● ◓◗●◔◕● ◑◔◐◖◒ ◓◕ ◖◗ ◓◑●◗◖◒◒◓◐●◑◑ ◕◖◖  ●◗◑◖◕◐◔◒◓◕●●◐ ◑◔◔◖◐●◗◕◒◒ ●◑◐◗◗◓◓◕◖◓●</p>`; break; }
				};	
			switch ( this.civ.id % 6 ) { // make integers
				case 0: { this.our_response = '<p>We have been over this again and again. We can not make any sense of this strange language. Perhaps researching <i>communications skills</i> would help?</p>'; break; } 
				case 1: { this.our_response = '<p>Clearly, we are having a hard time understanding their ... "words"? Perhaps with better <i>communication skills</i> we can one day come to understand them.</p>'; break; } 
				case 2: { this.our_response = '<p>Their language is just as weird as they are. There is nothing to be gained from further meetings at this time. Maybe we can come to understand them with time and <i>communication skills</i> research.</p>'; break; } 
				case 3: { this.our_response = '<p>After studying their "language" for months, we have all but given up. Their bizarre stream of clicks and whistles does not correspond to any known form of communication. With more study in <i>communication skills</i> we may one day understand them.</p>'; break; } 
				case 4: { this.our_response = '<p>This species does not use any known form of communication. In fact, we are not even sure if they <i>are</i> communicating. Let\'s just assume they are. Better <i>communication skills</i> may yield better results in the future.</p>'; break; } 
				case 5: { this.our_response = '<p>Uh..... right. None of that makes any sense. There is nothing more we can do with these "things" right now. Perhaps one day better <i>communication skills</i> will enable our species to somehow relate to theirs.</p>'; break; } 
				}
			}
		else if ( this.data && this.data.is_greeting /* i.e. first_contact */ ) { 
			switch ( Math.floor( this.app.game.myciv.LoveNub( this.civ ) / .33333 ) ) { // make integers
				case 0: { this.text_response = `<p>We have no interest in dealing with lesser beings. Do not bother us unless you come bearng gifts.</p>`; break; }
				case 1: { this.text_response = `<p>We look forward to the mutual benefit of our two civilizations.</p>`; break; }
				default: { this.text_response = `<p>We are delighted to meet you and your people.</p>`; break; }
				};
			}
		else { 
			switch ( Math.round( this.civ.diplo.contacts.get(this.app.game.myciv).annoyed * 10 ) ) { // make integers
				case 0: { this.text_response = `<p>We have heard enough of your blather. We will hear no more.</p>`; break; }
				case 1: { this.text_response = `<p>It is only due to my great patience that this audience is granted. My time is costly and you are wasting it. Speak.</p>`; break; }
				case 2: { this.text_response = `<p>You are wearing our patience thin. Be brief and then be gone.</p>`; break; }
				case 3: { this.text_response = `<p>Please keep you inquiries to a minimum. I have many meeting today after this one.</p>`; break; }
				case 4: { this.text_response = `<p>What is it you seek from us?</p>`; break; }
				case 5: { this.text_response = `<p>What can we do for you?</p>`; break; }
				case 6: { this.text_response = `<p>What brings the ${this.app.game.myciv.name} to visit us today?</p>`; break; }
				case 7: { this.text_response = `<p>Greetings. To what do we owe this honor?</p>`; break; }
				case 8: { this.text_response = `<p>I have been looking forward to our visit. Let me know what is on your mind.</p>`; break; }
				case 9: { this.text_response = `<p>Hello friend. It is a pleasure to see the <i>${this.app.game.myciv.name}</i> people again. How may we be of assistance?</p>`; break; }
				case 10: { this.text_response = `<p>Always a pleasure to meet with the <i>${this.app.game.myciv.name}</i>. What great things can we accomplish today?</p>`; break; }
				};
			}
		}
		
	HandleDebugInquiry( key ) { 
		switch ( key ) { // make integers
			case 'gold': { this.text_response = `<p>We hid the gold where you cannot find it. That's all I can say about that.</p>`; break; }
			case 'cats': { this.text_response = `<p>Cats generally keep themselves clean. On Arcopta IV we have purple cats that clean other cats in the cat cleaning circle.</p>`; break; }
			case 'friends': { this.text_response = `<p>My friends are your friends are my friends.</p>`; break; }
			case 'alf': { this.text_response = `<p>ALF died many years ago. His burial was legendary and his grave is visited by thousands each year.</p>`; break; }
			default: { this.text_response = `<p>I do not know about that.</p>`; break; }
			};	
		this.SetStandardOptions();
		}
		
	SelectWantToKnowInfoOption() {
		this.text_response = `<p>Oh? Curious about something?</p>`;
		let page = this;
		this.options = [
			{ text:"Can you tell me where the gold is hidden?", func: () => this.HandleDebugInquiry('gold') },
			{ text:"When are the cats going to clean themselves?", func: () => this.HandleDebugInquiry('cats') },
			{ text:"Who are your real friends?", func: () => this.HandleDebugInquiry('friends') },
			{ text:"Where is ALF?", func: () => this.HandleDebugInquiry('alf') },
			];	
		}
		
	SetStandardOptions() { 
		this.options = [];
		if ( this.comm >= 0.3 ) { 
			if ( this.civ.diplo.contacts.get(this.app.game.myciv).annoyed >= 0.05 ) {
				this.options.push({ text:"Let's trade.", func: () => this.Exit() });
				this.options.push({ text:"Let's make a deal.", func: () => this.Exit() });
				this.options.push({ text:"We want to know about ...", func: () => this.SelectWantToKnowInfoOption() });
				this.options.push({ text:"We declare war on you.", func: () => this.Exit() });
				}
			}
		this.options.push({ text:"End conversation.", func: () => {
			let acct = this.civ.diplo.contacts.get(this.app.game.myciv);
			acct.annoyed -= 0.05;
			if ( acct.annoyed < 0 ) { acct.annoyed = 0; }
			this.Exit();
			} });
		};
		
	bind( data ) {
		this.comm = this.app.game.myciv.CommOverlapWith(this.civ);
		/* i.e. first_contact */
		if ( this.data && this.data.is_greeting  ) { 
			this.on_exit = ''; // exit to map
			}
		this.text_response = '';
		this.our_response = '';
		this.GetResponse();
		this.SetStandardOptions();
		}
		
	Exit() { 
		this.app.SwitchMainPanel( this.on_exit ); 
		}
	}
