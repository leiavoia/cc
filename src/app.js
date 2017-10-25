import Game from './classes/Game';
import Galaxy from './classes/Galaxy';
import Star from './classes/Star';
import Planet from './classes/Planet';
import Hyperlane from './classes/Hyperlane';
import Constellation from './classes/Constellation';
import Fleet from './classes/Fleet';
import * as utils from './util/utils';


export class App {
	main_panel_obj = null;
	main_panel_mode = false;
	sidebar_obj = null;
	sidebar_mode = false;
	theapp = false;
	star_click_callback = null;
	hilite_star = null;
	state = 'title';
	state_obj = null;
	game = null;
	options = {
		dim_unexplored: true,
		show_sectors: true,
		see_all: true,
		};
		
	constructor() {
		this.theapp = this;
		this.game = new Game(this);
		// create initial state
		this.game.InitGalaxy();
// 		this.ChangeState('title');

		// --------\/-- [!]DEBUG SHORTCUT --\/---------------------
		this.game.galaxy.Make( 3000, 3000, 20, 0.5 );
		let mystar = this.game.galaxy.AddExploreDemo();
		this.game.SetMyCiv( 0 ); // could switch using debug stuff
		this.ChangeState('play');
		this.hilite_star = mystar;
		}
		
	ToggleOption( o ) { 
		this.options[o] = this.options[o] ? false : true;
		}

	// can be a Star, Planet, Fleet, or an x/y pair: {x:100,y:100}
	FocusMap( obj, snap = false ) { 
		if ( this.state == 'play' ) { 
			this.state_obj.FocusMap( obj, snap );
			}
		}
	MapZoomIn() { 
		if ( this.state == 'play' ) { this.state_obj.MapZoomIn(); }
		}
	MapZoomOut() { 
		if ( this.state == 'play' ) { this.state_obj.MapZoomOut(); }
		}
	
	// returns promise
	ChangeState( state ) { 
		console.log(`changing to ${state}`);
		this.state = state;
		}
		
	RegisterStarClickCallback( callback ) {
		this.star_click_callback = callback;
		}
	ClickStar( star ) { 
		if ( this.star_click_callback instanceof Function ) { 
			this.star_click_callback( star );
			this.star_click_callback = null;
			}
		else {
			this.SwitchSideBar( star );
			}
		}
	// the extra event param here is required in order to be able to stop propogation.
	// we need that to make little icons on top of stars work right.
	SwitchSideBar( obj = null, event = null ) {
		if ( event ) { event.stopPropagation(); }
		
		// special exception if a planet is not explored
		if ( obj instanceof Planet && !obj.star.explored && !this.options.see_all ) { return; }		
		
		if ( obj instanceof Planet ) { this.sidebar_mode = 'planet'; this.hilite_star = obj.star; }
		else if ( obj instanceof Star ) { this.sidebar_mode = 'star'; this.hilite_star = obj; }
		else if ( obj instanceof Fleet ) { this.sidebar_mode = 'fleet'; }
		else if ( obj instanceof Constellation ) { this.sidebar_mode = 'constel'; }
		else { this.sidebar_mode = false; }
		this.sidebar_obj = obj;
		}
	SwitchMainPanel( mode, obj = null ) {
		// toggle effect
		if ( mode == this.main_panel_mode && obj == this.main_panel_obj ) { 
			this.CloseMainPanel();
			}
		else {
			// close the sidebar in most cases
			if ( mode != 'planets' && mode != 'planetinfo' ) { 
				this.CloseSideBar();
				}
			this.main_panel_mode = mode;
			this.main_panel_obj = obj;
			}
		}
	CloseMainPanel() {
		this.main_panel_mode = false;
		this.main_panel_obj = null;
		}
	CloseSideBar() {
		this.sidebar_mode = false;
		this.sidebar_obj = null;
		}
	ReturnToMap() {
		this.CloseMainPanel();
		this.CloseSideBar();
		}
	ShowDialog( header, content ) { 
		this.modal_header = header;
		this.modal_content = content;
		}
	CloseDialog() {
		this.modal_header = null;
		this.modal_content = null;
		}
		
		
		
	}

	
	
	
