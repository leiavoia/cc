
export default class ShipCombat {

	// attacker and defender are fleets
	constructor( attacker, defender, planet ) { 
		this.queue = [];
		this.time = 0;
		this.log = []; // battle log
		this.stats = {}; //
		this.status = null; // null = stalemate, 1 = attacker victory, 2 = defender victory
		// set up teams
		this.teams = [ 
			{ label: 'ATTACKER', owner: 1, ships: attacker, targets: [], stats:{} },
			{ label: 'DEFENDER', owner: 2, ships: defender, targets: [], stats:{} },
			];
		// make a list of targets
		this.teams[0].targets = this.teams[1].ships.slice(); // clone array
		this.teams[1].targets = this.teams[0].ships.slice(); // clone array
		// set up combat queue
		this.PreloadQueue(this.teams);
		}
		
	End() { 
// 		this.CalcStats();
		console.log(this.status);
		console.log(this.log);
		console.dir(this.stats);
// 		console.log(this.teams);
		}		
		
	// item: { ship, weapon, team }
	AddAttack( item, priority ) { 
		if ( !this.queue.length ) { this.queue.push({i:item,p:priority}); }
		else {
			for ( let x = this.queue.length-1; x >= 0; x-- ) { 
				if ( priority >= this.queue[x].p || x==0 ) { 
					this.queue.splice( x+1, 0, {i:item,p:priority});
					break;
					}
				}
			}
		}
		
	ProcessQueue( delta = 5 ) {
		if ( this.status ) { return ; }
		this.time += delta;
		let turnlog = [];
		while ( this.queue.length && this.queue[0].p <= this.time ) { 
			let next = this.queue.shift();
			let priority = next.p; // object's priority
			next = next.i; // the object itself
			// dead ships do not attack
			if ( next.ship.hull && next.team.targets.length ) {
				// attack!
// 				console.log('@'+priority);
				let turnlog = next.ship.Attack( next.team.targets, next.weapon );
				// reschedule the weapon
				if ( next.weapon.shotsleft && next.team.targets.length ) {
					this.AddAttack( { ship:next.ship, weapon:next.weapon, team:next.team }, priority + next.weapon.reload );
					}
				// add the attack logs to the running list with some additional info
				turnlog = turnlog.map( i => {i.time=priority; i.team=next.team; return i;} );
				this.log.push(...turnlog);
				}
			// we're done, son
			if ( !next.team.targets.length ) { 
				this.status = 'VICTORY: ' + next.team.label;
				break;
				}
			}	
		if ( !this.status && !this.queue.length ) {
			this.status = 'STALEMATE!';
			}
		this.CalcStats(turnlog);
		return turnlog;
		}
		
	PreloadQueue( teams ) { 
		// queue up the attacks
		teams.forEach( t => {
			t.ships.forEach( s => {
				for ( const w of s.weapons ) {  
					if ( w.online && w.shotsleft ) {
						this.AddAttack( { ship:s, weapon:w, team:t }, s.bp.drive + w.reload );
						}
					}
				})
			});	
		}
	
	// providing log as a param allows you to 
	// incrementally update stats as the battle progresses.
	CalcStats( log = null ) { 
		if ( !this.stats.length || !log ) { 
			let blank = {
				losses:0,
				kills:0,
				total_dmg_out:0,
				total_dmg_in:0,
				hull_dmg_out:0,
				hull_dmg_in:0,
				armor_dmg_out:0,
				armor_dmg_in:0,
				shield_dmg_out:0,
				shield_dmg_in:0,
				attacks_made:0,
				attacks_received:0,
				attacks_missed:0,
				attacks_dodged:0
				};
			this.stats[this.teams[0].label] = Object.assign({}, blank);
			this.stats[this.teams[1].label] = Object.assign({}, blank);
			}
		this.log.forEach( x => {
			// tabulate
			let teamdata = this.stats[x.team.label];
			teamdata.hull_dmg_out += x.hull;
			teamdata.armor_dmg_out += x.armor;
			teamdata.shield_dmg_out += x.shield;
			teamdata.total_dmg_out += x.hull + x.armor + x.shield;
			teamdata.attacks_made++;
			if ( x.missed ) { teamdata.attacks_missed++; } 
			if ( x.killed ) { teamdata.kills++; } 
			});
		// swap records
		let keys = Object.keys( this.stats );
		let t0 = this.stats[keys[0]];
		let t1 = this.stats[keys[1]];
		t0.losses = t1.kills;
		t1.losses = t0.kills;
		t0.total_dmg_in = t1.total_dmg_out;
		t1.total_dmg_in = t0.total_dmg_out;
		t0.hull_dmg_in = t1.hull_dmg_out;
		t1.hull_dmg_in = t0.hull_dmg_out;
		t0.armor_dmg_in = t1.armor_dmg_out;
		t1.armor_dmg_in = t0.armor_dmg_out;
		t0.shield_dmg_in = t1.shield_dmg_out;
		t1.shield_dmg_in = t0.shield_dmg_out;
		t0.attacks_received = t1.attacks_made;
		t1.attacks_received = t0.attacks_made;
		t0.attacks_dodged = t1.attacks_missed;
		t1.attacks_dodged = t0.attacks_missed;
		}
		
	};
