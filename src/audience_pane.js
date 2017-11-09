import {bindable} from 'aurelia-framework';

export class AudiencePane {
	@bindable app = null;
	@bindable civ = null;
	@bindable on_exit = 'diplo'; // can be '' or 'diplo' or any other main panel 
	
	ambassador_present = true;
	
	options = [];
	constructor() { 
		
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
		switch ( Math.round( this.civ.annoyed * 10 ) ) { // make integers
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
			{ text:"Can you tell me where the gold is hidden?", func:function(){ page.HandleDebugInquiry('gold'); } },
			{ text:"When are the cats going to clean themselves?", func:function(){ page.HandleDebugInquiry('cats'); } },
			{ text:"Who are your real friends?", func:function(){ page.HandleDebugInquiry('friends'); } },
			{ text:"Where is ALF?", func:function(){ page.HandleDebugInquiry('alf'); } },
			];	
		}
		
	SetStandardOptions() { 
		let page = this;
		this.options = [];
		if ( page.civ.annoyed >= 0.05 ) {
			this.options.push({ text:"Let's trade.", func:function(){ page.Exit(); } });
			this.options.push({ text:"Let's make a deal.", func:function(){ page.Exit(); } });
			this.options.push({ text:"We want to know about ...", func:function(){ page.SelectWantToKnowInfoOption(); } });
			this.options.push({ text:"We declare war on you.", func:function(){ page.Exit(); } });
			}
		this.options.push({ text:"End conversation.", func:function(){ 
			page.civ.annoyed -= 0.05;
			if ( page.civ.annoyed < 0 ) { page.civ.annoyed = 0; }
			page.Exit();
			} });
		};
		
	bind( data ) {
		this.GetResponse();
		this.SetStandardOptions();
		}
		
	Exit() { 
		this.app.SwitchMainPanel( this.on_exit ); 
		}
	}
