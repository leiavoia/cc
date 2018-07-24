import Game from './classes/Game';
import Galaxy from './classes/Galaxy';
import Star from './classes/Star';
import Anom from './classes/Anom';
import Planet from './classes/Planet';
import Hyperlane from './classes/Hyperlane';
import Constellation from './classes/Constellation';
import Fleet from './classes/Fleet';
import Civ from './classes/Civ';
// import {Modlist,Mod} from './classes/Mods';
import * as utils from './util/utils';
import * as Signals from './util/signals';
import * as CrazyBox from './classes/Crazy';

export class App {
	version = '0.0.3';
	main_panel_obj = null;
// 	main_panel_mode = 'shipcombat';
	main_panel_mode = false;
	exclusive_ui = false; // if true, hides all UI except main content panel
	sidebar_obj = null;
	sidebar_mode = false;
	state = 'title';
	state_obj = null;
	hilite_star = null;
	game = null;
	notes = [];
	options = {
		dim_unexplored: true,
		show_sectors: false,
		see_all: false,
		show_range: false,
		show_xtreme_anoms: true,
		show_xtreme_fleets: true,
		debug: false,
		announce_scouted_stars: false,
		ai: true,
		bg_bright: 1.0
		};
		
	ResetEverything() { 
		this.main_panel_obj = null;
		this.main_panel_mode = false;
		this.sidebar_obj = null;
		this.sidebar_mode = false;
		this.hilite_star = null; // hint for playstate startup
		Fleet.KillAll();
		Fleet.all_fleets = [];
		Civ.total_civs = false; // next one will be zero
		Civ.relation_matrix = [];
		Civ.range_matrix = [];
		Civ.flag_id_roster = null;
		Civ.img_id_roster = null;
		Planet.next_uid = 1;
		Star.next_id = 1;
		this.game = null;		
		this.notes = [];
// 		this.state = 'title';
// 		this.state_obj = null;
		}
		
	constructor() {
		window.document.title = `Constellation Control v.${this.version}`;
// 		this.state = 'title';
// 		return;
		// --------\/-- [!]DEBUG SHORTCUT --\/---------------------
		this.game = new Game(this);
		// create initial state
		this.game.InitGalaxy();
// 		this.ChangeState('title');
		this.game.galaxy.Make( 7,7,30,0.5 );
		let mystar = this.game.galaxy.AddExploreDemo( 3 );
		CrazyBox.AddGiantSpaceAmoeba(this);
		CrazyBox.AddRedSpaceAmoeba(this);
		CrazyBox.AddBlueSpaceAmoeba(this);
		this.game.SetMyCiv( 0 ); // could switch using debug stuff
		this.ChangeState('play');
		this.hilite_star = mystar; // hint for playstate startup
		this.game.RecalcStarRanges();
		this.game.RecalcFleetRanges();
		this.game.RecalcCivContactRange();
		let app = this; // needed for callback
// 		this.AddNote(
// 			'neutral',
// 			`${this.game.galaxy.civs[1].name} Audience`,
// 			`The ${this.game.galaxy.civs[1].name} ambassador would like a moment of your time`,
// 			function(){app.SwitchMainPanel( 'audience', app.game.galaxy.civs[1] );}
// 			);

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
	MapScroll( xdiff, ydiff ) { 
		if ( this.state == 'play' ) { this.state_obj.MapScroll( xdiff, ydiff ); }
		}
		
	// returns promise
	ChangeState( state ) { 
		console.log(`changing to ${state}`);
		this.state = state;
		}
		
	ClickStar( star, event ) { 
		// deepsace anomalies not clickable. on map for debug only
		if ( star.objtype == 'anom' && !star.onmap ) { return; }
		// special action for right click
		if ( event.which > 1 ) { 
			Signals.Send('starclick',{star,event});
			}
		// regular left click
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
			
		if ( obj instanceof Planet ) { this.sidebar_mode = 'planet'; this.state_obj.SetCaret(obj.star); }
		else if ( obj instanceof Star ) { this.sidebar_mode = 'star';  this.state_obj.SetCaret(obj); }
		else if ( obj instanceof Anom ) { this.sidebar_mode = 'anom';  this.state_obj.SetCaret(obj); }
		else if ( obj instanceof Fleet ) { this.sidebar_mode = 'fleet'; this.state_obj.SetCaret(obj); }
// 		else if ( obj instanceof Constellation ) { this.sidebar_mode = 'constel'; }
		else { this.sidebar_mode = false; }
		this.sidebar_obj = obj;
		
		}
	// exclusive means to hide all UI elements to trap the user in the screen.
	SwitchMainPanel( mode, obj = null, data = null, exclusive = false ) {
		// toggle effect
		if ( mode == this.main_panel_mode && obj == this.main_panel_obj ) { 
			this.CloseMainPanel();
			this.exclusive_ui = false;
			}
		else {
			// close the sidebar in most cases
			if ( mode != 'planets' && mode != 'planetinfo' ) { 
				this.CloseSideBar();
				}
			this.exclusive_ui = !!exclusive;
			this.main_panel_mode = mode;
			this.main_panel_obj = obj;
			this.main_panel_data = data;
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
		
	// type: good, bad, neutral
	// title: optional
	// content: optional, HTML allowed
	// onclick: callback function. optional.
	AddNote( type, title = null, content = null , onclick = null ) {
		this.notes.push({ type:type, title:title, content:content, onclick:onclick });
		}
	// removes the note by default. executes onclick callback if set.
	ClickNote( note, remove = true, do_action = true ) { 
		let i = this.notes.indexOf(note);
		if ( i >= 0 ) { 
			if ( typeof note.onclick === 'function' && do_action ) { 
				note.onclick();
				}
			if ( remove ) { 
				this.notes.splice(i,1);
				}
			}
		}
	ClearNotes() { 
		this.notes.splice(0,this.notes.length);
		}
	}

	
	
	
