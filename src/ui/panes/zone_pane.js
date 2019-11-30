import * as Signals from '../../util/signals';
export class ZonePane {

	zone = null;
	zones = [];
	upgrade_costs = []; // parallel array with `zones`
	eligible_zones = []; // parallel array with `zones`
	
	activate(data) {
		this.app = data.app;
		this.planet = data.obj;
		// if we are supplied with a target zone, we are in upgrade mode.
		// otherwise we're in addition mode.
		if ( 'data' in data && 'zone' in data.data ) {
			this.zone = data.data.zone;
			}
		// based on what mode we're in, figure out what zones to display
		if ( this.zone ) { // upgrade mode
			this.zones = this.app.game.myciv.avail_zones.filter( z => 
				z.type == this.zone.type 
				&& z.key != this.zone.key 
				&& z.minsect <= this.zone.sect
				);
			// create a parallel array that has the cost to upgrade the zones
			const inf = this.zone.size * this.zone.val;
			const punishment = 4;
			this.upgrade_costs = this.zones.map( z => {
				let costs = {};
				for ( let k in z.inputs ) {
					costs[k] = Math.ceil( z.inputs[k] * inf * punishment );
					}
				return costs;
				});
			// create another parallel array that indicates whether or not we can afford the upgrade
			this.eligible_zones = [];
			for ( let i=0; i<this.zones.length; i++ ) {
				this.eligible_zones[i] = true;
				for ( let k in this.upgrade_costs[i] ) {
					if ( this.upgrade_costs[i][k] > this.planet.owner.resources[k] ) {
						this.eligible_zones[i] = false;
						break;
						}
					}
				}
			} 
		else { // addition mode
			this.zones = this.app.game.myciv.avail_zones;
			}
		}
		
	ClickZone( z ) { 
		if ( this.zone ) { // upgrade
			// pay up
			const i = this.zones.indexOf(z);
			if ( !this.eligible_zones[i] ) { return false; } // cant afford
			const costs = this.upgrade_costs[i];
			for ( let k in costs ) {
				this.planet.owner.resources[k] -= costs[k];
				}
			// swap the zone itself
			let v = this.zone.val;
			let sect = this.zone.sect;
			this.planet.RemoveZone( this.zone );
			let newzone = this.planet.AddZone(z.key);
			newzone.Grow( sect - newzone.minsect );
			newzone.val = v;
			this.planet.zoned += sect - newzone.minsect;
			this.app.CloseMainPanel();
			Signals.Send('turn'); // forces update on sidebar
			}
		else { // add
			this.planet.AddZone( z.key );
			if ( this.planet.size == this.planet.zoned ) {
				this.app.CloseMainPanel();
				}
			}
		}
		
	ClosePanel() {
		this.app.CloseMainPanel();
		}
		
	}
