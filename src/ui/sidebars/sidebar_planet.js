// import {bindable} from 'aurelia-framework';

export class PlanetDetailPane {
	planet = null;
	app = null;

	activate(data) {
		this.app = data.app;
		this.planet = data.obj;
		this.planetChanged( this.planet );
		}

	prod_q_repeat_vals = [
		{ value: -1, name: '∞'},
		{ value: 1, name: '1x'},
		{ value: 2, name: '2x'},
		{ value: 3, name: '3x'},
		{ value: 4, name: '4x'},
		{ value: 5, name: '5x'},
		];
		
	// update some calculated values whenever planet changes
	planetChanged( planet ) { 
		//
		// WARNING: This stuff needs to be updated if our tech 
		// would change the numbers while the panel is in focus.
		//
		// NOTE: Numbers displayed are from the point of view of the
		// race of the player, NOT the owner of the planet
		//
		if ( planet ) { 
			this.habitat = planet.Adaptation( this.app.game.myciv.race );
			this.habitable = planet.Habitable( this.app.game.myciv.race );
			this.habitat_bonus = planet.HabitationBonus( this.app.game.myciv.race );
			}
		}
		
	PressNextPlanetButton() { 
		let planets = this.planet.star.planets;
		let i = 0;
		// find me in the array
		for ( var my_index=0; my_index < planets.length; my_index++ ) {
			if ( planets[my_index].id == this.planet.id ) { break; }
			}
		// find the next planet
		if ( my_index + 1 < planets.length ) { i = my_index + 1; }
		// first in the list
		else if ( my_index > 0 ) { i = 0; }
		this.app.SwitchSideBar( planets[i] );
		if ( this.app.main_panel_mode == "planetinfo" ) { 
			this.app.SwitchMainPanel( "planetinfo", planets[i] );
			}		
		}

	PressPrevPlanetButton() { 
		let planets = this.planet.star.planets;
		let i = 0;
		// find me in the array
		for ( var my_index=0; my_index < planets.length; my_index++ ) {
			if ( planets[my_index].id == this.planet.id ) { break; }
			}
		// find the prev planet
		if ( my_index - 1 >= 0 ) { i = my_index - 1; }
		// last in the list
		else if ( planets.length - 1 > 0 ) { i = planets.length - 1; }
		this.app.SwitchSideBar( planets[i] );
		if ( this.app.main_panel_mode == "planetinfo" ) { 
			this.app.SwitchMainPanel( "planetinfo", planets[i] );
			}
		}

	PressStarButton() { 
		this.app.SwitchSideBar( this.planet.star );
		this.app.CloseMainPanel();
		}
		
	PressConstelButton() { 
		this.app.SwitchSideBar( this.planet.star.Acct(this.planet.owner.id).constel );
		this.app.CloseMainPanel();
		}
		
	OpenDetailsPane() { 
		this.app.SwitchMainPanel( 'planetinfo', this.planet );
		}
		
	BuildQueueMoveItemUp( index ) {
		// tech note: aurelia doesn't recognize that anything changed if you 
		// use the old fashioned "swap from temp" technique
		this.planet.prod_q.splice( index-1, 0,
			this.planet.prod_q.splice( index, 1 )[0]
			);
		}
	BuildQueueMoveItemDown( index ) {
		// tech note: aurelia doesn't recognize that anything changed if you 
		// use the old fashioned "swap from temp" technique
		this.planet.prod_q.splice( index+1, 0,
			this.planet.prod_q.splice( index, 1 )[0]
			);		
		}
	BuildQueueRemoveItem( index ) {
		this.planet.prod_q.splice( index, 1 );
		}
	}
