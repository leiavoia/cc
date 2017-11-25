// import Civ from './Civ';
import Galaxy from './Galaxy';
import Anom from './Anom';
import Star from './Star';
import Planet from './Planet';
import Hyperlane from './Hyperlane';
import Constellation from './Constellation';
import Fleet from './Fleet';
import * as utils from '../util/utils';

export default class Game {
	app = false;
	galaxy = null;
	avg_rich = 0;
	avg_rarity = 0;
	rare_count = [0,0,0,0,0];
	planets = [];
	turn_num = 0;
	iam = 0;
	myciv = null;
	processing_turn = false;
	autoplay = false;
	
	constructor( app ) {
		this.app = app;
		}
		
	// probably can just get rid of this eventually
	InitGalaxy() {
		this.galaxy = new Galaxy();
		}

	ToggleAutoPlay() { 
		if ( this.autoplay ) { 
			clearInterval( this.autoplay );
			this.autoplay = false;
			}
		else {
			let game = this;
			let cb = function(){ if ( !game.processing_turn ) { game.ProcessTurn(); } };
			this.autoplay = setInterval(cb, 500);
			}
		}
		
	ProcessTurn( num_turns = 1 ) {
		this.processing_turn = true;
		
		// TODO: lock the UI
		
		for ( let t=0; t < num_turns; t++ ) { 

// 			// Loop Part 1
// 			for ( let s of this.galaxy.stars ) { 
// 				for ( let p of s.planets ) {
// 					if ( p.settled ) {  
// 	
// 						// collect taxes
// // 						p.owner.treasury += p.CollectTax();
// 												
// 						}
// 					}
// 				}
				
			// import/export mined resources
// 			for ( let civ of this.galaxy.civs ) { 
// 				for ( let constel of civ.constels ) { 
// 					// NOTE: when zeroing out the accounts, leave the "have" field.
// 					// This lets amounts collect at the constellation or system level
// 					// over the course of several turns.
// 					constel.econ.need = 0; // zero out every turn
// 					constel.econ.export = 0; // zero out every turn
// 					constel.econ.redistrib = 0; // zero out every turn
// 					constel.econ.collected = 0; // zero out every turn
// 					for ( let star of constel.stars ) { 
// 						let acct = star.Acct(civ);
// 						acct.econ.need = 0; // zero out every turn
// 						acct.econ.export = 0; // zero out every turn
// 						acct.econ.imported = 0; // zero out every turn
// 						acct.econ.collected = 0; // zero out every turn
// 						acct.econ.redistrib = 0; // zero out every turn
// 						// STEP 1: COLLECT PLANETARY EXPORTS
// 						for ( let planet of star.planets ) {
// 							if ( planet.owner == civ ) { 
// 								planet.econ.mine_import = 0; 
// 								planet.DoMining();
// 								planet.econ.mine_export = planet.sect.mine.output - planet.sect.mine.need;
// 								if ( planet.econ.mine_export < 0 ) { 
// 									acct.econ.need -= planet.econ.mine_export;
// 									}
// 								else if ( planet.econ.mine_export > 0 ) { 
// 									planet.warehouse -= planet.econ.mine_export;
// 									acct.econ.have += planet.econ.mine_export;
// 									acct.econ.collected += planet.econ.mine_export;
// 									}
// // 								if ( this.iam == civ.id ) { console.log(`PLANET ${planet.name}: have ${planet.act.mine.output}, need ${planet.MiningNeed()}, export ${planet.econ.mine_export}`);}
// 								}
// 							}
// 						
// 						// STEP 2: REDISTRIBUTE
// 						// take care of our own people before shipping stuff intersteller.
// 						// give to each planet according to their need
// 						if ( acct.econ.need > 0 && acct.econ.have > 0 ) { 
// 							for ( let planet of star.planets ) {
// 								if ( planet.owner == civ && planet.econ.mine_export < 0 ) { 
// 									// note: we don't give more than they actually need, greedy bloodsucking aliens.
// 									let portion = 
// 										( -planet.econ.mine_export / acct.econ.need ) 
// 										* Math.min( acct.econ.need, acct.econ.have )
// 										;
// 									planet.econ.mine_import = portion; // stat tracking
// 									planet.warehouse += portion; // ie "have"
// 									planet.econ.mine_export += portion;
// // 									if ( this.iam == civ.id ) { console.log(`REDISTRIB PLANET: ${planet.name}: have ${planet.act.mine.output}, need ${planet.MiningNeed()}, export ${planet.econ.mine_export}, import ${planet.econ.mine_import}`); }
// 									
// 									acct.econ.need -= portion;							
// 									acct.econ.have -= portion;	
// 									acct.econ.redistrib += portion;
// 									}
// 								}
// 							}
// 						// system level accounting
// 						acct.econ.export = acct.econ.have - acct.econ.need;							
// 						
// // 						if ( this.iam == civ.id ) { console.log(`STAR ${star.name}: have ${acct.econ.have}, need ${acct.econ.need}, export ${acct.econ.export}`);}
// 						
// 						// STEP 3: EXPORT TO CONSTELLATION
// 						if ( acct.econ.export < 0 ) { 
// 							constel.econ.need -= acct.econ.export;
// 							}
// 						else if ( acct.econ.export > 0 ) { 
// 							constel.econ.have += acct.econ.export;
// 							constel.econ.collected += acct.econ.export; // useful for stat tracking
// 							acct.econ.have -= acct.econ.export;
// 							}					
// 						}
// 						
// // 						if ( this.iam == civ.id ) { console.log(`CONSTEL ${constel.name}: have ${constel.econ.have}, need ${constel.econ.need}`);}
// 												
// 					// STEP 4: REDISTRIBUTE TO SYSTEMS
// 					// NOTE [!]TODO : If there is an excess of materials, you need to choose to:
// 					//	- store at the constellation level (default)
// 					//	- give back to the producing planets
// 					// 	- equally redistribute
// 					constel.econ.redistrib = Math.min( constel.econ.need, constel.econ.have ); // useful for stat tracking
// 					if ( constel.econ.need > 0 && constel.econ.have > 0 ) { 
// 						for ( let star of constel.stars ) {
// 							let acct = star.Acct(civ);
// 							if ( acct.econ.export < 0 ) { 
// 								let system_portion = 
// 									( acct.econ.need / constel.econ.need ) 
// 									* Math.min( constel.econ.need, constel.econ.have )
// 									;
// 								// STEP 5: REDISTRIBUTE TO PLANETS
// 								for ( let planet of star.planets ) {
// 									if ( planet.owner == civ && planet.econ.mine_export < 0 ) { 
// 										// planet portion is based on what is provided by the system portion
// 										let portion = ( -planet.econ.mine_export / acct.econ.need ) * system_portion;
// 										planet.econ.mine_import += portion; // stat tracking
// 										planet.warehouse += portion;
// 										planet.econ.mine_export += portion;
// 										acct.econ.redistrib += portion;
// // 										if ( this.iam == civ.id ) { console.log(`PLANET RECEIVING: ${planet.name}: receiving ${portion}`);}
// 										}
// 									}
// 								// system level accounting
// // 								acct.econ.have += system_portion; // have is zero at this point anyway
// 								acct.econ.need -= system_portion;
// 								acct.econ.export += system_portion;							
// 								acct.econ.imported = system_portion;							
// 								
// 								constel.econ.need -= system_portion;							
// 								constel.econ.have -= system_portion;							
// 								}
// 							}
// 						}
// 					// do constellation-level accounting
// 					constel.econ.export = constel.econ.collected - constel.econ.redistrib;	
// 					}
// 				}
			
			
			
			
			
			// calculate how many material points (mining) we can afford 
			// to distribute to those planets in need.
			for ( let civ of this.galaxy.civs ) { 
				// recalculate box filter while we're here
// 				civ.RecalcEmpireBox();
				// reset some stuff
				civ.research_income = 0;
				civ.gov_pts_income = 0;
				civ.econ.income = 0;
				civ.econ.mp_need = 0; // reset each turn loop;
				for ( let p of civ.planets ) { 
					if ( p.settled && p.mp_export < 0 ) {
						civ.econ.mp_need -= p.mp_export;
						}
					}
				// now figure out how much we can afford to give back.
				if ( civ.econ.mp_need == 0 ) { 
					civ.econ.mp_need_met = 1.0;
					}
				else if ( civ.econ.warehouse == 0 ) { 
					civ.econ.mp_need_met = 0.0;
					}
				else {
					civ.econ.mp_need_met = utils.Clamp( civ.econ.warehouse / civ.econ.mp_need, 0, 1 );
					}
				}
			
			
			
			
			// Planetary Economics
			console.time('Planetary Econ');
			for ( let s of this.galaxy.stars ) { 
				for ( let p of s.planets ) {
					if ( p.settled ) {  
					
						// Planets will mine resources and stock their local warehouses.
						p.DoMining(); 
						// collect exports from planets
						if ( p.mp_export >= 0 ) { 
// 							console.log(`collecting ${p.mp_export}MP from ${p.name}`);
							p.owner.econ.warehouse += p.mp_export;
							p.warehouse -= p.mp_export;
							p.mp_need_met = 1.0; // trivial yet important
							}
						// They may need to borrow resources, so let them know how much they can borrow.
						else if ( p.mp_export < 0 ) { 
							let transferred = p.owner.econ.mp_need_met * -p.mp_export;
// 							console.log(`importing ${transferred}MP to ${p.name}`);
							p.mp_need_met = p.owner.econ.mp_need_met;
							p.owner.econ.warehouse -= transferred; // [!]OPTIMIZE : would be easier to make one calculation further upstream
							p.warehouse += transferred;
							}
						
						// production
						p.DoProduction(); // production
						
						// research
						p.owner.research += p.sect.sci.output;
						p.owner.research_income += p.sect.sci.output;
						
						// government
						p.owner.gov_pts += p.sect.gov.output;
						p.owner.gov_pts_income += p.sect.gov.output;
						
						// give or borrow money out of the civ treasury
						p.owner.treasury += p.treasury_contrib;
						p.owner.econ.income += p.treasury_contrib;
						
						// grow or shrink the infrastructure of each sector
						for ( let k in p.sect ) {
							let s = p.sect[k];
							if ( s.growth > 0 ) { 
								// growth can be slower if there is unmet need for MP
								let growth = s.growth * p.mp_need_met; 
								s.inf += growth;
								p.warehouse -= growth;
								}
							else {
								// decrepitude is free
								s.inf += s.growth;
								}
							// !IMPORTANT! 1.0 is the minimum infrastructure.
							// This avoids not being able to bootstrap a colony when mining goes to zero.
							if ( s.inf < 1.0 ) { s.inf = 1.0 } 
							}
		
		
		
						// grow/shrink economy
						p.GrowEconomy();
						
						// population growth ( returns true if max-pop reached )
						if ( p.GrowPop() ) { 
// 							this.ShowDialog( 'Maximum Polulation Reached', p.name );
							}
							
						// migration
						
						// age the planet
						p.AgePlanet();
						
						// Update this again because infrastructure levels changed
						p.RecalcSectors();
						
						}
					}
				}
			console.timeEnd('Planetary Econ');
			
			// AI!
			console.time('AI');
			for ( let civ of this.galaxy.civs ) { 
				civ.TurnAI( this.app );
				}
			console.timeEnd('AI');
			
			// important to do ship research BEFORE moving ships,
			// otherwise they get to do both in one turn. Not allowed.
			console.time('Fleet Research');
			this.DoFleetResearch();
			console.timeEnd('Fleet Research');
			
			console.time('Ship Movement');
			// ship movement
			for ( let f of this.galaxy.fleets ) { 
				if ( f.MoveFleet() ) { 
					// if the fleet arrived, mark the star as explored to help the UI
					if ( f.owner == this.myciv && f.star && !f.dest ) { 
						f.star.explored = true;
						}
				
					}
				}
			console.timeEnd('Ship Movement');
			
			
			// RESEARCH
			console.time('Research');
			for ( let civ of this.galaxy.civs ) { 
				civ.DoResearch( this.app );
				}	
			console.timeEnd('Research');
			
			// [!]OPTIMIZE we can optimize this out of the loop if 
			// we limit it to events that change planets or ship ranges
			console.time('Recalc Civ Contact');
			this.RecalcCivContactRange();
			console.timeEnd('Recalc Civ Contact');
			
			console.time('Recalc Star Range');
			this.RecalcStarRanges();
			console.timeEnd('Recalc Star Range');
				
			// fleets move, so we need to do this on each turn
			console.time('Recalc Fleet Range');
			this.RecalcFleetRanges(); 
			console.timeEnd('Recalc Fleet Range');
				
			this.turn_num++;
			
			} // foreach turn (in case of multiple).
		
		this.processing_turn = false;
		} // end process turn
		
		
	RecalcStarRanges() { 
		// recalculate which planets are in range of my systems
		// this may not be necessary as it is just for UI stuff
		// but may become necessary to short circuit some 
		// calculations later. Testing required.
		let range = this.myciv.ship_range * this.myciv.ship_range ; // NOTE: avoid square rooting.
		for ( let s of this.galaxy.stars ) { 
			// do i live here?
			if ( s.Acct(this.myciv) ) {
				s.in_range = true;
				}
			else {
				s.in_range = false;
				// use easy box test first
				if ( utils.BoxPointIntersect( this.myciv.empire_box, s.xpos, s.ypos ) ) {
					// how far am i from where i DO live?
					for ( let p of this.myciv.planets ) { 
						let dist = 
							Math.pow( Math.abs(p.star.xpos - s.xpos), 2 )
							+ Math.pow( Math.abs(p.star.ypos - s.ypos), 2 );
						if ( dist <= range ) {
							s.in_range = true;
							break;
							}
						}
					}
				};
			}
		}
		
	RecalcFleetRanges() { 
		// same notes as star ranges
		let range = this.myciv.ship_range * this.myciv.ship_range ; // NOTE: avoid square rooting.
		for ( let f of Fleet.all_fleets ) { 
			// all of my fleets are always visible
			if ( f.owner == this.myciv ) {
				f.in_range = true;
				}
			// only check fleets in the air. parked fleets are handled by star range 
			else if ( !f.star && f.dest && f.xpos && f.ypos ) {
				f.in_range = false;
				// use easy box test first
				if ( utils.BoxPointIntersect( this.myciv.empire_box, f.xpos, f.ypos ) ) {
					// how far am i from where i DO live?
					for ( let p of this.myciv.planets ) { 
						let dist = 
							Math.pow( Math.abs(p.star.xpos - f.xpos), 2 )
							+ Math.pow( Math.abs(p.star.ypos - f.ypos), 2 );
						if ( dist <= range ) {
							f.in_range = true;
							break;
							}
						}
					}
				};
			}
		}
		
	DoFleetResearch() { 
// 		let maxrange = this.myciv.ship_range * this.myciv.ship_range ; // NOTE: avoid square rooting.
		for ( let f of Fleet.all_fleets ) { 
			let report = f.DoResearch();
			if ( report && f.owner == this.app.game.myciv ) { 
				let findings_hook = '';
				if ( report.completed.length ) {
					findings_hook = ' They found: ';
					let n = report.completed.length;
					for ( let a of report.completed ) { 
						findings_hook += a.name;
						if ( --n > 0 ) { findings_hook += ', '; }
						else { findings_hook += '.'; }
						}
					}
				this.app.AddNote(
					'good',
					`Research Mission Complete`,
					`Fleet ${f.id} Has completed it's research mission.${findings_hook}`,
// 					function(){app.SwitchMainPanel('audience');}
					);				
				}
			}
		}
		
	RecalcCivContactRange() { 
		// we dont have a handy list of stars, but we do have planets.
		// no need to check every planet to every other planet, just their host stars.
		let starlist = []; // multidimensial array of [civ][star]
		for ( let c=0; c < this.galaxy.civs.length; c++ ) {
			let civ = this.galaxy.civs[c];
			starlist[civ.id] = [];
			for ( let p=0; p < civ.planets.length; p++ ) {
				if ( starlist[civ.id].indexOf( civ.planets[p].star ) == -1 ) {
					starlist[civ.id].push( civ.planets[p].star );
// 					console.log(`added ${civ.planets[p].star.name} to civ ${civ.name}`);
					}
				}
			}
		// recalculate which civs are in communication range.
		for ( let c1=0; c1 < this.galaxy.civs.length-1; c1++ ) { 
			let civ1 = this.galaxy.civs[c1];
			compare_civ2_loop:
			for ( let c2=c1+1; c2 < this.galaxy.civs.length; c2++ ) { 
				let civ2 = this.galaxy.civs[c2];
				// try the first-pass box filter
				if ( utils.BoxIntersect( civ1.empire_box, civ2.empire_box ) ) {
					// in-range is determined by the lesser of the civs' ship ranges
					let max_range = Math.pow( Math.min( civ1.ship_range, civ2.ship_range ), 2 ); // avoid sqrt
					// scan for range
					for ( let c1s=0; c1s < starlist[civ1.id].length; c1s++ ) { // for each of civ1's stars
						for ( let c2s=0; c2s < starlist[civ2.id].length; c2s++ ) { // for each of civ2's stars
							let star1 = starlist[civ1.id][c1s];
							let star2 = starlist[civ2.id][c2s];
							let dist = 0;
							if ( star1 != star2 ) { // no need to compare to self
								dist = 
								((star1.xpos - star2.xpos)*(star1.xpos - star2.xpos)) + 
								((star1.ypos - star2.ypos)*(star1.ypos - star2.ypos))
								;
								}
							if ( max_range > dist ) { // avoid sqrt
								if ( civ1 == this.app.game.myciv && !civ1.InRangeOf( civ2 ) ) { 
									let app = this.app;
									this.app.AddNote(
										'good',
										`Contact!`,
										`We have received communication signals from an alien civilization called the <b>"${civ2.name}"</b>`,
										function(){app.SwitchMainPanel( 'audience', civ2, {is_greeting:true}, true );}
										);
									}
								civ1.SetInRangeOf( civ2, true );
								continue compare_civ2_loop;
								}
							}
						}
					}
				// lost contact notice
				if ( civ1 == this.app.game.myciv && civ1.InRangeOf( civ2 ) ) { 
					this.app.AddNote(
						'bad',
						`Lost Contact`,
						`We have lost contact with the ${civ2.name}`
						);
					}
				// found nothing in range
				civ1.SetInRangeOf( civ2, false );
				}
			}
		}
		
	RegenerateGalaxy () {
		this.app.sidebar_obj = null;
		this.app.sidebar_mode = false;
		// let there be light
// 		this.galaxy = new Galaxy();
		this.galaxy.Make( 20, 10, 65, Math.random() );
		this.RefactorPlanetList();
		Fleet.KillAll();
		}
	
	// utility function
	MyCiv() { 
		return this.galaxy.civs[ this.iam ];
		}
	SetMyCiv( id ) { 
		this.iam = id;
		this.myciv = this.galaxy.civs[ this.iam ];
		}
	}

	
	
	
