import {Mod,Modlist} from './Mods';

export default class GroundCombat {

	// the attacker is an orbiting fleet with onboard ground units.
	// The defender is the planet with any ground forces.
	constructor( fleet, planet ) { 
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
				role: 'attacker',
				fleet: fleet, 
				planet: null,
				units: [], // actual data we work off of
				units_orig: [], // shadow array for UI display
				target_priority: 'size_desc', 
				strategy: 'normal', 
				status: null,
				owner: fleet.owner,
				odds: 0.5
				},
			{ 
				label: 'DEFENDER', 
				role: 'defender',
				fleet: null, 
				planet: planet,
				units: [], // actual data we work off of
				units_orig: [], // shadow array for UI display
				target_priority: 'size_desc', 
				strategy: 'normal', 
				status: null,
				owner: planet.owner,
				odds: 0.5
				},
			];
		// compile the fighting ground units
		this.teams[0].units = fleet.ListGroundUnits();
		this.teams[0].units_orig = this.teams[0].units.slice();
		this.teams[1].units = planet.troops;
		this.teams[1].units_orig = this.teams[1].units.slice();
		// create stat modifiers based on technology and planet conditions
		this.teams.forEach( team => {
			team.modlist = new Modlist();
			let adaptation = this.teams[1].planet.Adaptation( team.owner.race );
			if ( adaptation ) { 
				team.modlist.Add( 
					new Mod( 'ground_roll', '*', 1+(adaptation*0.1), 'Environment' )
					);
				}
			} );
		// handy crosslinks
		this.teams[0].otherteam = this.teams[1];
		this.teams[1].otherteam = this.teams[0];
		this.winner = null; // will be set to a team.label if victory
		this.CalcOdds();
		}
			
	Run( only_one_item = false ) {
		if ( this.status ) { return; }
		let turnlogs = [];
		while ( this.teams[0].units.length && this.teams[1].units.length ) { 
			let a = this.teams[0].units[0];
			let b = this.teams[1].units[0];
			// turnlog = { unit:this, target:target, roll: 0, target_roll: 0, dmg_received: 0, target_dmg: 0, died: false, target_died: false }
			let turnlog = a.Attack( b, this.teams[0].modlist, this.teams[1].modlist );
			if ( !a.hp ) { this.teams[0].units.shift(); }
			if ( !b.hp ) { this.teams[1].units.shift(); }
			if ( turnlog ) { 
				turnlog.attacker = this.teams[0].owner;
				turnlog.defender = this.teams[1].owner;
				this.log.unshift( turnlog ); // master log
				turnlogs.unshift( turnlog ); // function log
				}
			if ( only_one_item ) { break; }
			}
		// victory/defeat
		if ( !this.teams[0].units.length && !this.teams[1].units.length ) { 
			this.status = 'ANNIHILATION';
			this.winner = 'neither';
			this.teams[1].status = 'defeat';
			this.teams[0].status = 'defeat';
			}	
		else if ( !this.teams[0].units.length ) { 
			this.status = 'VICTORY: ' + this.teams[1].label;
			this.winner = this.teams[1].label;
			this.teams[1].status = 'victory';
			this.teams[0].status = 'defeat';
			}	
		else if ( !this.teams[1].units.length ) { 
			this.status = 'VICTORY: ' + this.teams[0].label;
			this.winner = this.teams[0].label;
			this.teams[0].status = 'victory';
			this.teams[1].status = 'defeat';
			}	
		this.CalcStats(turnlogs);
		// trim our internal log if too big
		if ( this.log.length > this.max_log_length ) { 
			this.log.splice( this.max_log_length-1, this.log.length - this.max_log_length ); 
			}
		
		// wrap up if combat is over
		if ( this.status ) { 
			// calculate experience:
	// 		let t0_size = this.teams[0].fleet.ships.reduce( (v,s) => {return v + s.bp.hull + s.bp.armor;}, 0 );
	// 		let t1_size = this.teams[1].fleet.ships.reduce( (v,s) => {return v + s.bp.hull + s.bp.armor;}, 0 );
	// 		let t0_dmg = this.stats[this.teams[0].label].total_dmg_out;
	// 		let t1_dmg = this.stats[this.teams[1].label].total_dmg_out;
	// 		let t0_xp = 100 
	// 			* ( (Math.min( 3.0, Math.max( 0.33, ( t1_size / t0_size ) ) )
	// 				+ Math.min( 3.0, Math.max( 0.33, ( t1_dmg ? ( t0_dmg / t1_dmg ) : 0.33 ) ) )
	// 				) / 2);
	// 		let t1_xp = 100
	// 			* (( Math.min( 3.0, Math.max( 0.33, ( t0_size / t1_size )  ) )
	// 				+ Math.min( 3.0, Math.max( 0.33, ( t0_dmg ? ( t1_dmg / t0_dmg ) : 0.33 ) ) )
	// 				) / 2);
			
			// clean up
			this.teams[0].fleet.RemoveDeadTroops();
			this.teams[1].planet.RemoveDeadTroops();
			
			// award experience to survivors
			// TODO
			
			// if the invasion was successfull, revert planet ownership
			if ( this.teams[0].status == 'victory' ) { 
				this.teams[1].planet.BeConqueredBy( this.teams[0].fleet.owner );
				// TODO: land all troops?
				}
		
			// TODO: capture of planet may anihilate the civ
			
			// TODO: diplomacy affect
			
			}
			
		return turnlogs;
		}
		
	// providing log as a param allows you to 
	// incrementally update stats as the battle progresses.
	CalcStats( log = null ) { 
		log = log || this.log;
		if ( !log ) { return; }
		// first time setup
		if ( !this.stats ) { 
			let blank = { losses:0, kills:0 };
			this.stats = {};
			this.stats[this.teams[0].label] = { losses:0, kills:0 };
			this.stats[this.teams[1].label] = { losses:0, kills:0 };
			}
		// log format: { unit:this, target:target, roll: 0, target_roll: 0, dmg_received: 0, target_dmg: 0, died: false, target_died: false }
		log.forEach( x => {
			// tabulate - note: all logs are from the attacker's (team 0) point of view.
			if ( x.target_died ) { 
				this.stats[this.teams[0].label].kills++; 
				this.stats[this.teams[1].label].losses++; 
				}
			if ( x.died ) { 
				this.stats[this.teams[1].label].kills++; 
				this.stats[this.teams[0].label].losses++; 
				}
			});
		}
		
	CalcOdds() { 
		// figure out what the cost of improving odds would be
		for ( let team of this.teams ) { 
			let total = 0; // aka firepower
			for ( let u of team.units ) { 
				let avgdmg = ( ( u.bp.maxdmg + u.bp.mindmg ) / 2 );
				total += 
					team.modlist.Apply( avgdmg, 'ground_roll', true ) 
					* u.bp.hp // hits * avg dmg
					;
				};
			team.firepower = total;
			team.odds_base_cost = total * 1000; // [!]MAGICNUMBER 
			};
		// calculate the odds
		this.teams[0].odds = this.teams[0].firepower / ( this.teams[0].firepower + this.teams[1].firepower ) ;
		this.teams[1].odds = this.teams[1].firepower / ( this.teams[0].firepower + this.teams[1].firepower ) ;
		}
	};
