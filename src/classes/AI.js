// = HOW THE AI WORKS: =
// Fundamentally, the AI system is just a list of objectives
// that the AI will try to meet each turn. The system here
// is broken down into two basic classes: AI and AIObjective.
// 
// == CivAI ==

// CivAI has a list of objectives but also internally keeps
// track of some high level statistics which it can use to make
// decisions. This AI is specifically tailored to sandbox Civs.
// You could use the generic AI class to create an AI for any
// other sort of scenario.
// 
// == AIObjective ==

// Objectives are extremely simple data structures with potentially 
// very complex behaviors. They have a single EvaluateFunc() which
// does all of the logic. The CivAI class will process all objectives
// in order of priority. On evaluation, Objectives that return 
// FALSE are pruned from the list. 
// 
// Objectives can have a delay and a TTL (time to live) to make sure
// short term objectives do not run away.
// 
// Because each AI entity works from one master list of objectives
// objectives can spawn sub objectives which are simply added to the 
// list. Objectives do not directly manage these sub objectives, 
// but you could easily program them to do so.
// 
// You can add a callback for when objectives complete or expire with
// `onComplete`, `onSuccess`, and `onFail`.
//
// Objectives can be chained together by using `onComplete` which is
// a callback function that can do literally whatever you want,
// including deploy another Objective.


import * as utils from '../util/utils';
import Fleet from './Fleet';

export class AI {
	civ = null;
	objectives = [];
	completed = []; // mostly for debug
	constructor( civ ) {
		this.civ = civ;
		}
	Do( app ) {
		// evaluate all objectives and throw away failed or expired.
		this.objectives.sort( (a,b) => a.priority <= b.priority ? -1 : 1 );
		// TECHNICAL: Aurelia can't handle array self-reassignment, so 
		// we need to loop through and manually splice out completed objectives.
		for ( let i = this.objectives.length-1; i >= 0; i-- ) { 
			let result = this.objectives[i].Evaluate(app,this.civ);		
			if ( result === true || result === false ) { 
				let o = this.objectives[i];
				// removal 
				this.objectives.splice(i,1); 
				this.completed.unshift(o);
				if ( this.completed.length > 12 ) {
					this.completed.pop();
					}
				// notes
				o.note += ' ' + ( result ? '⬤' : '⭕' );
				console.log('AI: ' + this.civ.name + ' ' + o.toString() );
				}
			}
		}
	// find a particular objective
	QueryObjectives( type, target=null ) {
		return this.objectives.filter( o => 
			o.type == type && ( target == o.target || !target )
			);
		}		
	}
	
export class CivAI extends AI {
	threats = []; // fleets
	staging_pts = []; // stars to send newly built ships, AKA "accumulators"
	total_milval = 0;
	avail_milval = 0;
	total_threat = 0;
	total_starvalue = 0;
	num_uncolonized = 0;
	total_troops = 0;
	total_troopships = 0;
	strat = { 
		def: 'balanced', // star system defense strategy [balanced, triage, equal, none, null]
		offense_ratio: 0.5, // 0..1. guides fleet composition and mission assignment
		def_planetvalue_weight: 0.5, // 0..1 amount to consider star system value when defending
		def_threat_weight: 0.5, // 0..1 amount to consider external threats when defending
		risk: 0.5, // 0..1 amount of risk AI is willing to take
		posture: 0.5, // 0..1 balance between turtling (0) and mindless offense (1).
		min_assault_score: 10000
		};
	needs = { 
		colony_ships: 0,
		combat_ships: 0,
		troop_ships: 0,
		research_ships: 0,
		scout_ships: 0,
		troops: 0,
		cash: 1,
		tech: 1
		};
	constructor( civ ) {
		super();
		this.civ = civ;
		// bootstrap
		this.objectives.push( new AIMainObjective(civ) );
		}
	}

	
export class AIObjective {
	type = 'none';
	target = null;
	fleet = null;
	ttl = -1;
	delay = 0;
	note = ''; // for debugging and the curious
	priority = 100; // for future development
	onComplete = null; // optional callback
	onSuccess = null; // optional callback
	onFail = null; // optional callback
	
	constructor( target = null, fleet = null, ttl = -1, delay = 0 ) {
		this.target = target;
		this.fleet = fleet;
		this.ttl = ttl;
		this.delay = delay;
		if ( this.fleet ) { 
			this.fleet.ai = this;
			}
		if ( delay ) { 
			this.note = 'waiting';
			}
		}
		
	// Does internal stuff to try to meet the objective.
	// Returns: 
	// 	NULL or UNDEFINED if objective is ongoing.
	// 	FALSE if objective failed or expired and needs to be removed.
	// 	TRUE if objective succeeded
	Evaluate( app, civ ) { 
		// delay
		if ( this.delay > 0 ) { 
			this.delay--;
			this.note = 'waiting';
			return; // do nothing
			}
		// ttl
		let result = null;
		if ( this.ttl > 0 ) { this.ttl--; }
		if ( this.ttl == 0 ) { 
			this.note = this.note + ' -expired';
			result = false; 
			}
		// actual objective evaluation
		else { result = this.EvaluateFunc(app,civ); }
		// cleanup
		if ( this.fleet && ( result === true || result === false ) ) { 
			this.fleet.ai = null; 
			}
		// post completion callbacks
		if ( typeof this.onComplete == 'function' && ( result === true || result === false ) ) { this.onComplete(); } 
		if ( result === true && typeof this.onSuccess == 'function' ) { this.onSuccess(); } 
		if ( result === false && typeof this.onFail == 'function' ) { this.onFail(); } 			
		return result;	
		}
		
	// This is the guts of the objective evaluation.
	// Inherit and overwrite this for subclass behaviors.
	// The default behavior is to do absolutely nothing.
	EvaluateFunc( app, civ ) { 
		// Return: 
		// 	NULL or UNDEFINED if objective is ongoing.
		// 	FALSE if objective failed
		// 	TRUE if objective succeeded
		}
		
	toString() { 
		return `[${this.type}] `
			+ ( this.target ? `=> ${this.target.name} ` : '' )
			+ ( this.fleet ? `F.${this.fleet.id} ` : '' )
			+ ( this.ttl > -1 ? `TTL.${this.ttl} ` : '' )
			+ ( this.note ? ` ${this.note} ` : '' )
			;	
		}
		
	FleetDestroyed() {
		return !this.fleet || this.fleet.killme || !this.fleet.ships.length;
		}
	}


// MAIN - This bootstraps the entire AI for sandbox civilizations.
export class AIMainObjective extends AIObjective { 	
	type = 'main';
	priority = 0;
	bootstrapped = false;
	EvaluateFunc( app, civ ) { 
		if ( !this.bootstrapped ) { 
			civ.ai.objectives.push( new AIAnalyzeObjective() );
			civ.ai.objectives.push( new AIDefenseObjective() );
			civ.ai.objectives.push( new AIOffenseObjective() );
			civ.ai.objectives.push( new AIColonizeObjective() );
			civ.ai.objectives.push( new AIPlanetsObjective() );
			this.bootstrapped = true;
			}
		}			
	}


// ANALYZE - This measures all the things so we can do other work later
export class AIAnalyzeObjective extends AIObjective { 	
	type = 'analyze';
	priority = 1;
	EvaluateFunc( app, civ ) { 
		// reset stats
		civ.ai.total_milval = 0;
		civ.ai.avail_milval = 0;
		civ.ai.total_starvalue = 0;
		civ.ai.total_threat = 0;
		civ.ai.total_troops = 0;
		civ.ai.total_troopships = 0;
		for ( let p of civ.planets ) { 
			let acct = p.star.accts.get(civ);
			acct.ai.value = 0;
			acct.ai.value_norm = 0;
			acct.ai.defense = 0;
			acct.ai.defense_norm = 0;
			acct.ai.threat = 0;
			acct.ai.threat_norm = 0;
			acct.ai.def_priority = 0;
			}
		// make a list of star systems while we're doing civ
		let starsystems = [];
		// evaluate values and threats
		for ( let p of civ.planets ) { 
			let acct = p.star.accts.get(civ);
			let star_already_evaluated = acct.ai.value != 0;
			// troops
			civ.ai.total_troops += p.troops.length;
			// value
			p.ai_value = p.ValueTo(civ);
			acct.ai.value += p.ai_value;
			civ.ai.total_starvalue += p.ai_value;
			if ( !star_already_evaluated ) {
				// defense
				let f = p.OwnerFleet();
				if ( f ) {
					acct.ai.defense = f.milval; // TODO: factor in fleets on missions?
					}			
				// threats
				for ( let c of app.game.galaxy.civs ) { 
					if ( c == civ ) { continue; } 
					// tech note: monsters show up in the civ list, 
					// but have no planets to calculate range.
					if ( !c.InRangeOfCiv( civ ) && c.planets.length ) { continue; }
					// TODO: factor in diplomatic situation
					// TODO: if star is theoretically reachable by ANY
					// unfriendly fleet, that should be a mild concern regardless
					// of presence of any actual fleets right now.
					for ( let f of c.fleets ) { 
						if ( f.killme || f.mission || !f.fp ) { continue; }
						let is_a_threat = false;
						let fastrange = 1; // use later
						let scanrange = 800*800; // don't care about targets outside 800px radius
						// fleets en route - use their destination
						if ( f.dest ) { 
							// WARNING: we are assuming no subspace communications can reroute fleets in transit
							fastrange = utils.DistanceBetween( f.dest.xpos, f.dest.ypos, p.star.xpos, p.star.ypos, true );
							if ( fastrange < civ.ship_range * civ.ship_range && fastrange < (scanrange) ) {
								is_a_threat = true;
								}
							}
						// parked fleets nearby
						else if ( f.star ) { 
							fastrange = utils.DistanceBetween( f.star.xpos, f.star.ypos, p.star.xpos, p.star.ypos, true );
							if ( fastrange < civ.ship_range * civ.ship_range && fastrange < (scanrange) ) {
								is_a_threat = true;
								}
							}
						// fleet is considered a threat - determine how much
						if ( is_a_threat ) { 
							let threat = f.milval;
							// fleets parked on me
							if ( f.star == p.star ) { threat = f.milval; }
							// fleets en route to me
							else if ( f.dest == p.star ) { threat = f.milval; }
							// fleets in the neighborhood
							else {
								// graduate threat over 7 turn ETA
								let range_mod = 1 + (7 - Math.min( 7, Math.ceil( fastrange / (f.speed * f.speed) ) ) ) / 7;
								// monsters are always a threat
								if ( f.owner.race.is_monster ) { 
									threat = f.milval * range_mod * 0.4;
									}
								else { 
									threat = f.milval * range_mod * 0.2;
									}
								}
							acct.ai.threat += threat;
							civ.ai.total_threat += threat;
// 							civ.ai.threats.push(f);
// 							if ( p.owner == app.game.myciv ) { 
// 								console.log(`${f.owner.name} fleet #${f.id} is a threat to ${p.star.name} [${threat}]`);
// 								}
							}
						}
					}
				starsystems.push(p.star);
				}
			}
		// evaluate fleets
		for ( let f of civ.fleets ) { 
			if ( f.mission || f.killme || !f.ships.length ) { continue; }
			civ.ai.total_troops += f.troops;
			civ.ai.total_troopships += f.troopcap;
			civ.ai.total_milval += f.milval;
			civ.ai.avail_milval += (f.milval - f.reserved_milval);
			}			
		// normalize levels
		if ( civ.ai.total_threat ) { 
			for ( let s of starsystems ) {
				let acct = s.accts.get(civ);
				acct.ai.threat_norm = acct.ai.threat / civ.ai.total_threat;
				acct.ai.defense_norm = acct.ai.defense / civ.ai.total_milval;
				acct.ai.value_norm = acct.ai.value / civ.ai.total_starvalue;
				// defense priority - used for Balanced strategy
				acct.ai.def_priority = 
					( ( acct.ai.threat_norm * civ.ai.strat.def_threat_weight )
					+ ( acct.ai.value_norm * civ.ai.strat.def_planetvalue_weight ) )
					/ ( civ.ai.strat.def_planetvalue_weight + civ.ai.strat.def_threat_weight );
				}
			}	
		this.note = 'PowerScore ' + civ.power_score;
		}			
	}


// DEFENSE
export class AIDefenseObjective extends AIObjective { 	
	type = 'defense';
	priority = 20;
	EvaluateFunc( app, civ ) {
		// BALANCED STRATEGY: calculate the ideal amount of ships for
		// each system based on system value and current threat level. 
		if ( civ.ai.strat.def == 'balanced' ) {
			// find under and over defended systems
			let systems = [];
			let threshold_diff = 0.15;
			civ.MyStars().forEach( s => {
				let acct = s.accts.get(civ);
				if ( acct.ai.def_priority ) { 
					let diffpct = ( acct.ai.def_priority - acct.ai.defense_norm ) / acct.ai.def_priority;
					if ( diffpct > threshold_diff ) { 
						systems.push({ star: s, diffpct: diffpct }); 
						}
					}
				});
			systems = systems.sort( (a,b) => {
				if ( a.diffpct > b.diffpct ) { return -1; }
				if ( a.diffpct < b.diffpct ) { return 1; }
				return 0;
				}).map( s => s.star );
				
			// find all fleets that can help defend
			let helpers = [];
			for ( let f of civ.fleets ) { 
				if ( !f.dest && f.fp && f.star && !f.killme && !f.mission ) { 
					let acct = f.star.accts.get(civ);
					// dont grab fleets in our underdefended list
					if ( systems.indexOf(f.star) > -1 ) { continue; } 
					// don't pull fleets from systems if they are pretty much where they need to be
					if ( acct ) { 
						if ( acct.ai.def_priority ) {
							let diffpct = ( acct.ai.def_priority - acct.ai.defense_norm ) / acct.ai.def_priority;
							if ( diffpct > -threshold_diff ) { continue; }
							}
						}
					// TODO dont grab fleets on AI missions
					helpers.push(f);
					}
				}
			// sort fleets based on system balanced defense priority
			helpers.sort( (a,b) => {
				let dpa = a.star.accts.has(civ) ? a.star.accts.get(civ).ai.def_priority : 0;
				let dpb = b.star.accts.has(civ) ? b.star.accts.get(civ).ai.def_priority : 0;
				if ( dpa > dpb ) { return -1; }
				if ( dpa < dpb ) { return 1; }
				return 0;
				});		
			while ( systems.length && helpers.length ) { 
				let star = systems.shift(); // most threatened
				// as part of our defense rating, we need to factor in ships en route to assist.
				// otherwise algorithm will just keep stripping more ships off other systems.
				let enroute = 0;
				for ( let f of civ.fleets ) { 
					if ( ( f.dest == star ) && f.milval ) { 
						enroute += f.milval;
						}
					}
				// how much more milval do i need?
				let milval_needed = 
					( star.accts.get(civ).ai.def_priority - star.accts.get(civ).ai.defense_norm ) 
					* civ.ai.avail_milval
					- enroute
					;
				while ( helpers.length && milval_needed > 0) { 
					let helper = helpers.pop();
					milval_needed -= civ.AI_PeelShipsForDefense( star, helper, milval_needed );
					}
				}
			// if there is leftover undefended threat, add that to our AI needs
			civ.ai.needs.combat_ships = 0;
			while ( systems.length > 0 ) { 
				let star = systems.pop();
				let milval_needed = 
					( star.accts.get(civ).ai.def_priority - star.accts.get(civ).ai.defense_norm ) 
					* civ.ai.avail_milval
					// - enroute // meh
					;
				civ.ai.needs.combat_ships += milval_needed;
				}		
			}
			
		// TRIAGE STRATEGY: peel ships off the least-threatened systems
		// and send them to the most threatened systems.
		else if ( civ.ai.strat.def == 'triage' ) {
			// find all threatened systems above some threshold
			let systems = civ.MyStars().filter( 
				s => s.accts.get(civ).ai.threat_norm > 0 
				);
			systems.sort( (a,b) => {
				let threat_a = a.accts.get(civ).ai.threat_norm;
				let threat_b = b.accts.get(civ).ai.threat_norm;
				if ( threat_a > threat_b ) { return -1; }
				if ( threat_a < threat_b ) { return 1; }
				return 0;
				});
			for ( let s of systems ) { 
				};
			// find all fleets that can help defend
			let helpers = [];
			for ( let f of civ.fleets ) { 
				if ( !f.dest && f.fp && f.star && !f.killme && !f.mission ) { 
					let acct = f.star.accts.get(civ);
					// don't peel off ships from high-value systems
					// or systems already under significant threat
					if ( acct && acct.ai.threat * 0.5 > acct.ai.defense ) { continue; } 
					helpers.push(f);
					}
				}
			// sort fleets based on system threat level first
			helpers.sort( (a,b) => {
				let threat_a = a.star.accts.has(civ) ? a.star.accts.get(civ).ai.threat_norm : 0;
				let threat_b = b.star.accts.has(civ) ? b.star.accts.get(civ).ai.threat_norm : 0;
				if ( threat_a > threat_b ) { return -1; }
				if ( threat_a < threat_b ) { return 1; }
				return 0;
				});		
			while ( systems.length && helpers.length ) { 
				let star = systems.shift(); // most threatened
				// as part of our defense rating, we need to factor in ships en route to assist.
				// otherwise algorithm will just keep stripping more ships off other systems.
				let enroute = 0;
				for ( let f of civ.fleets ) { 
					if ( ( f.dest == star || f.star == star ) && f.milval ) { 
						enroute += f.milval;
						}
					}
				let milval_needed = star.accts.get(civ).ai.threat - enroute;
				while ( helpers.length && milval_needed > 0) { 
					let helper = helpers.pop();
					milval_needed -= civ.AI_PeelShipsForDefense( star, helper, milval_needed );
					}
				}
			// if there is leftover undefended threat, add that to our AI needs
			civ.ai.needs.combat_ships = 0;
			while ( systems.length > 0 ) { 
				let star = systems.pop();
				civ.ai.needs.combat_ships += star.accts.get(civ).ai.threat - star.accts.get(civ).ai.defense;
				}
			}
			
		// see how many combat ships we already have in production. civ may
		// indicate we need to build more or possibly cull some already queued.
		for ( let p of civ.planets ) { 
			for ( let i of p.prod_q ) { 
				if ( i.type == 'ship' && i.obj.milval ) {
					civ.ai.needs.combat_ships -= i.obj.milval * ( i.qty == -1 ? 1 : i.qty );
					}
				}
			}	
		}			
	}


// OFFENSE
export class AIOffenseObjective extends AIObjective { 	
	type = 'offense';
	priority = 10;
	EvaluateFunc( app, civ ) { 
		this.note = '';
		
		let max_missions = 1;
		let att_missions = civ.ai.objectives.filter( o => o.type=='invade' );
		
		// we need to maintain at least a minimal force to keep at the ready
		civ.ai.needs.troops = civ.ai.total_troops < 5 ? (5 - civ.ai.total_troops) : 0;
		civ.ai.needs.troop_ships = civ.ai.total_troopships < 5 ? (5 - civ.ai.total_troopships) : 0;
		// how much ground power do i need to meet all objectives?
		civ.ai.needs.troops += att_missions.reduce( (total,m) => {
			return total + ( ( m.target && m.target.owner != civ ) ? m.target.troops.length : 0 );
			}, 0 );
		// this should tell me how many troop ships i need, plus a little extra
		civ.ai.needs.troop_ships = civ.ai.needs.troops;
		// also factor in how much security i need to protect all of my planets
		civ.ai.needs.troops += civ.planets.length * 3; // TODO scale with time. TODO: AI personality
		// balance this with what is on planets
		for ( let p of civ.planets ) {
			// stationed on planet
			civ.ai.needs.troops -= p.troops.length;
			// being built
			for ( let i of p.prod_q ) {
				if ( i.type == 'groundunit' ) {
					civ.ai.needs.troops--;
					}
				else if ( i.type == 'ship' && i.obj.role=='carrier' ) {
					civ.ai.needs.troop_ships--;
					}
				}
			}
		// ... and what we have in the air
		for ( let f of civ.fleets ) {
			if ( f.killme || f.mission ) { continue; } 
			civ.ai.needs.troop_ships - f.troopcap;
			civ.ai.needs.troops - f.troops;
			}
		// and a little extra motivation for the planetary build queue
		civ.ai.needs.troop_ships += 0.5;
		civ.ai.needs.troops += 0.5;
		
		if ( att_missions.length ) { 
			this.note = `${att_missions.length} missions`;
			// if i have enough objectives already, do not accept more.
			if ( att_missions.length >= max_missions ) {
				this.note = this.note + ' /!\\';
				return;
				}
			}
		
		// what's the best planet i have? 
		let my_best_planet = civ.planets.reduce( (v,p) => Math.max(p.ValueTo(civ),v), 0 );
		// how many planets are available for me to colonize still?
		// TODO may want to factor civ out as a general AI signal
		civ.ai.num_uncolonized = 0;
		let best_uncolonized = 0;
		for ( let s of app.game.galaxy.stars ) { 
			for ( let p of s.planets ) { 
				if ( !p.owner && civ.InRangeOf(p.star.xpos,p.star.ypos) ) { 
					let v = p.ValueTo(civ);
					if ( v ) { 
						civ.ai.num_uncolonized++;
						if ( v > best_uncolonized ) { best_uncolonized = v; }
						}
					}
				}
			}
			
		// find the minimum score we would be willing to accept
		civ.ai.strat.min_assault_score = 
			my_best_planet 
			* ( (1 + civ.ai.num_uncolonized) * 0.5  )
			* ( (0.5 - civ.ai.strat.posture) * 0.5 + 1 ) // more posture means more offensive tendency
			/ ((app.game.turn_num+1) / 50) // war more likely after turn 50
			;
			
		// find a list of planets we might like to have
		let planets = []; // { planet, score }
		for ( let c of app.game.galaxy.civs ) { 
			if ( civ == c || c.race.is_monster ) { continue; }
			// diplo status is important, but we wont write off something 
			// really juicy just because we're "friends"
			for ( let p of c.planets ) { 
				let score = p.ValueTo(civ);
				if ( score ) { // must be at habitable at least
					// TODO: at war? basically free for the taking!
					// if ( 1 /* at war */ ) { score *= 2; }
					// else if ( 0 /* at peace */ ) { score *= 0.5; }
					// defended?
					let defender = p.OwnerFleet();
					if ( defender && defender.milval ) { 
						// hard to gauge "how defended this is" because it depends
						// on our own fleet strength available
						let difficulty = defender.milval / civ.ai.total_milval;
						score -= 30 * difficulty * (1-civ.ai.strat.risk);
						}
					// ground forces to overcome?
					if ( p.troops.length ) { score -= p.troops.length * 2 * (1-civ.ai.strat.risk); }
					// we already have a foothold there?
					if ( p.star.accts.has(civ) ) { score *= 1.5; }
					// likelyhood of getting our butts kicked
					score *= ( civ.ai.total_milval / p.owner.ai.total_milval ) * (1+civ.ai.strat.risk)
					// meets minimum score? 
					if ( score > civ.ai.strat.min_assault_score ) { 
						planets.push({ planet: p, score, raw: p.ValueTo(civ) }); 
						}
					}
				}
			}
		if ( planets.length ) { 
			planets.sort( (a,b) => a.score > b.score ? -1 : 1 );
			for ( let p of planets ) { 
				p = p.planet;
				// no duplicate missions
				let dups = civ.ai.QueryObjectives( 'invade', p );
				if ( dups.length ) { continue; }
				let m = new AIInvadeObjective( p, null, 14, 0 );
				// chain into Guard mission if planet acquired
				m.onSuccess = () => {
					if ( !m.FleetDestroyed() ) {
						civ.ai.objectives.push( 
							new AIGuardObjective( p.star, m.fleet, Math.ceil( 12 * (1-civ.ai.risk) ) ) 
							);
						// TODO possibly call for reinforcements if fleet got hammered
						}	
					};
				civ.ai.objectives.push(m);
				m.Evaluate(app,civ); // this activates it
				console.log(`${civ.name}: Adding invasion mission: ${p.name}`);
				if ( ++att_missions.length >= max_missions ) { break; }
				}
			}
		// baseline military
		civ.ai.needs.combat_ships += 2000;	
		}			
	}


// COLONIZE
export class AIColonizeObjective extends AIObjective { 	
	type = 'colonize';
	priority = 30;
	EvaluateFunc( app, civ ) { 
		// build a list of targets, sorted by distance
		let targets = [];
		for ( let s of app.game.galaxy.stars ) { 
			for ( let p of s.planets ) {
				if ( !p.owner && p.Habitable( civ.race ) && civ.InRangeOf(p.star.xpos, p.star.ypos) ) { 
					targets.push(p);
					}
				}
			}
		// have colony ships?
		if ( targets.length )  {
			for ( let f of civ.fleets ) {
				// parked and not on mission
				if ( f.colonize && f.star && !f.dest && f.star.objtype == 'star' && !f.mission ) { 
					next_ship:
					for ( let s of f.ships ) {
						if ( s.bp.colonize ) { 
							// can i settle anything where i am?
							for ( let p of f.star.planets ) { 
								if ( !p.owner && p.Habitable( civ.race ) ) { 
									p.Settle( civ );
									f.RemoveShip( s );
									if ( !f.ships.length ) { f.Kill(); }
									else { f.FireOnUpdate(); }
									// i'm me?
									if ( civ == app.game.myciv && app.options.notify.settle ) { 
										app.AddNote( 'good',`${p.name} Settled`,'',function(){app.FocusMap(p);});	
										}
									// remove from target list
									targets.splice( targets.indexOf(p), 1 );
									break next_ship;
									}
								}
							if ( targets.length ) { 
								// resort the list and send to the first target
								targets.sort( (a,b) => {
									let score_a = a.ValueTo(civ);
									let score_b = b.ValueTo(civ);
									if ( score_a > score_b ) { return -1; }
									else { return 1; }
									} );
								let t = targets.shift();
// 								console.log(`Best planet was ${t.name} @ ${t.ValueTo(civ)}`);
// 								for ( let x of targets ) { 
// 									console.log(`Runnerup: ${x.name} @ ${x.ValueTo(civ)} :: size ${x.size}, SLOT: ${x.maxslots}, HAB ${x.Adaptation(civ.race)} MINE ${x.sect.mine.pow}, PROD ${x.sect.prod.pow}, SCI ${x.sect.sci.pow}, DEF ${x.sect.def.pow}, ESP ${x.sect.esp.pow}, `);
// 									}
								let myfleet = null;
								// split fleet if more than 1 ship in fleet
								// TODO: escorts would be nice
								// TODO: check for any hostile fleets to prevent suicide
								if ( f.ships.length > 1 ) { 
									f.RemoveShip(s); // old fleet
									myfleet = new Fleet( f.owner, f.star );
									myfleet.AddShip(s);
									myfleet.SetDest(t.star);
									}
								// otherwise send on its way
								else {
									f.SetDest(t.star);
									}
								}
							}
						}
					}
				}
			}
		// if i still have leftover targets, i dont have enough colony ships.
		civ.ai.needs.colony_ships = targets.length;
		if ( civ.ai.needs.colony_ships > 5 ) { // don't go crazy 
			civ.ai.needs.colony_ships = 5;
			}
		// see how many colony ships we already have in production. civ may
		// indicate we need to build more or possibly cull some already queued.
		for ( let p of civ.planets ) { 
			for ( let i of p.prod_q ) { 
				if ( i.type == 'ship' && i.obj.colonize ) {
					civ.ai.needs.colony_ships -= ( i.qty == -1 ) ? 1 : i.qty;
					}
				}
			}	
		}			
	}


// PLANETS
export class AIPlanetsObjective extends AIObjective { 	
	type = 'planets';
	priority = 50;
	EvaluateFunc( app, civ ) {
				
		// what is our average combat ship milval?
		let combat_bps = civ.ship_blueprints.filter( bp => bp.role == 'combat' );
		let avg_milval = combat_bps.reduce( (total,bp) => total+bp.milval, 0 ) / combat_bps.length;
			
		for ( let p of civ.planets ) { 
			// Purge unneeded queue items
			if ( p.prod_q.length > 1 ) { 
				// skip the one in the first slot because it may be half-built already
				for ( let i=p.prod_q.length-1; i > 0; i-- ) { 
					if ( p.prod_q[i].type != 'ship' ) { continue; }
					// colony ships
					if ( civ.ai.needs.colony_ships < 0 && p.prod_q[i].obj.role=='colonizer' ) {
						civ.ai.needs.colony_ships += ( p.prod_q[i].qty == -1 ) ? 1 : p.prod_q[i].qty;
						p.prod_q.splice(i,1);
						}
					// research ships
					else if ( civ.ai.needs.research_ships < 0 && p.prod_q[i].obj.role=='research' ) {
						civ.ai.needs.research_ships += ( p.prod_q[i].qty == -1 ) ? 1 : p.prod_q[i].qty;
						p.prod_q.splice(i,1);
						}
					// troop ships
					else if ( civ.ai.needs.troop_ships < 0 && p.prod_q[i].obj.role=='carrier' ) {
						civ.ai.needs.troop_ships += ( p.prod_q[i].qty == -1 ) ? 1 : p.prod_q[i].qty;
						p.prod_q.splice(i,1);
						}
					// combat ships (check queue length because combat needs tend to vascillate wildly each turn)
					else if ( p.prod_q.length > 5 && civ.ai.needs.combat_ships < 0 && p.prod_q[i].obj.role=='combat' ) {
						civ.ai.needs.combat_ships += ( p.prod_q[i].qty == -1 ) ? 1 : p.prod_q[i].qty;
						p.prod_q.splice(i,1);
						}
					// scout ships
					else if ( civ.ai.needs.scout_ships < 0 && p.prod_q[i].obj.role=='scout' ) {
						civ.ai.needs.scout_ships += ( p.prod_q[i].qty == -1 ) ? 1 : p.prod_q[i].qty;
						p.prod_q.splice(i,1);
						}
					}
				}

			// in order to decide what to build here,
			// we create a custom weighting function based 
			// on current supply and demand and then pick something
			// to build, if anything at all.
			let RollForBuildItem = () => { 
				let weights = [
					{ need: 'colony_ships', score: 1.0 * civ.ai.needs.colony_ships },
					{ need: 'combat_ships', score: civ.ai.needs.combat_ships / avg_milval },
					{ need: 'troop_ships', score: 1.0 * civ.ai.needs.troop_ships },
					{ need: 'research_ships', score: 1.0 * civ.ai.needs.research_ships },
					{ need: 'scout_ships', score: 1.0 * civ.ai.needs.scout_ships },
					{ need: 'troops', score: 1.0 * civ.ai.needs.troops },
// 					{ need: 'tech', score: 1.0 * civ.ai.needs.tech },
// 					{ need: 'cash', score: 1.0 * civ.ai.needs.cash },
					]
					.filter( i => i.score > 0 );
				weights.sort( (a,b) => a-b );
				let thing = weights.pop();
				return thing ? thing.need : null;
				};
				
			if ( p.prod_q.length < 7 ) { // dont overload the queue
				let thing_to_build = RollForBuildItem();
				if ( thing_to_build ) { 
					switch ( thing_to_build ) {
						case 'colony_ships' : { 
							for ( let bp of civ.ship_blueprints ) { 
								if ( bp.colonize ) { 
									p.AddBuildQueueShipBlueprint( bp );
									civ.ai.needs.colony_ships--;
									break;
									}
								}
							break;
							}
						case 'combat_ships' : { 
							// find the best combat blueprint appropriate for civ planet. 
							// TODO: AI build preferance algorithm goes here ;-)
							if ( combat_bps.length ) { 
								let bp = combat_bps[ utils.RandomInt(0, combat_bps.length-1) ];
								p.AddBuildQueueShipBlueprint( bp );
								civ.ai.needs.combat_ships -= bp.milval;
								}					
							break;
							}
						case 'troop_ships' : { 
							// find the best combat blueprint for troopships
							let bps = civ.ship_blueprints.filter( bp => bp.role=='carrier' );
							if ( bps.length ) { 
								let bp = bps[ utils.RandomInt(0, bps.length-1) ];
								p.AddBuildQueueShipBlueprint( bp );
								civ.ai.needs.troop_ships--;
								}					
							break;
							}
						case 'troops' : { 
							// find the best troop blueprint
							if ( civ.groundunit_blueprints.length ) { 
								let bp = civ.groundunit_blueprints[civ.groundunit_blueprints.length-1];
								p.AddBuildQueueGroundUnitBlueprint( bp );
								civ.ai.needs.troops--;
								}						
							break;
							}
						case 'research_ships' : { 
							let bps = civ.ship_blueprints.filter( bp => bp.role=='research' );
							if ( bps.length ) { 
								let bp = bps[ utils.RandomInt(0, bps.length-1) ];
								p.AddBuildQueueShipBlueprint( bp );
								civ.ai.needs.research_ships--;
								}					
							break;
							}
						case 'scout_ships' : { 
							let bps = civ.ship_blueprints.filter( bp => bp.role=='scout' );
							if ( bps.length ) { 
								let bp = bps[ utils.RandomInt(0, bps.length-1) ];
								p.AddBuildQueueShipBlueprint( bp );
								civ.ai.needs.scout_ships--;
								}					
							break;
							}
						}
					}
				}
				
			// always put tradegoods at the end of the queue
			let tradegoods_in_queue = false;
			for ( let i of p.prod_q ) { 
				if ( i.obj == 'tradegoods' ) {
					tradegoods_in_queue = true; 
					break;
					}
				}
			if ( !tradegoods_in_queue ) { 
				p.AddBuildQueueMakeworkProject( 'tradegoods' );
				}
			}	
			
		}			
	}


// GUARD - Fleet will navigate to target star and sit there until TTL expires.
export class AIGuardObjective extends AIObjective { 	
	type = 'guard';
	EvaluateFunc( app, civ ) { 
		// still have a fleet?
		if ( this.FleetDestroyed() ) { 
			this.note = 'fleet destroyed';
			return false; 
			}
		// en route?
		if ( this.fleet.dest && !this.fleet.star ) { 
			this.note = 'en route';
			return; 
			} 
		// on science mission? (why? *shrug*)
		if ( this.fleet.mission ) { 
			this.note = 'busy sciencing';
			return; 
			}
		// not where we need to be?
		if ( this.target != this.fleet.star ) {
			this.note = 'redirected';
			this.fleet.SetDest(this.target);
			return;
			}
		// doing nothing is what we are supposed to do.
		// note: we never actually return specific "success" (return true)
		this.note = 'guarding';
		}			
	}


// INVADE - Navigate to and invade a planet
export class AIInvadeObjective extends AIObjective { 	
	type = 'invade';
	EvaluateFunc( app, civ ) { 
		// planet acquired
		if ( this.target.owner == civ ) { 
			this.note = '!!! Invasion success !!!';
			return true;
			}
		// assigned fleet destroyed
		if ( this.FleetDestroyed() ) { 
			if ( this.fleet ) {
				this.fleet.ai = null;
				this.fleet = null;
				}
			// what are we up against? 
			let defender = this.target.OwnerFleet();
			let milval_needed = defender ? defender.milval : 0;
			milval_needed *= 2 * (1-civ.ai.strat.risk);
			// find the best whole fleet that can do the job
			for ( let f of civ.fleets ) { 
				if ( f.star && !f.killme && !f.mission && !f.ai && f.troopcap && f.MilvalAvailable() > milval_needed ) {
					if ( !this.fleet ) { this.fleet = f; }
					else if ( this.fleet && this.fleet.MilvalAvailable() < f.MilvalAvailable() ) { 
						this.fleet = f;
						}
					}
				}
			// TODO: we don't necessarily need the entire fleet. 
			// we may just want to peel off a detachment force.
			if ( this.fleet ) { 
				// pick up troops
				this.fleet.star.planets.forEach( p => { 
					if ( p.owner == this.fleet.owner ) { 
						this.fleet.TransferTroopsFromPlanet( p );
						}
					});
				// off we go!
				this.fleet.SetDest( this.target.star );
				this.fleet.ai = this;
				this.note = 'assigned fleet';
				}
			else {
				// TODO create a new fleet from bits and pieces around
				this.note = 'no fleet available; calling all carriers';
				if ( civ.ai.staging_pts.length ) { 
					civ.AI_AvailableFleets( this.target, this.ttl )
					.filter( f => f.troops && !f.ai )
					.forEach( f => { f.SplitBy( ship => ship.troops.length, civ.ai.staging_pts[0] ) });
					}
				}
			return;
			}
		// en route?
		if ( this.fleet.dest && !this.fleet.star ) { 
			this.note = 'en route';
			return; 
			} 
		// not where we need to be?
		else if ( this.target.star != this.fleet.star ) {
			this.note = 'redirected';
			this.fleet.SetDest(this.target.star);
			return;
			}
		// on location but unable to overcome defenses
		else if ( this.target.star == this.fleet.star ) { 
			// TECHNICAL: this is run before ship movement and combat, 
			// so fleet may be parked here right now.
			// TECHNICAL: fleet battles can be multi-turn affairs, 
			// so check to see if we still have what it takes to get the job done
			this.note = 'obtaining air superiority';
			let defender = this.target.OwnerFleet();
			if ( defender && defender.milval > this.fleet.milval ) { 
				// if we are cowardly, run away!
				if ( civ.ai.strat.posture < 0.34 || ( civ.ai.strat.posture < 0.67 && Math.random() > 0.5 ) ) {
					this.note = "underpowered; running away";
					let dest = civ.ai.staging_pts.length ? civ.ai.staging_pts[0] : null;
					if ( dest ) { this.fleet.SetDest(dest); }
					return false;
					}
				// call for backup
				else {
					this.note = 'waiting for backup';
					// make a list of nearest systems and peel off reinforcements.
					// we need reinforcements *fast*
					let fleets = civ.AI_AvailableFleets( this.target, this.ttl )
						.filter( f => f.fp && f.MilvalAvailable() );
					if ( fleets.length ) { 
						// time is of the essence
						fleets.sort( (a,b) => { 
							let a_turns = utils.DistanceBetween( 
								( a.star ? a.star.xpos : a.xpos ), 
								( b.star ? b.star.xpos : b.xpos ), 
								this.target.xpos, 
								this.target.ypos 
								) / Math.ceil(a.speed);
							let b_turns = utils.DistanceBetween( 
								( a.star ? a.star.xpos : a.xpos ), 
								( b.star ? b.star.xpos : b.xpos ), 
								this.target.xpos, 
								this.target.ypos 
								) / Math.ceil(a.speed);
							return a_turns < b_turns ? -1 : 1;
							});
						let defender_milval = this.target.OwnerFleet().milval;
						let milval_needed = defender_milval - this.fleet.milval;
						milval_needed *= 2 * (1-civ.ai.strat.risk);
						for ( let f of fleets ) { 
							milval_needed -= civ.AI_PeelShipsForDefense( this.target.star, f, milval_needed );
							if ( milval_needed <= 0 ) { break; }
							}
						if ( milval_needed > 0 ) {
							this.note = 'calling meager reinforcements';
							}
						}
					else {
						this.note = 'no help; looks grim';
						}
					}
				}
			// do we have enough troops to feel confident about winning? 
			if ( !this.fleet.troops || this.fleet.troops < this.target.troops.length ) { 
				let gothelp = false;
				civ.AI_AvailableFleets( this.target, this.ttl )
				.filter( f => f.troops && !f.ai )
				.forEach( f => {
					gothelp = gothelp || !!f.SplitBy( ship => ship.troops.length, this.target.star )
					});
				if ( gothelp ) { 
					this.note = 'troops exhausted; quit';
					return false;
					}
				else {
					this.note = 'called for more troops';
					}
				}
			}
		}			
	}
