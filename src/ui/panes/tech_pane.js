import {Techs,TechNodes} from '../../classes/Tech';
import * as Signals from '../../util/signals';

export class TechPane {

	constructor() {
		this.announce = null;
		this.announce_msg = null;
		this.announce_title = null;
		this.keypressCallback = (e) => this.KeyPress(e);
		// makes global objects available to template
		this.Techs = Techs;
		this.TechNodes = TechNodes;
		// these are shadow arrays that we can sort and filter for the UI
		this.tech_avail = [];
		this.tech_compl = [];
		}

	// to "announce" a new tech discovery, send the info in `data.obj` param:
	// data.obj: <tech from civ.tech.compl list>
	// include optional message in the optional `data.data` param
	// data.data: {
	//	announce_msg: <optional string>
	//	announce_title: <optional string>
	//	}
	activate(data) {
		if ( !data ) { return false; }
		this.app = data.app;
		this.mode = 'available';
		this.turn_subscription = Signals.Listen( 'turn', data => this.UpdateData() );
		// listen for hotkeys
		window.addEventListener('keydown', this.keypressCallback, false);		
		this.UpdateData();
		// discover announcement
		if ( data.obj ) {
			let i = this.app.game.myciv.tech.compl.indexOf(data.obj);
			if ( i >= 0 ) {
				this.announce = data.obj;
				this.featured_node = data.obj;
				if ( data.data && data.data.announce_msg ) { 
					this.announce_msg = data.data.announce_msg;
					}
				if ( data.data && data.data.announce_title ) { 
					this.announce_title = data.data.announce_title;
					}
				}
			}
		}
		
	bind() {
		// this.UpdateData();
		}
		
	unbind() { 
		// stop listening for hotkeys
		window.removeEventListener('keydown', this.keypressCallback);
		this.turn_subscription.dispose();
		}
		
	UpdateData() {
		this.announce = null;
		this.announce_msg = null;
		this.tech_avail = this.app.game.myciv.tech.avail; // reference
		this.tech_compl = this.app.game.myciv.tech.compl.map( x => x ).filter( x => !x.node.hidden && x.node.rp > 0 ).reverse();
		if ( this.mode == 'available' ) { 
			this.featured_node = this.tech_avail.length ? this.tech_avail[0] : null;
			}
		}
		
	ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		}
		
	ClickCompletedTech( node ) { 
		this.featured_node = node;
		this.announce = null;
		this.announce_msg = null;
		this.announce_title = null;
		}
		
	ClickAvailableTech( node ) {
		this.featured_node = node;
		this.announce = null;
		this.announce_msg = null;
		this.announce_title = null;
		}
		
	MoveTechUp( t ) {
		let avail = this.app.game.myciv.tech.avail;
		let i = avail.indexOf(t);
		if ( i > 0 ) {
			let temp = avail[i-1];
			avail.splice( i-1, 2, t, temp );
			}
		}
		
	MoveTechDown( t ) {
		let avail = this.app.game.myciv.tech.avail;
		let i = avail.indexOf(t);
		if ( i > -1 && i < avail.length-1 ) {
			let temp = avail[i+1];
			avail.splice( i, 2, temp, t );
			}
		}
		
	MoveTechFirst( t ) {
		let avail = this.app.game.myciv.tech.avail;
		let i = avail.indexOf(t);
		if ( i > 0 ) {
			avail.splice( i, 1 );
			avail.splice( 0, 0, t );
			}
		}
		
	MoveTechLast( t ) {
		let avail = this.app.game.myciv.tech.avail;
		let i = avail.indexOf(t);
		if ( i >= 0 ) {
			avail.splice( i, 1 );
			avail.push( t );
			}
		}
		
	ChangeMode( mode ) { 
		this.mode = mode=='available' ? mode : 'completed' ;
		if ( this.mode == 'available' ) { 
			this.featured_node = this.tech_avail.length ? this.tech_avail[0] : null;
			}
		else {
			this.featured_node = this.tech_compl.length ? this.tech_compl[ this.tech_compl.length-1 ] : null;
			}
		this.announce = null;
		this.announce_msg = null;
		this.announce_title = null;			
		}
		
	KeyPress( event ) {
		let avail = this.tech_avail;
		switch ( event.key ) { 
			case 'Escape': {
				this.ClosePanel();
				event.preventDefault();
				return false;
				}
			case 'ArrowLeft':
			case 'ArrowUp': {
				// find item in avail list
				let i = this.tech_avail.indexOf(this.featured_node);
				if ( i > 0 && i < this.tech_avail.length ) {
					if ( event.ctrlKey ) { 
						this.MoveTechUp(this.tech_avail[i]);
						}
					else if ( event.shiftKey ) { 
						this.MoveTechFirst(this.tech_avail[i]);
						}
					else {
						this.featured_node = this.tech_avail[i-1]; 
						}
					}
				event.preventDefault();
				return false;
				}
			case 'ArrowRight':
			case 'ArrowDown': {
				let i = this.tech_avail.indexOf(this.featured_node);
				if ( i >= 0 && i < this.tech_avail.length ) {
					if ( event.ctrlKey ) { 
						this.MoveTechDown(this.tech_avail[i]);
						}
					else if ( event.shiftKey ) { 
						this.MoveTechLast(this.tech_avail[i]);
						}
					else {
						this.featured_node = this.tech_avail[i+1]; 
						}
					}
				event.preventDefault();
				return false;
				}
			}
		}		
				
	}
