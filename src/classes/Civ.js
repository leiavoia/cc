// import Star from './Star';
import RandomName from '../util/RandomName';
import * as utils from '../util/utils';
import Constellation from './Constellation';
import Planet from './Planet';



export default class Civ {
	
	id = false;
	
	name = 'RACE';
	name_plural = 'RACITES';
	
	// we'll flesh this out later
	race = {
		env: { // natural habitat
			atm: 2,
			temp: 2,
			grav: 2,
			adaptation: 1, // levels to shift the habitability scale
			habitation: 2 // maximum bad planet we can settle
			},
		size: 1.0, // literal size of pop units
		
		};
	
	flag_img = 'img/workshop/flag_mock.gif';
	diplo_img = 'img/races/diplo_race_000.jpg';
	diplo_img_small = 'img/races/diplo_race_000s.jpg';
	color = '#FFFFFF';
	color_rgb = [255,255,255];
	
	gov_type = 'feudal';
	research = 0; // to split into cats later
	treasury = 10000;
	
	ships = [];
	ship_designs;
	
	spy = []; // how to structure???
	econ = {
		income: 0,
		warehouse : 0,
		mp_need: 0,
		mp_need_met: 0 // 0..1
		}; // how to structure???
	policies = []; // how to structure???
	
	planets = [];
	constels = []; // list of connected constellations
	
	diplo = []; // list of contacts. starts empty
	
	// well-chosen colors for other races:
	static StandardColors() {
		if ( !Civ.colors ) { 
			Civ.colors = [
				[128, 0, 0], 		// maroon
				[20, 20, 235], 	// blue
				[219, 210, 72], 	// yellow
				[10, 128, 30], 	// green
				[15, 155, 155],	// teal
				[192, 192, 192], 	// silver
				[255, 0, 0], 		// red
				[0, 255, 0], 		// lime
				[100, 100, 100], 	// grey
				[128, 128, 0], 	// olive
				[30, 30, 170], 	// navy
				[255, 0, 255],		// fuschia
				[128, 0, 128],		// purple
				[0, 255, 255]		// aqua
				];
			Civ.colors.shuffle();
			} 
		return Civ.colors;
		}
	static PickNextStandardColor() {
		return Civ.StandardColors()[ Civ.total_civs ];
		}
	static IncTotalNumCivs() {
		if( !this.total_civs && this.total_civs!==0 ){
			this.total_civs=0;
			}
		else{
			this.total_civs++;
			}
		}




	constructor( name ) { 
		this.name = ( name || RandomName() ).uppercaseFirst();
		this.name_plural = name + 's';
		Civ.IncTotalNumCivs();
		this.id = Civ.total_civs;
		}
	
	static Random( difficulty = 0.5 ) {
		let civ = new Civ;
// 		this.color_rgb = [ utils.RandomInt(0,255), utils.RandomInt(0,255), utils.RandomInt(0,255), ];
		civ.color_rgb = Civ.PickNextStandardColor();
// 		console.log( 'my colors are: ' + civ.color_rgb[0] + ' ' + civ.color_rgb[1] + ' ' + civ.color_rgb[2]  );
		return civ;
		}
		
	}
