export class PlanetinfoPane {

	ship_dest_opts = [];
	
	activate(data) {
		this.app = data.app;
		this.planet = data.obj;
		
		// list of valid destinations for newly constructed ships
		this.ship_dest_opts.push({name:'Stay Here', value:null});
		if ( this.planet.owner.ai.staging_pts.length ) { 
			this.ship_dest_opts.push({name:'Nearest Staging Point', value:'@'});
			}
		for ( let s of this.planet.owner.MyStars() ) { 
			if ( s != this.planet.star ) { 
				this.ship_dest_opts.push({name:s.name, value:s});
				}
			}
			
		}
		
	 ClosePanel() {
		this.app.CloseMainPanel();
		}
	}
