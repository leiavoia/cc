// import Civ from './Civ';
import Galaxy from './Galaxy';
import Anom from './Anom';
import Star from './Star';
import Planet from './Planet';
import Hyperlane from './Hyperlane';
import Constellation from './Constellation';
import Fleet from './Fleet';
import * as utils from '../util/utils';
import * as Signals from '../util/signals';
import FastPriorityQueue from 'fastpriorityqueue';
import EventLibrary from './EventLibrary';
import ShipCombat from './ShipCombat';


export default class Game {
	app = false;
	galaxy = null;
	planets = [];
	turn_num = 0;
	iam = 0;
	myciv = null;
	processing_turn = false;
	autoplay = false;
	eventcard = null; // the event card we are currently displaying to the player
	eventcard_queue = new FastPriorityQueue( (a,b) => { return (a.turn < b.turn) ? -1 : (a.turn > b.turn ? 1 : 0); });
	eventlib = null;
	shipcombats = [];
	
	DoEvent() { 
		let e = this.eventlib.Checkout( 'TEST_0', this.myciv, null );
		this.AddEventCard( e, 10 );
		this.AddEventCard( e, -1 );
		this.ProcessEventCardQueue();
		}
	AddEventCard( card, turn ) { 
		this.eventcard_queue.add({card,turn});
		}
	ProcessEventCardQueue() {
		if ( this.eventcard_queue.size > 0 ) { 
			if ( this.eventcard_queue.peek().turn <= this.turn_num ) { 
				this.eventcard = this.eventcard_queue.poll().card; // aka "pop"		
				this.eventcard.Exec(); // do whatever its action is
				}
			else { this.eventcard = null; }
			}
		else { this.eventcard = null; }
		}
	ChooseEventCardOption ( option ) { 
		// check for empty option which indicates "OK" for optionless events.
		if ( option && this.eventcard.options ) {
			// choosing an option can sometimes lead to a follow up event.
			let newcarddata = this.eventcard.ChooseOption( option );
			let newcard = this.eventlib.Checkout( newcarddata.label, newcarddata.civ, newcarddata.info );
			if ( newcard ) { 
				this.AddEventCard( newcard, this.turn_num + parseFloat(newcarddata.delay) );
				}
			}
		// FX: may want to clear the card and add a lag for the window to close/open
		this.ProcessEventCardQueue(); // next card
		}
		
	constructor( app ) {
		this.app = app;
		Signals.Listen('anom_complete', data => this.AnomCompleted(data) );
		this.eventlib = new EventLibrary(this.app);
		}
		
	AnomCompleted( data ) { // data contains at `anom`
		if ( data.fleet.owner == this.myciv ) { 
			this.app.AddNote(
				'neutral',
				data.anom.name,
				`<p>Research team finished investigating Anomaly ${data.anom.id}.</p>${data.anom.post_desc}`,
				() => { if ( !data.fleet.killme ) { this.app.SwitchSideBar(data.fleet); this.app.FocusMap(data.fleet); } } 
				);	
			}
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
// 				civ.gov_pts_income = 0;
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
// 						p.owner.gov_pts += p.sect.gov.output;
// 						p.owner.gov_pts_income += p.sect.gov.output;
						
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
            
						// make me happy baby
            			p.UpdateMorale();
						
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
			if ( this.app.options.ai ) { 
				console.time('AI');
				for ( let civ of this.galaxy.civs ) { 
					civ.TurnAI( this.app );
					}
				console.timeEnd('AI');
				}
				
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
					if ( f.owner == this.myciv && f.star && !f.dest && !f.star.explored ) { 
						f.star.explored = true;
						if ( this.app.options.announce_scouted_stars && f.star.objtype == 'star' ) { 
							// count habitable systems
							let goods = 0;
							f.star.planets.forEach( (p) => {if (!p.owner && p.Habitable(f.owner.race)) { goods++; }} )
							let app = this.app; 
							let star = f.star; // fleet may disappear leaving `f` == null
							let note = `${goods ? goods : 'No'} habitable system${goods==1 ? '' : 's'} found.`;
							this.app.AddNote(
								'neutral',
								`Scouts Explore ${f.star.name}`,
								note,
								function(){app.FocusMap(star); app.SwitchSideBar(star);}
								);						
							}
						}
				
					}
				}
			this.app.state_obj.SetCaret( this.app.state_obj.caret.obj );
			console.timeEnd('Ship Movement');
			
			// RESEARCH
			console.time('Research');
			for ( let civ of this.galaxy.civs ) { 
				civ.DoResearch( this.app );
				}	
			console.timeEnd('Research');
			
			// find potential ship combats
			console.time('Finding ship combats');
			this.FindShipCombats();
			console.timeEnd('Finding ship combats');
			
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
			
			// event queue needs the new turn number
			this.ProcessEventCardQueue();
			
			this.PresentNextPlayerShipCombat();
			
			} // foreach turn (in case of multiple).
		
		this.processing_turn = false;
		} // end process turn
		
	FindShipCombats() {
		// find all combats
		this.galaxy.stars.forEach( star => {
			if ( star.fleets.length > 1 ) { 
				for ( let fleet_a=0; fleet_a < star.fleets.length-1; fleet_a++ ) {
					for ( let fleet_b=1; fleet_b < star.fleets.length; fleet_b++ ) {
					if ( star.fleets[fleet_a].AIWantToAttackFleet(star.fleets[fleet_b]) ||
						star.fleets[fleet_b].AIWantToAttackFleet(star.fleets[fleet_a]) 
						) {
						// NOTE: fleet may want to attack planet, not just the fleet
						this.shipcombats.push({
							attacker: star.fleets[fleet_a],
							defender: star.fleets[fleet_b],
							planet: null, // TODO some day
							label: `${star.fleets[fleet_a].owner.name} attacks ${star.fleets[fleet_b].owner.name} at ${star.name}`
							});
						}
					}
				}
			}
		});
// 		// sort all player-involved combats to the back
// 		this.shipcombats.sort( (a,b) => {
// 			if ( a.owner == this.myciv || b.owner == this.myciv ) { return 1; }
// 			return 0;
// 		});

		// TODO sort out duplicates - lower CIV ID goes first (a-b, b-a)

		// TODO: we need to make a separare list of "proposed" combats 
		// for the player to accept or decline

		// Fight!
		for ( let c = this.shipcombats.length-1; c >= 0; c-- ) { 
			let sc = this.shipcombats[c];
			// fleet may have been destroyed in previous battle.
			if ( sc.attacker.killme || sc.defender.killme ) { 
				this.shipcombats.splice( c, 1 ); // delete
				continue; 
				}
			// if fleet involves player, save for later
			if ( sc.attacker.owner.is_player || sc.defender.owner.is_player ) { 
				continue; 
				}
			// otherwise autoresolve in background
			console.log('Auto-resolving AI combat: ' + sc.label);
			let combat = new ShipCombat( sc.attacker, sc.defender, sc.planet );
			combat.ProcessQueue( 1000 ); // 1000 = fight to the death if possible
			combat.End();
			};
		}
    
    // this will look through the shipcombats queue for 
    // player-involved combat and present them to the player.
    // The queue drains by having the ship combat screen call
    // this function again on exit. If the queue has no player
    // involved combats, nothing happens.
    PresentNextPlayerShipCombat() { 
 		if ( !this.shipcombats.length ) { return false; }
		let sc = this.shipcombats.shift();
		// fleet may have been destroyed in previous battle.
		if ( sc.attacker.killme || sc.defender.killme || !sc.attacker.ships.length || !sc.defender.ships.length ) { 
			this.PresentNextPlayerShipCombat();
			}
		// if player is the defender, present mandatory battle
		else if ( sc.defender.owner.is_player ) { 
			console.log(sc.label);
			this.app.ShowDialog(
				`Attack on ${sc.defender.star.name}`,
				sc.label,
				// buttons
				[
					{ 
						text: "Command", 
						class: "",
						cb: btn => { this.LaunchPlayerShipCombat(sc); }
						},
					{ 
						text: "Auto‑Resolve", // note nonbreaking hyphen
						class: "alt",
						cb: btn => { 
							let combat = new ShipCombat( sc.attacker, sc.defender, sc.planet );
							combat.ProcessQueue( 1000 ); // 1000 = fight to the death if possible
							combat.End();
							this.PresentNextPlayerShipCombat();
							}
						},
					{ 
						text: "Flee", 
						class: "bad",
						cb: btn => { 
							let combat = new ShipCombat( sc.attacker, sc.defender, sc.planet );
							combat.RetreatTeam( combat.teams[1] ); // team 1 is always the defender
							combat.ProcessQueue( 1000 ); // 1000 = fight to the death if possible
							combat.End();
							this.PresentNextPlayerShipCombat();
							}
						}
					]
				);
			}
		// if player is the attacker, launch directly to attack screen
		else if ( sc.attacker.owner.is_player ) { 
			this.LaunchPlayerShipCombat(sc);
			}
    	}
    	
	LaunchPlayerShipCombat( combat ) {
		this.app.SwitchMainPanel( 'shipcombat', combat, null, true ); // true = exclusive UI
		}
		
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
		for ( let f of Fleet.all_fleets ) { 
			let report = f.DoResearch();
			if ( report && f.owner == this.app.game.myciv ) { 
				let note = '';
				// status portion
				if ( report.status == 0 ) { 
					if ( report.remaining ) {
						note = note + ` Expedition leaders came back empty handed, but would like to continue the mission if possible. ${report.note}`;
						}
					else {
						note = 'Nothing of interest to report in this sector of space.';
						}				
					}
				else if ( report.status == -1 ) { 
					note = `Fleet #${f.id} has not returned from its deep space mission. The crew is feared lost.`;
					if ( report.remaining ) {
						note = note + ' Our last communication with the team indicates they were on to something. Perhaps we can continue the tour with additional precautions in the future.';
						}
					}
				else { 
					note = 'Success!';
					// followup comment 
					if ( report.remaining ) {
						note = note + ' Expedition leaders indicate the presence of yet more interesting things to investigate and would like to continue the mission if possible.';
						}
					else {
						note = note + ' The team has done an exhaustive search of the area and found nothing more to investigate.';
						}
					}
				this.app.AddNote(
					( report.status == -1 ? 'bad' : (report.status == 0 ? 'neutral' : 'good') ),
					`Research Mission ${report.status == -1 ? 'Failed' : 'Complete'}`,
					note,
					() => { if ( report.status > -1 && !f.killme ) { this.app.SwitchSideBar(f); this.app.FocusMap(f); } } 
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
		// unset old one
		this.galaxy.civs[ this.iam ].is_player = false;
		// set new one
		this.iam = id;
		this.myciv = this.galaxy.civs[ this.iam ];
		this.galaxy.civs[ this.iam ].is_player = true;
		}
	}

	
	
	
