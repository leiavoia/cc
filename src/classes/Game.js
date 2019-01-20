// import Civ from './Civ';
import Galaxy from './Galaxy';
import Anom from './Anom';
import Star from './Star';
import Planet from './Planet';
import Hyperlane from './Hyperlane';
import Fleet from './Fleet';
import * as utils from '../util/utils';
import * as Signals from '../util/signals';
import FastPriorityQueue from 'fastpriorityqueue';
import EventLibrary from './EventLibrary';
import ShipCombat from './ShipCombat';
import GroundCombat from './GroundCombat';
import {VictoryRecipes,VictoryIngredients} from './VictoryRecipes';


export default class Game {
	app = false;
	galaxy = null;
	planets = [];
	turn_num = 0;
	myciv = null; // object of player civ
	processing_turn = false;
	autoplay = false;
	eventcard = null; // the event card we are currently displaying to the player
	eventcard_queue = new FastPriorityQueue( (a,b) => { return (a.turn < b.turn) ? -1 : (a.turn > b.turn ? 1 : 0); });
	eventlib = null;
	shipcombats = [];
	groundcombats = [];
	victory_recipes = [];	
	victory_achieved = false;
		
	constructor( app ) {
		this.app = app;
		Signals.Listen('anom_complete', data => this.AnomCompleted(data) );
		this.eventlib = new EventLibrary(this.app);
		}
		
	CheckForVictory() { 
		if ( this.victory_achieved ) { return false; }
		for ( let civ of this.galaxy.civs ) { 
			for ( let r of this.victory_recipes ) { 
				let gotcha = true;
				if ( !civ.victory_ingredients.length ) {
					gotcha = false;
					}
				else {
					for ( let i of civ.victory_ingredients )  { 
						// not found - recipe is incomplete
						if ( r.requires.indexOf(i.tag) == -1 ) {
							gotcha = false;
							break; 
							}
						}
					}
				if ( gotcha ) { 
					this.victory_achieved = true;
					console.log( 'VICTORY ACHIEVED: ' + r.name );
					if ( civ == this.myciv ) { 
						this.app.AddNote(
							'good',
							`YOU WINNEDED!`,
							`"${r.name}" victory achieved.`,
							function(){ this.app.SwitchMainPanel( 'victory', r ); }
							);
						}
					else {
						this.app.AddNote(
							'bad',
							`YOU LOSEDED!`,
							`"${r.name}" victory achieved by the ${civ.name} civilization. This means YOU LOSE. You get NOTHING!`,
							function(){ this.app.SwitchMainPanel( 'victory', r ); }
							);	
						}			
					return true;
					}
				}
			}
		return false;
		}
		
	DeployVictoryIngredients( ) { 
		// TODO: we might opt to filter which victory conditions are added to the game
		// either by direct selection or level of crazyness.
		// HACK HARDCODE: 
		this.victory_recipes = [
			VictoryRecipes.TEST1
			];
		let ingr = [];
		this.victory_recipes.forEach( r => ingr = ingr.concat( r.requires, r.provides ) );
		ingr.unique().forEach( i => VictoryIngredients[i].AddToGame(this) );
		}
		
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
		
	AnomCompleted( data ) { // data contains at `anom`
		if ( data.fleet.owner == this.myciv && app.options.notify.anom ) { 
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
			console.time('Turn Processor');
			
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
// 			console.time('Planetary Econ');
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
													
						// age the planet
						p.AgePlanet();
						
						// Update this again because infrastructure levels changed
						p.RecalcSectors();
						
						}
					}
				}
// 			console.timeEnd('Planetary Econ');
			
			// restock weapons
// 			console.time('Fleet Reloading');
			for ( let f of this.galaxy.fleets ) { 
				f.ReloadAllShipWeapons();
				f.ReevaluateStats();
				}
// 			console.timeEnd('Fleet Reloading');
			
			// AI!
			if ( this.app.options.ai ) { 
// 				console.time('AI');
				for ( let civ of this.galaxy.civs ) { 
					civ.TurnAI( this.app );
					}
// 				console.timeEnd('AI');
				}
				
			// important to do ship research BEFORE moving ships,
			// otherwise they get to do both in one turn. Not allowed.
// 			console.time('Fleet Research');
			this.DoFleetResearch();
// 			console.timeEnd('Fleet Research');
			
// 			console.time('Ship Movement');
			// ship movement. TECHNICAL: loop backwards because moving can 
			// remove fleets from the list when they land at destinations.
			for ( let i = this.galaxy.fleets.length-1; i >= 0; i-- ) { 
				let f = this.galaxy.fleets[i];
				if ( f.MoveFleet() ) {
					// if the fleet arrived, mark the star as explored to help the UI
					if ( f.owner == this.myciv && f.star && !f.dest && !f.star.explored ) { 
						f.star.explored = true;
						if ( this.app.options.notify.explore && f.star.objtype == 'star' ) { 
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
				};
			// update caret (check for dead fleets removed from ship movement ) 
			if ( this.app.state_obj.caret.obj instanceof Fleet && this.app.state_obj.caret.obj.killme ) { 
				this.app.state_obj.caret.obj = null;
				}
			this.app.state_obj.SetCaret( this.app.state_obj.caret.obj );
// 			console.timeEnd('Ship Movement');
			
			// RESEARCH
// 			console.time('Research');
			for ( let civ of this.galaxy.civs ) { 
				civ.DoResearch( this.app );
				}	
// 			console.timeEnd('Research');
			
			// find potential combats
// 			console.time('Finding combats');
			this.FindShipCombats();
			this.FindGroundCombats();
// 			console.timeEnd('Finding combats');
			
			// [!]OPTIMIZE we can optimize this out of the loop if 
			// we limit it to events that change planets or ship ranges
// 			console.time('Recalc Civ Contact');
			this.RecalcCivContactRange();
// 			console.timeEnd('Recalc Civ Contact');
			
// 			console.time('Recalc Star Range');
			this.RecalcStarRanges();
// 			console.timeEnd('Recalc Star Range');
				
			// fleets move, so we need to do this on each turn
// 			console.time('Recalc Fleet Range');
			this.RecalcFleetRanges(); 
// 			console.timeEnd('Recalc Fleet Range');
				
			// calculate overall civ power scores
			for ( let civ of this.galaxy.civs ) { 
				civ.CalcPowerScore();
				}
			
			// [!]DEBUG: score every planet for the player
			for ( let s of this.galaxy.stars ) { 
				s.player_score = 0;
				for ( let p of s.planets ) { 
					p.player_score = p.ValueTo( this.myciv );
					if ( !p.owner || p.owner == this.myciv ) { 
						s.player_score += p.player_score;
						}
					}
				}
			
			// compile stats
			for ( let civ of this.galaxy.civs ) { 
				civ.ArchiveStats();
				}
			
			this.turn_num++;
			
			console.timeEnd('Turn Processor');
			//
			// At this point the turn is considered "processed",
			// however the player may still need to complete
			// some interactivities like combat resolution, 
			// subscreens, events, etc.
			//
			
			Signals.Send('turn', this.turn_num );
			
			if ( !this.CheckForVictory() ) { 				
				if ( !this.app.options.soak ) { 
					// event queue needs the new turn number
					this.ProcessEventCardQueue();
					this.PresentNextPlayerShipCombat();
					this.PresentNextPlayerGroundCombat();
					}
				}
				
			} // foreach turn (in case of multiple).
		
		this.processing_turn = false;
		} // end process turn
		
	QueueShipCombat( attacker, defender, planet ) {
		this.shipcombats.push({ attacker, defender, planet,
			label: `${attacker.owner.name} attacks ${defender.owner.name} at ${attacker.star.name}`
			});	
		}
		
	QueueGroundCombat( attacker, planet ) {
		this.groundcombats.push({ attacker, planet,
			label: `${attacker.owner.name} attacks planet ${planet.name}`
			});	
		}
		
	FindShipCombats() {
		// find all combats (stars and anomalies)
		this.galaxy.stars.concat( this.galaxy.anoms ).forEach( star => {
			if ( star.fleets.length > 1 ) { 
				for ( let fleet_a=0; fleet_a < star.fleets.length-1; fleet_a++ ) {
					for ( let fleet_b=1; fleet_b < star.fleets.length; fleet_b++ ) {
					if ( star.fleets[fleet_a].AIWantToAttackFleet(star.fleets[fleet_b]) ||
						star.fleets[fleet_b].AIWantToAttackFleet(star.fleets[fleet_a]) 
						) {
						// NOTE: fleet may want to attack planet, not just the fleet
						this.QueueShipCombat( star.fleets[fleet_a], star.fleets[fleet_b], null );
						}
					}
				}
			}
		});
		
		// Fight!
		for ( let c = this.shipcombats.length-1; c >= 0; c-- ) { 
			let sc = this.shipcombats[c];
			// fleet may have been destroyed in previous battle.
			if ( sc.attacker.killme || sc.defender.killme || !sc.attacker.ships.length || !sc.defender.ships.length ) { 
				this.shipcombats.splice( c, 1 ); // delete
				continue; 
				}
			// if fleet involves player, save for later
			if ( (sc.attacker.owner.is_player || sc.defender.owner.is_player) && !this.app.options.soak ) { 
				continue; 
				}
			// otherwise autoresolve in background
			let combat = new ShipCombat( sc.attacker, sc.defender, sc.planet );
			combat.ProcessQueue( 1000 ); // 1000 = fight to the death if possible
			combat.End();
			console.log('Resolved ship combat: ' + sc.label + ', WINNER: ' + combat.winner);
			this.shipcombats.splice( c, 1 ); // delete
			};
		}
    
		
	FindGroundCombats() {
		// find all AI combats
		for ( let star of this.galaxy.stars ) {
			if ( star.fleets.length && star.planets.length ) { 
				for ( let fleet of star.fleets ) { 
					if ( (this.app.options.soak || !fleet.owner.is_player) && fleet.troops && !fleet.mission && !fleet.killme ) { 
						for ( let planet of star.planets ) { 
							if ( planet.owner != fleet.owner ) { 
								if ( fleet.AIWantToInvadePlanet(planet) && !planet.OwnerFleet() ) {
									console.log(`GC: ${fleet.owner.name} wants to invade ${planet.name}`);
									this.QueueGroundCombat( fleet, planet );
									}
								}
							}
						}
					}
				}
			}
			
		// Fight!
		for ( let c = this.groundcombats.length-1; c >= 0; c-- ) { 
			let gc = this.groundcombats[c];
			// fleet may have been destroyed in previous battle.
			if ( gc.attacker.killme || !gc.attacker.ships.length ) { 
				this.groundcombats.splice( c, 1 ); // delete
				continue; 
				}
			// if defender is player, save for later
			if ( gc.planet.owner.is_player && !this.app.options.soak ) { 
				continue; 
				}
			// otherwise autoresolve in background
			let combat = new GroundCombat( gc.attacker, gc.planet );
			combat.Run(); // fight to the death
			console.log(`INVASION :: ${gc.attacker.owner.name} invading ${gc.planet.name}, winner: ${combat.winner}`);
			this.groundcombats.splice( c, 1 ); // delete
			}
		}
    
    // this will look through the shipcombats queued for 
    // player-involved combat and present them to the player.
    // The queue drains by having the ship combat screen call
    // this function again on exit. If the queue has no player
    // involved combats, nothing happens.
    PresentNextPlayerShipCombat() { 
    	// if we're out of ship combats, switch to ground combats
 		if ( !this.shipcombats.length ) { 
 			this.PresentNextPlayerGroundCombat();
 			return false;
 			}
		let sc = this.shipcombats.shift();
		// fleet may have been destroyed in previous battle.
		if ( sc.attacker.killme || sc.defender.killme || !sc.attacker.ships.length || !sc.defender.ships.length ) { 
			this.PresentNextPlayerShipCombat();
			return;
			}
		// neither fleet has weapons
		else if ( !sc.attacker.fp && !sc.defender.fp ) { 
			this.PresentNextPlayerShipCombat();
			return;
			}
		// if we are soaking, automate it
		else if ( this.app.options.soak ) { 
			let combat = new ShipCombat( sc.attacker, sc.defender, sc.planet );
			combat.ProcessQueue( 100000, false ); // 1000 = fight to the death if possible
			combat.End();
			this.PresentNextPlayerShipCombat();		
			}
		// if player is the defender, present mandatory battle
		else if ( sc.defender.owner.is_player ) { 
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
							combat.ProcessQueue( 100000, false ); // 1000 = fight to the death if possible
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
							combat.ProcessQueue( 100000, false ); // 1000 = fight to the death if possible
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
    
    // this will look through the groundcombats queued for 
    // player-involved combat and present them to the player.
    PresentNextPlayerGroundCombat() { 
 		if ( !this.groundcombats.length ) { return false; }
		let c = this.groundcombats.shift();
		// fleet may have been destroyed in previous battle.
		if ( c.attacker.killme || !c.attacker.troops ) { 
			this.PresentNextPlayerGroundCombat();
			return;
			}
		// if we are soaking, automate it
		else if ( this.app.options.soak ) { 
			let combat = new GroundCombat( c.attacker, c.planet );
			combat.Run(); // fight to the death
			console.log(`INVASION :: ${c.attacker.owner.name} invading ${c.planet.name}, winner: ${combat.winner}`);
			this.PresentNextPlayerGroundCombat();
			}			
		// if player is the defender, present mandatory battle
		else if ( c.planet.owner.is_player ) { 
			this.app.ShowDialog(
				`Attack on ${c.planet.star.name}`,
				c.label,
				// buttons
				[
					{ 
						text: "Command", 
						class: "",
						cb: btn => { this.LaunchPlayerGroundCombat(c); }
						},
					{ 
						text: "Auto‑Resolve", // note nonbreaking hyphen
						class: "alt",
						cb: btn => { 
							let combat = new GroundCombat( c.attacker, c.planet );
							combat.Run(); // fight to the death
							this.PresentNextPlayerGroundCombat();
							}
						}
					]
				);
			}
		// if player is the attacker, launch directly to attack creen
		else if ( c.attacker.owner.is_player ) { 
			this.LaunchPlayerGroundCombat(c);
			}
    	}
    	
	LaunchPlayerGroundCombat( combat ) {
		this.app.SwitchMainPanel( 'groundcombat', combat, null, true ); // true = exclusive UI
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
								if ( this.app.options.notify.contact ) { 
									if ( civ1 == this.app.game.myciv && !civ1.InRangeOfCiv( civ2 ) ) { 
										let app = this.app;
										this.app.AddNote(
											'good',
											`Contact!`,
											`We have received communication signals from an alien civilization called the <b>"${civ2.name}"</b>`,
											function(){app.SwitchMainPanel( 'audience', civ2, {is_greeting:true}, true );}
											);
										}
									}
								civ1.SetInRangeOfCiv( civ2, true );
								continue compare_civ2_loop;
								}
							}
						}
					}
				// lost contact notice
				if ( this.app.options.notify.contact_lost ) { 
					if ( civ1 == this.app.game.myciv && civ1.InRangeOfCiv( civ2 ) ) { 
						this.app.AddNote(
							'bad',
							`Lost Contact`,
							`We have lost contact with the ${civ2.name}`
							);
						}
					}
				// found nothing in range
				civ1.SetInRangeOfCiv( civ2, false );
				}
			}
		}
		
	RegenerateGalaxy() {
		this.app.sidebar_obj = null;
		this.app.sidebar_mode = false;
		// let there be light
		this.galaxy.Make( 20, 10, 65, Math.random() );
		this.RefactorPlanetList();
		this.DeployVictoryIngredients();
		this.victory_achieved = false;
		Fleet.KillAll();
		}
	
	// utility function
	SetMyCiv( c ) { // id or Civ object
		if ( Number.isInteger(c) ) { 
			c = this.galaxy.civs.find( civ => civ.id == c );
			}
		if ( c ) { 
			// unset old one
			if ( this.myciv ) { this.myciv.is_player = false; }
			// set new one
			this.myciv = c;
			this.myciv.is_player = true;
			}
		}
	RotateMyCiv() { 
		let oldIndex = this.galaxy.civs.indexOf(this.myciv);
		let newIndex = oldIndex == this.galaxy.civs.length-1 ? 0 : oldIndex+1;
		// unset old one
		if ( this.myciv ) { this.myciv.is_player = false; }
		// set new one
		this.myciv = this.galaxy.civs[ newIndex ];
		this.myciv.is_player = true;
		}
	}

	
	
	
