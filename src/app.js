import Game from './classes/Game';
import Galaxy from './classes/Galaxy';
import Star from './classes/Star';
import Anom from './classes/Anom';
import Planet from './classes/Planet';
import Constellation from './classes/Constellation';
import Fleet from './classes/Fleet';
import Civ from './classes/Civ';
import * as utils from './util/utils';
import * as Signals from './util/signals';
import * as CrazyBox from './classes/Crazy';

export class App {
	version = '0.0.4';
	main_panel_obj = null;
// 	main_panel_mode = 'shipdes';
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
		see_all: true,
		show_range: false,
		show_xtreme_anoms: true,
		show_xtreme_fleets: true,
		show_staging_pts: true,
		show_objectives: true, // debug only
		show_empire_box: true, // debug only
		show_threats: true, // debug only
		ship_scaling: true,
		xtreme_zoom_at: 0.25,
		debug: false,
		ai: true, // process the AI each turn
		soak: true, // run the game without player involvement
		bg_bright: 1.0,
		history_mode: 'power',
		autoload_troops: true,
		// notifications to bug player with.
		// you can also just set notify to boolean to en/disable all
		notify: { 
			explore: false,
			settle: false,
			contact: true,
			lost_contact: true,
			research: false,
			combat: true,
			anom: true
			},
		setup: { 
			AIs: 5,
			AIs_randomize: false,
			galaxy_size: 70,
			galaxy_size_randomize: false,
			galaxy_age: 0.5,
			galaxy_age_randomize: false,
			density: 0.5,
			density_randomize: false,
			difficulty: 0.5,
			difficulty_randomize: false,
			events: 0.5, 
			events_randomize: false, 
			crazy: 0.3,
			crazy_randomize: false,
			}
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
		this.LoadOptions();
		// --------\/-- [!]DEBUG SHORTCUT --\/---------------------
		this.game = new Game(this);
		// create initial state
		this.game.InitGalaxy();
// 		this.ChangeState('title');
		this.game.galaxy.Make( 9,6,50,0.5 );
		this.game.DeployVictoryIngredients();
		let mystar = this.game.galaxy.ThreatDemo( 6 );
// 		CrazyBox.AddGiantSpaceAmoeba(this);
// 		CrazyBox.AddRedSpaceAmoeba(this);
		// CrazyBox.AddBlueSpaceAmoeba(this);
		this.game.SetMyCiv( 0 ); // could switch using debug stuff
		this.ChangeState('play');
		this.hilite_star = mystar; // hint for playstate startup
		this.game.RecalcStarRanges();
		this.game.RecalcFleetRanges();
		this.game.RecalcCivContactRange();
		let app = this; // needed for callback
		}
		
	ToggleNotification( o ) { 
		this.options.notify[o] = this.options.notify[o] ? false : true;
		this.SaveOptions();
		}
		
	ToggleOption( o ) { 
		this.options[o] = this.options[o] ? false : true;
		this.SaveOptions();
		}

	SaveOptions() { 
		window.localStorage.setItem( 
			'options',
			JSON.stringify(this.options)
			);
		}
		
	LoadOptions() { 
		try { 
			let json = window.localStorage.getItem( 'options' );
			if ( json ) { 
				json = JSON.parse( json );
				if ( json ) { 
					// using object.assign lets us slip in new settings over time
					this.options = Object.assign(this.options,json);
					}
				}
			}
		catch ( ex ) {
			console.log('could not load options');	
			}
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
		else if ( obj instanceof Fleet && !obj.killme && !obj.merged_into ) { this.sidebar_mode = 'fleet'; this.state_obj.SetCaret(obj); }
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
			this.main_panel_obj = obj;
			this.main_panel_data = data;
			this.main_panel_mode = mode;
			}
		}
	CloseMainPanel() {
		this.main_panel_mode = false;
		this.main_panel_obj = null;
		this.main_panel_data = null;
		this.exclusive_ui = false;
		}
	CloseSideBar() {
		this.sidebar_mode = false;
		this.sidebar_obj = null;
		this.state_obj.SetCaret(null);
		}
	ReturnToMap() {
		this.CloseMainPanel();
		this.CloseSideBar();
		this.state_obj.SetCaret(null);
		}
	ShowDialog( header, content, buttons = null ) { 
		this.modal = { header, content, buttons };
		if ( !buttons ) { // default OK button to close dialog
		   this.modal.buttons = [{ text: 'OK', cb: (()=>this.CloseDialog()) }];
		   }
		}
	CloseDialog() {
		this.modal = null;
		}
	ClickDialogButton( btn ) {
		// window always closes regardless of what is clicked.
		this.modal = null;
	    btn.cb();
		}
		
	// type: good, bad, neutral
	// title: optional
	// content: optional, HTML allowed
	// onclick: callback function. optional.
	AddNote( type, title = null, content = null , onclick = null ) {
		// notes can be totally disabled
		if ( this.options.notify === false ) { return; }
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

	
	
	
