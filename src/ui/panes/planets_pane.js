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
	mode = 'basic' // 'basic', 'output'
	
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
			if ( this.app.options.see_all || star.explored ) { 
				for ( let planet of star.planets ) { 
					this.planets.push( planet );
					}
				}
			}
		this.SortBy();
		}
		
	SortBy( sort_by ) {
		this.sort_dir = this.sort_by == sort_by ? (this.sort_dir=='asc' ? 'desc' : 'asc') : 'desc';
		this.sort_by = sort_by || this.sort_by;
		// generic sorting method
		let val = x => { 
			switch ( this.sort_by ) {
				case 'name': return x.name;
				case 'size': return x.size;
				case 'hab': return x.Adaptation(this.app.game.myciv) || 0;
				case 'energy': return x.energy;
				case 'pop': return x.total_pop || 0;
				case 'popmax': return x.maxpop || 0;
				case 'taxrate': return x.tax_rate || 0;
				case 'spending': return x.spending || 0;
				case 'income': return x.acct_total.$ || 0;
				case 'o': return x.acct_total.o || 0;
				case 's': return x.acct_total.s || 0;
				case 'm': return x.acct_total.m || 0;
				case 'r': return x.acct_total.r || 0;
				case 'g': return x.acct_total.g || 0;
				case 'b': return x.acct_total.b || 0;
				case 'c': return x.acct_total.c || 0;
				case 'y': return x.acct_total.y || 0;
				case 'v': return x.acct_total.v || 0;
				case 'hou': return x.acct_total.hou || 0;
				case 'ship': return x.acct_total.ship || 0;
				case 'def': return x.acct_total.def || 0;
				case 'res': return x.acct_total.res || 0;
				case 'owner': return x.owner ? x.owner.name : null;
				case 'resources': return Object.values(x.resources).reduce( (accum,current) => accum+current, 0 );
				}	
			}
		this.planets.sort( (a,b) => val(b) < val(a) ? 1 : (val(b) > val(a) ? -1 : 0) );
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