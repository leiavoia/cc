import Galaxy from './Galaxy';
import Star from './Star';
import Planet from './Planet';
import Hyperlane from './Hyperlane';
import Constellation from './Constellation';
import Fleet from './Fleet';
import * as utils from '../util/utils';

export default class Game {
	theapp = false;
	galaxy = null;
	avg_rich = 0;
	avg_rarity = 0;
	rare_count = [0,0,0,0,0];
	planets = [];
	turn_num = 0;
	iam = 0;
	constructor( theapp ) {
		this.theapp = theapp;
		Fleet.all_fleets = []; // need to set this manually since Fleet class doesn't do it itself very well
		this.fleets = Fleet.all_fleets;
		}
		
	InitGalaxy() {
		
		
		// let there be light
		this.galaxy = new Galaxy();
// 		this.galaxy.MakeExploreDemo(); //Make( 5000, 5000, 100, 0.5 );
// 		this.RefactorPlanetList();
// 
// 		
// 		// open the planetinfo panel for testing
// 		loop1: for ( let i=0,  max=this.galaxy.stars.length; i < max; i++ ) { 
// 			for ( let j=0,  maxj=this.galaxy.stars[i].planets.length; j < maxj; j++ ) { 
// 				
// 				// this.galaxy.stars[i].planets[j].size = 120;
// 				// this.SwitchMainPanel('colonize',	this.galaxy.stars[i].planets[j]);
// 				
// // 				if ( this.galaxy.stars[i].planets[j].owner == this.iam ) {
// // 					this.SwitchSideBar( this.galaxy.stars[i].planets[j] );
// // 					this.SwitchMainPanel( "planetinfo", this.galaxy.stars[i].planets[j] );
// 
// 
// 					let fleet = new Fleet( this.galaxy.stars[i].planets[j].owner, this.galaxy.stars[i] )
// 					this.galaxy.stars[i].fleets.push( fleet );
// 					this.theapp.SwitchSideBar( fleet );
// 					
// 					
// 					break loop1;
// 					
// 					
// // 					}
// 				}
// 			}
			
		// make hyperlanes
// 		for ( let i=0,  max=this.galaxy.stars.length; i < max; i++ ) { 
// 			if ( i != 1 ) { 
// 				let l = this.galaxy.stars[1].ConnectLane( 
// 					this.galaxy.stars[i], 
// 					( this.galaxy.stars[i].planets.length ? this.galaxy.stars[i].planets[0].owner : 0 )
// 					); 
// 				this.galaxy.lanes.push( l );
// 				}
// 			}
			
// 		Constellation.Refactor( this.galaxy.civs );



		}

	// hacked in for debug
	RefactorPlanetList() { 
		this.avg_rich = 0;
		this.avg_rarity = 0;
		this.rare_count = [0,0,0,0,0];
		this.planets = [];
		if ( this.galaxy ) { 
			for ( let s of this.galaxy.stars ) { 
				for ( let p of s.planets ) { 
					this.planets.push(p);
					let r = Math.abs( p.atm - p.temp );
					this.avg_rarity += r;
					this.rare_count[r]++;
					this.avg_rich += p.rich;
					}
				}
			this.avg_rarity /= this.planets.length;
			this.avg_rich /= this.planets.length;
			}
		}
	ProcessTurn( num_turns = 1 ) {
		
		// TODO: lock the UI
		
		for ( let t=0; t < num_turns; t++ ) { 

			// Loop Part 1
			for ( let s of this.galaxy.stars ) { 
				for ( let p of s.planets ) {
					if ( p.settled ) {  
	
						// collect taxes
						p.owner.treasury += p.CollectTax();
												
						}
					}
				}
				
			// import/export mined resources
			for ( let civ of this.galaxy.civs ) { 
				for ( let constel of civ.constels ) { 
					// NOTE: when zeroing out the accounts, leave the "have" field.
					// This lets amounts collect at the constellation or system level
					// over the course of several turns.
					constel.econ.need = 0; // zero out every turn
					constel.econ.export = 0; // zero out every turn
					constel.econ.redistrib = 0; // zero out every turn
					constel.econ.collected = 0; // zero out every turn
					for ( let star of constel.stars ) { 
						let acct = star.Acct(civ);
						acct.econ.need = 0; // zero out every turn
						acct.econ.export = 0; // zero out every turn
						acct.econ.imported = 0; // zero out every turn
						acct.econ.collected = 0; // zero out every turn
						acct.econ.redistrib = 0; // zero out every turn
						// STEP 1: COLLECT PLANETARY EXPORTS
						for ( let planet of star.planets ) {
							if ( planet.owner == civ ) { 
								planet.econ.mine_import = 0; 
								planet.DoMining();
								planet.econ.mine_export = planet.act.mine.output - planet.act.mine.need;
								if ( planet.econ.mine_export < 0 ) { 
									acct.econ.need -= planet.econ.mine_export;
									}
								else if ( planet.econ.mine_export > 0 ) { 
									planet.warehouse -= planet.econ.mine_export;
									acct.econ.have += planet.econ.mine_export;
									acct.econ.collected += planet.econ.mine_export;
									}
// 								if ( this.iam == civ.id ) { console.log(`PLANET ${planet.name}: have ${planet.act.mine.output}, need ${planet.MiningNeed()}, export ${planet.econ.mine_export}`);}
								}
							}
						
						// STEP 2: REDISTRIBUTE
						// take care of our own people before shipping stuff intersteller.
						// give to each planet according to their need
						if ( acct.econ.need > 0 && acct.econ.have > 0 ) { 
							for ( let planet of star.planets ) {
								if ( planet.owner == civ && planet.econ.mine_export < 0 ) { 
									// note: we don't give more than they actually need, greedy bloodsucking aliens.
									let portion = 
										( -planet.econ.mine_export / acct.econ.need ) 
										* Math.min( acct.econ.need, acct.econ.have )
										;
									planet.econ.mine_import = portion; // stat tracking
									planet.warehouse += portion; // ie "have"
									planet.econ.mine_export += portion;
// 									if ( this.iam == civ.id ) { console.log(`REDISTRIB PLANET: ${planet.name}: have ${planet.act.mine.output}, need ${planet.MiningNeed()}, export ${planet.econ.mine_export}, import ${planet.econ.mine_import}`); }
									
									acct.econ.need -= portion;							
									acct.econ.have -= portion;	
									acct.econ.redistrib += portion;
									}
								}
							}
						// system level accounting
						acct.econ.export = acct.econ.have - acct.econ.need;							
						
// 						if ( this.iam == civ.id ) { console.log(`STAR ${star.name}: have ${acct.econ.have}, need ${acct.econ.need}, export ${acct.econ.export}`);}
						
						// STEP 3: EXPORT TO CONSTELLATION
						if ( acct.econ.export < 0 ) { 
							constel.econ.need -= acct.econ.export;
							}
						else if ( acct.econ.export > 0 ) { 
							constel.econ.have += acct.econ.export;
							constel.econ.collected += acct.econ.export; // useful for stat tracking
							acct.econ.have -= acct.econ.export;
							}					
						}
						
// 						if ( this.iam == civ.id ) { console.log(`CONSTEL ${constel.name}: have ${constel.econ.have}, need ${constel.econ.need}`);}
												
					// STEP 4: REDISTRIBUTE TO SYSTEMS
					// NOTE [!]TODO : If there is an excess of materials, you need to choose to:
					//	- store at the constellation level (default)
					//	- give back to the producing planets
					// 	- equally redistribute
					constel.econ.redistrib = Math.min( constel.econ.need, constel.econ.have ); // useful for stat tracking
					if ( constel.econ.need > 0 && constel.econ.have > 0 ) { 
						for ( let star of constel.stars ) {
							let acct = star.Acct(civ);
							if ( acct.econ.export < 0 ) { 
								let system_portion = 
									( acct.econ.need / constel.econ.need ) 
									* Math.min( constel.econ.need, constel.econ.have )
									;
								// STEP 5: REDISTRIBUTE TO PLANETS
								for ( let planet of star.planets ) {
									if ( planet.owner == civ && planet.econ.mine_export < 0 ) { 
										// planet portion is based on what is provided by the system portion
										let portion = ( -planet.econ.mine_export / acct.econ.need ) * system_portion;
										planet.econ.mine_import += portion; // stat tracking
										planet.warehouse += portion;
										planet.econ.mine_export += portion;
										acct.econ.redistrib += portion;
// 										if ( this.iam == civ.id ) { console.log(`PLANET RECEIVING: ${planet.name}: receiving ${portion}`);}
										}
									}
								// system level accounting
// 								acct.econ.have += system_portion; // have is zero at this point anyway
								acct.econ.need -= system_portion;
								acct.econ.export += system_portion;							
								acct.econ.imported = system_portion;							
								
								constel.econ.need -= system_portion;							
								constel.econ.have -= system_portion;							
								}
							}
						}
					// do constellation-level accounting
					constel.econ.export = constel.econ.collected - constel.econ.redistrib;	
					}
				}
			
			// Loop Part 2
			for ( let s of this.galaxy.stars ) { 
				for ( let p of s.planets ) {
					if ( p.settled ) {  
					
						// production
						p.DoProduction(); // production
						
						// grow/shrink economy
						p.GrowEconomy();
						
						// population growth ( returns true if max-pop reached )
						if ( p.GrowPop() ) { 
// 							this.ShowDialog( 'Maximum Polulation Reached', p.name );
							}
							
						// migration
						
						// pay piper
						p.owner.treasury -= p.total_expense;
						}
					}
				}
			
			// ship movement
			for ( let fleet of this.fleets ) { 
				fleet.MoveFleet();
				}
				
			this.turn_num++;
			
			}
		}
			
	RegenerateGalaxy () {
		this.theapp.sidebar_obj = null;
		this.theapp.sidebar_mode = false;
		// let there be light
// 		this.galaxy = new Galaxy();
		this.galaxy.Make( 8000, 4000, 65, Math.random() );
		this.RefactorPlanetList();
		Fleet.KillAll();
		}
	
	// utility function
	MyCiv() { 
		return this.galaxy.civs[ this.iam ];
		}
				
	}

	
	
	
