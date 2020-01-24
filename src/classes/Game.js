import Galaxy from './Galaxy';
import Fleet from './Fleet';
import * as utils from '../util/utils';
import * as Signals from '../util/signals';
import FastPriorityQueue from 'fastpriorityqueue';
import EventLibrary from './EventLibrary';
import Civ from './Civ';
import ShipCombat from './ShipCombat';
import GroundCombat from './GroundCombat';
import {VictoryRecipes,VictoryIngredients} from './VictoryRecipes';
import * as CrazyBox from './Crazy';

export default class Game {
	id = null;
	app = false;
	galaxy = null;
	turn_num = 0;
	myciv = null; // object of player civ
	processing_turn = false;
	autoplay = false;
	eventcard = null; // the event card we are currently displaying to the player
	eventcard_queue = new FastPriorityQueue( (a,b) => { return (a.turn < b.turn) ? -1 : (a.turn > b.turn ? 1 : 0); });
	eventlib = null;
	shipcombats = [];
	groundcombats = [];
	audiences = [];
	tech_announcements = []; // { tech, msg }
	victory_recipes = [];	
	victory_achieved = false;
	top10civs = []; // for AI / UI fun
	new_explored_star_queue = []; // stores fleets that just arrived on unexplored stars.
	// required to prevent arriving fleets from marking star as explored if
	// fleet is destroyed or chased away before the end of the turn.
	
	constructor( app, data ) {
		this.app = app;
		this.id = utils.UUID();
		if ( data ) { Object.assign( this, data ); }
		Signals.Listen('anom_complete', data => this.AnomCompleted(data) );
		this.eventlib = new EventLibrary(this.app);
		}
		
	toJSON() { 
		let obj = { _classname: "Game" }; 
		obj.turn_num = this.turn_num;
		obj.myciv = this.myciv.id;
		obj.galaxy = this.galaxy.id;
		obj.victory_achieved = this.victory_achieved;
		obj.eventcard_queue = []; // [!]TODO - not sure how to format yet
		obj.shipcombats = this.shipcombats.map( x => ({
			attacker: x.attacker.id,
			defender: x.defender.id,
			planet: (x.planet ? x.planet.id : null)
			}) );
		obj.groundcombats = this.groundcombats.map( x => ({
			attacker: x.attacker.id,
			planet: x.planet.id
			}) );
		obj.audiences = []; // you lost your chance
		return obj;
		}
						
	Pack( catalog ) {
		catalog[ this.id ] = this.toJSON();
		this.galaxy.Pack( catalog );
		}
				
	Unpack( catalog ) {
		this.galaxy = catalog[ this.galaxy ];
		this.myciv = catalog[ this.myciv ];
		this.shipcombats = this.shipcombats.map( x => {
			x.attacker = catalog[x.attacker];
			x.defender = catalog[x.defender];
			if ( x.planet ) { x.planet = catalog[x.planet]; }
			return x;
			} );
		this.groundcombats = this.groundcombats.map( x => {
			x.attacker = catalog[x.attacker];
			x.planet = catalog[x.planet];
			return x;
			} );
		}
				
	CheckForCivDeath() { 
		let living_civs_before = this.galaxy.civs.filter( c => c.alive && !c.race.is_monster).length;
		for ( let i = this.galaxy.civs.length-1; i >= 0; i-- ) { 
			let civ = this.galaxy.civs[i];
			if ( civ.alive && !civ.race.is_monster && (!civ.planets.length /*|| civ.resources.$ <= 0*/) ) {
				civ.Kill();
				this.galaxy.civs.splice( i, 1 );
				this.app.AddNote( 'neutral', `${civ.name} defeated`, null );
				// console.log(`*** ${civ.name} DEFEATED ***`);
				}		
			}
		let living_civs_after = this.galaxy.civs.filter( c => c.alive && !c.race.is_monster).length;
		if ( living_civs_after == 1 && living_civs_before > 1 ) {
			this.CheckForVictory(true); // check for last man standing victory		
			}
		}
		
	CheckForVictory( check_last_man_standing = false ) { 
		if ( this.victory_achieved ) { return true; }
		let civs_in_play = this.galaxy.civs.filter( c => c.alive && !c.race.is_monster);
		// last man standing
		if ( check_last_man_standing && civs_in_play.length == 1 ) { 
			this.victory_achieved = true;
			if ( !this.app.options.soak ) { 
				// player is last man standing
				if ( civs_in_play[0].is_player ) { 
					this.app.SwitchMainPanel( 'gameover', civs_in_play[0], { victory:true, msg:`The galaxy belongs to you now.` }, true, true );
					}
				// AI is last man standing
				else {
					this.app.SwitchMainPanel( 'gameover', civs_in_play[0], { victory:false, msg:`The <b>${civs_in_play[0].name}</b> was the last remaining civilization.` }, true, true );
					}
				}
			return true;
			}
		// player died
		if ( !this.myciv.alive ) { 
			if ( this.app.options.soak ) this.RotateMyCiv();
			else {
				this.victory_achieved = true;
				this.app.SwitchMainPanel( 'gameover', civs_in_play[0], { victory:false, msg:`Your civilization has perished.` }, true, true );
				return true;
				}
			}					
		// victory recipes
		for ( let civ of civs_in_play ) { 
			for ( let r of this.victory_recipes ) { 
				let gotcha = true;
				for ( let i of r.requires )  { 
					// not found - recipe is incomplete
					if ( civ.victory_ingredients.indexOf(VictoryIngredients[i]) == -1 ) {
						gotcha = false;
						break; 
						}
					}
				if ( gotcha ) { 
					this.victory_achieved = true;
					if ( !this.app.options.soak ) { 
						// player completed victory recipe
						if ( civ == this.myciv ) { 
							this.app.SwitchMainPanel( 'gameover', civs_in_play[0], { victory:true, recipe:r }, true, true );
							}
						// another civ completed victory recipe
						else {
							this.app.SwitchMainPanel( 'gameover', civs_in_play[0], { victory:false, recipe:r, civ:civ }, true, true );
							}
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
		this.victory_recipes = Object.values(VictoryRecipes);
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
		if ( data.fleet.owner == this.myciv && this.app.options.notify.anom ) { 
			this.app.AddNote(
				'neutral',
				data.anom.name,
				`<p>Research team finished investigating Anomaly ${data.anom.id}.</p>${data.anom.post_desc}`,
				() => { if ( !data.fleet.killme ) { this.app.SwitchSideBar(data.fleet); this.app.FocusMap(data.fleet); } } 
				);	
			}
		}
		
	InitGalaxy() {
		
		// galaxy size randomness is considered "up to" and not a totally random number.
		// This helps the galaxy size from exploding poor computers.
		const galaxy_size = 
			this.app.options.setup.galaxy_size_randomize
			? utils.RandomInt(16,this.app.options.setup.galaxy_size)
			: parseInt(this.app.options.setup.galaxy_size);
		const age = 
			this.app.options.setup.galaxy_age_randomize
			? (utils.RandomInt(0,10) / 10).toPrecision(1)
			: parseFloat(this.app.options.setup.galaxy_age);
		const density = 
			this.app.options.setup.density_randomize
			? (utils.RandomInt(0,10) / 10).toPrecision(1)
			: parseFloat(this.app.options.setup.density);
		const crazy = 
			this.app.options.setup.crazy_randomize
			? (utils.RandomInt(0,10) / 10).toPrecision(1)
			: parseFloat(this.app.options.setup.crazy);
		const AIs = 
			this.app.options.setup.AIs_randomize
			? utils.RandomInt(1,23)
			: parseInt(this.app.options.setup.AIs);
			
		// create initial state
		this.app.ResetEverything();
		this.galaxy = new Galaxy();
		this.galaxy.Make( galaxy_size, density, age, crazy );
		
		// this adds a standard game setup. However, this would also be a good place
		// to add alternate setups for faster debugging, perhaps based on query string params.
		this.app.hilite_star = this.galaxy.AddStandardSetup( AIs + 1 );
		
		// we override the first civ in the list with our user-defined settings.
		this.SetMyCiv( this.galaxy.civs[0] );
		this.myciv.name = this.app.options.setup.civ_name || 'Human';
		this.myciv.leader_name = this.app.options.setup.leader_name || 'Dear Leader';
		this.myciv.color_rgb = this.app.options.setup.color.map( c => parseInt(c) ) || [0,128,0];
		this.myciv.color = utils.RGBArrayToHexColor(this.myciv.color_rgb);
		// make sure the player's color does not conflict with AI colors
		let dist3d = function( c1, c2 ) { 
			return Math.sqrt ( Math.abs(  
				Math.pow( c2[0] - c1[0], 2 ) +
				Math.pow( c2[1] - c1[1], 2 ) +
				Math.pow( c2[2] - c1[2], 2 )
				) );
			};
		for ( let c of this.galaxy.civs ) { 
			if ( c == this.myciv ) { continue; } 
			let sanity = 150;
			while ( dist3d( this.myciv.color_rgb, c.color_rgb ) < 60 && --sanity ) {
				c.color_rgb = Civ.PickNextStandardColor();
				c.color = utils.RGBArrayToHexColor(c.color_rgb);
				c.homeworld.star.UpdateOwnershipTitleColorCSS();				
				} 
			}
		this.myciv.race.env.atm = parseInt( this.app.options.setup.race_atm || 2 );
		this.myciv.race.env.temp = parseInt( this.app.options.setup.race_temp || 2 );
		this.myciv.race.env.grav = parseInt( this.app.options.setup.race_grav || 2 );
		this.myciv.race.env.adaptation = parseInt( this.app.options.setup.race_adapt || 1 );
		let homeworld = this.myciv.planets[0];
		homeworld.name = this.app.options.setup.homeworld || 'Earth'
		homeworld.atm = this.myciv.race.env.atm;
		homeworld.temp = this.myciv.race.env.temp;
		homeworld.grav = this.myciv.race.env.grav;
		homeworld.energy = 1;
		homeworld.star.name = this.app.options.setup.homestar || 'Sol';
		homeworld.star.UpdateOwnershipTitleColorCSS();
		for ( let i=1; i < homeworld.star.planets.length; i++ ) {
			homeworld.star.planets[i].name = homeworld.star.name + ' ' + utils.Romanize(i+1);
			}
			
		// TODO: difficulty level: when assigning homeworlds, give player more or less
		// room, and better or worse position as defined by the natural score of all
		// planets within a "starting circle", then sort star systems by their totals.
		
		this.RecalcStarRanges();
		this.RecalcFleetRanges();
		this.RecalcCivContactRange();
		this.DeployVictoryIngredients();

		// TODO: random fun stuff
		// CrazyBox.AddGiantSpaceAmoeba(this.app);
		// CrazyBox.AddRedSpaceAmoeba(this.app);
		// CrazyBox.AddGreenMites(this.app);
		// CrazyBox.AddBlueSpaceAmoeba(this.app);
		}

	ToggleAutoPlay( speed = 500 ) { 
		if ( this.autoplay ) { 
			clearInterval( this.autoplay );
			this.autoplay = false;
			this.app.options.nofx = false;
			// this.app.options.headless = false;
			}
		else {
			let game = this;
			let cb = function(){ if ( !game.processing_turn ) { game.ProcessTurn(); } };
			this.autoplay = setInterval(cb, speed);
			if ( speed < 500 ) this.app.options.nofx = true;
			// if ( speed <= 10 ) this.app.options.headless = true;
			}
		}
		
	ProcessTurn() {
		this.processing_turn = true;
		
		// TODO: lock the UI

		this.CheckForCivDeath();
		
		// calculate resource being demanded by planetary zones
		for ( let civ of this.galaxy.civs ) { 
			civ.EstimateResources();
			// reset some stuff
			civ.research_income = 0;
			for ( let k in civ.resource_income ) { civ.resource_income[k] = 0; }
			for ( let k in civ.resource_spent ) { civ.resource_spent[k] = 0; }
			}
		
		// Planetary Economics
		for ( let s of this.galaxy.stars ) { 
			for ( let p of s.planets ) {
				if ( p.owner ) {  					
					// HACK zone production; TODO: MOVE THIS TO planet.js
					for ( let k in p.acct_total ) { p.acct_total[k] = 0; }
					for ( let k in p.output_rec ) { p.output_rec[k] = 0; }
					for ( let k in p.resource_rec ) { p.resource_rec[k] = 0; }
					p.acct_ledger.splice(0, p.acct_ledger.length); // clear accounting records
					p.DoZoning();						
					let items_built = p.DoProduction();
					if ( p.owner.is_player && !this.app.options.soak && this.app.options.notify.build_queue && items_built && items_built.length ) {
						items_built = items_built.filter( i => i.type != 'makework' ).unique();
						for ( let item of items_built ) {
							this.app.AddNote(
								'info',
								null,
								`<b>${item.name}</b> completed on <b>${p.name}</b>`,
								() => { this.app.FocusMap(p); this.app.SwitchSideBar(p); }
								);							
						}
					}
					p.GrowEconomy();
					p.UpdateMorale();
					p.GrowPop();
					}
				}
			}
			
		// restock weapons
		for ( let f of this.galaxy.fleets ) { 
			f.ReloadAllShipWeapons();
			f.ReevaluateStats();
			}
		
		// AI!
		if ( this.app.options.ai ) { 
			for ( let civ of this.galaxy.civs ) { 
				if ( !civ.is_player || this.app.options.soak ) { 
					civ.TurnAI( this.app );
					}
				}
			}
			
		// important to do ship research BEFORE moving ships,
		// otherwise they get to do both in one turn. Not allowed.
		this.DoFleetResearch();
		
		// ship movement. TECHNICAL: loop backwards because moving can 
		// remove fleets from the list when they land at destinations.
		for ( let i = this.galaxy.fleets.length-1; i >= 0; i-- ) { 
			let f = this.galaxy.fleets[i];
			if ( f.MoveFleet() ) {
				// if the fleet arrived, mark the star as explored to help the UI
				if ( f.owner.is_player && f.star && !f.dest && !f.star.explored ) {
					if ( this.app.options.soak ) { f.star.explored = true; }
					else { this.new_explored_star_queue.push(f); }
					}
				// notice to player if fleet has colony ship and there is colonizable planet
				if ( f.owner.is_player && !this.app.options.soak && this.app.options.notify.colony_ship_arrived && f.colonize && f.star && !f.dest && 'planets' in f.star &&  f.star.planets.length ) {
					if ( f.star.planets.filter( p => !p.owner && p.Habitable(f.owner.race) ).length ) {
						this.app.AddNote(
							'neutral',
							`Settle ${f.star.name}?`,
							`Colony ships have arrived at ${f.star.name}, ready to settle down at your command.`,
							() => { this.app.FocusMap(f.star); this.app.SwitchSideBar(f.star); }
							);						
						}
					}
				}
			};
		// update caret (check for dead fleets removed from ship movement ) 
		if ( this.app.CurrentState().caret ) { 
			this.app.CurrentState().SetCaret( this.app.CurrentState().caret.obj );
			}
		if ( this.app.sidebar_obj instanceof Fleet && this.app.sidebar_obj.killme ) { 
			this.app.sidebar_obj = null;
			this.app.sidebar_mode = null;
			}
		if ( !this.app.sidebar_obj && this.app.sidebar_mode ) { 
			this.app.sidebar_mode = null;
			}
		if ( this.app.sidebar_obj && !this.app.sidebar_mode ) { 
			this.app.sidebar_obj = null;
			}
		
		// RESEARCH
		for ( let civ of this.galaxy.civs ) { 
			civ.DoResearch( this.app );
			}	
		
		// find potential combats
		this.FindShipCombats();
		this.FindGroundCombats();
		
		// [!]OPTIMIZE we can optimize this out of the loop if 
		// we limit it to events that change planets or ship ranges
		this.RecalcCivContactRange();
		
		this.RecalcStarRanges();
			
		// fleets move, so we need to do this on each turn
		this.RecalcFleetRanges(); 
		
		// this needs to come before accounting because treaty incomes affect totals.	
		this.UpdateDiplomaticRelations();
		
		// collects taxes, handles expenses, makes accounting records
		for ( let civ of this.galaxy.civs ) {
			civ.DoAccounting( this.app );
			}
					
		// calculate overall civ power scores
		for ( let civ of this.galaxy.civs ) { 
			civ.CalcPowerScore();
			}
		this.top10civs = this.galaxy.civs.filter( c => c.alive && !c.race.is_monster && c.power_score > 0 );
		this.top10civs.sort( (a,b) => b.power_score - a.power_score );
		this.top10civs = this.top10civs.slice(0,10)
			.map( (c,i) => { return {
				civ:c, 
				score:c.power_score, 
				rank:(i+1), 
				pct:(c.power_score / this.top10civs[0].power_score) 
				};
				} );
		
		// compile stats
		for ( let civ of this.galaxy.civs ) { 
			civ.ArchiveStats();
			}
		
		this.CheckForCivDeath(); // second time 
		
		this.turn_num++;
		
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
				this.ProcessUIQueue(); // present subscreens
				}
			}
		// GAME OVER!
		else {
			Signals.Send('game_over', this.turn_num );
			if ( this.autoplay ) { 
				clearInterval( this.autoplay );
				this.autoplay = false;
				}
			}
		
		// autosave
		if ( this.app.options.autosave && !this.app.options.soak ) {
			this.app.SaveGame('Auto-Save');
			}
			 
		this.processing_turn = false;
		} // end process turn
		
	ProcessNewlyExploredStars() {
		while( this.new_explored_star_queue.length ) { 
			let f = this.new_explored_star_queue.shift();
			if ( f.owner == this.myciv && f.star && !f.dest && !f.star.explored ) {
				f.star.explored = true;
				if ( this.app.options.notify.explore && f.star.objtype == 'star' ) { 
					// count habitable systems
					let goods = 0;
					let occupied = 0;
					for ( let p of f.star.planets ) {
						if ( p.Habitable(f.owner.race) ) { 
							goods++;
							if ( p.owner ) { occupied++; }
							}
						};
					let app = this.app; 
					let star = f.star; // fleet may disappear leaving `f` == null
					let note = `${goods ? goods : 'No'} habitable system${goods==1 ? '' : 's'} found.`;
					if ( occupied ) { note += ` ${occupied} system${occupied==1 ? '' : 's'} is occupied by another civilization.`;  }
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
		
	// `data` is whatever the civ is wanting to discuss, which isnt programmed yet.
	// currently only takes `data.offer` for trade offers and `data.message` for raw text.
	QueueAudience( civ, data ) {
		if ( !civ ) { return false; }
		if ( this.app.options.soak ) { return false; }
		// first flush out any existing audiences with the same civ.
		// we dont want embarassing multiple audiences in one turn.
		for ( let i = this.audiences.length-1; i >= 0; i-- ) { 
			if ( this.audiences[i].civ == civ ) {
				this.audiences.splice( i, 1 );
				} 
			}
		this.audiences.push({ civ, data, label: `${civ.name} audience` });	
		}
		
	// `tech` is an item from the civ.tech.compl list.
	// `msg` is optional in case you steal something or win something.
	QueueTechAnnouncement( tech, msg=null, title=null ) {
		if ( !tech ) { return false; }
		if ( this.app.options.soak ) { return false; }
		this.tech_announcements.push({ tech, msg, title });	
		}
		
	QueueShipCombat( attacker, defender, planet, force_prompt=false ) {
		if ( !attacker || !defender ) { return false; }
		this.shipcombats.push({ attacker, defender, planet,
			label: `${attacker.owner.name} attacks ${defender.owner.name} at ${attacker.star.name}`
			});	
		}
		
	QueueGroundCombat( attacker, planet, end = 'back', force_prompt=false ) {
		if ( !attacker || !planet ) { return false; }
		let data = { attacker, planet,
			label: `${attacker.owner.name} invades planet ${planet.name}`,
			prompt:force_prompt
			};
		if ( end === 'back' ) { this.groundcombats.push(data); }	
		else { this.groundcombats.unshift(data); }	
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
						// NOTE 2: defender should get the chance to select a planet to hide behind
						// 	if the attacker does not choose any.
						// If the attacker (fleet_a) is the player, skip. Players initiate all combat manually.
						if ( !star.fleets[fleet_a].owner.is_player || this.app.options.soak ) {
							this.QueueShipCombat( star.fleets[fleet_a], star.fleets[fleet_b], null );
							}
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
			// console.log('Resolved ship combat: ' + sc.label + ', WINNER: ' + combat.winner);
			this.shipcombats.splice( c, 1 ); // delete
			};
		}
    
		
	FindGroundCombats() {
		// find all AI combats
		for ( let star of this.galaxy.stars ) {
			if ( star.fleets.length && star.planets.length ) { 
				for ( let fleet of star.fleets ) { 
					// If the attacker is the player, skip. Players initiate all combat manually.
					if ( (this.app.options.soak || !fleet.owner.is_player) && fleet.troops && !fleet.mission && !fleet.killme ) { 
						for ( let planet of star.planets ) { 
							if ( planet.owner != fleet.owner ) {
								if ( fleet.AIWantToInvadePlanet(planet) && (!planet.OwnerFleet() || !planet.OwnerFleet().milval) ) {
									// console.log(`GC: ${fleet.owner.name} wants to invade ${planet.name}`);
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
			if ( gc.attacker.killme || !gc.attacker.ships || !gc.attacker.ships.length || !gc.planet.owner ) { 
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
			// console.log(`INVASION :: ${gc.attacker.owner.name} invading ${gc.planet.name}, winner: ${combat.winner}`);
			this.groundcombats.splice( c, 1 ); // delete
			this.CheckForCivDeath();
			}
		}
    
	// This queue will launch certain interaction-required subscreens (UI panels)
	// such as ship combat, ground combat, diplomatic audiences, etc. The queue is
	// process-locked by (bool) game.processing_ui_queue. It will not process multiple
	// items at once. The process is pumped by calling app.CloseMainPanel() since
	// all Panel objects call this function to close themselves out. This triggers the
	// next queue item. Process ends when queue is empty. 
	ProcessUIQueue() {
		if ( this.shipcombats.length ) { this.PresentNextPlayerShipCombat(); }
		else if ( this.groundcombats.length ) { this.PresentNextPlayerGroundCombat(); }
		else if ( this.audiences.length ) { this.PresentNextAudience(); }
		else if ( this.tech_announcements.length ) { this.PresentNextTechAnnouncement(); }
		else { 
			this.ProcessNewlyExploredStars();
			this.CheckForCivDeath();
			this.CheckForVictory(true);
			return true;
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
 			this.ProcessUIQueue();
 			return false;
 			}
		let sc = this.shipcombats.shift();
		// fleet may have been destroyed in previous battle.
		if ( sc.attacker.killme || sc.defender.killme || !sc.attacker.ships.length || !sc.defender.ships.length || !sc.defender.owner.alive || !sc.attacker.owner.alive ) { 
			this.ProcessUIQueue();
			return;
			}
		// neither fleet has weapons
		else if ( !sc.attacker.fp && !sc.defender.fp ) { 
			this.ProcessUIQueue();
			return;
			}
		// if we are soaking, automate it
		else if ( this.app.options.soak ) { 
			let combat = new ShipCombat( sc.attacker, sc.defender, sc.planet );
			combat.ProcessQueue( 100000, false ); // 1000 = fight to the death if possible
			combat.End();
			this.ProcessUIQueue();		
			}
		// if player is the defender, present mandatory battle
		else if ( sc.defender.owner.is_player ) {
			let ods = Math.round( 100 * ( sc.defender.milval / ( sc.defender.milval + sc.attacker.milval ) ) );
			this.app.ShowDialog(
				`Attack on ${sc.defender.star.name}`,
				`<p class="centered">${sc.label}</p><p class="centered">Odds of Winning: <b>${ods}%</b></p>`,
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
							this.ProcessUIQueue();
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
							this.ProcessUIQueue();
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
		if ( c.attacker.killme || !c.attacker.troops || !c.planet.owner || !c.planet.owner.alive || !c.attacker.owner.alive ) { 
			this.ProcessUIQueue();
			return;
			}
		// if we are soaking, automate it
		else if ( this.app.options.soak ) { 
			let combat = new GroundCombat( c.attacker, c.planet );
			combat.Run(); // fight to the death
			// console.log(`INVASION :: ${c.attacker.owner.name} invading ${c.planet.name}, winner: ${combat.winner}`);
			this.CheckForCivDeath();
			this.ProcessUIQueue();
			return;
			}			
		// if player is the defender, present mandatory battle
		else if ( c.planet.owner.is_player || c.prompt ) { 
			this.app.ShowDialog(
				`Invasion of ${c.planet.star.name}`,
				`<p class="centered">${c.label}</p>`,
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
							this.CheckForCivDeath();
							this.ProcessUIQueue();
							}
						}
					]
				);
			}
		// if player is the attacker, launch directly to attack screen
		else if ( c.attacker.owner.is_player ) { 
			this.LaunchPlayerGroundCombat(c);
			}
    	}
    
    PresentNextTechAnnouncement() { 
 		if ( !this.tech_announcements.length ) { return false; }
		let a = this.tech_announcements.shift();
		// croaked or soaked
		if ( this.app.options.soak || !this.myciv.alive ) { 
			this.ProcessUIQueue(); 
			return false;
			}
		else {
			if ( this.autoplay ) {
				clearInterval( this.autoplay );
				this.autoplay = false;
				}
			this.app.SwitchMainPanel( 'tech', a.tech, {announce_msg: a.msg, announce_title: a.title} ); // true = exclusive UI			
			}
    	}
    
    PresentNextAudience() { 
 		if ( !this.audiences.length ) { return false; }
		let a = this.audiences.shift();
		// croaked or soaked
		if ( this.app.options.soak || !a.civ.alive || !this.myciv.alive ) { 
			this.ProcessUIQueue(); 
			return false;
			}
		else { this.LaunchAudience(a); }
    	}
    	
	LaunchAudience( audience ) {
		// no audiences if can't communicate
		if ( this.myciv.CommOverlapWith( audience.civ ) <= 0 ) { return false; }
		if ( this.autoplay ) { 
			clearInterval( this.autoplay );
			this.autoplay = false;
			}
		this.app.SwitchMainPanel( 'audience', audience.civ, audience.data, true ); // true = exclusive UI
		}
    	
	LaunchPlayerGroundCombat( combat ) {
		if ( this.autoplay ) { 
			clearInterval( this.autoplay );
			this.autoplay = false;
			}
		this.app.SwitchMainPanel( 'groundcombat', combat, null, true ); // true = exclusive UI
		}
    	
	LaunchPlayerShipCombat( combat ) {
		// double check all players are still active
		if ( combat.defender.killme || combat.attacker.killme 
		|| combat.defender.merged_with || combat.attacker.merged_with 
		|| !combat.defender.owner.alive || !combat.attacker.owner.alive ) { 
			this.ProcessUIQueue(); 
			return false; 
			}
		if ( this.autoplay ) { 
			clearInterval( this.autoplay );
			this.autoplay = false;
			}
		this.app.SwitchMainPanel( 'shipcombat', combat, null, true ); // true = exclusive UI
		}
		
	RecalcStarRanges() { 
		// recalculate which planets are in range of my systems
		// this may not be necessary as it is just for UI stuff
		// but may become necessary to short circuit some 
		// calculations later. Testing required.
		// NOTE: `in_range` is code for "is visible on map for the player"
		// and has no programmatic effect.
		
		// NOTE: SURVEILLENCE agreements can increase what is visible to the player
		let civs = [this.myciv];
		for ( let [c,acct] of this.myciv.diplo.contacts ) { 
			if ( acct.treaties.has('SURVEIL') ) {
				civs.push(c);
				}
			}
		let stellar_objects = this.galaxy.stars.concat( this.galaxy.anoms );
		for ( let s of stellar_objects ) { 
			for ( let civ of civs ) { 
				let range = civ.ship_range * civ.ship_range ; // NOTE: avoid square rooting.
				// do i live here?
				if ( s.objtype=='star' && s.Acct(civ) ) {
					s.in_range = true;
					break;
					}
				else if ( s.objtype=='star' || (s.objtype=='anom' && s.onmap) ) {
					s.in_range = false;
					// use easy box test first
					if ( utils.BoxPointIntersect( civ.empire_box, s.xpos, s.ypos ) ) {
						// how far am i from where i DO live?
						for ( let p of civ.planets ) { 
							let dist = 
								Math.pow( Math.abs(p.star.xpos - s.xpos), 2 )
								+ Math.pow( Math.abs(p.star.ypos - s.ypos), 2 );
							if ( dist <= range ) {
								s.in_range = true;
								break;
								}
							}
						}
					if ( s.in_range ) { break; } // don't check other civs
					};
				}
			}
		}
		
	RecalcFleetRanges() {
		
		// NOTE: SURVEILLENCE agreements can increase what is visible to the player
		let civs = [this.myciv];
		for ( let [c,acct] of this.myciv.diplo.contacts ) { 
			if ( acct.treaties.has('SURVEIL') ) {
				civs.push(c);
				}
			}
		// same notes as star ranges
		for ( let f of Fleet.all_fleets ) { 
			for ( let civ of civs ) { 
				let range = civ.ship_range * civ.ship_range ; // NOTE: avoid square rooting.
				// all of my fleets are always visible
				if ( f.owner == civ ) {
					f.in_range = true;
					break;
					}
				// only check fleets in the air. parked fleets are handled by star range 
				else if ( !f.star && f.dest && f.xpos && f.ypos ) {
					f.in_range = false;
					// use easy box test first
					if ( utils.BoxPointIntersect( civ.empire_box, f.xpos, f.ypos ) ) {
						// how far am i from where i DO live?
						for ( let p of civ.planets ) { 
							let dist = 
								Math.pow( Math.abs(p.star.xpos - f.xpos), 2 )
								+ Math.pow( Math.abs(p.star.ypos - f.ypos), 2 );
							if ( dist <= range ) {
								f.in_range = true;
								break;
								}
							}
						}
					if ( f.in_range ) { break; } // don't check other civs
					};
				}
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
						note = note + ` Expedition leaders at <b>${f.star.name}</b> came back empty handed, but would like to continue the mission if possible. ${report.note}`;
						}
					else {
						note = 'Nothing of interest to report in this sector of space.';
						}				
					}
				else if ( report.status == -1 ) { 
					note = `Fleet #${f.id} has not returned from its deep space mission near <b>${report.star.name}</b>. The crew is feared lost.`;
					if ( report.remaining ) {
						note = note + ' Our last communication with the team indicates they were on to something. Perhaps we can continue the tour with additional precautions in the future.';
						}
					}
				else { 
					note = 'Success!';
					// followup comment 
					if ( report.remaining ) {
						note = note + ` Expedition leaders at <b>${f.star.name}</b> indicate the presence of yet more interesting things to investigate and would like to continue the mission if possible.`;
						}
					else {
						note = note + ` The team at <b>${f.star.name}</b> has done an exhaustive search of the area and found nothing more to investigate.`;
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
		let starlist = []; // multidimensial array of [civ][star]
		for ( let c=0; c < this.galaxy.civs.length; c++ ) {
			starlist[c] = this.galaxy.civs[c].MyStars();
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
					for ( let c1s=0; c1s < starlist[c1].length; c1s++ ) { // for each of civ1's stars
						for ( let c2s=0; c2s < starlist[c2].length; c2s++ ) { // for each of civ2's stars
							let star1 = starlist[c1][c1s];
							let star2 = starlist[c2][c2s];
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
		
	UpdateDiplomaticRelations() { 
		for ( let c of this.galaxy.civs ) { 
			if ( c.is_monster ) { continue; } // no monsters 
			if ( !c.alive || !c.planets.length ) { continue; } // no zombies 
			c.RecalcReputation();
			// note that we evaluate treaties (actually two) from each viewpoint
			for ( let [civ, acct] of c.diplo.contacts.entries() ) { 
				// no dead civs - TODO ideally move this to a KILL() function
				if ( !c.alive || !civ.planets.length ) { continue; } 
				for ( let t of acct.treaties.values() ) { 
					if ( 'onTurn' in t ) { 
						t.onTurn( this.turn_num ); 
						}
					}
				for ( let t of civ.diplo.contacts.get(c).treaties.values() ) { 
					if ( 'onTurn' in t ) {
						t.onTurn( this.turn_num ); 
						}	
					}
				// regain attention span
				if ( !c.is_player ) { 
					acct.attspan += c.diplo.attspan_recharge; 
					if ( acct.attspan > c.diplo.attspan_max ) { 
						acct.attspan = c.diplo.attspan_max; 
						}
					}
				// gravitate towards natural disposition (this is called 
				// once for each civ, so it double dips - be careful)
				if ( acct.lovenub > c.diplo.dispo ) { c.BumpLoveNub( civ, 0.001 ); }
				}
			}
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
			// UI hinting
			this.galaxy.stars.forEach( s => {
				s.settled_by_player = s.accts.has(this.myciv);
				// note: dont completely overwrite `explored` - this overwrites saved-game data when game
				s.explored = s.explored || s.accts.has(this.myciv); // fuzzy but ok for debug
				this.RecalcStarRanges();
				this.RecalcFleetRanges();
				});
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
		// UI hinting
		this.galaxy.stars.forEach( s => {
			s.settled_by_player = s.accts.has(this.myciv);
			s.explored = s.accts.has(this.myciv); // fuzzy but ok for debug
			this.RecalcStarRanges();
			this.RecalcFleetRanges();
			});
		}
		
	}

	
	
	
