// import Civ from './Civ';
// import Galaxy from './Galaxy';
// import Anom from './Anom';
// import Star from './Star';
// import Planet from './Planet';
// import Fleet from './Fleet';
// import * as utils from '../util/utils';
// import * as Signals from '../util/signals';


class EventCard {
	app = false;
	label = '';
	title = '';
	text = '';
	img = null;
	effect = null;
	options = null;
	civ = null;
	info = null;
	
	constructor( app, card, civ, info ) {
		card && Object.assign(this, card);
		this.app = app;
		this.civ = civ;
		this.info = info;
		}
		
	Hydrate() { 
		// not sure what this does yet
		}
		
	Exec() { 
		if ( typeof this.effect == 'function' ) { this.effect(); }
		if ( this.app.game.myciv == this.civ ) { 
// 			this.app.ShowDialog( this.title, this.text );
			this.app.game.eventcard = this;
			}
		else {
			// make AI choose something
			}
		}
		
	// may return info for a follow up card to be enqueued
	ChooseOption( option ) { 
		let i = this.options.indexOf( option );
		if ( i > -1 ) {
			let o = this.options[i];
			// do any immediate effect
			if ( typeof o.onSelect == 'function' ) { o.onSelect(); }
			// trigger a follow up card
			if ( o.next ) {
				let selected_card = null;
				// force array
				if ( !Array.isArray(o.next) ) { o.next = [o.next]; } 
				// if only one option, obvious choice
				if ( o.next.length == 1 ) {
					selected_card = o.next[0];
					if ( typeof selected_card == 'string' ) {  // convert to object
						selected_card = { label: selected_card, delay: 0 };
						}
					}
				// if multiple options, build a chance table and randomly choose.
				else {
					let total = 0;
					o.next.forEach( (card,k) => {
						if ( typeof card == 'string' ) { // convert to object
							o.next[k] = { label: card, delay: 0 };
							}
						if ( !('chance' in o.next[k]) ) { o.next[k].chance = 1; } // defaults to 1
						else { o.next[k].chance = parseFloat( o.next[k].chance ); }
						total += o.next[k].chance;
						});
					let winner = Math.random() * total; // winning number	
					for ( let card of o.next ) {
						total -= card.chance; // backtrack the total
						if ( winner >= total ) {
							selected_card = card;
							break;
							}
						}
					}
				// send back new card to be enqueued
				selected_card.delay = ( 'delay' in selected_card ) ? selected_card.delay : 0;
				selected_card.civ = this.civ;
				selected_card.info = this.info;
				return selected_card;
				}
			}
		}
		
	}
	
export default class EventLibrary {
	app = false;
	
	constructor( app ) {
		this.app = app;
		}
		
	Checkout( card, civ, info ) {
		return new EventCard( this.app, all_events[card], civ, info );
		}
		
	Random( civ ) { 
	
		}
	}

// the big list
let all_events = {
	TEST_0: {
		title: 'The Man From Nantucket',
		text: 'There once was a man from nantucket. He got his head stuck in a bucket. What should we do?',
		effect: () => {
			// do something Gorman!
			},
		img: null,
		root: true,
		options: [
			{
				title: 'Remove the bucket.',
				text: 'It\'s the least we could do.',
				onSelect: null,
				next: ['TEST_A','TEST_B']
				},
			{ 
				title: 'Let him be.',
				text: 'His weird bucket fetish is none of our business.',
				onSelect: null,
				next: { label:'TEST_C', delay: 3, chance: 1 }
				}
			]
		},
		
	TEST_A: {
		title: 'The Thankful Man',
		text: 'Mr Nantucket is very thankful for our help. He gave us $20.',
		effect: () => { /* do something Gorman! */ },
		img: null,
		root: true,
		options: null
		},
		
	TEST_B: {
		title: 'The Ungreatful Man',
		text: 'Mr Nantucket was enjoying his bucket therapy and we interupted him. He was very disgruntled.',
		effect: () => { /* do something Gorman! */ },
		img: null,
		root: true,
		options: null
		},
		
	TEST_C: {
		title: 'The Ghost of Nantucket',
		text: 'Remember the man with the bucket on his head that we refused to help? His "big brother" found out about it and now we\'re in trouble.',
		effect: () => { /* do something Gorman! */ },
		img: null,
		root: true,
		options: null
		},
	};
	
	
