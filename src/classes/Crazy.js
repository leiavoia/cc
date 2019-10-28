import Civ from './Civ';
import Fleet from './Fleet';
import * as utils from '../util/utils';
import {Ship,ShipBlueprint} from './Ship';
import * as AI from './AI';

export function AddBlueSpaceAmoeba( app ) { 
	let civ = new Civ();
	civ.race.is_monster = true;
	civ.diplo.contactable = false;
	civ.name = 'Blue Space Amoebas';
	civ.diplo_img = 'img/races/space_amoeba_blue.jpg';
	civ.diplo_img_small = 'img/races/space_amoeba_blue.jpg';
	civ.color_rgb = [20,100,230];
	civ.color = '#' + utils.DecToHex(civ.color_rgb[0]) + utils.DecToHex(civ.color_rgb[1]) + utils.DecToHex(civ.color_rgb[2]);
			
	app.game.galaxy.civs.push( civ ) ;
	// amoebas don't have a home system per se, 
	// but they do have a starting fleet that is 
	// not parked on another civ's HW
	let star = app.game.galaxy.stars[ 0 ];
	
	let bp = new ShipBlueprint();
	bp.name = 'Space Amoeba';
	bp.hull = 400;
	bp.armor = 100;
	bp.speed = 200;
	bp.img = 'img/ships/monsters/space_amoeba_blue.png';
	bp.AddWeapon('AMOEBASLIME1',8);
	civ.ship_blueprints.push(bp);
	
	let fleet = new Fleet( civ, star );
	fleet.AddShip( new Ship(bp) );
	civ.fleets.push(fleet);
	
	civ.ai = new AI.AI(civ);
	civ.ai.objectives.push( new AI.AIBlueAmoebaObjective() );	
	}
	
	
	
export function AddGiantSpaceAmoeba( app ) { 
	let civ = new Civ();
	civ.race.is_monster = true;
	civ.diplo.contactable = false;
	civ.name = 'Giant Space Amoebas';
	civ.diplo_img = 'img/races/space_amoeba_yellow.jpg';
	civ.diplo_img_small = 'img/races/space_amoeba_yellow.jpg';
	civ.color_rgb = [240,240,50];
	civ.color = '#' + utils.DecToHex(civ.color_rgb[0]) + utils.DecToHex(civ.color_rgb[1]) + utils.DecToHex(civ.color_rgb[2]);
	app.game.galaxy.civs.push( civ ) ;
	
	let bp = new ShipBlueprint();
	bp.name = 'Giant Space Amoeba';
	bp.hull = 800;
	bp.armor = 0;
	bp.speed = 80;
	bp.img = 'img/ships/monsters/space_amoeba_yellow.png';
	bp.AddWeapon('AMOEBASLIME3',12);
	civ.ship_blueprints.push(bp);
	
	// giant amoebas start in space and fly in
	let star = app.game.galaxy.stars.pickRandom();
	let fleet = new Fleet( civ, null );
	fleet.xpos = star.xpos + 500;
	fleet.ypos = star.ypos + 500;
	fleet.AddShip( bp.Make() );	
	fleet.SetDest( star );
	civ.fleets.push(fleet);
	
	civ.ai = new AI.AI(civ);
	civ.ai.objectives.push( new AI.AIGiantAmoebaObjective() );
	}
	
	
export function AddRedSpaceAmoeba( app ) { 
	let civ = new Civ();
	civ.race.is_monster = true;
	civ.diplo.contactable = false;
	civ.name = 'Red Space Amoebas';
	civ.diplo_img = 'img/races/space_amoeba_red.jpg';
	civ.diplo_img_small = 'img/races/space_amoeba_red.jpg';
	civ.color_rgb = [230,40,10];
	civ.color = '#' + utils.DecToHex(civ.color_rgb[0]) + utils.DecToHex(civ.color_rgb[1]) + utils.DecToHex(civ.color_rgb[2]);
	app.game.galaxy.civs.push( civ ) ;
	
	// red amoebas start with a male and female 
	// in different regions of the galaxy. They 
	// wonder aimlessly attacking anything found,
	// including other amoebas. If the male ever
	// finds the female, all hell breaks loose.
	
	// adult male
	let bpam = new ShipBlueprint();
	bpam.name = 'Adult Red Space Amoeba (M)';
	bpam.hull = 600;
	bpam.speed = 400;
	bpam.sex = 'M';
	bpam.adult = true;
	bpam.img = 'img/ships/monsters/space_amoeba_red.png';
	bpam.AddWeapon('AMOEBASLIME2',12);  
	civ.ship_blueprints.push(bpam);

	// one adult male for every 25 stars
	for ( let n=0; n < Math.ceil( app.game.galaxy.stars.length / 25 ); n++ ) { 
		let star = app.game.galaxy.stars.pickRandom();
		let fleet = new Fleet( civ, star );
		fleet.AddShip( bpam.Make() );	
		civ.fleets.push(fleet);
		}
		
	// adult female
	let bpaf = new ShipBlueprint();
	bpaf.name = 'Adult Red Space Amoeba (F)';
	bpaf.hull = 900;
	bpaf.speed = 300;
	bpaf.sex = 'F';
	bpaf.adult = true;
	bpaf.img = 'img/ships/monsters/space_amoeba_red.png';
	bpaf.AddWeapon('AMOEBASLIME2',12);   
	bpaf.AddWeapon('AMOEBASLIME3',4);   
	civ.ship_blueprints.push(bpaf);
	
	let star = app.game.galaxy.stars.pickRandom();
	let fleet = new Fleet( civ, star );
	fleet.AddShip( bpaf.Make() );	
	civ.fleets.push(fleet);

	// baby male
	let bpbm = new ShipBlueprint();
	bpbm.name = 'Baby Red Space Amoeba (M)';
	bpbm.hull = 35;
	bpbm.speed = 100;
	bpbm.sex = 'M';
	bpbm.adult = false;
	bpbm.img = 'img/ships/monsters/space_amoeba_red.png';
	bpbm.AddWeapon('AMOEBASLIME1',2);   
	civ.ship_blueprints.push(bpbm);
	
	// baby female
	let bpbf = new ShipBlueprint();
	bpbf.name = 'Baby Red Space Amoeba (F)';
	bpbf.hull = 45;
	bpbf.speed = 100;
	bpbf.sex = 'F';
	bpbf.adult = false;
	bpbf.img = 'img/ships/monsters/space_amoeba_red.png';
	bpbf.AddWeapon('AMOEBASLIME1',4);   
	civ.ship_blueprints.push(bpbf);

	civ.ai = new AI.AI(civ);
	civ.ai.objectives.push( new AI.AIRedAmoebaObjective() );
	}
