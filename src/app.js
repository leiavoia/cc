import Game from './classes/Game';
import Galaxy from './classes/Galaxy';
import Star from './classes/Star';
import Anom from './classes/Anom';
import Planet from './classes/Planet';
import Fleet from './classes/Fleet';
import {Ship,ShipBlueprint} from './classes/Ship';
import {GroundUnit,GroundUnitBlueprint} from './classes/GroundUnit';
import Civ from './classes/Civ';
import * as Signals from './util/signals';
import * as utils from './util/utils';

export class App {
	version = '0.0.5';
	main_panel_obj = null;
	last_saved_game_key = '';
	main_panel_mode = false;
	exclusive_ui = false; // if true, hides all UI except main content panel
	sidebar_obj = null;
	sidebar_mode = false;
	state = 'title_screen';
	state_changed_callback = null; // callback to use with ChangeState()
	state_obj = null;
	hilite_star = null;
	starclick_echo = false; // kinda hacky: lets us know if a widget somewhere responded to a starclick
	game = null;
	notes = [];
	options = {
		dim_unexplored: true,
		show_sectors: false,
		see_all: true,
		show_range: false,
		always_show_range: false,
		show_xtreme_anoms: true,
		show_xtreme_fleets: true,
		show_staging_pts: true,
		show_objectives: true, // debug only
		show_threats: true, // debug only
		ship_scaling: true,
		xtreme_zoom_at: 0.25,
		debug: false,
		ai: true, // process the AI each turn
		soak: false, // run the game without player involvement
		bg_bright: 1.0,
		nofx: false,
		headless: false, // for debugging on turbo speed
		history_mode: 'power',
		autoload_troops: true,
		autosave: true,
		graph_history: true,
		// notifications to bug player with.
		// you can also just set notify to boolean to en/disable all
		notify: { 
			explore: false,
			settle: false,
			contact: true,
			lost_contact: true,
			research: false,
			research_announce: false,
			combat: true,
			anom: true,
			colony_ship_arrived: true,
			build_queue: true
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
			leader_name: 'Dear Leader',
			civ_name: 'Human',
			homeworld: 'Earth',
			homestar: 'Sol',
			color: [0,128,0],
			race_atm: 2,
			race_temp: 2,
			race_grav: 2,
			race_adapt: 1,
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
		this.notes = [];
		}
		
	constructor() {  
	
		// TECHNICAL: lots of deep-down game bits need access to settings
		// and data that App maintains. In order to bypass dependency injection
		// patterns and increase efficiency, we're going to just stick a 
		// singleton instance reference right on the class itself for easy 
		// reference by literally any other game component. USAGE:
		// 	let app = App.instance;
		App.instance = this;
		
		// child state elements can fire 'state_changed' element.
		// App will listen for this event and fire the optional callback
		// supplied with ChangedState() function.
		Signals.Listen('state_changed', data => {
			if ( typeof(this.state_changed_callback) === 'function' ) { 
				let f = this.state_changed_callback;
				this.state_changed_callback = null; // /!\ callback itself can overwrite this w/ another callback
				setTimeout( () => f(data), 0 );
				}
			});
		
		window.document.title = `Constellation Control v.${this.version}`;
		this.LoadOptions();
		// // close-tab confirmation
		// if ( !this.options.soak ) { 
		// 	window.onbeforeunload = function (e) {
		// 		e = e || window.event;
		// 		if (e) { e.returnValue = 'Close your game?'; } // IE, FF<4.0
		// 		return 'Close your game?'; // For Safari
		// 		};
		// 	}
		// debug shortcut
		if ( this.options.debug ) {
			this.game = new Game(this);
			this.game.InitGalaxy();
			this.ChangeState('play');
			}
		// normal startup
		else {
			this.ChangeState('title_screen');
			}
		}
		
	CurrentState() {
		return ( this.state_obj && this.state_obj.currentViewModel ) ? this.state_obj.currentViewModel : null;
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
				// nofx defaults to off; this is mainly for debug
				this.options.nofx = false;
				}
			}
		catch ( ex ) {
			console.warn('could not load options');	
			}
		}
		
	// can be a Star, Planet, Fleet, or an x/y pair: {x:100,y:100}
	FocusMap( obj, snap = false ) { 
		if ( this.state == 'play' ) { 
			this.CurrentState().FocusMap( obj, snap );
			}
		}
	MapZoomIn() { 
		if ( this.state == 'play' ) { this.CurrentState().MapZoomIn(); }
		}
	MapZoomOut() { 
		if ( this.state == 'play' ) { this.CurrentState().MapZoomOut(); }
		}
	MapScroll( xdiff, ydiff ) { 
		if ( this.state == 'play' ) { this.CurrentState().MapScroll( xdiff, ydiff ); }
		}
		
	// returns promise
	ChangeState( state, callback=null ) { 
		if ( callback && typeof(callback)==='function' ) { 
			this.state_changed_callback = callback;
			}
		this.state = state;
		}
		
	ClickStar( star, event ) { 
		// deepspace anomalies not clickable. on map for debug only
		if ( star.objtype == 'anom' && !star.onmap ) { return; }
		this.starclick_echo = false;
		// widgets that hear 'starclick' will set starclick_echo=true
		Signals.Send('starclick',{star,event});
		// special action for right click, used for fleet move orders
		if ( !('which' in event && event.which !== 1) && !this.starclick_echo ) { 
			this.SwitchSideBar( star );
			}
		this.starclick_echo = false;
		}
	// the extra event param here is required in order to be able to stop propogation.
	// we need that to make little icons on top of stars work right.
	SwitchSideBar( obj = null, event = null ) {
		if ( event ) { event.stopPropagation(); }
		
		// special exception if a planet is not explored
		if ( obj instanceof Planet && !obj.star.explored && !this.options.see_all ) { return; }		
			
		if ( obj instanceof Planet ) { this.sidebar_mode = 'planet'; this.CurrentState().SetCaret(obj.star); }
		else if ( obj instanceof Star ) { this.sidebar_mode = 'star';  this.CurrentState().SetCaret(obj); }
		else if ( obj instanceof Anom ) { this.sidebar_mode = 'anom';  this.CurrentState().SetCaret(obj); }
		else if ( obj instanceof Fleet && !obj.killme && !obj.merged_into ) { this.sidebar_mode = 'fleet'; this.CurrentState().SetCaret(obj); }
		else if ( obj instanceof Game ) { this.sidebar_mode = 'gamemenu'; } 
		else { this.sidebar_mode = false; }
		this.sidebar_obj = obj;
		
		}
	// exclusive means to hide all UI elements to trap the user in the screen.
	SwitchMainPanel( mode, obj = null, data = null, exclusive = false, close_sidebar = true ) {
		// toggle effect
		if ( mode == this.main_panel_mode && obj == this.main_panel_obj ) { 
			this.CloseMainPanel();
			this.exclusive_ui = false;
			}
		else {
			// close the sidebar in most cases
			if ( close_sidebar ) { this.CloseSideBar(); }
			// null out data to prevent cross-screen data contamination during transition
			this.main_panel_mode = null;
			this.main_panel_obj = null;
			this.main_panel_data = null;
			// now set screen proper
			this.exclusive_ui = !!exclusive;
			this.main_panel_mode = mode;
			this.main_panel_obj = obj;
			this.main_panel_data = data;
			}
		}
	CloseMainPanel() {
		this.main_panel_mode = false;
		this.main_panel_obj = null;
		this.main_panel_data = null;
		this.exclusive_ui = false;
		// closing subscreens needs to pump the UI queue
		// in order to prompt the player with combats, audiences, etc.
		this.game.ProcessUIQueue();
		}
	CloseSideBar() {
		this.sidebar_mode = false;
		this.sidebar_obj = null;
		this.CurrentState().SetCaret(null);
		}
	ReturnToMap() {
		this.CloseMainPanel();
		this.CloseSideBar();
		this.CurrentState().SetCaret(null);
		}
	ShowDialog( header, content, buttons = null ) {
		// stop autoturn from piling up multiple dialogs
		if ( this.state=='play' && this.CurrentState().autoplay ) { 
			this.CurrentState().ToggleAutoPlay();
			}
		this.modal = { header, content, buttons };
		if ( !buttons || !Array.isArray(buttons) ) { // default OK button to close dialog
		   this.modal.buttons = [{ text: 'OK', cb: (()=>this.CloseDialog()) }];
		   }
		// null callbacks also close panel
		for ( let b of this.modal.buttons ) { 
			if ( !('cb' in b) || !b.cb || typeof(b.cb) !== 'function' ) {
				b.cb = ()=>this.CloseDialog();
				}
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
	AddNote( type, title = null, content = null, onclick = null, ttl=0 ) {
		// notes can be totally disabled
		if ( this.options.notify === false || this.options.soak ) { return; }
		let note = { type:type, title:title, content:content, onclick:onclick };
		this.notes.push(note);
		if ( ttl > 0 ) { 
			setTimeout( () => this.ClickNote(note,true,false), ttl );
			}
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
		
	SavedGameList() { 
		let gameslist = localStorage.getItem('games');
		gameslist = JSON.parse(gameslist);
		if ( !gameslist ) gameslist = [];
		gameslist = gameslist.filter( x => x.version && x.version.substring(0,3) === this.version.substring(0,3) );
		return gameslist;
		}
			
	// return true on success, false on error
	SaveGame( name = 'Saved Game', force_download = false ) {
		if ( !this.game ) { return false; }
		try { 
			// start by cleaning up space
			this.PurgeUnlistedSavedGames()
			name = 'Game: ' + name; 
			// console.time('SAVE GAME');
			let catalog = { 'version' : this.version };
			this.game.Pack( catalog );
			let content = JSON.stringify(catalog);
			content = content.replace(/(\.\d{4})(\d+)/g,"$1"); // reduce number precision
			content = content.replace(/\.0+,/g,","); // hack off unnecessary zeroes
			// console.log('Saving ' + content.length + ' bytes ...' );
			// save to html5 localStorage
			if ( content.length < 5000000 && !force_download ) {
				localStorage.setItem( name, content );
				// log to games list
				let gameslist = this.SavedGameList();
				// remove incompatible games
				gameslist = gameslist.filter( x => x.version && x.version.substring(0,3) === this.version.substring(0,3) );
				// remove existing same-named entry
				let samename = gameslist.find( x => x.key==name );
				if ( samename ) { 
					let i = gameslist.indexOf(samename);
					gameslist.splice( i, 1 );
					}
				gameslist.push({
					key: name, 
					time: Date.now(),
					turn_num: this.game.turn_num,
					civs: this.game.galaxy.civs.length,
					civ: this.game.myciv.name,
					planets: this.game.myciv.planets.length,
					version: this.version
					});
				gameslist.sort( (a,b) => b.time - a.time );
				localStorage.setItem( 'games', JSON.stringify(gameslist) );
				if ( name != "Game: Quick Save" ) { 
					this.last_saved_game_key = name;
					}
				}
			// download as file
			else {
				let element = document.createElement('a');
				element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
				element.setAttribute('download', 'ConstellationControl_t' + this.game.turn_num + '.game');
				element.style.display = 'none';
				document.body.appendChild(element);
				element.click();
				document.body.removeChild(element);
				}
			// console.timeEnd('SAVE GAME');
			return true;
			}	
		catch ( error ) {
			console.error(error);
			return false;
			}
		}
		
	// - If the string param is less than 256 chars, assume its a
	// name of a local storage saved game. 
	// - If param is an integer, look up in saved games list
	// - Otherwise, treat as raw JSON.
	LoadGame( str ) {
		if ( Number.isInteger( str ) ) {
			let i = str;
			let gameslist = localStorage.getItem('games');
			gameslist = JSON.parse(gameslist);
			if ( !gameslist || i >= gameslist.length ) return false;
			str = localStorage.getItem( gameslist[i].key );
			if ( !str ) return false;
			this.last_saved_game_key = gameslist[i].key;
			}
		else if ( str && str.length <= 256 ) {
			let name = 'Game: ' + str; 
			str = localStorage.getItem( name );
			if ( !str ) return false;
			this.last_saved_game_key = str;
			}
		// console.time('LOAD GAME');
		let catalog = JSON.parse(str);
		if ( !catalog ) return false;
		// version mismatch
		if ( !catalog.version || catalog.version.substring(0,3) != this.version.substring(0,3) ) { return false; }
		// console.log(catalog);
		// as we go along and find the Game object, keep note of that guy
		let newgame = null;
		// rehydrate all objects
		for ( let k in catalog ) {
			if ( k == 'version' ) { continue; }
			switch ( catalog[k]._classname ) {
				case 'Game' : { catalog[k] = new Game(this,catalog[k]); newgame = catalog[k]; break; }
				case 'Galaxy' : { catalog[k] = new Galaxy(catalog[k]); break; }
				case 'Star' : { catalog[k] = new Star(catalog[k]); break; }
				case 'Planet' : { catalog[k] = new Planet(catalog[k]); break; }
				case 'Civ' : { catalog[k] = new Civ(catalog[k]); break; }
				case 'Fleet' : { catalog[k] = new Fleet(catalog[k]); break; }
				case 'Anom' : { catalog[k] = new Anom(catalog[k]); break; }
				case 'GroundUnitBlueprint' : { catalog[k] = new GroundUnitBlueprint(catalog[k]); break; }
				case 'GroundUnit' : { catalog[k] = new GroundUnit(catalog[k]); break; }
				case 'ShipBlueprint' : { catalog[k] = new ShipBlueprint(catalog[k]); break; }
				case 'Ship' : { catalog[k] = new Ship(catalog[k]); break; }
				default : { console.warn('Unhandled object type in LoadGame: ' + catalog[k]._classname); }
				}
			}
		if ( newgame ) { 
			// update the UUID sequencial counter to avoid issues.
			// (A true UUID wouldnt have this problem, but sequencial 
			// numbers are easier to read and take up less space in JSON
			let maxuuid = 0;
			for ( let k of Object.keys(catalog) ) {
				maxuuid = Math.max( maxuuid, parseInt(k) ); 
				} 			
			utils.UUID( maxuuid + 1 ); // reset counter
			// dereference all objects
			for ( let k in catalog ) { 
				if ( typeof(catalog[k])==='object' && 'Unpack' in catalog[k] ) {
					catalog[k].Unpack(catalog);
					}
				}
			// [!]HACK - reconnect modlist parent chain
			for ( let k in catalog ) {
				if ( catalog[k]._classname == 'Planet' && catalog[k].owner ) {
					catalog[k].mods.parent = catalog[k].owner.mods;
					}
				}
			let app = this;
			this.ChangeState('loading_screen', function() { 
				app.ResetEverything();
				// rebuild the master fleets array
				Fleet.all_fleets.splice(0,Fleet.all_fleets.length);
				for ( let c of newgame.galaxy.civs ) {
					Fleet.all_fleets.push( ...c.fleets );
					}
				newgame.galaxy.fleets = Fleet.all_fleets;
				// install new game 
				app.game = newgame; 
				newgame.SetMyCiv( newgame.galaxy.civs.find( x => x.is_player ) );
				// [!]HACK - reset diplomacy stats
				for ( let c of app.game.galaxy.civs ) { c.RecalcReputation(); }
				let focus_planet = newgame.myciv.homeworld.owner == newgame.myciv 
					? newgame.myciv.homeworld
					: newgame.myciv.planets[0];
				app.ChangeState('play', function() { app.FocusMap( focus_planet, true ) } ) ;
				});
	
			}
		// console.timeEnd('LOAD GAME');
		}
			
	PurgeUnlistedSavedGames() { 
		let games = this.SavedGameList().map( x => x.key );
		let keys = Object.keys(localStorage).filter( k => k.match(/^Game: /) );
		for ( let k of keys ) { 
			if ( games.indexOf(k) == -1 ) {
				localStorage.removeItem(k);
				}
			}
		}
						
	}

	
	
	
