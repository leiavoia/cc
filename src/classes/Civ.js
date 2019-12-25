 import Fleet from './Fleet';
// import Star from './Star';
import RandomName from '../util/RandomName';
import * as utils from '../util/utils';
import * as Tech from './Tech';
import Planet from './Planet';
import TradeOffer from './TradeOffer';
import {Ship,ShipBlueprint} from './Ship';
import {GroundUnit,GroundUnitBlueprint} from './GroundUnit';
import {WeaponList} from './WeaponList';
import {ZoneList} from './Zones';
import {VictoryIngredients} from './VictoryRecipes';
import {ShipComponentList} from './ShipComponentList';
import {Mod,Modlist} from './Mods';
import {Treaties,Treaty} from './Treaties';
import * as AI from './AI';
import {App} from '../app';

export default class Civ {
	
	id = false;
	
	name = 'RACE';
	leader_name = 'Dear Leader';
	
	is_player = false; // set to true to indicate who the human is
	alive = true; // dead indicates civ is out of play
	
	// we'll flesh this out later
	race = {
		env: { // natural habitat
			atm: 2,
			temp: 2,
			grav: 2,
			adaptation: 1, // levels to shift the habitability scale
			},
		is_monster: false, // true for space monsters. changes some UI formating.
		};
	
	// AI stuff
	ai = null; // AI object
		
	power_score = 1;
	
	homeworld = null; // a Planet // TODO // necessary?
	victory_ingredients = []; // list of VictoryIngredient objects
	
	ship_range = 750; // px - upgrades with technology
	max_ship_speed = 200; // for AI - upgrades with technology
	ship_blueprints = [];
	groundunit_blueprints = [];
	max_hull_size = 50; 
	avail_ship_comps = []; // components we can equip on ships
	avail_ship_weapons = []; // weapons we can equip on ships
	avail_zones = [];
	
	vis_level = 0; // HACK : 0 = space, 1 = hyperspace, 2 = subspace
	empire_box = {x1:0,x2:0,y1:0,y2:0};
	
	flag_img = 'img/workshop/flag_mock.gif';
	diplo_img = 'img/races/alien_000.jpg';
	diplo_img_small = 'img/races/alien_000.jpg';
	color = '#FFFFFF';
	color_rgb = [255,255,255];
	
	stat_history = []; // recording enabled by app.options.graph_history
	
	// diplomatic communication with other races is measured
	// by comparing their overlapping line segments composed 
	// of diplo.style +/- diplo.skill
	// US:   |----------------====#====-------|
	// THEM: |---------======#======----------|
	// the general spread of race types over diplo.style is (0..1) :
	// rocks - plants - organic - cyborgs - robots - energy - trandimensional
	diplo = {
		contacts: new Map(), // civ => { lovenub, attspan, treaties, etc. }
		contactable: true,
		style: 0.5, // 0..1, what kind of communication type this race uses 
		skill: 0.25, // 0..1, the range of communication skills this race has.
		dispo: 0.5, // 0..1, lovenub starting disposition when we meet other races.
		offer_ok_at: 0, // anything over is a good deal
		offer_counter_at: -0.5, // anything beteen this and `ok` gets an automatic counter-offer 
		offer_bad_at: -1.0, // anything between this and `counter` gets refused
		// anything less than `bad` get refused and treated as an insult
		attspan_recharge: 0.05, // how much their attention space recharges each turn
		attspan_max: 0.8, // maximum attention span
		emotion: 1.0, // how much to multiply diplomatic effects		
		};
		
	// bumping the lovenub of this civ will actually bump both nubs in sync.
	// The `emotion` stat will be whichever is greater of the two civs.
	BumpLoveNub( civ, amount /* 0..1 */ ) {
		let acct = this.diplo.contacts.get(civ);
		if ( acct ) { 
			let emotion = civ.diplo.emotion;
			if ( !this.is_player ) { emotion = Math.max(emotion, this.diplo.emotion); }
			acct.lovenub = utils.Clamp( acct.lovenub + amount * emotion, 0, 1 );
			let them = civ.diplo.contacts.get(this);
			if ( them ) { 
				them.lovenub = utils.Clamp( them.lovenub + amount * emotion, 0, 1 );
				}
			}
		}
		
	CommOverlapWith( civ ) { 
		if ( !this.diplo.contactable || !civ.diplo.contactable ) { return 0; }
		let min1 = utils.Clamp( this.diplo.style - this.diplo.skill, 0, 1 );
		let max1 = utils.Clamp( this.diplo.style + this.diplo.skill, 0, 1 );
		let range1 = max1 - min1;
		let min2 = utils.Clamp( civ.diplo.style - civ.diplo.skill, 0, 1 );
		let max2 = utils.Clamp( civ.diplo.style + civ.diplo.skill, 0, 1 );
		let range2 = max2 - min2;
		let overlap = Math.max(0, Math.min(max1, max2) - Math.max(min1, min2));
		let ratio1 = range1 ? ( overlap / range1 ) : 0;
		let ratio2 = range2 ? ( overlap / range2 ) : 0;
		return Math.max(ratio1,ratio2); // return the greater of the ratios of overlap
		}
		
	LoveNub( civ ) {
		return this.diplo.contacts.has(civ) ? this.diplo.contacts.get(civ).lovenub : 0;
		}
		
	InRangeOfCiv( civ ) {
		return this.diplo.contacts.has(civ) && this.diplo.contacts.get(civ).in_range;
		}
	
	SetInRangeOfCiv( civ, in_range = false ) {
		if ( in_range ) { 
			this.InitDiplomacyWith( civ );
			civ.InitDiplomacyWith( this );
			}
		else { // don't delete entry and reset relationship, just set in_range = false
			if ( this.diplo.contacts.has(civ) ) { 
				this.diplo.contacts.get(civ).in_range = false;
				}
			if ( civ.diplo.contacts.has(this) ) { 
				civ.diplo.contacts.get(this).in_range = false;
				}
			}
		}
	
	// AKA "AddContact"
	InitDiplomacyWith( civ ) {
		if ( !this.diplo.contacts.has(civ) ) {
			// for two AIs, go with however is grumpier. For player, go with AI.
			let lovenub = this.is_player ? civ.diplo.dispo :  Math.min( this.diplo.dispo, civ.diplo.dispo );
			this.diplo.contacts.set( civ, { 
				lovenub: lovenub,
				attspan: ( this.is_player ? 1.0 : this.diplo.attspan_max ),
				in_range: true,
				comm: this.CommOverlapWith( civ ), // when technology changes, you need to update this!
				treaties: new Map()
				});
			}
		}
		
	RecalcEmpireBox() { 
		this.empire_box = {x1:100000,x2:-100000,y1:100000,y2:-100000};
		this.planets.forEach( (v, k, array) => {
			this.empire_box.x1 = Math.min( this.empire_box.x1, v.star.xpos - this.ship_range );
			this.empire_box.y1 = Math.min( this.empire_box.y1, v.star.ypos - this.ship_range );
			this.empire_box.x2 = Math.max( this.empire_box.x2, v.star.xpos + this.ship_range );
			this.empire_box.y2 = Math.max( this.empire_box.y2, v.star.ypos + this.ship_range );
			});
		}
		
	// returns boolean
	InRangeOf( x, y ) {
		// easy box test
		if ( !utils.BoxPointIntersect( this.empire_box, x, y ) ) { 
			return false; 
			}
		let range = this.ship_range * this.ship_range ; // NOTE: avoid square rooting.
		for ( let p of this.planets ) { 
			let dist = 
				Math.pow( Math.abs(p.star.xpos - x), 2 )
				+ Math.pow( Math.abs(p.star.ypos - y), 2 );
			if ( dist <= range ) {
				return true;
				}
			}
		return false;
		}
		
	research = 0; // all-time total
	research_income = 0; // calculated per turn
	
	tech = {
		techs: [], // links to items in the master Techs list
		avail: [], // { node: <TechNode>, rp: <research point committed> }
		avail_keys: {}, /// TechNode.key => bool
		compl: [], // { node: <TechNode>, rp: <research point committed>, source: <civ_id or null> }
		compl_keys: {}, /// TechNode.key => bool
		Current() { return this.avail.length ? this.avail[0] : null; }
		};
		
	// set the civ up with starting technology roster
	InitResearch() { 
		for ( let key in Tech.TechNodes ) { 
			if ( !Tech.TechNodes[key].requires.length && !Tech.TechNodes[key].rp ) { 
				this.CompleteTechNode( { node:Tech.TechNodes[key], rp:0, source:null}, null, false );
				}
			}
		this.RecalcAvailableTechNodes();
		}
		
	RecalcAvailableTechNodes() {
		nodescannerloop:
		for ( let key in Tech.TechNodes ) { 
			// if it isn't in either of our lists ...
			if ( !this.tech.avail_keys[key] && !this.tech.compl_keys[key] ) { 
				// check the prerequisites against our completed nodes
				let t = Tech.TechNodes[key];
				if ( t.requires && t.requires.length ) { 
					for ( let req of t.requires ) { 
						if ( !this.tech.compl_keys[req] ) { 
							continue nodescannerloop;
							}
						}
					}
				// all prerequisites met. add the node to available list
				this.tech.avail.push( { node: t, rp: 0 } );
				this.tech.avail_keys[key] = true;
				}
			}
		// sort project list
		if ( !this.is_player || ( App.instance.options.soak && App.instance.options.ai ) ) {
			// TODO: sort according to AI preference
			let SortFunc = (a,b) => a.node.rp - b.node.rp;
			this.tech.avail.sort(SortFunc);
			}
		}
		
	DoResearch( app ) { 
		let income = this.research_income;
		this.research = this.research_income; // add to total for record keeping
		let sanity_counter = 0;
		while ( income > 0.001 && this.tech.avail.length && ++sanity_counter < 5 ) { 
			let rp_applied = Math.min( income, this.tech.avail[0].node.rp - this.tech.avail[0].rp );
			income -= rp_applied;
			this.tech.avail[0].rp += rp_applied;
			// project completed?
			if ( this.tech.avail[0].rp >= this.tech.avail[0].node.rp ) { 					
				// wrap it up
				let cp = this.tech.avail[0];
				this.CompleteTechNode( cp );
				// share this tech with our alliance members
				for ( let [civ,acct] of this.diplo.contacts ) { 
					if ( acct.treaties.has('TECH_ALLIANCE') ) { 
						civ.CompleteTechNode( cp, this, true );
						}
					}
				}
			}
		}
		
	CompleteTechNode( tech /* entire data structure from tech.avail */, source_civ = null, notify_player = true ) {
		// make note of source to handle tech-brokering agreements
		tech.source = source_civ;
		// dispurse any techs
		if ( tech.node.yields.length ) { 
			for ( let t of tech.node.yields ) { 
				this.tech.techs.push(Tech.Techs[t]);
				Tech.Techs[t].onComplete( this ); // run callback
				}
			}
		// move node into the completed pile
		this.tech.compl.push( tech );
		this.tech.compl_keys[tech.node.key] = true;
		// remove from available pile
		let i = this.tech.avail.findIndex( t => t.node.key == tech.node.key );
		if ( i > -1 ) { 
			this.tech.avail.splice( i, 1 );
			delete( this.tech.avail_keys[tech.node.key] );
			}
		this.RecalcAvailableTechNodes();
		// note to player
		if ( notify_player && App.instance.game.myciv == this && App.instance.options.notify.research ) { 
			App.instance.AddNote(
				'good',
				`${tech.node.name} completed.`,
				`Research on "${tech.node.name}" has been completed`,
				function(){App.instance.SwitchMainPanel('tech');}
				);
			}			
		}
		
	gov_type = 'feudal';
	
	// our current stock of goodies, including cash
	resources = {
		$:10000,
		o:200, // organics
		s:200, // silicates
		m:200, // metals
		r:0, // redium
		g:0, // verdagen
		b:0, // bluetonium
		c:0, // cyanite
		v:0, // violetronium
		y:0, // yellowtron	
		}
	
	// supply/demand ratio per resource type. <1.0 indicates shortfall
	resource_supply = { $:1, o:1, s:1, m:1, r:1, g:1, b:1, c:1, v:1, y:1 };
	
	// resources that were actually consumed last turn
	resource_spent = { $:0, o:0, s:0, m:0, r:0, g:0, b:0, c:0, v:0, y:0 };
	
	// resources that were actually produced last turn
	resource_income = { $:0, o:0, s:0, m:0, r:0, g:0, b:0, c:0, v:0, y:0 };
	
	// the sum of all resources being demanded from all sources
	resource_estm = { $:0, o:0, s:0, m:0, r:0, g:0, b:0, c:0, v:0, y:0 };
	
	ResourceLabel( resource ) { 
		const resources = {
			$:'Cash',
			o:'Organics',
			s:'Silicates',
			m:'Metals',
			r:'Redium',
			g:'Verdagen',
			b:'Bluetonium',
			c:'Cyanite',
			v:'Violetronium',
			y:'Yellowtron'
			};
		return (resource in resources) ? resources[resource] : 'unknown';
		}
	
	EstimateResources() {
		for ( let k in this.resource_estm ) { this.resource_estm[k] = 0; }
		for ( let p of this.planets ) {
			let ship_labor = 0;
			let def_labor = 0;
			// estimate resources consumed by zone activity
			for ( let z of p.zones ) { 
				let estm = z.EstimateResources(p);
				for ( let k of Object.keys(estm) ) { 
					this.resource_estm[k] += estm[k]; 
					}
				ship_labor += (z.outputs.ship || 0) * z.size * z.val;
				def_labor = (z.outputs.def || 0) * z.size * z.val;
				}
			// estimate resources consumed by ship and def production assuming
			// that zones are 100% funded.
			let ship_est = p.EstimateProduction('ship', ship_labor);
			let def_est = p.EstimateProduction('def', def_labor);
			for ( let e of [ship_est,def_est] ) {
				for ( let k of Object.keys(e) ) { 
					this.resource_estm[k] += e[k]; 
					}
				}
			}
		// factor in non-zone sources of resource income (particularly cash).
		// WARNING: because of taxes, this can go negative.
		this.resource_estm.$ -= this.econ.income || 0; // tax income
		this.resource_estm.$ += this.econ.ship_maint || 0;
		this.resource_estm.$ += this.econ.troop_maint || 0;
		// calc supply vs demand
		for ( let k in this.resource_supply ) { 
			this.resource_supply[k] = 
				( this.resource_estm[k] && this.resources[k] )
				? Math.max( 0, this.resources[k] / ( this.resource_estm[k] > 0 ? this.resource_estm[k] : 1 ) ) 
				: 1.0; 
			}
		}
		
	econ = {
		income: 0, // tax rev
		ship_maint: 0,
		troop_maint: 0,
		planet_maint: 0,
		cat_spending: {},
		subcat_spending: {}
		}; // how to structure???
	policies = []; // how to structure???
	
	planets = [];
	fleets = [];
	
	// well-chosen colors for other races:
	static StandardColors() {
		if ( !Civ.colors ) { 
			Civ.next_standard_color_index = -1;
			Civ.colors = [
				[128, 0, 0], 		// maroon
				[45, 130, 220], 	// blue
				[219, 210, 72], 	// yellow
				[10, 128, 30], 		// forest green
				[15, 120, 155],		// teal
				[192, 192, 192], 	// silver
				[255, 0, 0], 		// red
				[0, 220, 0], 		// green
				[100, 100, 100], 	// grey
				[128, 128, 0], 		// olive
				[20, 66, 170], 		// navy
				[255, 0, 255],		// fuschia
				[128, 0, 128],		// purple
				[0, 255, 255],		// aqua
				[140,205,140],		// spring green
				[195,144,212],		// lavender
				[212,161,144],		// mid brown
				[120,80,24],		// dark brown
				[222,195,144],		// tan
				[190,102,40],		// dull orange
				[255,149,0],		// orange 
				[162,255,31],		// chartreuse
				[230,119,119],		// salmon
				[255,186,206]		// pink
				];
			Civ.colors.shuffle();
			// random colors to finish off the set
			for ( let n = 0; n < 124; ) {
				let c = [ 
					utils.RandomInt(0,255),
					utils.RandomInt(0,255),
					utils.RandomInt(0,255),
					];
				if ( c[0] + c[1] + c[2] > 200 ) { 
					Civ.colors.push(c); 
					n++;
					}
				}
			} 
		return Civ.colors;
		}
		
	static PickNextStandardColor() {
		let colors = Civ.StandardColors();
		if ( ++Civ.next_standard_color_index >= colors.length ) {
			Civ.next_standard_color_index = 0;
			}
 		return colors[ Civ.total_civs ];
		}
		
	static IncTotalNumCivs( reset=false ) {
		if( !this.total_civs && this.total_civs!==0 ){
			this.total_civs=0;
			}
		else{
			this.total_civs++;
			}
		}

	constructor( name ) {
		// 'fromJSON' data bundle in first arg
		if ( name && typeof(name)==='object' && 'name' in name ) { 
			Object.assign( this, name );
			}
		// regular constructor
		else {
			this.name = ( name || RandomName() ).uppercaseFirst();
			Civ.IncTotalNumCivs();
			this.id = utils.UUID();
			// internal flag roster picks unique flags for each race
			if ( !Civ.flag_id_roster ) { 
				Civ.flag_id_roster = [];
				for ( let i=0; i<=30; i++ ) { Civ.flag_id_roster.push(i); }
				Civ.flag_id_roster.shuffle();
				Civ.img_id_roster = [];
				for ( let i=0; i<=454 ; i++ ) { Civ.img_id_roster.push(i); }
				Civ.img_id_roster.shuffle();
				}
			this.flag_img = 'img/flags/flag_' + ("000" + Civ.flag_id_roster[Civ.total_civs]).slice(-3) + '.png';
			this.diplo_img = 'img/races/alien_' + ("000" + Civ.img_id_roster[Civ.total_civs]).slice(-3) + '.jpg';
			this.diplo_img_small = 'img/races/alien_' + ("000" + Civ.img_id_roster[Civ.total_civs]).slice(-3) + '.jpg';
			// TODO: the race can also have a modlist when Races Picks are implemented
			this.mods = new Modlist( /*this.race*/ );
			this.ai = new AI.CivAI(this);
			}
		}
	
	toJSON() { 
		let obj = Object.assign( {}, this ); 
		obj._classname = 'Civ';
		obj.homeworld = this.homeworld ? this.homeworld.id : null;
		obj.mods = this.mods.toJSON();
		obj.planets = this.planets.map( x => x.id );
		obj.fleets = this.fleets.filter( x => !x.killme ).map( x => x.id );
		obj.ship_blueprints = this.ship_blueprints.map( x => x.id );
		obj.groundunit_blueprints = this.groundunit_blueprints.map( x => x.id );
		obj.avail_ship_comps = this.avail_ship_comps.map( x => x.tag );
		obj.avail_ship_weapons = this.avail_ship_weapons.map( x => x.tag );
		obj.avail_zones = this.avail_zones.map( x => x.key );
		obj.victory_ingredients = this.victory_ingredients.map( x => x.key );
		obj.diplo = Object.assign( {}, this.diplo ); // dont overwrite original object
		obj.diplo.contacts = {}; 
		for ( let [k,v] of this.diplo.contacts ) {
			if ( !k.alive ) { continue; }
			let contact = Object.assign( {}, v ); 
			contact.treaties = [];
			for ( let [tk,tv] of v.treaties ) { 
				contact.treaties.push( { type: tk, ttl: tv.ttl, turn_num: tv.turn_num, created_on: tv.created_on } );
				}
			obj.diplo.contacts[ k.id ] = contact;
			}
		obj.tech = Object.assign( {}, this.tech ); // dont overwrite original object
		obj.tech.techs = this.tech.techs.map( t => t.key );	
		obj.tech.avail = this.tech.avail.map( t => ({key:t.key, rp:t.rp}) );
		obj.tech.compl = this.tech.compl.map( t => ({key:t.key, rp:t.rp, source:(t.source ? t.source.id : null)}) );
		obj.ai = this.ai.toJSON();
		// optionally remove stat history to save space
		if ( !App.instance.options.graph_history ) { 
			delete(obj.stat_history);
			}
		return obj;
		}
		
	Pack( catalog ) {
		if ( !( this.id in catalog ) ) { 
			catalog[ this.id ] = this.toJSON(); 
			for ( let x of this.ship_blueprints ) { x.Pack(catalog); }
			for ( let x of this.groundunit_blueprints ) { x.Pack(catalog); }
			for ( let x of this.fleets ) { x.Pack(catalog); }
			// dont need to pack planets - handled by Galaxy
			}
		}	

	Unpack( catalog ) {
		this.homeworld = this.homeworld ? catalog[this.homeworld] : null;
		this.ship_blueprints = this.ship_blueprints.map( x => catalog[x] );
		this.groundunit_blueprints = this.groundunit_blueprints.map( x => catalog[x] );
		this.planets = this.planets.map( x => catalog[x] );
		this.fleets = this.fleets.map( x => catalog[x] );
		this.avail_ship_comps = this.avail_ship_comps.map( x => ShipComponentList[x] );
		this.avail_ship_weapons = this.avail_ship_weapons.map( x => WeaponList[x] );
		this.avail_zones = this.avail_zones.map( x => ZoneList[x] );
		this.victory_ingredients = this.victory_ingredients.map( x => VictoryIngredients[x] );
		this.mods = new Modlist(this.mods);
		this.mods.Unpack( catalog ); 
		this.ai = this.ai._classname=='CivAI' 
			? ( new AI.CivAI(this.ai) ) // playable civs use CivAI
			: ( new AI.AI(this.ai) ); // space monsters and shill civs use regular AI 
		this.ai.Unpack( catalog );
		// diplomacy
		let contacts = new Map();
		for ( let k in this.diplo.contacts ) { 
			if ( !(k in catalog) ) { continue; }
			let treaties = this.diplo.contacts[k].treaties;
			this.diplo.contacts[k].treaties = new Map();
			for ( let t of treaties ) { 
				const t1 = Treaty( t.type, this, catalog[k], t.turn_num, t.ttl );
				t1.created_on = t.created_on;
				this.diplo.contacts[k].treaties.set( t.type, t1 );
				}
			contacts.set( catalog[k], this.diplo.contacts[k] );
			}		
		this.diplo.contacts = contacts;
		// techs
		this.tech.techs = this.tech.techs.map( t => Tech.Techs[t.key] );
		this.tech.avail = this.tech.avail.map( t => ({ node: Tech.TechNodes[t.key], rp:t.rp }) );
		this.tech.compl = this.tech.compl.map( t => ({ node: Tech.TechNodes[t.key], rp:t.rp, source:(t.source?catalog[t.source]:null) }) );
		}
						
	static Random( difficulty = 0.5 ) {
		let civ = new Civ;
		civ.color_rgb = Civ.PickNextStandardColor();
		civ.color = '#' + utils.DecToHex(civ.color_rgb[0]) + utils.DecToHex(civ.color_rgb[1]) + utils.DecToHex(civ.color_rgb[2]);
		civ.race.env.atm = utils.BiasedRandInt(0, 4, 2, 0.5);
		civ.race.env.temp = utils.BiasedRandInt(0, 4, 2, 0.5);
		civ.race.env.grav = utils.BiasedRandInt(0, 4, 2, 0.5);
		// diplomatic personality
		civ.diplo.style = Math.random();
		civ.diplo.skill = utils.BiasedRand(0.05, 0.25, 0.10, 0.5);
		civ.diplo.dispo = utils.BiasedRand(0.2, 0.8, 0.5, 0.75);
		civ.diplo.emotion = utils.BiasedRand(0.25, 2.0, 1.0, 0.9);
		civ.diplo.attspan_recharge = utils.BiasedRand(0.005, 0.1, 0.035, 0.5);
		civ.diplo.attspan_max = utils.BiasedRandInt(2, 10, 6, 0.5) / 10;
		civ.diplo.offer_ok_at = (0.3 * Math.random() - 0.11); // anything over this is a good deal
		civ.diplo.offer_counter_at = ( ( civ.diplo.offer_ok_at - 0.3 ) + ( Math.random() * 0.2 ) ); // anything beteen this and `ok` gets an automatic counter-offer 
		civ.diplo.offer_bad_at = ( ( civ.diplo.offer_counter_at - 0.3 ) + ( Math.random() * 0.2 ) ); // anything between this and `counter` gets refused
		// anything below offer_bad_at is an insult
		// AI combat strategy traits
		civ.ai.strat.def = ['balanced', 'triage'/*, 'equal', null*/][ utils.RandomInt(0,1) ];
		civ.ai.strat.def_threat_weight = Math.random();
		civ.ai.strat.def_planetvalue_weight = 1 - civ.ai.strat.def_threat_weight;
		civ.ai.strat.offense_ratio = Math.random();
		civ.ai.strat.risk = Math.random();
		civ.ai.strat.posture = Math.random();
		// how AI weights various levels of zoning needs
		civ.ai.strat.zoning_weights = {
			local: utils.BiasedRandInt(1, 5, 4, 0.2),
			global: utils.BiasedRandInt(1, 5, 3, 0.2),
			ai: utils.BiasedRandInt(1, 5, 3, 0.2)
			};
		let zoning_weight_total = 0;
		for ( let k in civ.ai.strat.zoning_weights ) { zoning_weight_total += civ.ai.strat.zoning_weights[k]; }
		for ( let k in civ.ai.strat.zoning_weights ) { civ.ai.strat.zoning_weights[k] /= zoning_weight_total; }
		// ideal zoning preference ("play style")
		civ.ai.strat.ideal_zoning = {
			housing: utils.BiasedRandInt(6, 12, 5, 0.5),
			mining: utils.BiasedRandInt(5, 12, 5, 0.5),
			stardock: utils.BiasedRandInt(5, 12, 5, 0.5),
			economy: utils.BiasedRandInt(3, 9, 5, 0.5),
			research: utils.BiasedRandInt(6, 12, 5, 0.5),			
			military: utils.BiasedRandInt(6, 12, 5, 0.5),			
			}
		let ideal_zone_total = 0;
		for ( let k in civ.ai.strat.ideal_zoning ) { ideal_zone_total += civ.ai.strat.ideal_zoning[k]; }
		for ( let k in civ.ai.strat.ideal_zoning ) { civ.ai.strat.ideal_zoning[k] /= ideal_zone_total; }
		// zone remodeling
		civ.ai.strat.zone_remodel_freq = utils.BiasedRandInt(15, 40, 30, 0.5);
		civ.ai.strat.zone_remodel = 'recycle'; // strategy for remodeling [wipe,rand,semirand,recycle,smart]
		civ.ai.strat.zone_remodel = ['recycle','wipe','rand','semirand'][ utils.RandomInt(0,3) ]; 
		civ.ai.strat.zone_remodel_rand_chance = utils.BiasedRand(0.1, 0.7, 0.35, 0.75);
		// ship designing
		civ.ai.strat.ship_des_freq = utils.BiasedRand(0.1, 0.9, 0.5, 0.75);
		civ.ai.strat.ship_size = utils.BiasedRand(0.0, 1.0, 0.2, 0.75);
		// start researching
		civ.InitResearch();
		return civ;
		}
		
	// marks civ as "dead" and cleans up.
	Kill() { 
		this.alive = false;
		while ( this.fleets.length ) { this.fleets[0].Kill(); }
		while ( this.planets.length ) { this.planets[0].Reset(false); }
		this.ai.objectives = [];
		this.ai.completed = [];
		this.empire_box = {x1:0,x2:0,y1:0,y2:0};
		this.power_score = 0;
		for ( let [civ,acct] of this.diplo.contacts ) { 
			civ.diplo.contacts.delete(this);
			this.diplo.contacts.delete(civ);
			}
		}
		
	// returns score, but you can also access this.power_score
	CalcPowerScore() { 
		this.score = 0;
		
		// planets
		let planet_score = 0;
		for ( let p of this.planets ) { 
			planet_score += p.score;
			planet_score += p.total_pop * 0.1;
			// TODO local economy
			}
			
		// ships
		let ship_score = 0;
		for ( let f of this.fleets ) { 
			if ( !f.killme ) { 
				ship_score += f.milval;
				}
			}
			
		// troops
		let ground_score = 0;
		for ( let p of this.planets ) { 
			ground_score += p.troops.length;
			}
		for ( let f of this.fleets ) { 
			ground_score += f.troops;
			}
		
		// tech level
		let tech_score = 0;
		for ( let t of this.tech.compl ) { 
			tech_score += t.node.rp;
			}
			
		this.power_score = Math.round( 
			  ( planet_score * 20.0 )
			+ ( ship_score * 0.02 )
			+ ( ground_score * 2.0 )
			+ ( tech_score * 0.1 )
			+ ( this.resources.$ * 0.001 )
			);
			
		return this.power_score;
		}
		
	ArchiveStats() {
		if ( this.race.is_monster ) { return; }
		let ships = 0;
		let milval = 0;
		this.fleets.forEach( f => {
			ships += f.ships.length;
			milval += f.milval;
			});
		this.stat_history.push({
			research: Math.round(this.research),
			research_income: Math.round(this.research_income),
			techs: this.tech.compl.length, 
			power: this.power_score,
			ships,
			milval, 
			planets: this.planets.length,
			cash: this.resources.$,
			min_assault: ( this.ai.strat.min_assault_score > 500 ? 500 : this.ai.strat.min_assault_score )
			});
		}
		
	// returns list of star systems we have a colony in
	MyStars( filter_func = null ) {
		let systems = [];
		for ( let p of this.planets ) { 
			if ( systems.indexOf(p.star) == -1 ) {
				if ( !filter_func || filter_func(p.star) ) { 
					systems.push(p.star);
					}
				}
			}
		return systems;
		}

	// take ships from `fleet` and send them to `star` up to `milval_needed`.
	// returns the total milval relocated.
	AI_PeelShipsForDefense( star, fleet, milval_needed ) { 
		// already there?
		if ( fleet.star == star || fleet.dest == star ) { return; }
		// if they need everything we've got, just reroute the entire fleet.
		if ( milval_needed >= fleet.milval && !fleet.reserved_milval ) {
			fleet.SetDest( star );
			return fleet.milval;
			}
		// otherwise, get some random ships
		else {
			let ships_to_send = [];
			let max_milval_to_strip = fleet.milval - fleet.reserved_milval;
			let milval_stripped = 0;
			for ( let i=fleet.ships.length-1; i >= 0 && milval_needed > 0 && milval_stripped < max_milval_to_strip; i-- ) { 
				let ship = fleet.ships[i];
				if ( ship.bp.milval && ship.bp.milval < milval_needed*2 ) { 
					milval_needed -= ship.bp.milval;
					milval_stripped += ship.bp.milval;
					ships_to_send.push(ship); // add 
					fleet.ships.splice( i, 1 ); // remove
					}
				}
			if ( ships_to_send.length ) { 
				let newfleet = new Fleet( fleet.owner, fleet.star );
				newfleet.ships = ships_to_send;
				newfleet.ReevaluateStats();
				newfleet.SetDest( star );
				}
			if ( !fleet.ships.length ) {
				fleet.Kill();
				}
			else {
				fleet.ReevaluateStats();
				}
			return milval_stripped;
			}
		}
		
	TurnAI( app ) { 
		this.ai.Do(app);
		}
		
	AI_ToggleStagingPoint( star ) { 
		let acct = star.accts.get(this);
		if ( acct ) { 
			if ( !acct.ai.staging_pt ) { 
				acct.ai.staging_pt = true;
				this.ai.staging_pts.push(star);
				}
			else {
				acct.ai.staging_pt = false;
				let i = this.ai.staging_pts.indexOf(star);
				if ( i > -1 ) { 
					this.ai.staging_pts.splice(i,1); 
					}			
				}
			return true;
			}
		return false;
		}
		
	AI_AddStagingPoint( star ) { 
		let acct = star.accts.get(this);
		if ( acct ) { 
			acct.ai.staging_pt = true;
			this.ai.staging_pts.push(star);
			return true;
			}
		return false;
		}
		
	AI_RemoveStagingPoint( star ) { 
		let acct = star.accts.get(this);
		if ( acct ) { 
			acct.ai.staging_pt = false;
			let i = this.ai.staging_pts.indexOf(star);
			if ( i > -1 ) { 
				this.ai.staging_pts.splice(i,1); 
				}
			return true;
			}
		return false;
		
		}
		
	AI_AvailableFleets( dest = null, within_turns = 10 ) { 
		return this.fleets.filter( f => { 
			// already here
			if ( f.star && f.star == dest ) { return false; }
			// not available
			if ( f.killme || f.mission ) { return false; }
			// in flight
			if ( f.dest && !f.star ) { return false; }
			// can't get here fast enough
			if ( f.star && dest && within_turns > 0 ) { 
				if ( utils.DistanceBetween( f.star.xpos, f.star.ypos, dest.xpos, dest.ypos ) > f.speed * within_turns ) { 
					return false; 
					}
				}
			return true;
			} );
		}
	
	// returns float score -1 .. 1 (positive is good for our side)
	// raw_diff will be populated with a positive value used for counter offers
	AI_ScoreTradeOffer( deal ) { 
		// what they are offering us
		let our_score = 0;
		for ( let i of deal.offer ) {
			i.score = this.AI_ScoreTradeItem(i,deal.from);
			our_score += i.score;
			// console.log(`OFFERING: ${i.score} for ${i.label}`);
			}
		// what they are asking for
		let their_score = 0;
		for ( let i of deal.ask ) {
			i.score = this.AI_ScoreTradeItem(i,deal.from);
			their_score += i.score;
			// console.log(`ASKING: ${i.score} for ${i.label}`);
			}
		// better deals for better relationships
		their_score *= 0.75 + this.LoveNub(deal.from) * 0.5;
		// what would it take to make us say yes?
		deal.raw_diff = our_score - their_score;
		// the score is positive or negative depending on how it is viewed. 
		// we cannot use a simple ratio which is always positive.
		let our_score_norm = our_score / (our_score + their_score);
		let their_score_norm = their_score / (our_score + their_score);
		let score = our_score_norm - their_score_norm;
		// console.log(`TRADE SCORE: ${our_score_norm} - ${their_score_norm} = ${score} `);
		return score;
		}
		
	AI_ScoreTradeItem( i, civ ) { 
		switch ( i.type ) {
			case 'cash' : {
				return parseFloat(i.amount) * this.ai.needs.cash;
				}
			case 'resource' : {
				let intrinsic_val = 1.0;
				if ( i.key=='r' || i.key=='g' || i.key=='b' ) { intrinsic_val = 2; }
				else if ( i.key=='c' || i.key=='y' || i.key=='v' ) { intrinsic_val = 3; }
				let supply_val = ( 1 / ( this.resource_supply[i.key] || 1.0 ) );
				return parseFloat(i.amount) * supply_val * intrinsic_val;
				}
			case 'planet' : {
				// base value
				let score = i.obj.ValueTo(this) * 100;
				// we naturally want to hold onto our own planets
				if ( i.obj.owner == this ) { score *= 1.5; }
				// how much do i need planets? 
				score *= ( ( ( this.planets.length + 1 ) / this.planets.length) + 1 ) / 2;
				// small bump if this is one of my staging points
				if ( i.obj.owner == this && this.ai.staging_pts.indexOf(i.obj) > -1 ) { score *= 1.1; }
				// we prefer planets in multiplanet systems
				score *= 1 + i.obj.star.planets.length / 20;
				// but we don't like sharing (especially with enemies)
				for ( let p of i.obj.star.planets ) { 
					if ( p != i.obj && p.owner != this ) {
						const acct = this.diplo.contacts.get(p.owner);
						if ( acct && acct.treaties.has('WAR') ) { score *= 0.5; }
						else if ( acct && acct.lovenub < 0.35 ) { score *= 0.75; }
						else { score *= 0.9; }
						}
					}
				// give the AI some reproducable random attachment to certain planets (1.0 .. 1.25)
				// see: http://indiegamr.com/generate-repeatable-random-numbers-in-js/
				score *= 1.0 + ( ( (i.obj.id * 9301 + 49297) % 233280 ) / 233280 ) * (1.25 - 1.0);
				// TODO AI preference for expansionism / xenophobia
				return score;
				}
			case 'technode' : {
				let score = i.obj.rp;
				// how long would it take me to research this on my own? 
				score *= Math.pow( ( i.obj.rp / (this.research_income || 10)), 0.3 );
				// how does this compare to my overall tech situation?
				let avg_rp = 0;
				if ( this.tech.compl.length ) { 
					let total_rp = 0;
					for ( let n of this.tech.compl ) { 
						total_rp += n.rp;
						}
					avg_rp = total_rp / this.tech.compl.length;
					score *= ( i.obj.rp / avg_rp );
					}
				// cheaper if tech brokering agreement in effect
				if ( this.diplo.contacts.get(civ).treaties.has('TECH_BROKERING') ) { 
					score *= 0.75;
					}
				// TODO: check for obsolete tiered techs
				// TODO: AI tech preference
				return score;
				}
			case 'treaty' : {
				let score = 0;
							
				// (?) Who benefits the most from this deal? 
				const powergraph_spread = // -1 .. +1 
					( this.power_score / ((this.power_score + civ.power_score) || 1) )
					- ( civ.power_score / ((this.power_score + civ.power_score) || 1) );
				const rp_spread = // -1 .. +1 
					( this.research_income / ((this.research_income + civ.research_income) || 1) )
					- ( civ.research_income / ((this.research_income + civ.research_income) || 1) );
				const econ_spread = // -1 .. +1 
					( this.econ.income / ((this.econ.income + civ.econ.income) || 1) )
					- ( civ.econ.income / ((this.econ.income + civ.econ.income) || 1) );
					
				const powergraph_ratio = this.power_score / civ.power_score;
				let my_team_power = this.power_score;
				let their_team_power = civ.power_score;
				for ( let [c,acct] of this.diplo.contacts ) {
					if ( acct.lovenub > 0.65 ) { my_team_power += c.power_score; }
					}
				for ( let [c,acct] of civ.diplo.contacts ) {
					if ( acct.lovenub > 0.65 ) { their_team_power += c.power_score; }
					}
				let team_power_ratio = my_team_power / their_team_power;
				
// 				// (?) Will this get me in trouble with friends?
// 				let mutual_contacts = 0;
// 				let mutual_friends = 0;
// 				let mutual_enemies = 0;
// 				let mutual_conflicts = 0; // our friends do not get along with their friends
// 				for ( let [civ,our_acct] of this.diplo.contacts ) {
// 					const their_acct = civ.diplo.contacts.get(civ);
// 					if ( thier_account ) {
// 						mutual_contacts++;
// 						if ( their_acct.lovenub > 0.65 && our_acct.lovenub > 0.65 ) { 
// 							mutual_friends++;
// 							}
// 						else if ( their_acct.lovenub < 0.35 && our_acct.lovenub < 0.35 ) { 
// 							mutual_enemies++;
// 							}
// 						else if ( their_acct.lovenub > 0.65 && our_acct.lovenub < 0.35 ) { 
// 							mutual_conflicts++;
// 							}
// 						else if ( their_acct.lovenub < 0.35 && our_acct.lovenub > 0.65 ) { 
// 							mutual_conflicts++;
// 							}
// 						}
// 					}
					
				// (?) Do i want to be friends with you
				
 				// (?) Am i planning to conquer you soon?
 				
				// (?) AI stance on forming long term relationships (e.g. xenophobia)
				
				// (?) Do i need what this treaty provides? 
				
				switch ( i.obj ) { // the "obj" is just a string label, not an actual treaty at this point
					case 'NON_AGGRESSION' : { 
						// we want this if we are peacelike or they or their team are stronger than us.
						// Rephrased: how much would we pay to not be attacked?
						score = 1000 * ( this.ai.strat.posture - 0.5 ) * powergraph_spread;
						break;
						}
					case 'ALLIANCE' : { 
						score = 10000 * ( this.ai.strat.posture - 0.5 ) * powergraph_spread;
						break;
						}
						
					// if we want to go in deep
					// but not help too much
					case 'TECH_ALLIANCE' : { 
						score = 10000 * ( rp_spread + 0.1 ); // 0.1 is our ego
						break;
						}  
					case 'ECON_ALLIANCE' : { 
						score = 10000 * ( econ_spread + 0.3 ); // generally no risk - TODO: need a reason to avoid econ alliance
						break;
						}  

					// if we want to keep our distance.
					case 'NO_STAR_SHARING' : { 
						score = 1000 * ( this.ai.strat.posture - 0.5 ) * powergraph_spread;
						break;
						}  
					
					// no use to the AI
					case 'SURVEIL' : { 
						score = 2500 * this.ai.strat.posture;
						break;
						}  
					
					// helpful if we are underpowered
					case 'RESEARCH' : { 
						score = 2500 * ( rp_spread + 0.1 ); // 0.1 is our ego
						break;
						}  
					case 'TRADE' : { 
						score = 2500 * ( econ_spread + 0.1 );
						break;
						}  
					
					// not helpful unless we get a great deal
					// makes us more likely to trade stuff in the future though.
					case 'TECH_BROKERING' : { 
						score = 1000 * ( rp_spread + 0.1 ) * powergraph_ratio; // 0.1 is our ego
						break;
						}  
					
					// only if we are losing or getting a great deal
					case 'CEASEFIRE' : { 
						score = 7500 * ( this.ai.strat.posture - 0.5 ) * powergraph_spread;
						break;
						} 
					}
					
				return score;
				}
			}
		}
		
	AI_ListItemsForTrade( civ, inc_not_avail = true ) {
		const comm = this.CommOverlapWith(civ);
		
		let items = [];
		
		// CASH
		items.push({ type:'cash', label:'Cash', max:this.resources.$, amount:0, avail:true });
		
		// RESOURCES
		for ( let k of ['o','s','m','r','g','b','c','y','v'] ) { 
			if ( this.resources[k] >= 1 ) { 
				items.push({ type:'resource', label:this.ResourceLabel(k), key:k, max:this.resources[k], amount:0, avail:(this.resources[k] > 10) });
				}
			}
		
		// TREATIES
		for ( let k of Object.keys( Treaties ) ) { 
			const t = Treaties[k];
			if ( k != 'WAR' ) { 
				items.push({ type:'treaty', label:t.label, obj:t.type, civ:civ, avail:t.AvailTo( this, civ ) });
				}
			}
			
		// TECH
		// calculate partner's average tech
		let avg_rp = 1; // avoid divide by zero
		if ( civ.tech.compl.length ) { 
			let total_rp = 0;
			for ( let n of civ.tech.compl ) { 
				total_rp += n.rp;
				}
			avg_rp = total_rp / civ.tech.compl.length;
			}
		for ( let t of this.tech.compl ) { 
			// trading partner already has this? 
			if ( civ.tech.compl_keys[t.node.key] ) { continue; }
			// tech brokering agreement in effect?
			if ( 'source' in t && t.source ) {
				let acct = this.diplo.contacts.get( t.source );
				if ( acct && acct.treaties.has('TECH_BROKERING') ) {
					continue;
					}
				}
			// advanced tech requires better communication
			const avail = utils.Clamp(t.node.rp / (avg_rp*2), 0, 10) < comm * 3;
			items.push({ type:'technode', obj:t.node, label:t.node.name, avail });
			}
		
		// PLANETS
		this.planets.forEach( p => {
			if ( p.ValueTo(civ) // habitable and in range
				&& p != this.homeworld // never trade our homeworld away
				) { 
				items.push({ type:'planet', obj:p, label:p.name, avail:(comm >= 0.6) });
				}
			// TODO: perhaps we only want to trade the stinkers?
			});
			
		return inc_not_avail ? items : items.filter( i => i.avail );
		}
		
	// returns item list with addition 'score' attribute
	AI_ListItemsWantInTrade( civ, inc_not_avail = true  ) {
		let items = civ.AI_ListItemsForTrade(this,inc_not_avail);
		for ( let item of items ) {
			// scoring doesn't work for items that have a quantity, 
			// so just pick a random amount up to half-max.
			if ( 'amount' in item ) { 
				item.amount = Math.ceil( Math.random() * item.max * 0.5 ); 
				}
			item.score = this.AI_ScoreTradeItem(item,civ);
			}
		return items;
		}
		
	AI_CreateCounterOffer( deal ) {
		let newdeal = new TradeOffer( deal.to, deal.from, deal.ask, deal.offer );
		let on_table = deal.ask.map( i => i.type + i.label ).concat( deal.offer.map( i => i.type + i.label ) );
		let items = this.AI_ListItemsWantInTrade( deal.from ).filter( i => !on_table.contains(i.type + i.label) ).shuffle();	
		let remaining_score = deal.raw_diff < 0 ? -deal.raw_diff : 0 ;
		while ( remaining_score > 0 && items.length ) { 
			let i = items.pop();
			if ( i.score ) { 
				newdeal.ask.push(i);
				remaining_score -= i.score;
				}
			}
		return newdeal;

		}
		
	DiplomaticEffectOfBreakingTreaty( civ, type ) { 
		const acct = this.diplo.contacts.get(civ);
		if ( acct ) { 
			let amount = 0;
			switch ( type ) {
				// special exception for WAR which isn't actually a treaty
				case 'WAR' : { break; }
				// no big deals:
				case 'SURVEIL' :
				case 'NO_STAR_SHARING' :
				case 'TECH_BROKERING' : 
				case 'RESEARCH' : { 
					amount = -0.1;
					break;
					}
				// manageable, but shows lack of faith
				case 'TECH_ALLIANCE' :
				case 'TRADE' : { 
					amount = -0.25;
					break;
					}
				// considered a signal of potential aggression
				case 'CEASEFIRE' :
				case 'NON_AGGRESSION' : { 
					amount = -0.3;
					break;
					}
				// pretty big no no
				case 'ALLIANCE' : {
					amount = -0.45;
					break;
					}
				default: { 
					amount = -0.2;
					break;
					}
				}
			this.BumpLoveNub( civ, amount );	
			}
		}
		
	// assumes that `civ` is the aggressor and we were attacked
	DiplomaticEffectOfShipCombat( civ, shipcombat ) { 
		if ( civ.race.is_monster ) { return; } // monsters dont have feelings
		let outrage = 0.1;
		const acct = this.diplo.contacts.get(civ);
		// figure out if this was a small skirmish or an act of war.
		const stats = shipcombat.stats[ shipcombat.teams[1].label ];
// 		const myfleet = shipcombat.teams[1].fleet;
		if ( stats.total_dmg_in > 200 ) { outrage += 0.2; }
		// non-aggression pact?
		if ( acct && acct.treaties.has('NON_AGGRESSION') ) { outrage += 0.5; }
		// alliance?
		if ( acct && acct.treaties.has('ALLIANCE') ) { outrage = 1.0; }
		// effect
		this.BumpLoveNub( civ, -outrage );
		// cancel treaties if things are really bad
		if ( acct && !acct.treaties.has('WAR') ) { 
			let to_cancel = ['CEASEFIRE','TECH_ALLIANCE','SURVEIL'];
			if ( acct.lovenub < 0.5 ) { 
				to_cancel.concat(['NO_STAR_SHARING','TECH_BROKERING','RESEARCH','TRADE']);
				}
			if ( acct.lovenub < 0.25 || outrage > 0.75 ) { 
				to_cancel = []; // empty array means just cancel everything
				}
			for ( let [type,treaty] of acct.treaties ) { 
				if ( !to_cancel.length || to_cancel.indexOf(type) > -1 ) {
					acct.treaties.delete(type);
					civ.diplo.contacts.get(this).treaties.delete(type);
					}
				}
			// declare war?
			if ( acct.lovenub <= 0 ) { 
				this.CreateTreaty( 'WAR', civ );
				}
			// scold the player for attacking us, or make formal declaration of war
			if ( civ.is_player || this.is_player ) { 
				acct.attspan -= (acct.lovenub <= 0) ? 1.0 : 0.5; // silent treatment
				acct.attspan = Math.max(acct.attspan,0);
				let starname = shipcombat.planet ? shipcombat.planet.star.name : null;
				if ( !starname && shipcombat.teams[0].fleet.star ) { starname = shipcombat.teams[0].fleet.star.name; }
				if ( !starname && shipcombat.teams[1].fleet.star ) { starname = shipcombat.teams[1].fleet.star.name; }
				// we attacked them
				let message = '';
				if ( civ.is_player ) {
					if ( acct.lovenub <= 0 ) {
						message = `Your attack on ${starname} was unfortunate... <i>for you</i>. Now your suffering will be legendary. To war!`;
						}
					else {
						message = `The attack on our forces at ${starname} was hopefully some kind of accident. If it was not, you are leading our civilizations down the path to war.`;
						}
					App.instance.game.QueueAudience( this, {message} );
					}
				// they attacked us and it led to war. surprise!
				else if ( acct.lovenub <= 0 ) {
					message = `Now the game has truly begun. We will accept your surrender any time.`;
					App.instance.game.QueueAudience( civ, {message} );
					}
				}
			}						
		}
		
	// assumes that `civ` is the aggressor and we were attacked
	DiplomaticEffectOfGroundCombat( civ, groundcombat ) { 
		this.BumpLoveNub( civ, -1 );
		const acct = this.diplo.contacts.get(civ);
		// automatic war
		if ( acct && !acct.treaties.has('WAR') ) { 
			this.CreateTreaty( 'WAR', civ ); // this also cancels all other treaties
			// audience / scolding
			if ( civ.is_player ) { 
				let message = `Invading ${groundcombat.planet.name} will be remembered as the greatest of your mistakes. Prepare for your demise. To war!`;
				acct.attspan = 0; // silent treatment
				App.instance.game.QueueAudience( this, {message} );
				}
			// surprise attack!					
			else if ( this.is_player ) {
				// TODO: this might also be a good opportunity to try extortion.
				// Propose trade for planet in exchange for not going to war.
				let message = `In a unanimous vote, we have decided this galaxy is too small for the both of us. The time for your extermination has arrived.`;
				acct.attspan = 0; // silent treatment
				App.instance.game.QueueAudience( civ, {message} );
				}					
			}						
		}
		
	CreateTreaty( type, civ ) { 
		const acct1 = this.diplo.contacts.get(civ);
		if ( acct1 ) { 
			const t1 = Treaty( type, this, civ, App.instance.game.turn_num );
			acct1.treaties.set( type, t1 );
			if ( 'Init' in t1 ) { t1.Init(); }
			const acct2 = civ.diplo.contacts.get(this);
			if ( acct2 ) { 
				const t2 = Treaty( type, civ, this, App.instance.game.turn_num );
				acct2.treaties.set( type, t2 );
				if ( 'Init' in t2 ) { t2.Init(); }	
				}
			}
		}
		
	EndTreaty( type, civ, diplo_fx = true ) { 
		const acct1 = this.diplo.contacts.get(civ);
		if ( acct1 ) { 
			acct1.treaties.delete( type );
			const acct2 = civ.diplo.contacts.get(this);
			if ( acct2 ) { 
				acct2.treaties.delete( type );
				}
			if ( diplo_fx ) { 
				this.DiplomaticEffectOfBreakingTreaty( civ, type );	
				}
			}
		}

	DoAccounting( app ) {
		this.econ.ship_maint = 0;
		this.econ.troop_maint = 0;
		this.econ.income = 0;
		for ( let k in this.econ.cat_spending ) { this.econ.cat_spending[k] = 0; }
		for ( let k in this.econ.subcat_spending ) { this.econ.subcat_spending[k] = 0; }
		for ( let p of this.planets ) {
			for ( let row of p.acct_ledger ) {
				if ( '$' in row && row.$ < 0 ) {
					this.econ.cat_spending[ row.type ] += -row.$;
					this.econ.subcat_spending[ row.type + '.' + (row.subcat || 'unknown') ] += -row.$;
					}
				}
			p.acct_ledger.unshift( { name:'Tax Income', type:'tax', $:p.econ.tax_rev } );
			p.acct_total.$ = (p.acct_total.$||0) + p.econ.tax_rev;
			p.owner.resource_income.$ += p.econ.tax_rev;
			p.owner.resources.$ += p.econ.tax_rev;
			p.owner.econ.income += p.econ.tax_rev;
			if ( app.options.graph_history ) {
				p.RecordHistory();
				}
			for ( let t of p.troops ) { 
				this.econ.troop_maint += t.bp.cost.labor * 0.15; // HACK TODO tech and civ stats may change
				}
			}
		for ( let f of this.fleets ) {
			for ( let s of f.ships ) { 
				this.econ.ship_maint += s.bp.cost.labor * 0.015; // HACK TODO tech and civ stats may change
				for ( let t of s.troops ) { 
					this.econ.troop_maint += t.bp.cost.labor * 0.15; // HACK TODO tech and civ stats may change
					}
				}
			}
		// stat tracking
		this.resource_spent.$ += this.econ.ship_maint;
		this.resource_spent.$ += this.econ.troop_maint;
		this.resources.$ -= this.econ.ship_maint;
		this.resources.$ -= this.econ.troop_maint;
		this.econ.cat_spending['ships'] = this.econ.ship_maint;
		this.econ.subcat_spending['ships.maint'] = this.econ.ship_maint;
		this.econ.cat_spending['troops'] = this.econ.troop_maint;
		this.econ.subcat_spending['troops.maint'] = this.econ.troop_maint;
		// resources below zero happen because of rounding errors, but not allowed.
		for ( let k in this.resources ) { 
			if ( this.resources[k] < 0 ) { 
				this.resources[k] = 0; 
				}
			}
		}
		
	AddAvailZoneType( z ) { 
		this.avail_zones.push(z);
		this.avail_zones.sort( (a,b) => { 
			if ( a.type > b.type ) return 1;
			else if ( a.type < b.type ) return -1;
			else return a.size - b.size; 	
			});
		}

	}
