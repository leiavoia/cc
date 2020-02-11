// import Planet from './classes/Planet';
// import {bindable} from 'aurelia-framework';
import * as Signals from '../../util/signals';

export class StarDetailPane {
	star = null;
	app = null;
	editing_name = false;
	// used for stuff that needs to be computed when UI changes.
	// changes in player's technology can affect the results, so
	// we use signals from the turn processor to update this
	// after each turn completed.
	calc_vals = {}; 
	playerHasLocalFleet = false;
	
	activate(data) {
		this.app = data.app;
		this.star = data.obj;
		this.turn_subscription = Signals.Listen('turn', data => this.Update(data) );
		this.Update();
		}
		
	unbind() { 	
		this.turn_subscription.dispose();
		}
		
	Update( turn_num ) { 
		this.calc_vals = {};
		this.fleets = [];
		if ( this.star ) { 
			for ( let p of this.star.planets ) { 
				this.calc_vals[p.id] = {
					adapt: p.Adaptation( this.app.game.myciv ),
					hab: p.Habitable( this.app.game.myciv )
					};
				}
			this.fleets = this.star.fleets.map( f => ({ fleet:f, models: f.ListUniqueModels() }) );
			this.playerHasLocalFleet = this.star.PlayerHasLocalFleet;
			}
		}
		
	PlanetSizeCSS( planet ) {
		let size = Math.min( 75, Math.round( Math.pow(planet.size-3,0.45)*16 ) );
		let pos = Math.max( 0, 35 - (size * 0.5) );
		return `background-size: ${size}px; background-position: ${pos}px 0%`;
		}
		
	StartEditName() {
		this.editing_name = true;
		this.old_name = this.star.name;
		}
		
	StopEditName() {
		this.star.name = this.star.name || 'Some Star';
		for ( let p of this.star.planets ) {
			p.name = p.name.replace( this.old_name, this.star.name );
			}
		this.old_name = null;	
		this.editing_name = false;
		return false;
		}
		
	}
