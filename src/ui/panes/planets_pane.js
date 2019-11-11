import * as Signals from '../../util/signals';

export class PlanetsPane {
	app = null;
	myciv = null;
	planets = [];
	
	show_mine = true;
	show_foreign = false;
	show_unclaimed	= false;
	sort_by = 'size';
	sort_dir = 'asc';
	
	activate(data) {
		this.app = data.app;
		this.myciv = this.app.game.myciv;
		this.turn_subscription = Signals.Listen( 'turn', data => this.UpdatePlanets() );
		this.UpdatePlanets();
		}
		
	unbind() { 
		this.turn_subscription.dispose();
		}
				
	ClosePanel() {
		// this.app.CloseSideBar(); // keep this open
		this.app.CloseMainPanel();
		}
	ClickPlanet(p) { 
		this.app.SwitchSideBar(p);
		this.app.FocusMap(p);	
		}
	UpdatePlanets() { 
		this.planets.splice(0, this.planets.length); // empty it
		for ( let star of this.app.game.galaxy.stars ) { 
			if ( this.app.options.see_all || star.in_range ) { 
				for ( let planet of star.planets ) { 
					this.planets.push( planet );
					}
				}
			}
		this.SortBy();
		}
		
	SortBy( sort_by ) {
		this.sort_dir = this.sort_by == sort_by ? (this.sort_dir=='desc' ? 'asc' : 'desc') : 'asc';
		this.sort_by = sort_by || this.sort_by;
		// generic sorting method
		let val = x => { 
			switch ( this.sort_by ) {
				case 'name': return x.name;
				case 'size': return x.size;
				case 'hab': return x.Adaptation(this.app.game.myciv.race);
				case 'energy': return x.energy;
				case 'pop': return x.total_pop;
				case 'popmax': return x.maxpop;
				case 'taxrate': return x.tax_rate;
				case 'spending': return x.spending;
				case 'income': return x.acct_total;
				case 'owner': return x.owner ? x.owner.name : null;
				case 'resources': return Object.values(x.resources).reduce( (accum,current) => accum+current, 0 );
				}	
			}
		this.planets.sort( (a,b) => val(b) > val(a) ? 1 : (val(b) < val(a) ? -1 : 0) );
		if ( this.sort_dir == 'desc' ) {
			this.planets.reverse();
			}
		}
		
		
	}

export class PlanetsizerValueConverter {
	toView( n ) {
		if ( n < 8 ) { n = 8; }
		if ( n > 20 ) { n = 20; }
		return n * 5;
		}
	}