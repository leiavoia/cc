
export default class ShipCombat {

	// attacker and defender are fleets
	constructor( attacker, defender, planet ) { 
		this.queue = [];
		this.time = 0;
		// battle log.
		// NOTE: log is in reverse chronological order, because
		// it works better for UI display and because the log
		// is for the benfit of the player, not the system.
		this.log = []; 
		this.max_log_length = 50;
		this.stats = null; 
		this.status = null;
		// set up teams
		this.teams = [ 
			{ 
				label: 'ATTACKER', 
				fleet: attacker, 
				targets: [], 
				target_priority: 'size_desc', 
				strategy: 'normal', 
				ships_retreated: 0, 
				retreating: false 
				},
			{ 
				label: 'DEFENDER', 
				fleet: defender, 
				targets: [], 
				target_priority: 'size_desc', 
				strategy: 'normal', 
				ships_retreated: 0, 
				retreating: false 
				},
			];
		// when combat begins, each ship is given a "retreat" flag
		// to show if it is in battle or has fled. Clean up afterward.
		this.teams[0].fleet.ships.forEach( s => { s.retreat = false; } );
		this.teams[1].fleet.ships.forEach( s => { s.retreat = false; } );
		// make a list of targets
		// NOTE: we use a shadow array that we can resort and
		// prioritize in the background without messing up visual representation.
		this.teams[0].targets = this.teams[1].fleet.ships.slice(); // clone array
		this.teams[1].targets = this.teams[0].fleet.ships.slice(); // clone array
		this.SortTargets( this.teams[0] );
		this.SortTargets( this.teams[1] );
		// set up combat queue
		this.PreloadQueue(this.teams);
		this.winner = null; // will be set to a team.label if victory
		}
		
	SortTargets( team ) {
		let sort_funcs = {
			size_desc: (a,b) => {
				if ( a.bp.hull > b.bp.hull ) { return  -1; }
				if ( a.bp.hull < b.bp.hull ) { return  1; }
				return 0;
				},
			easy_desc: (a,b) => {
				if ( a.bp.hull > b.bp.hull ) { return  1; }
				if ( a.bp.hull < b.bp.hull ) { return  -1; }
				return 0;
				},
			firepower_desc: (a,b) => {
				if ( a.bp.fp > b.bp.fp ) { return  -1; }
				if ( a.bp.fp < b.bp.fp ) { return  1; }
				return 0;
				},
			};
		team.targets.sort( sort_funcs[team.target_priority] );
		}
		
	End() { 
		// calculate experience:
		// 100 pts per battle, each side, modified by damage ratio and size ratio
		let t0_size = this.teams[0].fleet.ships.reduce( (v,s) => {return v + s.bp.hull + s.bp.armor;}, 0 );
		let t1_size = this.teams[1].fleet.ships.reduce( (v,s) => {return v + s.bp.hull + s.bp.armor;}, 0 );
// 		console.log(`size: t0:${t0_size}, t1:${t1_size} `);
		let t0_dmg = this.stats[this.teams[0].label].total_dmg_out;
		let t1_dmg = this.stats[this.teams[1].label].total_dmg_out;
// 		console.log(`dmg: t0:${t0_dmg}, t1:${t1_dmg} `);
		let t0_xp = 100 
			* ( (Math.min( 3.0, Math.max( 0.33, ( t1_size / t0_size ) ) )
				+ Math.min( 3.0, Math.max( 0.33, ( t1_dmg ? ( t0_dmg / t1_dmg ) : 0.33 ) ) )
				) / 2);
		let t1_xp = 100
			* (( Math.min( 3.0, Math.max( 0.33, ( t0_size / t1_size )  ) )
				+ Math.min( 3.0, Math.max( 0.33, ( t0_dmg ? ( t1_dmg / t0_dmg ) : 0.33 ) ) )
				) / 2);
// 		console.log(`awarding xp: t0:${this.teams[0].label}:${t0_xp}, t1:${this.teams[1].label}:${t1_xp} `);
		// clean up dead ships
		this.teams[0].fleet.RemoveDeadShips();
		this.teams[1].fleet.RemoveDeadShips();
		// award experience to survivors
		this.teams[0].fleet.ships.forEach( s => s.AwardXP(t0_xp) );
		this.teams[1].fleet.ships.forEach( s => s.AwardXP(t1_xp) );
		// clean up dead fleets and reload survivors
		this.teams.forEach( team => {
			if ( team.fleet.ships.length ) { 
				team.fleet.ReloadAllShipWeapons();
				// yellow bellied cowards get out of Dodge
				if ( team.retreating && team.ships_retreated ) {
					let f = team.fleet;
					let closest = f.owner.planets.reduce( (closest,planet) => { 
						if ( !closest || closest == planet.star ) { return planet.star; }
						let dist_a = 
							Math.pow( Math.abs(f.star.xpos - closest.star.xpos), 2 ) 
							+ Math.pow( Math.abs(f.star.ypos - closest.star.ypos), 2 ) 
							;
						let dist_b = 
							Math.pow( Math.abs(f.star.xpos - planet.star.xpos), 2 ) 
							+ Math.pow( Math.abs(f.star.ypos - planet.star.ypos), 2 ) 
							;
						return ( dist_a < dist_b ) ? closest : planet;
						}, null );
					// can't retreat to self
					if ( closest != f.star ) { 
						f.SetDest(closest);
						f.star = null; // prevent circling back
						}
					}
				}
			else { team.fleet.Kill(); }
			});
		// clean up battle-specific stuff
		this.teams[0].fleet.ships.forEach( s => { delete s.retreat; } );
		this.teams[1].fleet.ships.forEach( s => { delete s.retreat; } );
		}		
		
	// item: { ship, weapon, team, qty }
	AddAttack( item, priority ) { 
		item.qty = item.weapon.qty; // full load
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
		
	ProcessQueue( delta = 5, only_one_item = false ) {
		if ( this.status ) { return ; }
		this.time += delta;
		let turnlogs = [];
		while ( this.queue.length && this.queue[0].p <= this.time ) { 
			let next = this.queue[0];
			let priority = next.p; // object's priority
			next = next.i; // the object itself
			// dead/absent/useless ships do not attack
			if ( next.ship.retreat || !next.ship.hull || !next.team.targets.length || next.qty < 0 ) {
				this.queue.shift();
				continue;
				}
			// if my team is retreating, i forfeit my turn
			else if ( next.team.retreating && next.weapon !== 'retreat' ) { 
				this.queue.shift();
				continue;
				}
			// skip retreated targets... you had your chance, Gorman.
			else if ( next.team.targets[0].retreat ) { 
				next.team.targets.shift();
				continue;
				}
			// retreat token - get out of combat free card
			else if ( next.weapon === 'retreat' ) { 
				next.ship.retreat = true;
				next.team.ships_retreated++;
				this.queue.shift();
				continue;
				}
			// attack!
			else {
				next.qty--;
				// TODO: choose a target
				let turnlog = next.ship.Attack( next.team.targets[0], next.weapon );
				// update weapon stats
				if ( next.qty<=0 ) { next.weapon.shotsleft--; }
				if ( !next.team.targets[0].hull ) { next.team.targets.shift(); }
				// we went through all quantity
				if ( next.qty <= 0 ) {
					this.queue.shift();
					// reschedule the weapon if shots left
					if ( next.weapon.shotsleft && next.team.targets.length ) { 
						this.AddAttack( 
							{ ship:next.ship, weapon:next.weapon, team:next.team }, 
							priority + next.weapon.reload 
							);
						}
					}
				// add the attack logs to the running list with some additional info
				if ( turnlog ) { 
					turnlog.time=priority; 
					turnlog.team=next.team;
					this.log.unshift( turnlog ); // master log
					turnlogs.unshift( turnlog ); // function log
					}
				}
			// we're done, son
			if ( !next.team.targets.length ) { 
				this.status = 'VICTORY: ' + next.team.label;
				this.winner = next.team.label;
				break;
				}
			// break early
			if ( only_one_item ) { 
				break;
				}
			}	
		if ( !this.status && !this.queue.length ) {
			// difference between retreat and stalemate
			if ( this.teams[0].retreating ) { 
				this.status = 'RETREATED: ' + this.teams[0].label;
				}
			else if ( this.teams[1].retreating ) { 
				this.status = 'RETREATED: ' + this.teams[1].label;
				}
			else { 
				this.status = 'STALEMATE!';
				}
			}
		// empty the queue if we're done
		if ( this.status ) { 
			this.queue = [];
			}
		this.CalcStats(turnlogs);
		// trim our internal log if too big
		if ( this.log.length > this.max_log_length ) { 
			this.log.splice( this.max_log_length-1, this.log.length - this.max_log_length ); 
			}
		return turnlogs;
		}
		
	PreloadQueue( teams ) { 
		// queue up the attacks
		teams.forEach( t => {
			t.fleet.ships.forEach( s => {
				for ( const w of s.weapons ) {  
					if ( w.online && w.shotsleft ) {
						this.AddAttack( { ship:s, weapon:w, team:t }, s.bp.drive + w.reload + Math.random() /* jitter */ );
						}
					}
				})
			});	
		}
		
	RetreatTeam( team ) { 
		if ( !team.retreating ) { 
			team.retreating = true;		
			team.fleet.ships.forEach( s => {
				this.AddAttack( 
					{ ship:s, weapon:'retreat', team:team }, 
					this.time + s.bp.drive + Math.random() /* jitter */ 
					);
				});
			}
		}
	
	// providing log as a param allows you to 
	// incrementally update stats as the battle progresses.
	CalcStats( log = null ) { 
		log = log || this.log;
		if ( !log ) { return; }
		// first time setup
		if ( !this.stats ) { 
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
			this.stats = {};
			this.stats[this.teams[0].label] = Object.assign({}, blank);
			this.stats[this.teams[1].label] = Object.assign({}, blank);
			}
		log.forEach( x => {
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
