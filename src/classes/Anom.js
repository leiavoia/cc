// import Civ from './Civ';
import * as utils from '../util/utils';
// import * as Signals from '../util/signals';


export default class Anom {
	
	objtype = 'anom';
	id = 0;
	name = 'Anomaly';
	type = 'normal';
	xpos = 0;
	ypos = 0;
	fleets = [];
	settled = false; // set to true to tell the UI to do special stuff
	explored = false; // set to true to tell the UI to do special stuff
	in_range = false; // set to true to tell the UI to do special stuff
	order = 0; // for exploration
	onmap = false;
	vis_level = 0;
	size = 100; // measure of how much it takes to research this anom
	collected = false; // NULL = not collectable, FALSE = not collected, TRUE = collected
	researched = new Map();
	// TODO: 'nature'. May need UI hint to indicate the general nature of the anomoly: good, bad, neutral.
	
	// pre-discovery description. A hint of what lurks inside
	pre_desc = 'A strange anomaly.';
	// post discovery summary / backstory / color commentary
	post_desc = `We checked it out and it was just the neighbor's cat.`;
	
	// a callback you can override
	onComplete( fleet ) { 
		
		}
		
	AmountResearched( civ ) {
		return this.researched.get( civ ) || 0;
		}
	ResearchIsCompleted( civ ) {
		return this.researched.get( civ ) >= this.size;
		}
	AddResearch( civ, amount ) {
		let a = this.researched.get( civ ) || 0;
		if ( a < this.size ) { 
			this.researched.set( civ, Math.min( this.size, a + amount ) );
			let finished = ( a + amount ) >= this.size;
			if ( finished && this.collected === false ) { this.collected = true; }
			return finished;
			}
		else {
			return true;
			}
		}
		
	static IncNextID() {
		if( !this.next_id && this.next_id!==0 ){
			this.next_id=1;
			}
		else{
			this.next_id++;
			}
		return this.next_id;
		}
		
	constructor( type, xpos, ypos ) { 
		this.type = type;
		this.xpos = xpos;
		this.ypos = ypos;	
		this.id = Anom.IncNextID();
		this.name = 'Anomaly ' + this.id; //( name || /*utils.RandomName()*/'X' ).uppercaseFirst();
// 		this.name = 'Abandoned Cargo';
		this.collected = false; // collectable
		}
		
	static CreateFrom( anomdata, x, y ) { 
		let a = new Anom( 'normal', x, y );
		Object.assign( a, anomdata );
		a.onmap = true;
		a.collected = false;
		a.vis_level = 0; // 0..2
		a.size = 1;
		a.order = utils.RandomInt( 0, 100 );
		return a;
		}
		
	static Random( x, y ) {
		let list_i = utils.RandomInt( 0, anom_list.length-1 );
		let a = new Anom( 'normal', x, y );
		Object.assign( a, anom_list[list_i] );
// 		a.onComplete = a.onComplete.bind(a);
		a.onmap = !( Math.random() > 0.5 ); // 50% chance of being a map object
		a.collected = a.onmap ? null : false; // on-map anoms cant be collectable
		a.vis_level = 0;//utils.RandomInt(0,2);
		a.size = utils.RandomInt( 3, 80) * 10 * ( (a.vis_level+1) * 2 );
		a.order = utils.RandomInt( 0, 100 );
		return a;
		}
	}

let anom_list = [
	{
		pre_desc: 'Small object or gravitational disturbance detected.',
		post_desc: 'In the vacuum of space we found a stream of valuable cargo apparently jetisoned from a convoy. Who were the owners? Smugglers? Thieves? Regardless, we recovered the cargo and sold it off for {AMOUNT} credits.',		
		onComplete: function (fleet) { 
			this.name = 'Abandoned Cargo';
			let amount = Math.ceil( Math.random() * 500 ) * 10; 
			fleet.owner.resources.cash += amount;
			this.post_desc = this.post_desc.replace('{AMOUNT}',amount);
			}
		},
	{
		pre_desc: 'Small object or gravitational disturbance detected.',
		post_desc: 'We found a small intersteller asteroid comprised mainly of precious metals. It was sold for {AMOUNT} credits.',		
		onComplete: function (fleet) { 
			this.name = 'Bonanza Asteroid';
			let amount = Math.ceil( Math.random() * 500 ) * 10; 
			fleet.owner.resources.cash += amount;
			this.post_desc = this.post_desc.replace('{AMOUNT}',amount);
			}
		},
	{
		pre_desc: 'Small object or gravitational disturbance detected.',
		post_desc: 'Research teams happened upon what appears to be the wreckage of a failed "orgship". It seems to have suffered an accident and was found drifting eternally end over end. Studying the wreckage may give us some insights into its makers.',		
		onComplete: function (fleet) { 
			//  TODO ????
			this.name = 'Mysterious Wreckage';
			}
		},
	{
		pre_desc: 'Abnormal energy signatures detected.',
		post_desc: 'We discovered a small deep space proto-star. It hasn\'t started solar fusion, so it makes a great resource for fuel. Our range has increased by {AMOUNT}.',		
		onComplete: function (fleet) {
			this.name = 'Fuel Deposit';
			let amount = Math.random() > 0.5 ? 50 : 100;
			fleet.owner.ship_range += amount;
			this.post_desc = this.post_desc.replace('{AMOUNT}',amount);
			}
		},
	{
		pre_desc: 'Abnormal energy signatures detected.',
		post_desc: 'Drifting though space at sub-light speeds, research teams intercepted an uncrewed alien probe. More research is needed to uncover its origins.',		
		onComplete: function (fleet) {
			this.name = 'Probe';
			}
		},
	{
		pre_desc: 'Abnormal energy signatures detected.',
		post_desc: 'This region of space exhibits unusual hyperspace geometry. It should give us a kind of 4-dimensional "shortcut". Our ship speed has increased by {AMOUNT}.',		
		onComplete: function (fleet) {
			this.name = 'Hyperspace Wrinkle';
			let amount = Math.random() > 0.5 ? 50 : 100;
			fleet.owner.ship_speed += amount;
			this.post_desc = this.post_desc.replace('{AMOUNT}',amount);
			}
		},
	{
		pre_desc: 'Small object or gravitational disturbance detected.',
		post_desc: 'Drifting in deep space, we discovered an abandoned spacecraft of unknown origin. The reseach team will tow it back for follow up examination and retrofitting for use in our fleet.',		
		onComplete: function (fleet) {
			this.name = 'Lost Spacecraft';
			let bp = new ShipBlueprint();
			bp.name = 'Lost Fighter';
			bp.img = 'img/ships/ship005_mock.png';
			bp.AddWeapon('RAYGUN',5);
			bp.AddWeapon('LASER',3);
			bp.AddWeapon('MISSILE',5);      
			bp.hull = 400;
			bp.armor = 100;
			bp.speed = 200;
			fleet.AddShip( new Ship(bp) );
			}
		}
	];
