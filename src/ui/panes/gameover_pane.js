import * as Signals from '../../util/signals';
import {VictoryRecipes,VictoryIngredients} from '../../classes/VictoryRecipes';
import { Chart } from 'chart.js';
export class GameOverPane {

	constructor() { 
		this.modes = [
			{key: 'power', label: 'Overall Power'},
			{key: 'research', label: 'Total Research'},
			{key: 'research_income', label: 'Research Per Turn'},
			{key: 'techs', label: 'Techs Researched'},
			{key: 'ships', label: 'Ships'},
			{key: 'milval', label: 'Military'},
			{key: 'cash', label: 'Treasury'},
			{key: 'planets', label: 'Planets'},
			{key: 'min_assault', label: 'Min Assault'}
			];
		this.rank_modes = [
			{key: 'power', label: 'Overall'},
			{key: 'research', label: 'Tech'},
			{key: 'milval', label: 'Military'},
			{key: 'cash', label: 'Cash'},
			{key: 'planets', label: 'Planets'},
			{key: 'victory', label: 'Victory'},
			];
		this.mode = 'power';
		this.rank_mode = 'power';
		this.show_history = false
		this.chart = null;
		this.recipes = [];
		this.civs = [];
		}
		
	activate(data) {
		if ( !data ) { return false; }
		this.app = data.app;
		this.winning_civ = data.data && data.data.civ ? data.data.civ : null; 
		this.msg = data.data && data.data.msg ? data.data.msg : null; 
		this.recipe = data.data && data.data.recipe ? data.data.recipe : null; 
		this.victory = data.data && data.data.victory ? data.data.victory : false; 
		this.UpdateVictoryRecipes();
		this.UpdateRankData();
		this.BuildDataset();
		}
	
	BuildDataset() { 
		if ( this.app.options.graph_history ) { 
			this.datasets = [];
			for ( let civ of this.app.game.galaxy.historical_civs ) { 
				if ( !civ.race.is_monster ) { 
					if ( this.app.options.see_all || civ == this.app.game.myciv || civ.InRangeOf(this.app.game.myciv) ) { 
						this.datasets.push({
							label: civ.name,
							data: civ.stat_history.map( i => i[this.mode] ),
							// backgroundColor: `${civ.color}33`,
							backgroundColor: civ.color,
							borderColor: civ.color,
							borderWidth: 4,
							borderJoinStyle: 'round',
							pointRadius: 0,
							fill: false
							});			
						}
					}
				}
			}
		}
    
	attached () {
		if ( this.app.options.graph_history ) { 
			let ctx = document.getElementById("myChart").getContext('2d');
			let xlabels = [];
			for ( let i=0; i < this.datasets[0].data.length; i++ ) {
				xlabels.push(i);
				}
			this.chart = new Chart(ctx, {
				type: 'line',
				data: {
					labels: xlabels,
					datasets: this.datasets
				},
				options: {
					aspectRatio: 2.6,
					legend: { 
						labels: {
							boxWidth: 20,
							fontSize: 14,
							fontColor: '#AAA',
							usePointStyle: false
							}
						},
					animation: {
						duration: 0, // general animation time
						},
					hover: {
						animationDuration: 0, // duration of animations when hovering an item
						},
					responsiveAnimationDuration: 0, // animation duration after a resize			
					elements: {
						line: {
							tension: 0, // disables bezier curves
							}
						},
					scales: {
						xAxes: [{
							ticks: {
								autoSkip: true,
								maxTicksLimit: 20
								}
							}]					
	// 					yAxes: [{
	// 						ticks: {
	// 							beginAtZero:true
	// 							}
	// 						}]
						}
					}
				});
			}
		}
		
	detached () { 
		if ( this.chart ) { 
			this.chart.destroy();
			}
		}
		
	ChangeRankMode( mode ) { 
		this.rank_mode = mode;
		this.UpdateRankData();
		}
		
	UpdateVictoryRecipes() { 
		// make a list of all victory recipes and their ingredients that are in the game
		
		let recipes = {};
		for ( let i of this.app.game.myciv.victory_ingredients ) { 
			// find all recipes this ingredient belongs to 
			for ( let rkey in VictoryRecipes ) {
				let r = VictoryRecipes[rkey];
				if ( r.requires.indexOf( i.key ) >= 0 ) {
					// new entry 
					if ( !(r.key in recipes) ) { 
						recipes[r.key] = {
							key: r.key,
							name: r.name,
							desc: r.desc,
							ingredients: r.requires.map(i => Object.assign( {gotcha:false}, VictoryIngredients[i] ) )
							};
						}
					recipes[r.key].ingredients.find(i2 => i2.key==i.key).gotcha = true;
					}
				
				} 
			}
		// convert to array
		this.recipes = Object.keys(recipes).map( k => recipes[k] );
		}
		
	UpdateRankData() {
		let extract = x => {
			if ( this.rank_mode == 'research' ) { return x.research; }
			else if ( this.rank_mode == 'milval' ) { return x.ai.total_milval; }
			else if ( this.rank_mode == 'cash' ) { return x.resources.$; }
			else if ( this.rank_mode == 'planets' ) { return x.planets.length; }
			else if ( this.rank_mode == 'victory' ) { return x.victory_ingredients.length; }
			else { return x.power_score; }
			}
		this.civs = this.app.game.galaxy.civs
			.filter( c => c.alive && !c.race.is_monster && c.power_score > 0 )
			.filter( c => this.app.options.see_all || c.is_player || this.app.game.myciv.diplo.contacts.has(c) )
			.sort( (a,b) => extract(b) - extract(a) )
			.slice(0,20) // if you want only top X number of civs
			;
		// if the player was not in the list, put them at the bottom. (loser!)
		if ( this.civs.indexOf( this.app.game.myciv ) < 0 ) {
			this.civs.push( this.app.game.myciv );
			} 
		this.civs = this.civs.map( (c,i) => { return {
			civ: c,
			rank: (i+1),
			val: extract(c),
			pct: ( extract(c) / ( extract(this.civs[0]) || 1 ) ) 
			}; } );		
		}
		
	ClickContinue() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		}
		
	ClickEnd() {
		this.app.ChangeState('title_screen');
		}
	}
