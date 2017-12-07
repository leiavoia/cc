import Civ from './Civ';
import Fleet from './Fleet';
import * as utils from '../util/utils';
	
export function AddBlueSpaceAmoeba( app ) { 
	let civ = Civ.Random();
	civ.race.is_monster = true;
	civ.diplo.contactable = false;
	civ.name = 'Space Amoeba';
	civ.diplo_img = 'img/races/space_amoeba_blue.jpg';
	civ.diplo_img_small = 'img/races/space_amoeba_blue.jpg';
	civ.color_rgb = [20,100,230];
	app.game.galaxy.civs.push( civ ) ;
	// amoebas don't have a home system per se, 
	// but they do have a starting fleet that is 
	// not parked on another civ's HW
	let star = app.game.galaxy.stars[ 0 ];
	let fleet = new Fleet( civ, star );
	let ship = {
		name: 'Space Amoeba',
		img: 'img/ships/monsters/space_amoeba_blue.png',
		hp: 200,
		maxhp: 200,
		armor: 0,
		maxarmor: 0,
		shield: 0,
		maxshield: 0,
		att: 20,
		speed: 75,
		colonize: false,
		research: false,
		selected: true
		};
	fleet.AddShip(ship);	
	// new AI routine to subdivide dem Amoybas
	civ.TurnAI = function ( app ) { 
		// on every 8th turn, subdivide all amoeba fleets
		// and send them out to nearby systems based on dice roll
		if ( app.game.turn_num % 8 == 0 ) { 
			for ( let f of this.fleets ) { 
				if ( f.star && !f.dest ) { // only parked fleets subdivide
					ship = {
						name: 'Space Amoeba',
						img: 'img/ships/monsters/space_amoeba_blue.png',
						hp: 200,
						maxhp: 200,
						armor: 0,
						maxarmor: 0,
						shield: 0,
						maxshield: 0,
						att: 20,
						speed: 75,
						colonize: false,
						research: false,
						selected: true
						};
					// stay
					if ( Math.random() < (1 / f.ships.length) + 0.25 ) { 
						f.AddShip(ship);	
						}
					// go 
					else {
						// find the first star within 1000px 
						app.game.galaxy.stars.shuffle(); // very inefficient
						let gotcha = false;
						for ( let s of app.game.galaxy.stars ) { 
							let dist = 
								Math.pow( Math.abs(f.star.xpos - s.xpos), 2 ) 
								+ Math.pow( Math.abs(f.star.ypos - s.ypos), 2 ) 
								;
							if ( dist < 1000000 ) { 
								fleet = new Fleet( this, f.star );
								fleet.AddShip(ship);	
								fleet.SetDest( s );
								gotcha = true;
								break;
								}	
							}
						if ( !gotcha ) { 
							// if nothing available, just join the herd
							f.AddShip(ship);	
							}
						}
					}
				}
			}
		};
	}
	
	
	
export function AddGiantSpaceAmoeba( app ) { 
	let civ = Civ.Random();
	civ.race.is_monster = true;
	civ.diplo.contactable = false;
	civ.name = 'Space Amoeba';
	civ.diplo_img = 'img/races/space_amoeba_yellow.jpg';
	civ.diplo_img_small = 'img/races/space_amoeba_yellow.jpg';
	civ.color_rgb = [240,240,50];
	app.game.galaxy.civs.push( civ ) ;
	// giant amoebas start in space and fly in
	let star = app.game.galaxy.stars[ 0 ];
	let fleet = new Fleet( civ, null );
	fleet.xpos = star.xpos + 500;
	fleet.ypos = star.ypos + 500;
	let ship = {
		name: 'Giant Space Amoeba',
		img: 'img/ships/monsters/space_amoeba_yellow.png',
		hp: 800,
		maxhp: 800,
		armor: 0,
		maxarmor: 0,
		shield: 0,
		maxshield: 0,
		att: 10,
		speed: 80,
		colonize: false,
		research: false,
		selected: true
		};
	fleet.AddShip(ship);	
	fleet.SetDest(star);
	// new AI routine to subdivide dem Amoybas
	civ.TurnAI = function ( app ) { 	
		for ( let f of this.fleets ) { 
			if ( f.star && !f.dest ) { // only parked fleets subdivide
				// possibly reproduce 
				if ( Math.random() <= 0.05 ) { 
					f.AddShip({
						name: 'Giant Space Amoeba',
						img: 'img/ships/monsters/space_amoeba_yellow.png',
						hp: 800,
						maxhp: 800,
						armor: 0,
						maxarmor: 0,
						shield: 0,
						maxshield: 0,
						att: 10,
						speed: 80,
						colonize: false,
						research: false,
						selected: true
						});
					}
				if ( Math.random() <= 0.2 ) { 
					// find the first star within 1500px 
					app.game.galaxy.stars.shuffle(); // very inefficient
					for ( let s of app.game.galaxy.stars ) { 
						if ( s == f.star ) { continue; } 
						let dist = 
							Math.pow( Math.abs(f.star.xpos - s.xpos), 2 ) 
							+ Math.pow( Math.abs(f.star.ypos - s.ypos), 2 ) 
							;
						if ( dist < 1500000 ) { 	
							f.SetDest( s );
							break;
							}	
						}
					}
				}
			}
		
		};
	}
	
	
export function AddRedSpaceAmoeba( app ) { 
	let civ = Civ.Random();
	civ.race.is_monster = true;
	civ.diplo.contactable = false;
	civ.name = 'Space Amoeba';
	civ.diplo_img = 'img/races/space_amoeba_red.jpg';
	civ.diplo_img_small = 'img/races/space_amoeba_red.jpg';
	civ.color_rgb = [230,40,10];
	app.game.galaxy.civs.push( civ ) ;
	// red amoebas start with a male and female 
	// in different regions of the galaxy. They 
	// wonder aimlessly attacking anything found,
	// including other amoebas. If the male ever
	// finds the female, all hell breaks loose.
	
	// male
	let star = app.game.galaxy.stars[ 0 ];
	let fleet = new Fleet( civ, star );
	let ship = {
		name: 'Adult Red Space Amoeba (M)',
		img: 'img/ships/monsters/space_amoeba_red.png',
		hp: 600,
		maxhp: 600,
		armor: 0,
		maxarmor: 0,
		shield: 0,
		maxshield: 0,
		att: 22,
		speed: 400,
		colonize: false,
		research: false,
		selected: true,
		sex: 'M', // custom
		adult: true // custom
		};
	fleet.AddShip(ship);
	
	// female
	star = app.game.galaxy.stars[ 1 ];
	fleet = new Fleet( civ, star );
	ship = {
		name: 'Adult Red Space Amoeba (F)',
		img: 'img/ships/monsters/space_amoeba_red.png',
		hp: 900,
		maxhp: 900,
		armor: 0,
		maxarmor: 0,
		shield: 0,
		maxshield: 0,
		att: 16,
		speed: 300,
		colonize: false,
		research: false,
		selected: true,
		sex: 'F', // custom
		adult: true // custom
		};
	fleet.AddShip(ship);

	// custom AI routine
	civ.TurnAI = function ( app ) { 
		for ( let f of this.fleets ) { 
			if ( f.star && !f.dest ) { // only parked fleets move
				// are adults present? will they mate?
				let mate = 0; // 1 = male, 2 = female, 3 = lets do it
				for ( let ship of f.ships ) { 
					if ( ship.adult ) { 
						mate = mate | (ship.sex == 'M' ? 1 : 2);
						}
					// every turn, there is a 1/1000 chance a baby will be promoted to an adult
					else if ( Math.random() <= 1/1000 ) {
						ship.adult = true;
						ship.maxhp = (ship.sex=='M' ? 500 : 800);
						ship.hp = (ship.sex=='M' ? 500 : 800);
						ship.att = (ship.sex=='M' ? 20 : 15);
						ship.name = `Adult Red Space Amoeba (${ship.sex})`;
						}
					}
				// get it on
				if ( mate >= 3 && mate % 3 == 0 ) { 
					// make babies
					let fleets = [];
					let n = utils.RandomInt(6,16);
					while ( n-- ) { 
						let i = utils.RandomInt(3,12);
						let newfleet = new Fleet(this,f.star);
						while ( i-- ) { 
							let sex = (Math.random() > 0.5 ? 'M' : 'F');
							newfleet.AddShip( {
								name: `Baby Red Space Amoeba (${sex})`,
								img: 'img/ships/monsters/space_amoeba_red.png',
								hp: (sex=='M' ? 35 : 45),
								maxhp: (sex=='M' ? 35 : 45),
								armor: 0,
								maxarmor: 0,
								shield: 0,
								maxshield: 0,
								att: (sex=='M' ? 10 : 8),
								speed: 550,
								colonize: false,
								research: false,
								selected: true,
								sex, // custom
								adult: false // custom
								} );	
							}
						fleets.push(newfleet);
						}
					// send the babies to random places around the galaxy
					app.game.galaxy.stars.shuffle();
					for ( let i=0; i < fleets.length; i++ ) { 
						let n = i % ( app.game.galaxy.stars.length-1 ); // defend against not enough stars
						// merge into where i am
						if ( f.star == app.game.galaxy.stars[n] ) { 
							fleets[i].ParkOnStar();
							}
						// send away
						else {
							fleets[i].SetDest( app.game.galaxy.stars[n] );	
							}
						}
					// warn the player of impending doom
					app.AddNote(
						'bad',
						`Red Space Amoeba Spawn`,
						`There are recent deep space sightings of baby red space amoebas. 
							When red space amoebas mate, they produce dozens or even hundreds
							of offspring which fan out across space. Be on guard.`,
						null
						);		
					}
				// move adults
				if ( mate ) { // i.e. "adults present" 
					let kill_list = [];
					for ( let ship of f.ships ) { 
						if ( ship.adult ) { 
							// recently mated males die
							if ( mate >= 3 && ship.sex=='M' ) { 
								kill_list.push(ship);
								continue;
								}
							// Males move a lot. Females tend to stay in place waiting for the male.
							// Recently mated amoebas will go literally anywhere.
							if ( ship.sex=='M' || mate >= 3 || Math.random() > 0.8 ) {
								// move to a randomish nearby star within 1500px
								app.game.galaxy.stars.shuffle(); // very inefficient
								for ( let s of app.game.galaxy.stars ) { 
									if ( s == f.star ) { continue; }
									// red amoebas have a preference for older stars.
									let chance = 1;
									switch (s.color) {
										case 'red' : chance = 0.70; break;
										case 'orange' : chance = 0.65; break;
										case 'yellow' : chance = 0.55; break;
										case 'white' : chance = 0.35; break;
										case 'cyan' : chance = 0.25; break;
										case 'blue' : chance = 0.15; break;
										default : chance = 0.10;
										}
									if ( mate>=3 || Math.random() <= chance ) { 
										if ( s == f.star ) { continue; } 
										let dist = 
											Math.pow( Math.abs(f.star.xpos - s.xpos), 2 ) 
											+ Math.pow( Math.abs(f.star.ypos - s.ypos), 2 ) 
											;
										if ( dist < 1000000 || mate >= 3 ) { 
											if ( f.ships.length > 1 ) { 
												let fl = new Fleet( this, f.star );
												kill_list.push(ship);
												fl.AddShip(ship);	
												fl.SetDest( s );
												}
											else { 
												f.SetDest( s );
												}
											break;
											}	
										}
									}										
								}
							}
						}
					// remove any ships that needed to be removed during the loop	
					for ( let killship of kill_list ) { 
						f.RemoveShip(killship);
						}
					if ( !f.ships.length ) { f.Kill(); }
					}
				}
			}
		} // end AI
		
	}
