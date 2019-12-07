export class FleetsPane {

	activate(data) {
		this.app = data.app;
		this.fleets = this.app.game.myciv.fleets;//.map( x => x );
		}
		
	 ClosePanel() {
		// this.app.CloseSideBar(); // keep this open
		this.app.CloseMainPanel(); 
		}
		
	ClickObject(o) { 
		this.app.SwitchSideBar(o);
		this.app.FocusMap(o);	
		}
		
	SortBy( sort_by ) {
		this.sort_by = sort_by || this.sort_by;
		this.sort_dir = this.sort_by == sort_by ? (this.sort_dir=='asc' ? 'desc' : 'asc') : 'desc';
		// generic sorting method
		let val = x => { 
			switch ( this.sort_by ) {
				case 'id': return x.id;
				case 'ships': return x.ships.length;
				case 'star': return (x.star ? x.star.name : '');
				case 'dest': return (x.dest ? x.dest.name : '');
				case 'milval': return x.milval || 0;
				case 'fp': return x.fp || 0;
				case 'health': return (x.health / x.healthmax);
				case 'troops': return x.troops || 0;
				case 'research': return x.research || 0;
				}	
			}
		this.fleets.sort( (a,b) => val(b) < val(a) ? 1 : (val(b) > val(a) ? -1 : 0) );
		if ( this.sort_dir == 'desc' ) {
			this.fleets.reverse();
			}
		}
				
	}
