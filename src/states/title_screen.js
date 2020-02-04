import {inject} from 'aurelia-framework';
import {App} from '../app';
import * as Signals from '../util/signals';

@inject(App)
export class TitleState {
	
	constructor( app ) {
		this.app = app;
		this.show_loading_panel = false;
		this.LoadGameList();
		}
		
	LoadGameList() { 
		this.saved_games = this.app.SavedGameList();
		if ( this.saved_games ) {
			for ( let i of this.saved_games ) { 
				i.key = i.key.replace('Game: ','');
				var newDate = new Date();
				newDate.setTime(i.time);
				i.time = newDate.toUTCString();				
				}
			}
		}
		
	LoadSavedGameFile() {
		let input = document.getElementById('savefileloader');
		if ( input && 'files' in input && input.files.length > 0 ) {
			this.readFileContent(input.files[0])
			.then(content => this.app.LoadGame(content) )
			.catch(error => console.log(error))
			}
		}

	readFileContent(file) {
		const reader = new FileReader()
		return new Promise((resolve, reject) => {
			reader.onload = event => resolve(event.target.result)
			reader.onerror = error => reject(error)
			reader.readAsText(file)
			})
		}
	
	ClickNewGame() {
		this.app.ChangeState('setup_new_game');
		}
		
	ClickSavedGame(i) {
		let g = this.saved_games.indexOf(i);
		if ( g >= 0 ) {
			this.app.LoadGame(g);
			}
		}

	ExportSavedGame(g,event) {
		event.stopPropagation(); 
		let key = 'Game: ' + g.key;
		let str = localStorage.getItem( key );
		if ( !str ) { return false; }
		let element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(str));
		element.setAttribute('download', 'ConstellationControl_t' + g.turn_num + '_' + g.time.replace(/( |\s)+/ig,'_') + '.game');
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
		return false;
		}

	DeleteSavedGame(g,event) {
		event.stopPropagation(); 
		this.app.DeleteSavedGame( g.key );
		this.LoadGameList();
		return false;
		}
		
	ClickHeadless() {
		this.app.ChangeState('headless');
		}

	attached() {
		Signals.Send('state_changed', this );
		}
		
	}

	
	
	
